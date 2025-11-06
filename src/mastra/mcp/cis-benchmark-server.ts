/**
 * CIS Benchmark MCP Server
 * 
 * MCP Server untuk menyediakan data CIS Benchmark yang up-to-date
 * dengan kemampuan web search untuk mendapatkan informasi terbaru
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Search CIS Benchmark information from web
 */
async function searchCISBenchmark(osVersion: string, control?: string): Promise<any> {
  try {
    // In production, this would use web search API or fetch from CIS official sources
    // For now, we'll use a search approach that can be enhanced
    
    const searchQuery = control 
      ? `CIS Benchmark ${osVersion} ${control} latest recommendation`
      : `CIS Benchmark ${osVersion} latest recommendations security settings`;

    // TODO: Integrate with actual web search API (Google Custom Search, Bing API, etc.)
    // For now, return structure that indicates web search capability
    return {
      query: searchQuery,
      source: 'Web Search',
      note: 'In production, this would fetch from CIS Workbench or official CIS sources',
      data: null, // Would contain actual benchmark data
    };
  } catch (error) {
    throw new Error(`Failed to search CIS Benchmark: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch CIS Benchmark data from official sources
 */
async function fetchOfficialBenchmark(osVersion: string): Promise<any> {
  try {
    // In production, this would fetch from:
    // - CIS Workbench API (if available)
    // - CIS Benchmark official website
    // - CIS GitHub repository
    
    // Placeholder for actual implementation
    const benchmarkUrl = `https://www.cisecurity.org/cis-benchmark/${osVersion.replace(/\s+/g, '-').toLowerCase()}`;
    
    return {
      version: 'Latest',
      source: benchmarkUrl,
      lastUpdated: new Date().toISOString(),
      note: 'Fetch from official CIS sources in production',
    };
  } catch (error) {
    throw new Error(`Failed to fetch official benchmark: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Initialize MCP Server
 */
async function main() {
  const server = new Server(
    {
      name: 'cis-benchmark-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  /**
   * List available tools
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'search_cis_benchmark',
        description: 'Mencari informasi CIS Benchmark terbaru dari web untuk OS tertentu. Menggunakan web search untuk mendapatkan rekomendasi terbaru.',
        inputSchema: {
          type: 'object',
          properties: {
            osVersion: {
              type: 'string',
              enum: ['Windows Server 2016', 'Windows Server 2019', 'Windows Server 2022', 'Windows 10', 'Windows 11'],
              description: 'Versi OS yang ingin dicari benchmark-nya',
            },
            control: {
              type: 'string',
              description: 'Kontrol spesifik yang ingin dicari (opsional). Contoh: "Password Policy", "Account Lockout"',
            },
            useWebSearch: {
              type: 'boolean',
              description: 'Apakah harus mencari dari web untuk mendapatkan informasi terbaru (default: true)',
              default: true,
            },
          },
          required: ['osVersion'],
        },
      },
      {
        name: 'get_latest_benchmark_version',
        description: 'Mendapatkan versi terbaru CIS Benchmark untuk OS tertentu dari sumber resmi',
        inputSchema: {
          type: 'object',
          properties: {
            osVersion: {
              type: 'string',
              description: 'Versi OS',
            },
          },
          required: ['osVersion'],
        },
      },
      {
        name: 'fetch_benchmark_recommendations',
        description: 'Mengambil rekomendasi CIS Benchmark lengkap untuk OS tertentu dengan mencari dari web untuk mendapatkan informasi terbaru',
        inputSchema: {
          type: 'object',
          properties: {
            osVersion: {
              type: 'string',
              description: 'Versi OS',
            },
            categories: {
              type: 'array',
              items: { type: 'string' },
              description: 'Kategori spesifik yang ingin diambil (opsional)',
            },
          },
          required: ['osVersion'],
        },
      },
    ],
  }));

  /**
   * Handle tool calls
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // Type guard untuk args
    if (!args || typeof args !== 'object' || Array.isArray(args)) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Invalid arguments provided',
          },
        ],
        isError: true,
      };
    }

    // Type-safe argument extraction dengan proper typing
    const argsRecord = args as Record<string, unknown>;
    const getArg = <T>(key: string, defaultValue?: T): T => {
      const value = argsRecord[key];
      if (value === undefined || value === null) {
        if (defaultValue !== undefined) {
          return defaultValue as T;
        }
        throw new Error(`Required argument '${key}' is missing`);
      }
      return value as T;
    };

    try {
      switch (name) {
        case 'search_cis_benchmark': {
          const osVersion = getArg<string>('osVersion', '');
          const control = getArg<string | undefined>('control');
          
          if (!osVersion) {
            throw new Error('osVersion is required');
          }

          const result = await searchCISBenchmark(osVersion, control);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  osVersion,
                  control: control || 'All',
                  searchQuery: result.query,
                  source: result.source,
                  note: 'This MCP server is designed to search web for latest CIS Benchmark data. In production, integrate with web search API.',
                  instructions: 'Use web search or AI knowledge to get latest CIS Benchmark recommendations for the specified OS and control.',
                }, null, 2),
              },
            ],
          };
        }

        case 'get_latest_benchmark_version': {
          const osVersion = getArg<string>('osVersion', '');
          
          if (!osVersion) {
            throw new Error('osVersion is required');
          }

          const benchmarkInfo = await fetchOfficialBenchmark(osVersion);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  osVersion,
                  latestVersion: benchmarkInfo.version,
                  source: benchmarkInfo.source,
                  lastUpdated: benchmarkInfo.lastUpdated,
                  note: 'Check official CIS website for actual latest version',
                }, null, 2),
              },
            ],
          };
        }

        case 'fetch_benchmark_recommendations': {
          const osVersion = getArg<string>('osVersion', '');
          const categories = getArg<string[] | undefined>('categories');
          
          if (!osVersion) {
            throw new Error('osVersion is required');
          }

          // This would fetch comprehensive recommendations
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  osVersion,
                  categories: categories || 'All',
                  note: 'Use web search or AI to fetch latest CIS Benchmark recommendations. This MCP server provides interface for fetching up-to-date data.',
                  instruction: 'Search web for latest CIS Benchmark recommendations and extract structured data.',
                }, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('CIS Benchmark MCP Server running on stdio');
}

// Run server if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { searchCISBenchmark, fetchOfficialBenchmark, main };
