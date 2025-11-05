# Setup Instructions untuk DTK AI RAG System

## Prerequisites

1. **Node.js** >= 20.9.0
2. **Qdrant Vector Database** (local atau cloud)
3. **OpenAI API Key**

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

Package yang akan diinstall termasuk:
- `@qdrant/js-client-rest` - Qdrant client
- `ai` - Vercel AI SDK
- `@ai-sdk/openai` - OpenAI SDK

### 2. Setup Qdrant

**Option A: Local Qdrant dengan Docker (Recommended untuk Development)**

```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

Qdrant akan berjalan di `http://localhost:6333`

**Option B: Qdrant Cloud (Production)**

1. Daftar di https://cloud.qdrant.io
2. Buat cluster baru
3. Dapatkan API key dan URL

### 3. Konfigurasi Environment Variables

Buat file `.env` di root project:

```env
# OpenAI API Key (WAJIB)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Qdrant Configuration
QDRANT_URL=http://localhost:6333
# QDRANT_API_KEY=your-qdrant-api-key  # Hanya jika menggunakan Qdrant Cloud

# Upload Directory (untuk menyimpan dokumen yang diupload)
UPLOAD_DIR=./uploads

# Mastra Database
MASTRA_DB_URL=file:./mastra.db
```

### 4. Verifikasi Setup

**Test Qdrant Connection:**

```bash
curl http://localhost:6333/collections
```

Jika berhasil, akan mengembalikan JSON dengan daftar collections.

**Test OpenAI API:**

Pastikan Anda memiliki quota yang cukup untuk menggunakan embeddings API.

### 5. Struktur Direktori

Pastikan struktur direktori seperti ini:

```
pdf-questions/
├── src/
│   └── mastra/
│       ├── agents/
│       │   └── dtk-ai-agent.ts
│       ├── lib/
│       │   └── qdrant.ts
│       ├── tools/
│       │   ├── upload-document-tool.ts
│       │   └── search-document-tool.ts
│       └── index.ts
├── uploads/          # Akan dibuat otomatis saat pertama kali upload
├── .env              # File environment variables
└── package.json
```

### 6. Menjalankan Contoh

```bash
# Via Mastra CLI
npm run dev

# Atau langsung via Node
npx tsx examples/dtk-ai-example.ts
```

## Upload Dokumen Pertama

Setelah setup selesai, Anda bisa upload dokumen pertama:

```typescript
import { mastra } from './src/mastra/index.js';

const agent = mastra.getAgent('dtkAiAgent');

const result = await agent.generate([
  {
    role: 'user',
    content: 'Upload dokumen ISO 27001 dari path: ./path/to/your/document.pdf dengan tipe pdf',
  },
]);
```

**Note:** Pastikan file path yang diberikan benar (absolute atau relative dari project root).

## Troubleshooting

### Error: Qdrant connection failed
- Pastikan Qdrant berjalan di `http://localhost:6333`
- Check dengan: `curl http://localhost:6333/collections`

### Error: OpenAI API key invalid
- Pastikan `OPENAI_API_KEY` sudah di-set di `.env`
- Check quota OpenAI API Anda

### Error: File not found saat upload
- Gunakan absolute path atau relative path dari project root
- Pastikan file benar-benar ada di lokasi tersebut
- Check file permissions

### Error: Collection not found
- Collection akan dibuat otomatis saat pertama kali upload dokumen
- Pastikan Qdrant berjalan dengan baik

## Next Steps

1. Upload dokumen ISO 27001 dan PCI DSS Anda
2. Test pencarian dengan berbagai query
3. Integrasikan dengan WhatsApp (jika diperlukan)

## Support

Untuk pertanyaan atau issue, silakan hubungi tim PT Duta Teknologi Kreatif.

---

**DTK AI** - Dibuat oleh PT Duta Teknologi Kreatif

