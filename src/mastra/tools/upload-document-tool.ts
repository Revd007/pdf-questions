import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { extractTextFromFile } from '../lib/util';
import {
  chunkText,
  storeDocumentChunks,
  ensureCollection,
  type DocumentMetadata,
} from '../lib/qdrant';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Supported file types for compliance documentation
const SUPPORTED_FILE_TYPES = ['pdf', 'txt', 'docx', 'xlsx', 'csv'] as const;

export const uploadDocumentTool = createTool({
  id: 'upload-document-tool',
  description: 'Upload dan proses dokumen compliance (PDF, Word/DOCX, Excel/XLSX, CSV, TXT) ke dalam sistem RAG. Dokumen akan dipecah menjadi chunks, diubah menjadi embeddings, dan disimpan di Qdrant Vector Database. Ideal untuk dokumen ISO 27001, PCI DSS, policies, procedures, checklists, dan dokumentasi compliance lainnya.',
  inputSchema: z.object({
    filePath: z.string().describe('Path lengkap ke file yang akan diupload'),
    fileName: z.string().optional().describe('Nama file (opsional, akan diambil dari filePath jika tidak disediakan)'),
    fileType: z.enum(SUPPORTED_FILE_TYPES).describe('Tipe file: pdf, txt, docx (Word), xlsx (Excel), atau csv'),
  }),
  outputSchema: z.object({
    documentId: z.string().describe('ID unik dokumen yang telah disimpan'),
    fileName: z.string().describe('Nama file'),
    filePath: z.string().describe('Path lengkap file yang disimpan'),
    chunksCount: z.number().describe('Jumlah chunks yang dibuat dari dokumen'),
    message: z.string().describe('Pesan konfirmasi upload'),
  }),
  execute: async ({ context }) => {
    const { filePath, fileName: providedFileName, fileType } = context;

    try {
      // Validasi file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File tidak ditemukan: ${filePath}`);
      }

      const fileName = providedFileName || path.basename(filePath);
      const documentId = randomUUID();
      const uploadTimestamp = new Date().toISOString();

      // Copy file ke upload directory
      const fileExtension = path.extname(fileName);
      const storedFileName = `${documentId}${fileExtension}`;
      const storedFilePath = path.join(UPLOAD_DIR, storedFileName);
      
      fs.copyFileSync(filePath, storedFilePath);
      console.log(`✅ File disalin ke: ${storedFilePath}`);

      // Auto-detect file type from extension if not provided
      let detectedFileType = fileType;
      if (!detectedFileType) {
        const extension = path.extname(fileName).slice(1).toLowerCase();
        if (SUPPORTED_FILE_TYPES.includes(extension as any)) {
          detectedFileType = extension as typeof SUPPORTED_FILE_TYPES[number];
        } else {
          throw new Error(
            `Tipe file tidak dapat dideteksi dari extension: ${extension}. ` +
            `Silakan tentukan fileType secara eksplisit. Format yang didukung: ${SUPPORTED_FILE_TYPES.join(', ')}`
          );
        }
      }
      
      if (!SUPPORTED_FILE_TYPES.includes(detectedFileType as any)) {
        throw new Error(
          `Tipe file tidak didukung: ${detectedFileType}. ` +
          `Format yang didukung: ${SUPPORTED_FILE_TYPES.join(', ')}`
        );
      }

      console.log(`📄 Memproses file tipe: ${detectedFileType.toUpperCase()}`);

      // Extract text berdasarkan tipe file menggunakan fungsi unified
      const extractionResult = await extractTextFromFile(filePath, detectedFileType);
      const extractedText = extractionResult.extractedText;
      const pagesCount = extractionResult.pagesCount;

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('Tidak dapat mengekstrak teks dari dokumen. Pastikan file berisi konten yang dapat dibaca.');
      }

      // Chunk text
      console.log('📝 Memecah dokumen menjadi chunks...');
      const chunks = chunkText(extractedText, 1000, 200);
      console.log(`✅ Dibuat ${chunks.length} chunks dari dokumen`);

      // Prepare metadata
      const metadata: Omit<DocumentMetadata, 'chunkIndex' | 'totalChunks'> = {
        documentId,
        fileName,
        filePath: storedFilePath,
        fileType: detectedFileType,
        uploadedAt: uploadTimestamp,
      };

      // Store chunks in Qdrant
      console.log('💾 Menyimpan chunks ke Qdrant Vector Database...');
      await ensureCollection();
      await storeDocumentChunks(chunks, metadata);

      console.log(`✅ Dokumen berhasil diupload: ${fileName}`);

      return {
        documentId,
        fileName,
        filePath: storedFilePath,
        chunksCount: chunks.length,
        message: `Dokumen "${fileName}" berhasil diupload dan diproses. ${chunks.length} chunks telah dibuat dan disimpan di Qdrant Vector Database.`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error uploading document:', errorMessage);
      throw new Error(`Gagal upload dokumen: ${errorMessage}`);
    }
  },
});

