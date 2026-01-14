import fg from 'fast-glob';
import fs from 'fs/promises';
import ignore from 'ignore';
import path from 'path';

export interface IndexedFile {
  path: string;
  content: string;
  mtime: Date;
  size: number;
  extension: string;
}

export class FileIndexer {
  private ignorePatterns: ReturnType<typeof ignore>;

  constructor() {
    this.ignorePatterns = ignore();
    // Default ignore patterns
    this.ignorePatterns.add([
      'node_modules/**',
      '.git/**',
      '*.log',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      '*.lock',
      'package-lock.json',
      'yarn.lock'
    ]);
  }

  async loadIgnoreFile(rootPath: string) {
    try {
      const mcpIgnorePath = path.join(rootPath, '.mcpignore');
      const content = await fs.readFile(mcpIgnorePath, 'utf-8');
      this.ignorePatterns.add(content.split('\n').filter(Boolean));
    } catch (error) {
      // .mcpignore doesn't exist, use defaults
    }

    // Also load .gitignore
    try {
      const gitIgnorePath = path.join(rootPath, '.gitignore');
      const content = await fs.readFile(gitIgnorePath, 'utf-8');
      this.ignorePatterns.add(content.split('\n').filter(Boolean));
    } catch (error) {
      // .gitignore doesn't exist
    }
  }

  async indexDirectory(rootPath: string): Promise<IndexedFile[]> {
    await this.loadIgnoreFile(rootPath);

    // Find all files using fast-glob
    const files = await fg('**/*', {
      cwd: rootPath,
      onlyFiles: true,
      absolute: false,
      dot: true
    });

    // Filter using ignore patterns
    const filteredFiles = files.filter((file: string) => {
      return !this.ignorePatterns.ignores(file);
    });

    // Index each file
    const indexed: IndexedFile[] = [];

    for (const file of filteredFiles) {
      const fullPath = path.join(rootPath, file);

      try {
        const stats = await fs.stat(fullPath);

        // Skip files larger than 1MB
        if (stats.size > 1024 * 1024) {
          continue;
        }

        // Only index text files
        if (!this.isTextFile(file)) {
          continue;
        }

        const content = await fs.readFile(fullPath, 'utf-8');

        indexed.push({
          path: fullPath,
          content,
          mtime: stats.mtime,
          size: stats.size,
          extension: path.extname(file)
        });
      } catch (error) {
        // Skip files we can't read
        console.error(`Skipping ${fullPath}:`, error);
      }
    }

    return indexed;
  }

  private isTextFile(filename: string): boolean {
    const textExtensions = [
      '.js',
      '.ts',
      '.jsx',
      '.tsx',
      '.py',
      '.java',
      '.c',
      '.cpp',
      '.h',
      '.css',
      '.scss',
      '.html',
      '.xml',
      '.json',
      '.yaml',
      '.yml',
      '.md',
      '.txt',
      '.sh',
      '.bash',
      '.go',
      '.rs',
      '.rb',
      '.php',
      '.sql',
      '.graphql',
      '.vue',
      '.svelte',
      '.astro'
    ];

    const ext = path.extname(filename).toLowerCase();
    return textExtensions.includes(ext);
  }
}
