import { MCPClient } from '@mastra/mcp';

/**
 * MCP Client untuk DTK AI
 * Menghubungkan Mastra agents dengan MCP servers eksternal
 * 
 * Konfigurasi sesuai dokumentasi: https://mastra.ai/docs/tools-mcp/mcp-overview
 */
export const dtkMcpClient = new MCPClient({
  id: 'dtk-mcp-client',
  servers: {
    // Mastra MCP Docs Server - untuk akses ke dokumentasi Mastra
    mastra: {
      command: 'npx',
      args: ['-y', '@mastra/mcp-docs-server'],
    },
    // Bisa ditambahkan MCP servers lain sesuai kebutuhan
    // Contoh: Wikipedia, Weather Service, dll
  },
});

