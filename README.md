# 🧠 Second Brain MCP

> Your code, but searchable like memories. Stop grepping, start remembering. A semantic search MCP server for your codebase—ask natural questions, get smart answers.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Tech: Node.js](https://img.shields.io/badge/Tech-Node.js-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Tech: TypeScript](https://img.shields.io/badge/Tech-TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![AI: OpenAI](https://img.shields.io/badge/AI-OpenAI-412991?logo=openai&logoColor=white)](https://openai.com/)

---

## TL;DR

**Second Brain MCP** is a local server that indexes your code and other text-based files, allowing you to perform semantic searches using natural language. It runs as a Model Context Protocol (MCP) server, so you can interact with it from any MCP-compatible client. It uses OpenAI's embedding models to understand the meaning of your code, not just keywords.

## 🛠️ Tech Stack

This project is a TypeScript-based Node.js application.

| Component               | Technology      | Key Libraries/Frameworks                |
| :---------------------- | :-------------- | :-------------------------------------- |
| **Application Runtime** | Node.js         | TypeScript, `@modelcontextprotocol/sdk` |
| **Database**            | SQLite          | `better-sqlite3`                        |
| **Embeddings**          | OpenAI          | `openai`                                |
| **Development**         | Package Manager | `npm`                                   |

## 🚀 Quick Start

The following instructions are optimized for a Linux environment (Ubuntu/Debian).

### Prerequisites

You must have **Node.js (v20+)** and **npm** installed.

1.  **Clone the repository**

    ```bash
    git clone https://github.com/RyanMaxiemus/second-brain-mcp.git
    cd second-brain-mcp
    ```

2.  **Configure Environment Variables**

    You will need an OpenAI API key. You can set it as an environment variable:

    ```bash
    export OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
    ```

3.  **Install Dependencies**

    Install all necessary Node.js dependencies.

    ```bash
    npm install
    ```

4.  **Build the Application**

    Compile the TypeScript code to JavaScript.

    ```bash
    npm run build
    ```

5.  **Run the Application**

    Launch the MCP server.

    ```bash
    npm start
    ```

    The server will be running and ready to accept connections from an MCP client.

## 🤝 Contributing

Found a bug? Have an idea for a new feature? We welcome all contributions!

1.  **Open an Issue:** Before submitting a Pull Request, please open an issue to discuss the bug or feature you're working on. This helps prevent duplicate work and ensures alignment with the project's goals.
2.  **Fork and Branch:** Fork the repository and create a new branch for your contribution.
3.  **Code and Commit:** Write clean, well-documented code. Commit messages should be descriptive and follow a conventional format (e.g., `feat: add support for local embeddings`).
4.  **Submit a PR:** Submit a Pull Request against the `main` branch. We'll review it as quickly as possible.

Let's make Second Brain the most intuitive code search tool available, together.
