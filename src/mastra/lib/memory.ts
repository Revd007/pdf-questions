import { Memory } from '@mastra/memory';

/**
 * Memory configuration untuk DTK AI Agent
 * Based on Mastra documentation: https://mastra.ai/docs/agents/agent-memory
 * 
 * Memory akan menggunakan shared storage dari Mastra instance (LibSQLStore)
 * yang sudah dikonfigurasi di src/mastra/index.ts
 * 
 * Memory configuration includes:
 * - Conversation History: Captures recent messages from current conversation
 * - Working Memory: Stores persistent user-specific details (names, preferences, goals)
 * 
 * Note: Semantic Recall dinonaktifkan karena memerlukan vector store yang terpisah.
 * Conversation history dengan lastMessages: 20 sudah cukup untuk konteks percakapan.
 */
export const dtkAiMemory = new Memory({
  options: {
    // Conversation History: jumlah pesan terakhir yang disimpan (diperbesar untuk konteks lebih baik)
    lastMessages: 20, // Simpan lebih banyak pesan untuk konteks yang lebih baik
    
    // Semantic Recall: dinonaktifkan karena memerlukan vector store
    // Jika ingin mengaktifkan semantic recall, perlu mengkonfigurasi vector store terlebih dahulu
    // semanticRecall: {
    //   topK: 10,
    //   messageRange: 3,
    //   scope: 'resource',
    // },
    
    // Working Memory: persistent user-specific details
    workingMemory: {
      enabled: true,
      template: `You are DTK AI, an AI assistant created by PT Duta Teknologi Kreatif. 
Your role is to help organizations prepare for ISO 27001 and PCI DSS certification audits.
You have access to a RAG system with Qdrant Vector Database containing compliance documents.

IMPORTANT - Use Memory Effectively:
- Remember previous conversations and context
- Recall what documents have been uploaded
- Remember user's compliance goals and progress
- Remember previous findings and recommendations
- Connect current questions with previous discussions
- Provide continuity across conversations

Current context:
- User is preparing for ISO 27001 or PCI DSS audit
- You should provide guidance, reminders, and act as a virtual auditor
- Always search documents first before answering questions
- Provide file paths and detailed explanations
- Remember user preferences and previous requests`,
    },
    
    // Thread configuration
    threads: {
      generateTitle: true, // Auto-generate thread titles
    },
  },
});

/**
 * Export memory config untuk referensi (jika diperlukan)
 */
export const memoryConfig = dtkAiMemory;
