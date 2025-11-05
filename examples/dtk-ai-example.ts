import { mastra } from './src/mastra/index';

/**
 * Example penggunaan DTK AI Agent
 * 
 * Jalankan dengan: npm run test:dtk-ai
 * atau: npx tsx examples/dtk-ai-example.ts
 */

async function main() {
  console.log('🚀 DTK AI Agent Example\n');

  const agent = mastra.getAgent('dtkAiAgent');

  // Example 1: Upload Document
  console.log('📄 Example 1: Upload Document');
  console.log('================================\n');
  
  try {
    const uploadResponse = await agent.generate([
      {
        role: 'user',
        content: 'Upload dokumen ISO 27001 policy. File path: ./documents/iso27001-policy.pdf (jika ada)'
      }
    ]);
    console.log('Response:', uploadResponse.text);
    console.log('\n');
  } catch (error) {
    console.log('Note: File mungkin tidak ada, lanjut ke contoh berikutnya\n');
  }

  // Example 2: Search Documents
  console.log('🔍 Example 2: Search Documents');
  console.log('================================\n');
  
  const searchResponse = await agent.generate([
    {
      role: 'user',
      content: 'Cari dokumen tentang access control untuk ISO 27001'
    }
  ]);
  console.log('Response:', searchResponse.text);
  console.log('\n');

  // Example 3: Generate Word Document
  console.log('📝 Example 3: Generate Word Document');
  console.log('================================\n');
  
  const wordResponse = await agent.generate([
    {
      role: 'user',
      content: 'Buat laporan hardening Windows Server 2016 dengan standar CIS Benchmark terbaru menggunakan Word. Laporan harus mencakup executive summary, methodology, findings, dan recommendations.'
    }
  ]);
  console.log('Response:', wordResponse.text);
  console.log('\n');

  // Example 4: Generate Excel Spreadsheet
  console.log('📊 Example 4: Generate Excel Spreadsheet');
  console.log('================================\n');
  
  const excelResponse = await agent.generate([
    {
      role: 'user',
      content: 'Buat spreadsheet Excel untuk CIS Benchmark Windows Server 2016 dengan semua kontrol yang perlu dicek. Buat dengan multiple sheets untuk mengorganisir berdasarkan kategori kontrol.'
    }
  ]);
  console.log('Response:', excelResponse.text);
  console.log('\n');

  // Example 5: Compliance Checklist
  console.log('✅ Example 5: Compliance Checklist');
  console.log('================================\n');
  
  const checklistResponse = await agent.generate([
    {
      role: 'user',
      content: 'Tampilkan checklist compliance ISO 27001 untuk Access Control (A.9)'
    }
  ]);
  console.log('Response:', checklistResponse.text);
  console.log('\n');

  // Example 6: Gap Analysis
  console.log('🔎 Example 6: Gap Analysis');
  console.log('================================\n');
  
  const gapResponse = await agent.generate([
    {
      role: 'user',
      content: 'Lakukan gap analysis untuk PCI DSS compliance. Identifikasi area yang belum compliant dan berikan rekomendasi perbaikan.'
    }
  ]);
  console.log('Response:', gapResponse.text);
  console.log('\n');

  // Example 7: Streaming Response
  console.log('🌊 Example 7: Streaming Response');
  console.log('================================\n');
  
  const stream = await agent.stream([
    {
      role: 'user',
      content: 'Jelaskan tentang ISO 27001 Information Security Management System (ISMS) secara detail'
    }
  ]);

  console.log('Streaming response:');
  for await (const chunk of stream.textStream) {
    process.stdout.write(chunk);
  }
  console.log('\n\n');

  console.log('✅ All examples completed!');
}

// Run main function
main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
