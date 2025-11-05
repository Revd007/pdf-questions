# DTK AI - Enhanced ISO 27001 & PCI DSS Compliance Assistant

Sistem RAG yang lengkap dengan Memory, Compliance Tools, Scorers, dan Streaming untuk membantu persiapan sertifikasi ISO 27001 dan PCI DSS versi terbaru.

## 🎯 Fitur Utama

### 1. **RAG System dengan Qdrant**
- Document Processing: PDF/TXT → Text Extraction → Chunking → Embeddings → Qdrant Vector DB
- Semantic Search: Cosine Similarity dengan threshold 0.7
- File Location Response: Memberikan lokasi file + penjelasan isi dokumen

### 2. **Memory System** (LibSQLStore)
- **Conversation History**: Menyimpan 10 pesan terakhir
- **Semantic Recall**: Mengambil 5 pesan relevan dari percakapan sebelumnya (scope: resource)
- **Working Memory**: Menyimpan progress audit, action items, dan preferensi user
- **Thread Management**: Auto-generate thread titles

### 3. **Compliance Tools** (Baru!)
- **Compliance Checklist Tool**: Checklist requirements ISO 27001 & PCI DSS
- **Deadline Reminder Tool**: Tracking deadline audit dan milestone penting
- **Gap Analysis Tool**: Identifikasi gaps dan rekomendasi perbaikan
- **Audit Preparation Tool**: Checklist dan guidance untuk persiapan audit

### 4. **Scorers** (Baru!)
- **Answer Relevancy Scorer**: Evaluasi relevansi jawaban (30% sampling)
- **Toxicity Scorer**: Cek konten tidak pantas (100% sampling)

### 5. **Streaming Support** (Baru!)
- **Text Streaming**: Real-time response streaming
- **Network Streaming**: Execution details dengan tool calls

## 📋 Tools yang Tersedia

### Document Management Tools
1. **uploadDocumentTool**: Upload dan proses dokumen ke Qdrant
2. **searchDocumentTool**: Semantic search dengan cosine similarity 0.7
3. **getDocumentTool**: Ambil dokumen lengkap berdasarkan documentId

### Compliance & Audit Tools
4. **complianceChecklistTool**: 
   - Input: `standard` (ISO27001/PCIDSS), `domain` (optional)
   - Output: List requirements dengan priority dan status

5. **deadlineReminderTool**:
   - Input: `standard`, `action` (list/add/check), `deadline` (optional)
   - Output: List deadlines dengan status (Upcoming/Due Soon/Overdue)

6. **gapAnalysisTool**:
   - Input: `standard`, `currentState`, `focusArea` (optional)
   - Output: Gaps dengan severity, recommendation, dan estimated effort

7. **auditPreparationTool**:
   - Input: `standard`, `auditType`, `daysUntilAudit` (optional)
   - Output: Documents required, action items, tips

## 🚀 Cara Penggunaan

### 1. Upload Dokumen

```typescript
import { mastra } from './src/mastra/index.js';

const agent = mastra.getAgent('dtkAiAgent');

const result = await agent.generate([
  {
    role: 'user',
    content: 'Upload dokumen ISO 27001 dari path: ./documents/iso27001.pdf dengan tipe pdf',
  },
]);
```

### 2. Cari Dokumen dengan RAG

```typescript
const result = await agent.generate([
  {
    role: 'user',
    content: 'Saya butuh dokumen tentang access control untuk ISO 27001',
  },
]);

// Agent akan:
// - Mencari dokumen relevan menggunakan semantic search
// - Memberikan file path
// - Menjelaskan isi dokumen berdasarkan pemahaman chunks
```

### 3. Compliance Checklist

```typescript
const result = await agent.generate([
  {
    role: 'user',
    content: 'Berikan compliance checklist untuk PCI DSS dengan focus area Network Security',
  },
]);

// Agent akan menggunakan complianceChecklistTool
```

### 4. Deadline Reminder

```typescript
const result = await agent.generate([
  {
    role: 'user',
    content: 'Cek deadline yang akan datang untuk audit ISO 27001',
  },
]);

// Agent akan menggunakan deadlineReminderTool
```

### 5. Gap Analysis

```typescript
const result = await agent.generate([
  {
    role: 'user',
    content: 'Lakukan gap analysis untuk PCI DSS. Kondisi saat ini: belum ada encryption untuk stored cardholder data',
  },
]);

// Agent akan menggunakan gapAnalysisTool
```

### 6. Audit Preparation

```typescript
const result = await agent.generate([
  {
    role: 'user',
    content: 'Persiapkan checklist untuk ISO 27001 Initial Certification Audit dalam 60 hari',
  },
]);

// Agent akan menggunakan auditPreparationTool
```

### 7. Streaming Response

```typescript
// Text Streaming
const stream = await agent.stream([
  {
    role: 'user',
    content: 'Bantu saya dengan compliance checklist untuk ISO 27001',
  },
]);

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}

// Network Streaming (untuk melihat execution details)
const networkStream = await agent.network(
  'Lakukan gap analysis untuk PCI DSS'
);

for await (const chunk of networkStream) {
  console.log(chunk);
}
```

## 📊 Scorers

Agent secara otomatis mengevaluasi kualitas respon:

- **Relevancy Scorer**: Mengevaluasi apakah jawaban relevan dengan pertanyaan
  - Sampling: 30% dari responses
  - Model: gpt-4o-mini

- **Toxicity Scorer**: Mengecek konten yang tidak pantas
  - Sampling: 100% dari responses
  - Model: gpt-4o-mini

