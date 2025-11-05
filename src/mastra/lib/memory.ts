import { Memory } from '@mastra/memory';
import { openai } from '@ai-sdk/openai';

/**
 * Create Memory instance with LibSQLStore for persistence
 * Based on Mastra documentation: https://mastra.ai/docs/memory/overview
 * 
 * Memory configuration includes:
 * - Working Memory: Stores persistent user-specific details (names, preferences, goals)
 * - Conversation History: Captures recent messages from current conversation
 * - Semantic Recall: Retrieves older messages based on semantic relevance
 * 
 * Storage akan menggunakan shared storage dari Mastra instance (LibSQLStore)
 * yang sudah dikonfigurasi di src/mastra/index.ts
 * 
 * Untuk dedicated storage per agent, tambahkan storage parameter:
 * ```typescript
 * import { LibSQLStore } from '@mastra/libsql';
 * 
 * return new Memory({
 *   storage: new LibSQLStore({ url: 'file:./dtk-ai-memory.db' }),
 *   // ... rest of config
 * });
 * ```
 */
export function createMemoryWithLibSQL(): Memory {
  return new Memory({
    // Storage akan menggunakan shared storage dari Mastra instance jika tidak di-set
    // LibSQLStore sudah dikonfigurasi di src/mastra/index.ts
    
    // Embedder untuk semantic recall
    embedder: openai.embedding('text-embedding-3-small'),
    
    // Memory configuration options
    options: {
      // Conversation History: jumlah pesan terakhir yang disimpan
      lastMessages: 10,
      
      // Semantic Recall: retrieve messages berdasarkan semantic similarity
      semanticRecall: {
        topK: 5, // Ambil 5 pesan paling relevan
        messageRange: 2, // Include 2 pesan sebelum dan sesudah setiap hasil
        scope: 'resource', // Search across all threads untuk user yang sama
      },
      
      // Working Memory: persistent user-specific details
      workingMemory: {
        enabled: true,
        template: `You are DTK AI, an AI assistant created by PT Duta Teknologi Kreatif. 
Your role is to help organizations prepare for ISO 27001 and PCI DSS certification audits.
You have access to a RAG system with Qdrant Vector Database containing compliance documents.

Current context:
- User is preparing for ISO 27001 or PCI DSS audit
- You should provide guidance, reminders, and act as a virtual auditor
- Always search documents first before answering questions
- Provide file paths and detailed explanations`,
      },
      
      // Thread configuration
      threads: {
        generateTitle: true, // Auto-generate thread titles
      },
    },
  });
}

