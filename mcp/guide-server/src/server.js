/**
 * Guide Server — MCP Entry Point
 * Exposes guide operations as MCP tools over stdio transport.
 *
 * Usage:
 *   node src/server.js
 *
 * Environment variables:
 *   GUIDE_DB_PATH  — path to SQLite database file (default: ./guides.db)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

import { initDb } from './db.js';
import { tools, handleTool } from './tools.js';

// ── Initialize ──────────────────────────────────────────────────────────────

initDb();

const server = new Server(
  {
    name: 'guide-server',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// ── Request Handlers ────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map(({ name, description, inputSchema }) => ({
    name,
    description,
    inputSchema
  }))
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const tool = tools.find(t => t.name === name);
  if (!tool) {
    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }

  return handleTool(name, args ?? {});
});

// ── Start ───────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);

// stderr only — stdout is reserved for MCP protocol messages
process.stderr.write('[guide-server] started\n');