Hasil scoring tersimpan di database dan dapat dilihat di Mastra Studio.

## 🧠 Memory Features

### Conversation History
- Menyimpan 10 pesan terakhir dari percakapan saat ini
- Menyediakan short-term continuity

### Semantic Recall
- Mengambil 5 pesan paling relevan berdasarkan semantic similarity
- Scope: `resource` (search across all threads untuk user yang sama)
- Message range: 2 pesan sebelum dan sesudah setiap hasil
- Embedder: `text-embedding-3-small`

### Working Memory
- Menyimpan informasi spesifik user (preferensi, progress audit, action items)
- Template disesuaikan untuk konteks ISO 27001 & PCI DSS
- Dapat diupdate oleh agent selama percakapan

## 🔧 Konfigurasi

### Environment Variables

```env
# OpenAI API Key (WAJIB)
OPENAI_API_KEY=sk-your-openai-api-key

# Qdrant Configuration
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-qdrant-api-key  # Optional jika menggunakan cloud

# Upload Directory
UPLOAD_DIR=./uploads

# Mastra Database
MASTRA_DB_URL=file:./mastra.db
```

### Memory Configuration

```typescript
// src/mastra/lib/memory.ts
options: {
  lastMessages: 10,
  semanticRecall: {
    topK: 5,
    messageRange: 2,
    scope: 'resource',
  },
  workingMemory: {
    enabled: true,
    template: `...`, // DTK AI context template
  },
}
```

## 📚 Contoh Use Cases

### Use Case 1: Persiapan Audit ISO 27001

```typescript
// 1. Check compliance checklist
await agent.generate([
  { role: 'user', content: 'Compliance checklist untuk ISO 27001' }
]);

// 2. Gap analysis
await agent.generate([
  { role: 'user', content: 'Gap analysis untuk ISO 27001, kondisi saat ini: ...' }
]);

// 3. Audit preparation
await agent.generate([
  { role: 'user', content: 'Persiapkan untuk ISO 27001 Initial Audit dalam 30 hari' }
]);

// 4. Track deadlines
await agent.generate([
  { role: 'user', content: 'Cek deadline yang akan datang' }
]);
```

### Use Case 2: PCI DSS Compliance

```typescript
// 1. Check PCI DSS requirements
await agent.generate([
  { role: 'user', content: 'PCI DSS checklist untuk area Encryption' }
]);

// 2. Gap analysis
await agent.generate([
  { role: 'user', content: 'Gap analysis PCI DSS: belum ada encryption untuk stored cardholder data' }
]);

// 3. Search relevant documents
await agent.generate([
  { role: 'user', content: 'Cari dokumen tentang PCI DSS encryption requirements' }
]);
```

## 🎨 Best Practices

### 1. Gunakan Streaming untuk Long Responses
```typescript
// ✅ GOOD: Streaming untuk response panjang
const stream = await agent.stream([...]);
for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}

// ❌ BAD: Generate untuk response panjang (user harus menunggu)
const result = await agent.generate([...]);
```

### 2. Kombinasikan Tools dengan Memory
```typescript
// Agent akan otomatis:
// - Cek memory untuk konteks sebelumnya
// - Gunakan tools yang sesuai
// - Gabungkan informasi dari memory + tools + RAG
```

### 3. Gunakan Deadline Reminder untuk Tracking
```typescript
// Add deadline baru
await agent.generate([
  { 
    role: 'user', 
    content: 'Tambah deadline: ISO 27001 audit pada 2024-12-31, type Audit, priority Critical' 
  }
]);

// Check upcoming deadlines
await agent.generate([
  { role: 'user', content: 'Cek deadline yang akan datang' }
]);
```

## 📖 Dokumentasi Referensi

- **Tools & MCP**: https://mastra.ai/docs/tools-mcp/overview
- **Scorers**: https://mastra.ai/docs/scorers/overview
- **Streaming**: https://mastra.ai/docs/streaming/overview
- **Memory**: https://mastra.ai/docs/memory/overview

## 🏗️ Arsitektur

```
User Query
    ↓
Memory Check (Semantic Recall)
    ↓
Tool Selection (Compliance/RAG Tools)
    ↓
Tool Execution
    ↓
RAG Search (Qdrant) [jika diperlukan]
    ↓
Analysis & Synthesis
    ↓
Response (dengan Streaming)
    ↓
Scorers Evaluation (Async)
    ↓
Memory Update (Working Memory)
```

## ✅ Checklist Fitur

- [x] RAG System dengan Qdrant Vector Database
- [x] Memory dengan LibSQLStore (Conversation History, Semantic Recall, Working Memory)
- [x] Compliance Checklist Tool
- [x] Deadline Reminder Tool
- [x] Gap Analysis Tool
- [x] Audit Preparation Tool
- [x] Answer Relevancy Scorer
- [x] Toxicity Scorer
- [x] Streaming Support (Text & Network)
- [x] File Location Response
- [x] Document Upload & Search

## 🔮 Next Steps untuk Integrasi WhatsApp

Ketika diintegrasikan ke WhatsApp:
1. Agent akan mengirim file sebagai dokumen di grup WhatsApp Kelas
2. Streaming response akan dikirim sebagai multiple messages
3. Deadline reminders akan dikirim otomatis sesuai jadwal
4. Compliance checklist dapat dikirim sebagai formatted message

---

**DTK AI** - Dibuat oleh PT Duta Teknologi Kreatif  
**Versi**: Enhanced dengan Compliance Tools, Scorers, dan Streaming

