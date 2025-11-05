# DTK AI - ISO 27001 & PCI DSS RAG System

Sistem RAG (Retrieval-Augmented Generation) sederhana untuk DTK AI yang membantu persiapan sertifikasi ISO 27001 dan PCI DSS versi terbaru.

## 🎯 Fitur Utama

- **Document Processing**: Upload dokumen PDF/TXT → Text Extraction → Chunking → Embeddings → Qdrant Vector DB
- **Semantic Search**: Pencarian dokumen menggunakan Cosine Similarity dengan threshold 0.7
- **DTK AI Agent**: Agent yang bertindak sebagai pembimbing dan auditor virtual untuk ISO 27001 & PCI DSS
- **File Location Response**: Memberikan lokasi file yang diminta beserta penjelasan isi dokumen

## 🏗️ Arsitektur

```
Document → Text → Chunk → Embeddings → Vector DB (Qdrant)
                                ↓
                      Semantic Search (Cosine Similarity ≥ 0.7)
                                ↓
                    File Path + Document Explanation
```

## 📋 Komponen

### 1. Utilities (`src/mastra/lib/qdrant.ts`)
- `chunkText()`: Memecah dokumen menjadi chunks dengan overlap
- `createEmbeddings()`: Membuat embeddings menggunakan OpenAI text-embedding-3-small
- `ensureCollection()`: Membuat collection di Qdrant jika belum ada
- `storeDocumentChunks()`: Menyimpan chunks ke Qdrant dengan metadata
- `searchDocuments()`: Pencarian semantic dengan cosine similarity threshold 0.7

### 2. Tools

#### Upload Document Tool (`src/mastra/tools/upload-document-tool.ts`)
- Upload dokumen PDF atau TXT
- Extract text dari dokumen
- Chunk text menjadi bagian-bagian kecil
- Generate embeddings dan simpan ke Qdrant
- Return documentId dan file path

#### Search Document Tool (`src/mastra/tools/search-document-tool.ts`)
- `searchDocumentTool`: Mencari dokumen relevan berdasarkan query
- `getDocumentTool`: Mengambil dokumen lengkap berdasarkan documentId

### 3. DTK AI Agent (`src/mastra/agents/dtk-ai-agent.ts`)
- Agent khusus untuk ISO 27001 & PCI DSS compliance
- Identitas: DTK AI dibuat oleh PT Duta Teknologi Kreatif
- Dapat mencari dokumen, menjelaskan isi, dan memberikan file path
- Bertindak sebagai pembimbing dan auditor virtual

## 🔧 Setup

### 1. Install Dependencies

```bash
npm install
```

Dependencies yang diperlukan sudah termasuk:
- `@qdrant/js-client-rest`: Qdrant client
- `@ai-sdk/openai`: OpenAI SDK untuk embeddings
- `ai`: Vercel AI SDK

### 2. Setup Qdrant

**Option A: Local Qdrant (Docker)**
```bash
docker run -p 6333:6333 qdrant/qdrant
```

**Option B: Qdrant Cloud**
- Daftar di https://cloud.qdrant.io
- Dapatkan API key dan URL

### 3. Environment Variables

Buat file `.env`:

```env
# OpenAI API Key (untuk embeddings)
OPENAI_API_KEY=your-openai-api-key

# Qdrant Configuration
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-qdrant-api-key  # Optional jika menggunakan local

# Upload Directory
UPLOAD_DIR=./uploads

# Mastra Database
MASTRA_DB_URL=file:../mastra.db
```

## 🚀 Usage

### Upload Dokumen

```typescript
import { mastra } from './src/mastra/index';

const agent = mastra.getAgent('dtkAiAgent');

// Upload dokumen
const result = await agent.generate([
  {
    role: 'user',
    content: 'Upload dokumen ISO 27001 dari path: ./documents/iso27001.pdf',
  },
]);
```

### Cari Dokumen

```typescript
const agent = mastra.getAgent('dtkAiAgent');

// Cari dokumen tentang access control
const result = await agent.generate([
  {
    role: 'user',
    content: 'Saya butuh dokumen tentang access control untuk ISO 27001',
  },
]);

// Agent akan:
// 1. Mencari dokumen relevan menggunakan semantic search
// 2. Memberikan file path
// 3. Menjelaskan isi dokumen
```

### Menggunakan Tools Langsung

```typescript
import { uploadDocumentTool, searchDocumentTool } from './src/mastra/tools';

// Upload dokumen
const uploadResult = await uploadDocumentTool.execute({
  context: {
    filePath: './documents/pci-dss.pdf',
    fileType: 'pdf',
  },
  mastra,
});

// Cari dokumen
const searchResult = await searchDocumentTool.execute({
  context: {
    query: 'apa saja requirement untuk encryption di PCI DSS?',
    limit: 5,
  },
  mastra,
});
```

## 📁 Struktur File

```
src/
├── mastra/
│   ├── agents/
│   │   └── dtk-ai-agent.ts          # DTK AI Agent
│   ├── lib/
│   │   ├── qdrant.ts                # Qdrant utilities
│   │   └── util.ts                  # PDF extraction utilities
│   ├── tools/
│   │   ├── upload-document-tool.ts  # Upload tool
│   │   └── search-document-tool.ts  # Search tool
│   └── index.ts                     # Mastra instance
├── uploads/                         # Uploaded documents directory
└── ...
```

## 🔍 Pencarian dengan Cosine Similarity

- **Threshold**: 0.7 (hanya hasil dengan similarity ≥ 0.7 yang dikembalikan)
- **Method**: Cosine Similarity
- **Embedding Model**: text-embedding-3-small (1536 dimensions)
- **Vector Distance**: Cosine

## 📝 Metadata Dokumen

Setiap chunk disimpan dengan metadata:
- `documentId`: ID unik dokumen
- `fileName`: Nama file
- `filePath`: Path lengkap file
- `fileType`: Tipe file (pdf/txt)
- `chunkIndex`: Index chunk dalam dokumen
- `totalChunks`: Total jumlah chunks
- `uploadedAt`: Timestamp upload

## 🎯 Integrasi WhatsApp (Future)

Ketika diintegrasikan ke WhatsApp:
- Agent akan mengirim file sebagai dokumen di grup WhatsApp Kelas
- Format: File + Penjelasan isi dokumen
- Sesuai dengan file yang diminta pengguna

## ⚙️ Configuration

### Chunk Settings
- **Chunk Size**: 1000 characters
- **Overlap**: 200 characters
- Dapat diubah di `src/mastra/lib/qdrant.ts`

### Similarity Threshold
- **Threshold**: 0.7
- Dapat diubah di `src/mastra/lib/qdrant.ts` (constant `SIMILARITY_THRESHOLD`)

## 📚 Contoh Query

```
"Bagaimana cara melakukan risk assessment untuk ISO 27001?"
"File tentang encryption requirements di PCI DSS"
"Dokumen terkait access control policy"
"Perlu dokumen tentang incident response procedure"
```

## 🛠️ Troubleshooting

### Qdrant Connection Error
- Pastikan Qdrant berjalan di `http://localhost:6333`
- Atau set `QDRANT_URL` di `.env` ke URL Qdrant cloud Anda

### Embedding Error
- Pastikan `OPENAI_API_KEY` sudah di-set di `.env`
- Check quota OpenAI API Anda

### File Not Found
- Pastikan file path yang diberikan benar (absolute atau relative)
- Check permissions file system

## 📄 License

Apache-2.0

---

**Dibuat oleh PT Duta Teknologi Kreatif**
**DTK AI - ISO 27001 & PCI DSS Compliance Assistant**

