import Database from 'better-sqlite3';
import OpenAI from 'openai';
import { IndexedFile } from './indexer.js';

export interface SearchResult {
  path: string;
  content: string;
  score: number;
  mtime: Date;
}

export class VectorStore {
  private db: Database.Database;
  private openai: OpenAI;

  constructor(dbPath: string, apiKey?: string) {
    this.db = new Database(dbPath);
    this.openai = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
    this.initialize();
  }

  private initialize() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT UNIQUE NOT NULL,
        content TEXT NOT NULL,
        mtime INTEGER NOT NULL,
        size INTEGER NOT NULL,
        extension TEXT
      );

      CREATE TABLE IF NOT EXISTS embeddings (
        file_id INTEGER NOT NULL,
        chunk_index INTEGER NOT NULL,
        chunk_text TEXT NOT NULL,
        embedding BLOB NOT NULL,
        PRIMARY KEY (file_id, chunk_index),
        FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_files_mtime ON files(mtime);
      CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);
    `);
  }

  async indexFiles(files: IndexedFile[]) {
    const insertFile = this.db.prepare(`
      INSERT OR REPLACE INTO files (path, content, mtime, size, extension)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertEmbedding = this.db.prepare(`
      INSERT OR REPLACE INTO embeddings (file_id, chunk_index, chunk_text, embedding)
      VALUES (?, ?, ?, ?)
    `);

    for (const file of files) {
      // Insert file
      const result = insertFile.run(
        file.path,
        file.content,
        file.mtime.getTime(),
        file.size,
        file.extension
      );

      const fileId = result.lastInsertRowid as number;

      // Chunk the content
      const chunks = this.chunkText(file.content, 500);

      // Generate embeddings in batches
      const batchSize = 20;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);

        const response = await this.openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: batch
        });

        // Store embeddings
        for (let j = 0; j < batch.length; j++) {
          const embedding = response.data[j].embedding;
          const buffer = Buffer.from(new Float32Array(embedding).buffer);

          insertEmbedding.run(fileId, i + j, batch[j], buffer);
        }
      }
    }
  }

  async search(query: string, limit: number = 5): Promise<SearchResult[]> {
    // Generate query embedding
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query
    });

    const queryEmbedding = response.data[0].embedding;

    // Get all embeddings and compute similarity
    const embeddings = this.db
      .prepare(
        `
      SELECT
        e.file_id,
        e.chunk_text,
        e.embedding,
        f.path,
        f.content,
        f.mtime
      FROM embeddings e
      JOIN files f ON e.file_id = f.id
    `
      )
      .all();

    const results = embeddings.map((row: any) => {
      const embedding = new Float32Array(row.embedding.buffer);
      const similarity = this.cosineSimilarity(queryEmbedding, Array.from(embedding));

      return {
        path: row.path,
        content: row.chunk_text,
        score: similarity,
        mtime: new Date(row.mtime)
      };
    });

    // Sort by similarity and return top results
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  getRecentFiles(days: number = 7): Array<{ path: string; mtime: Date }> {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const files = this.db
      .prepare(
        `
      SELECT path, mtime
      FROM files
      WHERE mtime > ?
      ORDER BY mtime DESC
    `
      )
      .all(cutoff);

    return files.map((row: any) => ({
      path: row.path,
      mtime: new Date(row.mtime)
    }));
  }

  private chunkText(text: string, maxChunkSize: number): string[] {
    const chunks: string[] = [];
    const lines = text.split('\n');
    let currentChunk = '';

    for (const line of lines) {
      if (currentChunk.length + line.length > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      currentChunk += line + '\n';
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  close() {
    this.db.close();
  }
}
