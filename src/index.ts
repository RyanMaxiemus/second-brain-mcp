import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { FileIndexer } from './indexer.js';
import { VectorStore } from './vector-store.js';

// Initialize global instances
const indexer = new FileIndexer();
const dbPath = path.join(os.homedir(), '.second-brain', 'index.db');
await fs.mkdir(path.dirname(dbPath), { recursive: true });
const vectorStore = new VectorStore(dbPath);

const server = new Server(
  {
    name: 'second-brain-mcp',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'index_directory',
        description: 'Index a directory for semantic search',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to directory to index'
            }
          },
          required: ['path']
        }
      },
      {
        name: 'semantic_search',
        description: 'Search indexed files semantically',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query'
            },
            limit: {
              type: 'number',
              description: 'Number of results',
              default: 5
            }
          },
          required: ['query']
        }
      },
      {
        name: 'summarize_file',
        description: 'Get AI summary of a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to file'
            }
          },
          required: ['path']
        }
      },
      {
        name: 'recent_activity',
        description: 'Show recent file changes',
        inputSchema: {
          type: 'object',
          properties: {
            days: {
              type: 'number',
              description: 'Number of days to look back',
              default: 7
            }
          }
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params;

  if (!args) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Missing arguments'
        }
      ],
      isError: true
    };
  }

  try {
    switch (name) {
      case 'index_directory':
        return await handleIndexDirectory(args.path as string);

      case 'semantic_search':
        return await handleSemanticSearch(
          args.query as string,
          (args.limit as number) || 5
        );

      case 'summarize_file':
        return await handleSummarizeFile(args.path as string);

      case 'recent_activity':
        return await handleRecentActivity((args.days as number) || 7);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
});

async function handleIndexDirectory(dirPath: string) {
  const files = await indexer.indexDirectory(dirPath);
  await vectorStore.indexFiles(files);

  return {
    content: [
      {
        type: 'text',
        text: `Indexed ${files.length} files from ${dirPath}`
      }
    ]
  };
}

async function handleSemanticSearch(query: string, limit: number) {
  const results = await vectorStore.search(query, limit);

  const formatted = results
    .map(
      r =>
        `**${r.path}** (score: ${r.score.toFixed(3)})\n${r.content.substring(
          0,
          200
        )}...\n`
    )
    .join('\n');

  return {
    content: [
      {
        type: 'text',
        text: `Found ${results.length} results:\n\n${formatted}`
      }
    ]
  };
}

async function handleSummarizeFile(filePath: string) {
  const content = await fs.readFile(filePath, 'utf-8');

  return {
    content: [
      {
        type: 'text',
        text: `File: ${filePath}\n\nSize: ${
          content.length
        } bytes\n\nPreview:\n${content.substring(0, 500)}...`
      }
    ]
  };
}

async function handleRecentActivity(days: number) {
  const files = vectorStore.getRecentFiles(days);

  const formatted = files.map(f => `${f.mtime.toISOString()}: ${f.path}`).join('\n');

  return {
    content: [
      {
        type: 'text',
        text: `Recent activity (last ${days} days):\n\n${formatted}`
      }
    ]
  };
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Second Brain MCP server running on stdio');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
