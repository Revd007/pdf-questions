import { mastra } from './src/mastra/index.js';

/**
 * Contoh penggunaan DTK AI Agent untuk ISO 27001 & PCI DSS
 */

async function main() {
  console.log('🤖 DTK AI - ISO 27001 & PCI DSS Compliance Assistant');
  console.log('Dibuat oleh PT Duta Teknologi Kreatif\n');

  const agent = mastra.getAgent('dtkAiAgent');

  // Contoh 1: Upload dokumen
  console.log('📤 Contoh 1: Upload Dokumen');
  console.log('='.repeat(50));
  
  try {
    const uploadResult = await agent.generate([
      {
        role: 'user',
        content: 'Upload dokumen ISO 27001 dari path: ./documents/iso27001.pdf dengan tipe pdf',
      },
    ]);
    
    console.log('Hasil:', uploadResult.text);
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n');

  // Contoh 2: Cari dokumen
  console.log('🔍 Contoh 2: Cari Dokumen');
  console.log('='.repeat(50));
  
  try {
    const searchResult = await agent.generate([
      {
        role: 'user',
        content: 'Saya butuh dokumen tentang access control untuk ISO 27001',
      },
    ]);
    
    console.log('Hasil:', searchResult.text);
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n');

  // Contoh 3: Query tentang PCI DSS
  console.log('💳 Contoh 3: Query PCI DSS');
  console.log('='.repeat(50));
  
  try {
    const queryResult = await agent.generate([
      {
        role: 'user',
        content: 'Apa saja requirement untuk encryption di PCI DSS? Berikan file yang relevan.',
      },
    ]);
    
    console.log('Hasil:', queryResult.text);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run jika file ini dijalankan langsung
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };

