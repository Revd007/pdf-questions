# DTK AI - ISO 27001 & PCI DSS Compliance Assistant

AI Assistant yang dibuat oleh PT Duta Teknologi Kreatif untuk membantu persiapan sertifikasi ISO 27001 dan PCI DSS, serta bertindak sebagai pembimbing dan auditor virtual.

## 🎯 Fitur Utama

### Document Management & RAG
- ✅ **Upload Documents**: Support PDF, Word (DOCX), Excel (XLSX), CSV, TXT
- ✅ **Semantic Search**: Pencarian dokumen menggunakan cosine similarity (threshold 0.7)
- ✅ **Vector Database**: Menggunakan Qdrant untuk menyimpan dan mencari dokumen
- ✅ **Enhanced Error Handling**: Pesan error yang informatif dan troubleshooting guidance

### Document Generation
- ✅ **Generate Word Documents**: Membuat dokumen Word (DOCX) dengan struktur yang rapi
- ✅ **Generate Excel Spreadsheets**: Membuat spreadsheet Excel (XLSX) dengan multiple sheets
- ✅ **Professional Formatting**: Headings, tables, lists, auto-filter, frozen headers

### Compliance & Audit Tools
- ✅ **Compliance Checklist**: Checklist requirements untuk ISO 27001 & PCI DSS
- ✅ **Deadline Reminder**: Tracking deadline dan timeline audit
- ✅ **Gap Analysis**: Identifikasi area yang belum compliant beserta rekomendasi
- ✅ **Audit Preparation**: Checklist dan guidance untuk persiapan audit

### MCP Integration
- ✅ **MCP Client**: Terhubung ke MCP servers (Mastra Docs Server, dll)
- ✅ **Extensible**: Mudah menambahkan MCP servers lain

### Memory & Context
- ✅ **LibSQLStore**: Persistent memory storage
- ✅ **Semantic Recall**: Mencari konteks relevan dari percakapan sebelumnya
- ✅ **Working Memory**: Tracking progress audit dan action items

### Quality Evaluation
- ✅ **Answer Relevancy Scorer**: Evaluasi relevansi jawaban
- ✅ **Toxicity Scorer**: Safety check untuk konten

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 20.9.0 atau lebih tinggi
- Docker (untuk Qdrant Vector Database)
- OpenAI API Key

### 2. Installation

```bash
# Clone repository
git clone <repository-url>
cd pdf-questions

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env dan tambahkan OPENAI_API_KEY
```

### 3. Setup Qdrant Vector Database

```bash
# Run Qdrant menggunakan Docker
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant

# Atau gunakan Qdrant Cloud
# Set QDRANT_URL dan QDRANT_API_KEY di .env
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Test DTK AI Agent

```bash
# Lihat examples/dtk-ai-example.ts untuk contoh penggunaan
npm run test:dtk-ai
```

## 📋 Environment Variables

Lihat `.env.example` untuk semua environment variables yang diperlukan:

- `OPENAI_API_KEY` - **Required**: OpenAI API key
- `QDRANT_URL` - Default: `http://localhost:6333`
- `QDRANT_API_KEY` - Optional: Untuk Qdrant Cloud
- `MASTRA_DB_URL` - Default: `file:./mastra.db`
- `OUTPUT_DIR` - Default: `./outputs`
- `UPLOAD_DIR` - Default: `./uploads`

## 💡 Usage Examples

### Upload Document

```typescript
import { mastra } from './src/mastra/index';

const agent = mastra.getAgent('dtkAiAgent');

const response = await agent.generate([
  {
    role: 'user',
    content: 'Upload dokumen ISO 27001 policy dari file: ./documents/iso27001-policy.pdf'
  }
]);
```

### Search Documents

```typescript
const response = await agent.generate([
  {
    role: 'user',
    content: 'Cari dokumen tentang access control untuk ISO 27001'
  }
]);
```

### Generate Word Document

```typescript
const response = await agent.generate([
  {
    role: 'user',
    content: 'Buat laporan hardening Windows Server 2016 dengan standar CIS Benchmark terbaru menggunakan Word'
  }
]);

// Agent akan:
// 1. Mencari dokumen CIS Benchmark terkait
// 2. Membuat dokumen Word dengan struktur yang rapi
// 3. Memberikan filePath ke dokumen yang dibuat
```

### Generate Excel Spreadsheet

```typescript
const response = await agent.generate([
  {
    role: 'user',
    content: 'Buat spreadsheet Excel untuk CIS Benchmark Windows Server 2016 dengan semua kontrol yang perlu dicek'
  }
]);

// Agent akan:
// 1. Menggunakan Compliance Checklist Tool untuk mendapatkan controls
// 2. Membuat spreadsheet Excel dengan multiple sheets
// 3. Memberikan filePath ke spreadsheet yang dibuat
```

### Compliance Checklist

```typescript
const response = await agent.generate([
  {
    role: 'user',
    content: 'Tampilkan checklist compliance ISO 27001 untuk Access Control'
  }
]);
```

