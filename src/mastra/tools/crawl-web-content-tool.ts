import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import {
  chunkText,
  storeDocumentChunks,
  ensureCollection,
  type DocumentMetadata,
} from '../lib/qdrant';

const CRAWL_DIR = process.env.CRAWL_DIR || './crawled_data';

// Ensure crawl directory exists
if (!fs.existsSync(CRAWL_DIR)) {
  fs.mkdirSync(CRAWL_DIR, { recursive: true });
}

/**
 * Crawl web content and save to file
 */
async function crawlWebContent(url: string): Promise<{ content: string; title: string }> {
  try {
    console.log(`🌐 Crawling content from: ${url}`);
    
    // Fetch content from URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // Simple HTML to text extraction (basic, bisa ditingkatkan dengan library seperti cheerio)
    // Remove script and style tags
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;

    return { content: text, title };
  } catch (error) {
    throw new Error(`Failed to crawl web content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Tool untuk crawling data dari web, kemudian chunking, convert ke vector, dan simpan ke Vector Database
 */
export const crawlWebContentTool = createTool({
  id: 'crawl-web-content-tool',
  description: 'Crawl konten dari website, kemudian otomatis melakukan chunking, convert ke vector embeddings, dan menyimpan ke Qdrant Vector Database untuk digunakan dalam RAG. Tool ini mengikuti alur lengkap: Crawling → Chunking → Vector Conversion → Vector Database Storage → RAG Integration.',
  inputSchema: z.object({
    url: z.string().url().describe('URL website yang akan di-crawl (contoh: https://www.cisecurity.org/cis-benchmarks/)'),
    chunkSize: z.number().optional().default(1000).describe('Ukuran chunk untuk text splitting (default: 1000 karakter)'),
    chunkOverlap: z.number().optional().default(200).describe('Overlap antar chunks (default: 200 karakter)'),
    saveToFile: z.boolean().optional().default(true).describe('Simpan konten yang di-crawl ke file (default: true)'),
  }),
  outputSchema: z.object({
    documentId: z.string().describe('ID unik dokumen yang telah disimpan di Vector Database'),
    url: z.string().describe('URL yang di-crawl'),
    title: z.string().describe('Judul konten yang di-crawl'),
    contentLength: z.number().describe('Panjang konten yang di-crawl (karakter)'),
    chunksCount: z.number().describe('Jumlah chunks yang dibuat'),
    filePath: z.string().optional().describe('Path ke file yang disimpan (jika saveToFile=true)'),
    message: z.string().describe('Pesan konfirmasi proses crawling dan indexing'),
  }),
  execute: async ({ context }) => {
    const { url, chunkSize = 1000, chunkOverlap = 200, saveToFile = true } = context;

    try {
      console.log(`🚀 Memulai proses crawling dari: ${url}`);

      // Step 1: Crawling data dari web
      console.log(`📥 Step 1: Crawling data dari web...`);
      const { content, title } = await crawlWebContent(url);
      
      if (!content || content.trim().length === 0) {
        throw new Error('Tidak dapat mengekstrak konten dari URL. Pastikan URL dapat diakses dan berisi konten teks.');
      }

      console.log(`✅ Berhasil crawl ${content.length} karakter dari: ${title}`);

      // Step 2: Save to file (optional)
      let filePath: string | undefined;
      if (saveToFile) {
        const documentId = randomUUID();
        const fileName = `${documentId}_${title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.txt`;
        filePath = path.join(CRAWL_DIR, fileName);
        
        // Ensure directory exists
        if (!fs.existsSync(CRAWL_DIR)) {
          fs.mkdirSync(CRAWL_DIR, { recursive: true });
        }
        
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✅ Konten disimpan ke: ${filePath}`);
      }

      // Step 3: Chunking - Memecah text menjadi chunks dengan overlap
      console.log(`📝 Step 2: Chunking - Memecah text menjadi chunks...`);
      const chunks = chunkText(content, chunkSize, chunkOverlap);
      console.log(`✅ Dibuat ${chunks.length} chunks (size: ${chunkSize}, overlap: ${chunkOverlap})`);

      // Step 4: Convert ke Vector Data (Embeddings)
      console.log(`🔢 Step 3: Convert ke Vector Data (Embeddings)...`);
      // Embeddings akan dibuat di storeDocumentChunks

      // Step 5: Simpan ke Vector Database (Qdrant)
      console.log(`💾 Step 4: Simpan ke Vector Database (Qdrant)...`);
      const documentId = randomUUID();
      const uploadTimestamp = new Date().toISOString();

      const metadata: Omit<DocumentMetadata, 'chunkIndex' | 'totalChunks'> = {
        documentId,
        fileName: title,
        filePath: filePath || url,
        fileType: 'web',
        uploadedAt: uploadTimestamp,
      };

      await ensureCollection();
      await storeDocumentChunks(chunks, metadata);
      console.log(`✅ ${chunks.length} chunks berhasil disimpan ke Qdrant Vector Database`);

      // Step 6: RAG Integration - Ready untuk digunakan
      console.log(`🔗 Step 5: RAG Integration - Data siap untuk digunakan dalam semantic search`);

      return {
        documentId,
        url,
        title,
        contentLength: content.length,
        chunksCount: chunks.length,
        filePath,
        message: `✅ Proses lengkap selesai! Data dari ${url} telah di-crawl, di-chunk menjadi ${chunks.length} bagian, dikonversi ke vector embeddings, dan disimpan ke Qdrant Vector Database. Data sekarang siap digunakan dalam RAG untuk semantic search.`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error crawling web content:', errorMessage);
      throw new Error(`Gagal crawl web content: ${errorMessage}`);
    }
  },
});

