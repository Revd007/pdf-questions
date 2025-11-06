import { QdrantClient } from '@qdrant/js-client-rest';
import { embedMany } from 'ai';
import { getEmbeddingModel, getEmbeddingProviderName } from './model-provider';

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || undefined;
const COLLECTION_NAME = 'dtk_ai_documents';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || undefined; // Will use default from provider
const SIMILARITY_THRESHOLD = 0.7;

// Get embedding dimension based on provider
function getEmbeddingDimension(): number {
  const provider = getEmbeddingProviderName();
  return provider === 'gemini' ? 768 : 1536; // Gemini text-embedding-004: 768, OpenAI text-embedding-3-small: 1536
}

// Initialize Qdrant client
export const qdrantClient = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
});

/**
 * Chunk text into smaller pieces with overlap
 */
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push(chunk.trim());
    
    // Move forward by chunkSize - overlap
    start += chunkSize - overlap;
  }

  return chunks.filter(chunk => chunk.length > 0);
}

/**
 * Create embeddings for text chunks
 */
export async function createEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddingModel = getEmbeddingModel(EMBEDDING_MODEL);
  const result = await embedMany({
    model: embeddingModel,
    values: texts,
  });

  return result.embeddings;
}

/**
 * Initialize Qdrant collection if it doesn't exist
 */
export async function ensureCollection(): Promise<void> {
  try {
    const collections = await qdrantClient.getCollections();
    const collectionExists = collections.collections.some(
      (col) => col.name === COLLECTION_NAME
    );

    if (!collectionExists) {
      const embeddingSize = getEmbeddingDimension();
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: embeddingSize,
          distance: 'Cosine',
        },
      });
      console.log(`✅ Created Qdrant collection: ${COLLECTION_NAME} with ${embeddingSize}D embeddings (provider: ${getEmbeddingProviderName()})`);
    }
  } catch (error) {
    console.error('❌ Error ensuring collection:', error);
    throw error;
  }
}

/**
 * Store document chunks in Qdrant
 */
export interface DocumentMetadata {
  documentId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  chunkIndex: number;
  totalChunks: number;
  pageNumber?: number;
  uploadedAt: string;
}

export async function storeDocumentChunks(
  chunks: string[],
  metadata: Omit<DocumentMetadata, 'chunkIndex' | 'totalChunks'>
): Promise<void> {
  await ensureCollection();

  const embeddings = await createEmbeddings(chunks);

  const points = chunks.map((chunk, index) => ({
    id: `${metadata.documentId}_chunk_${index}`,
    vector: embeddings[index],
    payload: {
      text: chunk,
      documentId: metadata.documentId,
      fileName: metadata.fileName,
      filePath: metadata.filePath,
      fileType: metadata.fileType,
      chunkIndex: index,
      totalChunks: chunks.length,
      pageNumber: metadata.pageNumber,
      uploadedAt: metadata.uploadedAt,
    },
  }));

  await qdrantClient.upsert(COLLECTION_NAME, {
    wait: true,
    points,
  });

  console.log(`✅ Stored ${chunks.length} chunks for document: ${metadata.fileName}`);
}

/**
 * Search documents using cosine similarity
 */
export interface SearchResult {
  documentId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  chunkText: string;
  chunkIndex: number;
  score: number;
  pageNumber?: number;
}

export async function searchDocuments(
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  await ensureCollection();

  // Create embedding for query
  const queryEmbeddings = await createEmbeddings([query]);
  const queryVector = queryEmbeddings[0];

  // Search in Qdrant
  const searchResults = await qdrantClient.search(COLLECTION_NAME, {
    vector: queryVector,
    limit,
    score_threshold: SIMILARITY_THRESHOLD,
  });

  return searchResults
    .filter((result) => result.score >= SIMILARITY_THRESHOLD)
    .map((result) => ({
      documentId: result.payload?.documentId as string,
      fileName: result.payload?.fileName as string,
      filePath: result.payload?.filePath as string,
      fileType: result.payload?.fileType as string,
      chunkText: result.payload?.text as string,
      chunkIndex: result.payload?.chunkIndex as number,
      score: result.score || 0,
      pageNumber: result.payload?.pageNumber as number | undefined,
    }));
}

/**
 * Get all chunks for a specific document
 */
export async function getDocumentChunks(documentId: string): Promise<SearchResult[]> {
  await ensureCollection();

  const scrollResult = await qdrantClient.scroll(COLLECTION_NAME, {
    filter: {
      must: [
        {
          key: 'documentId',
          match: { value: documentId },
        },
      ],
    },
    limit: 1000,
  });

  return (
    scrollResult.points?.map((point) => ({
      documentId: point.payload?.documentId as string,
      fileName: point.payload?.fileName as string,
      filePath: point.payload?.filePath as string,
      fileType: point.payload?.fileType as string,
      chunkText: point.payload?.text as string,
      chunkIndex: point.payload?.chunkIndex as number,
      score: 1.0,
      pageNumber: point.payload?.pageNumber as number | undefined,
    })) || []
  );
}

/**
 * Delete a document from Qdrant
 */
export async function deleteDocument(documentId: string): Promise<void> {
  await ensureCollection();

  await qdrantClient.delete(COLLECTION_NAME, {
    wait: true,
    points: [],
    filter: {
      must: [
        {
          key: 'documentId',
          match: { value: documentId },
        },
      ],
    },
  });

  console.log(`✅ Deleted document: ${documentId}`);
}