### Gap Analysis

```typescript
const response = await agent.generate([
  {
    role: 'user',
    content: 'Lakukan gap analysis untuk PCI DSS compliance berdasarkan dokumen yang sudah diupload'
  }
]);
```

## 🏗️ Architecture

```
DTK AI Agent
├── Document Management Tools
│   ├── Upload Document Tool
│   ├── Search Document Tool
│   ├── Get Document Tool
│   ├── Generate Word Document Tool
│   └── Generate Excel Spreadsheet Tool
├── Compliance & Audit Tools
│   ├── Compliance Checklist Tool
│   ├── Deadline Reminder Tool
│   ├── Gap Analysis Tool
│   └── Audit Preparation Tool
├── MCP Tools
│   └── Mastra MCP Docs Server
├── RAG System
│   ├── Qdrant Vector Database
│   ├── OpenAI Embeddings
│   └── Cosine Similarity Search
├── Memory System
│   ├── LibSQLStore (Persistent)
│   ├── Semantic Recall
│   └── Working Memory
└── Quality Evaluation
    ├── Answer Relevancy Scorer
    └── Toxicity Scorer
```

## 📁 Project Structure

```
src/mastra/
├── agents/
│   ├── dtk-ai-agent.ts          # Main DTK AI Agent
│   ├── pdf-question-agent.ts    # PDF processing agent
│   ├── pdf-summarization-agent.ts
│   └── text-question-agent.ts
├── tools/
│   ├── upload-document-tool.ts
│   ├── search-document-tool.ts
│   ├── generate-word-document-tool.ts
│   ├── generate-excel-spreadsheet-tool.ts
│   ├── compliance-tools.ts
│   └── ...
├── mcp/
│   └── mcp-client.ts            # MCP Client configuration
├── lib/
│   ├── qdrant.ts                # Qdrant utilities
│   ├── util.ts                  # Text extraction utilities
│   └── memory.ts                # Memory configuration
├── workflows/
│   └── generate-questions-from-pdf-workflow.ts
└── index.ts                      # Mastra configuration
```

## 🔧 Development

### Scripts

```bash
# Development server
npm run dev

# Build
npm run build

# Start production
npm run start

# Run examples
npm run test:dtk-ai
```

### Adding New MCP Servers

Edit `src/mastra/mcp/mcp-client.ts`:

```typescript
export const dtkMcpClient = new MCPClient({
  id: 'dtk-mcp-client',
  servers: {
    mastra: {
      command: 'npx',
      args: ['-y', '@mastra/mcp-docs-server'],
    },
    // Tambahkan server lain di sini
    wikipedia: {
      command: 'npx',
      args: ['-y', 'wikipedia-mcp'],
    },
  },
});
```

## 📖 Documentation

- [Enhanced RAG & Word Generation](./ENHANCED_RAG_AND_WORD_GENERATION.md)
- [MCP & Excel Support](./MCP_AND_EXCEL_SUPPORT.md)
- [Complete Features Guide](./COMPLETE_FEATURES_GUIDE.md)

## 🐛 Troubleshooting

### Qdrant Connection Error

```bash
# Pastikan Qdrant berjalan
docker ps | grep qdrant

# Jika tidak, start Qdrant
docker run -p 6333:6333 qdrant/qdrant

# Check connection
curl http://localhost:6333/health
```

### MCP Tools Not Loading

- Pastikan `npx` tersedia di system
- Check console untuk error messages
- Agent akan tetap berfungsi tanpa MCP tools

### Document Upload Fails

- Pastikan file path benar
- Check file permissions
- Pastikan `UPLOAD_DIR` writable

### Word/Excel Generation Fails

- Pastikan `OUTPUT_DIR` writable
- Check disk space
- Pastikan dependencies terinstall (`docx`, `exceljs`)

## ✅ Checklist Setup

- [ ] Node.js 20.9.0+ terinstall
- [ ] Dependencies terinstall (`npm install`)
- [ ] Environment variables di-set (`.env`)
- [ ] Qdrant berjalan (Docker atau Cloud)
- [ ] OpenAI API key valid
- [ ] Test upload document
- [ ] Test search document
- [ ] Test generate Word document
- [ ] Test generate Excel spreadsheet

## 🎯 Next Steps

1. **Upload Compliance Documents**: Upload policies, procedures, checklists
2. **Test Search**: Cari dokumen menggunakan semantic search
3. **Generate Reports**: Buat laporan compliance menggunakan Word/Excel
4. **Use Compliance Tools**: Gunakan checklist, gap analysis, dll
5. **Integrate with WhatsApp**: Siap untuk integrasi WhatsApp (next phase)

## 📞 Support

Untuk pertanyaan atau bantuan:
- **Dibuat oleh**: PT Duta Teknologi Kreatif
- **Agent**: DTK AI

---

**DTK AI** - ISO 27001 & PCI DSS Compliance Assistant  
**Version**: 1.0.0  
**Last Updated**: 2024
