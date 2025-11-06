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
    // CIS Benchmark MCP Server - untuk data CIS Benchmark yang up-to-date
    // Note: Server ini bisa di-deploy sebagai standalone atau diintegrasikan dengan external API
    // Untuk sekarang, menggunakan tool langsung (cisBenchmarkScoringTool)
    // cisBenchmark: {
    //   command: 'node',
    //   args: ['src/mastra/mcp/cis-benchmark-server.ts'],
    // },
    // Bisa ditambahkan MCP servers lain sesuai kebutuhan
    // Contoh: Wikipedia, Weather Service, dll
  },
});

