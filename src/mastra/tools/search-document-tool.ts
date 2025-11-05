import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { searchDocuments, getDocumentChunks, type SearchResult } from '../lib/qdrant';

export const searchDocumentTool = createTool({
  id: 'search-document-tool',
  description: 'Mencari dokumen menggunakan semantic search dengan cosine similarity threshold 0.7. Mengembalikan file path dan penjelasan konten yang relevan.',
  inputSchema: z.object({
    query: z.string().describe('Pertanyaan atau kata kunci untuk mencari dokumen'),
    limit: z.number().optional().default(5).describe('Maksimal jumlah hasil yang dikembalikan'),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        documentId: z.string(),
        fileName: z.string(),
        filePath: z.string(),
        fileType: z.string(),
        chunkText: z.string(),
        chunkIndex: z.number(),
        score: z.number(),
        pageNumber: z.number().optional(),
      })
    ),
    totalResults: z.number(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    const { query, limit = 5 } = context;

    try {
      console.log(`🔍 Mencari dokumen dengan query: "${query}"`);
      
      const searchResults = await searchDocuments(query, limit);

      if (searchResults.length === 0) {
        return {
          results: [],
          totalResults: 0,
          message: `Tidak ditemukan dokumen yang relevan dengan query "${query}" (threshold similarity: 0.7). Coba gunakan kata kunci yang lebih spesifik atau berbeda.`,
        };
      }

      // Get unique file paths
      const uniqueFilePaths = Array.from(
        new Set(searchResults.map((result) => result.filePath))
      );

      console.log(`✅ Ditemukan ${searchResults.length} chunks relevan dari ${uniqueFilePaths.length} dokumen`);

      return {
        results: searchResults,
        totalResults: searchResults.length,
        message: `Ditemukan ${searchResults.length} hasil relevan dari ${uniqueFilePaths.length} dokumen. File paths: ${uniqueFilePaths.join(', ')}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error searching documents:', errorMessage);
      throw new Error(`Gagal mencari dokumen: ${errorMessage}`);
    }
  },
});

export const getDocumentTool = createTool({
  id: 'get-document-tool',
  description: 'Mengambil semua chunks dari dokumen spesifik berdasarkan documentId',
  inputSchema: z.object({
    documentId: z.string().describe('ID dokumen yang ingin diambil'),
  }),
  outputSchema: z.object({
    documentId: z.string(),
    fileName: z.string(),
    filePath: z.string(),
    chunks: z.array(
      z.object({
        chunkText: z.string(),
        chunkIndex: z.number(),
      })
    ),
    totalChunks: z.number(),
  }),
  execute: async ({ context }) => {
    const { documentId } = context;

    try {
      console.log(`📄 Mengambil dokumen: ${documentId}`);
      
      const chunks = await getDocumentChunks(documentId);

      if (chunks.length === 0) {
        throw new Error(`Dokumen dengan ID ${documentId} tidak ditemukan`);
      }

      const firstChunk = chunks[0];

      return {
        documentId,
        fileName: firstChunk.fileName,
        filePath: firstChunk.filePath,
        chunks: chunks
          .sort((a, b) => a.chunkIndex - b.chunkIndex)
          .map((chunk) => ({
            chunkText: chunk.chunkText,
            chunkIndex: chunk.chunkIndex,
          })),
        totalChunks: chunks.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error getting document:', errorMessage);
      throw new Error(`Gagal mengambil dokumen: ${errorMessage}`);
    }
  },
});

