import { MastraMemory } from '@mastra/core/memory';
import { LibSQLStore } from '@mastra/libsql';
import { openai } from '@ai-sdk/openai';
import type { MemoryConfig } from '@mastra/core/memory';

/**
 * Memory configuration untuk DTK AI Agent
 * Based on Mastra documentation: https://mastra.ai/docs/memory/overview
 * 
 * Memory akan menggunakan shared storage dari Mastra instance (LibSQLStore)
 * yang sudah dikonfigurasi di src/mastra/index.ts
 * 
 * Memory configuration includes:
 * - Working Memory: Stores persistent user-specific details (names, preferences, goals)
 * - Conversation History: Captures recent messages from current conversation
 * - Semantic Recall: Retrieves older messages based on semantic relevance
 */
export const memoryConfig: MemoryConfig = {
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
};

/**
 * Create Memory instance dengan LibSQLStore
 * 
 * Note: Agent akan menggunakan storage dari Mastra instance secara otomatis
 * jika memory tidak di-set secara eksplisit. Untuk menggunakan memory config,
 * set memoryConfig di agent config atau gunakan undefined untuk default behavior.
 */
export function createMemoryWithLibSQL(): MastraMemory | undefined {
  // Agent akan menggunakan storage dari Mastra instance (LibSQLStore) secara otomatis
  // Memory configuration dapat di-set melalui threadConfig di agent config
  // Return undefined untuk menggunakan default memory behavior dengan storage dari Mastra
  
  return undefined;
}
