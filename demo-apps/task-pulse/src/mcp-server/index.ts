/**
 * Standalone mock MCP server using @modelcontextprotocol/sdk.
 * Run with: pnpm mcp-server
 * The server communicates over stdio and exposes two resources:
 *   mcp://demo/tasks    – list of project tasks
 *   mcp://demo/summary  – aggregate project metrics
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { mockTasks, mockSummaryMetrics } from '../lib/mock-data';

const server = new Server(
  { name: 'promptable-ui-demo', version: '0.1.0' },
  { capabilities: { resources: {} } }
);

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'mcp://demo/tasks',
      name: 'Project Tasks',
      description: 'List of project tasks with status, priority, category, assignee, and due date',
      mimeType: 'application/json',
    },
    {
      uri: 'mcp://demo/summary',
      name: 'Project Summary',
      description: 'Aggregate project metrics: totals, completion rates, counts by status/priority',
      mimeType: 'application/json',
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async request => {
  const { uri } = request.params;

  if (uri === 'mcp://demo/tasks') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(mockTasks, null, 2),
        },
      ],
    };
  }

  if (uri === 'mcp://demo/summary') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(mockSummaryMetrics, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP demo server running on stdio');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
