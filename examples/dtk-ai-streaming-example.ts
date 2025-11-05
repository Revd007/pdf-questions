import { mastra } from '../mastra/index.js';

/**
 * Contoh penggunaan DTK AI Agent dengan Streaming
 * Based on Mastra documentation: https://mastra.ai/docs/streaming/overview
 */

async function exampleWithStreaming() {
  console.log('🤖 DTK AI - ISO 27001 & PCI DSS Compliance Assistant');
  console.log('Dibuat oleh PT Duta Teknologi Kreatif\n');

  const agent = mastra.getAgent('dtkAiAgent');

  // Contoh 1: Streaming response untuk real-time feedback
  console.log('📤 Contoh 1: Streaming Response');
  console.log('='.repeat(50));
  
  const stream = await agent.stream([
    {
      role: 'user',
      content: 'Bantu saya dengan compliance checklist untuk ISO 27001, khususnya di area Access Control',
    },
  ]);

  console.log('\nResponse (streaming):\n');
  for await (const chunk of stream.textStream) {
    process.stdout.write(chunk);
  }

  console.log('\n\n✅ Streaming selesai\n');

  // Contoh 2: Menggunakan Compliance Checklist Tool
  console.log('📋 Contoh 2: Compliance Checklist');
  console.log('='.repeat(50));
  
  try {
    const checklistResult = await agent.generate([
      {
        role: 'user',
        content: 'Berikan saya compliance checklist untuk PCI DSS dengan focus area Network Security',
      },
    ]);
    
    console.log('Hasil:', checklistResult.text);
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n');

  // Contoh 3: Deadline Reminder dengan streaming
  console.log('⏰ Contoh 3: Deadline Reminder (Streaming)');
  console.log('='.repeat(50));
  
  try {
    const deadlineStream = await agent.stream([
      {
        role: 'user',
        content: 'Cek deadline yang akan datang untuk audit ISO 27001 dan PCI DSS',
      },
    ]);

    for await (const chunk of deadlineStream.textStream) {
      process.stdout.write(chunk);
    }
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n');

  // Contoh 4: Gap Analysis
  console.log('🔍 Contoh 4: Gap Analysis');
  console.log('='.repeat(50));
  
  try {
    const gapResult = await agent.generate([
      {
        role: 'user',
        content: 'Lakukan gap analysis untuk PCI DSS. Kondisi saat ini: kami belum memiliki encryption untuk cardholder data yang stored, dan beberapa sistem masih menggunakan TLS 1.1',
      },
    ]);
    
    console.log('Hasil:', gapResult.text);
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n');

  // Contoh 5: Audit Preparation dengan streaming
  console.log('📚 Contoh 5: Audit Preparation (Streaming)');
  console.log('='.repeat(50));
  
  try {
    const prepStream = await agent.stream([
      {
        role: 'user',
        content: 'Persiapkan checklist untuk ISO 27001 Initial Certification Audit yang akan dilakukan dalam 60 hari',
      },
    ]);

    for await (const chunk of prepStream.textStream) {
      process.stdout.write(chunk);
    }
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n');
}

// Contoh penggunaan dengan Network Streaming (untuk melihat execution details)
async function exampleWithNetworkStreaming() {
  console.log('🌐 Contoh Network Streaming');
  console.log('='.repeat(50));

  const agent = mastra.getAgent('dtkAiAgent');

  const networkStream = await agent.network(
    'Bantu saya dengan gap analysis untuk ISO 27001 di area Cryptography dan berikan rekomendasi perbaikannya'
  );

  console.log('\nExecution Details:\n');
  for await (const chunk of networkStream) {
    console.log('Chunk:', JSON.stringify(chunk, null, 2));
  }

  console.log('\nFinal Status:', await networkStream.status);
  console.log('Final Result:', await networkStream.result);
  console.log('Token Usage:', await networkStream.usage);
}

// Run jika file ini dijalankan langsung
if (import.meta.url === `file://${process.argv[1]}`) {
  exampleWithStreaming().catch(console.error);
  // Uncomment untuk test network streaming:
  // exampleWithNetworkStreaming().catch(console.error);
}

export { exampleWithStreaming, exampleWithNetworkStreaming };

