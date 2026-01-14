# Second Brain MCP Server

> Your code, but searchable like memories.

Stop grepping. Start remembering. Semantic search MCP server for your codebase—ask natural questions, get smart answers. "What was I building before I rage-quit?" Actually works.

## What It Does

Indexes your local files and exposes them through the Model Context Protocol with:

- **Semantic search** - Natural language queries over your codebase
- **File summaries** - Quick overviews of what's in each file
- **Change tracking** - "What did I work on last week?"
- **Smart indexing** - Respects `.gitignore` and `.mcpignore`

## Why It's Useful

Instead of this:

```bash
grep -r "authentication" . | grep -v node_modules | ...
```

You do this:

```
"Find the React component where I handle user authentication"
```

Instead of this:

```bash
git log --since="1 week ago" --name-only | ...
```

You do this:

```
"Show me what I worked on last week"
```

## Installation

### Prerequisites

- Node.js 20+
- OpenAI API key (for embeddings)

### Setup

```bash
# Clone the repository
git clone https://github.com/RyanMaxiemus/second-brain-mcp.git
cd second-brain-mcp

# Install dependencies
npm install

# Build
npm run build

# Set your OpenAI API key
export OPENAI_API_KEY=your_key_here
```

### Configure Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "second-brain": {
      "command": "node",
      "args": ["/path/to/second-brain-mcp/build/index.js"],
      "env": {
        "OPENAI_API_KEY": "your_key_here"
      }
    }
  }
}
```

Restart Claude Desktop.

## Usage

### Index Your Code

In Claude Desktop:

```
Index my ~/Projects/my-app directory
```

### Search Semantically

```
Find the React component where I handle payments
```

```
Show me where I defined the database schema
```

```
Which files deal with user authentication?
```

### Track Activity

```
What files did I change in the last 3 days?
```

```
Show me recent activity from the past week
```

### Summarize Files

```
Summarize ~/Projects/my-app/src/auth/login.ts
```

## MCP Tools

The server exposes these tools:

### `index_directory`

Indexes a directory for semantic search.

**Parameters:**

- `path` (string, required) - Path to directory to index

**Example:**

```json
{
  "path": "/Users/you/Projects/my-app"
}
```

### `semantic_search`

Search indexed files using natural language.

**Parameters:**

- `query` (string, required) - Search query
- `limit` (number, optional, default: 5) - Number of results

**Example:**

```json
{
  "query": "authentication middleware",
  "limit": 10
}
```

### `summarize_file`

Get a summary of a specific file.

**Parameters:**

- `path` (string, required) - Path to file

**Example:**

```json
{
  "path": "/Users/you/Projects/my-app/src/index.ts"
}
```

### `recent_activity`

Show recently modified files.

**Parameters:**

- `days` (number, optional, default: 7) - Number of days to look back

**Example:**

```json
{
  "days": 3
}
```

## Configuration

Create a `.second-brain.yml` file in your project root:

```yaml
indexed_paths:
  - ~/Projects
  - ~/Notes

ignore_patterns:
  - '**/*.log'
  - '**/dist/**'
  - '**/.env*'

embeddings:
  model: 'text-embedding-3-small'
  batch_size: 20

git_integration: true
```

## Ignoring Files

The indexer automatically respects:

- `.gitignore` files
- `.mcpignore` files (same syntax as `.gitignore`)

Create a `.mcpignore` in your project to exclude files from indexing:

```
# Don't index these
node_modules/
dist/
*.min.js
package-lock.json
```

## Docker Support

### Build and Run

```bash
# Build the image
docker build -t second-brain-mcp .

# Run with docker-compose
docker-compose up -d
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  second-brain:
    build: .
    volumes:
      - ~/Projects:/data/projects:ro
      - ~/Notes:/data/notes:ro
      - second-brain-index:/index
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    stdin_open: true
    tty: true

volumes:
  second-brain-index:
```

The vector database persists in the `second-brain-index` volume.

## How It Works

1. **Indexing**: Scans directories, filters files using `.gitignore`/`.mcpignore`
2. **Chunking**: Splits files into ~500 token chunks
3. **Embedding**: Generates embeddings using OpenAI's `text-embedding-3-small`
4. **Storage**: Stores in SQLite with vector search
5. **Search**: Computes cosine similarity between query and file embeddings
6. **Results**: Returns ranked results with context

## Limitations

- Only indexes text files (source code, markdown, etc.)
- Skips files larger than 1MB
- Requires OpenAI API key for embeddings
- Binary files are ignored

## Roadmap

- [ ] Incremental indexing with file watchers
- [ ] Git history integration (commit messages, blame info)
- [ ] Local embedding models (via Ollama)
- [ ] Cross-reference detection
- [ ] Project-level summaries
- [ ] CLI companion tool
- [ ] Support for more embedding providers

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol)
- Embeddings powered by [OpenAI](https://openai.com)
- Vector storage using [SQLite](https://www.sqlite.org) and [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)

---

**Questions?** Open an issue or reach out on [Twitter/X](https://twitter.com/yourusername).

**Like this?** Give it a ⭐️ on GitHub!
