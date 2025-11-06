import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { extractTextFromFile } from '../lib/util';
import { getLanguageModel } from '../lib/model-provider';
import { generateText } from 'ai';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Tool untuk menganalisis hardening checklist PDF secara lengkap
 * dan melakukan scoring berdasarkan CIS Benchmark terbaru
 */
export const analyzeHardeningChecklistTool = createTool({
  id: 'analyze-hardening-checklist-tool',
  description: 'Menganalisis dokumen hardening checklist (PDF/DOCX) secara LENGKAP dan melakukan scoring berdasarkan CIS Benchmark TERBARU. Tool ini membaca SELURUH konten file, mengekstrak SEMUA data konfigurasi, dan menggunakan MCP untuk mencari CIS Benchmark terbaru sebelum melakukan scoring komprehensif.',
  inputSchema: z.object({
    filePath: z.string().describe('Path lengkap ke file hardening checklist (PDF atau DOCX)'),
    osVersion: z.enum(['Windows Server 2016', 'Windows Server 2019', 'Windows Server 2022', 'Windows 10', 'Windows 11']).describe('Versi OS yang dianalisis dalam dokumen'),
    useMcpForLatestData: z.boolean().optional().default(true).describe('Gunakan MCP untuk mencari data CIS Benchmark terbaru (default: true)'),
  }),
  outputSchema: z.object({
    documentInfo: z.object({
      fileName: z.string(),
      pagesCount: z.number(),
      totalCharacters: z.number(),
    }),
    extractedConfigurations: z.record(z.any()).describe('SEMUA konfigurasi yang diekstrak dari dokumen'),
    benchmarkInfo: z.object({
      version: z.string(),
      source: z.string(),
      officialUrl: z.string().optional().describe('LINK WEBSITE RESMI CIS Benchmark yang bisa diverifikasi'),
      documentUrl: z.string().optional().describe('LINK ke dokumen CIS Benchmark resmi'),
      lastUpdated: z.string().optional(),
    }),
    scoringResults: z.object({
      osVersion: z.string(),
      overallScore: z.number(),
      complianceLevel: z.enum(['Excellent', 'Good', 'Fair', 'Poor', 'Critical']),
      totalChecks: z.number(),
      passedChecks: z.number(),
      failedChecks: z.number(),
      criticalFindings: z.number(),
      detailedResults: z.array(z.any()),
      summary: z.string(),
      priorityActions: z.array(z.any()),
    }),
    comprehensiveAnalysis: z.string().describe('Analisis lengkap dan detail dari seluruh temuan'),
  }),
  execute: async ({ context, mastra }) => {
    const { filePath: rawFilePath, osVersion, useMcpForLatestData } = context;

    try {
      // Step 1: Normalize path dan baca file
      // Coba beberapa lokasi yang mungkin: uploads folder, current directory, absolute path
      let filePath = path.normalize(rawFilePath);
      let finalFilePath: string | null = null;

      // List of possible locations to search
      const possiblePaths = [
        // If already absolute, use as is
        path.isAbsolute(filePath) ? filePath : null,
        // Try uploads folder first (most common location)
        path.resolve(process.cwd(), 'uploads', path.basename(filePath)),
        // Try current directory
        path.resolve(process.cwd(), filePath),
        // Try absolute path if not already absolute
        path.isAbsolute(filePath) ? null : path.resolve(filePath),
        // Try from workspace root
        path.resolve(process.cwd(), '..', filePath),
      ].filter((p): p is string => p !== null);

      // Try each possible path
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          finalFilePath = possiblePath;
          console.log(`✅ File ditemukan di: ${finalFilePath}`);
          break;
        }
      }

      if (!finalFilePath) {
        // Try to find file by name in uploads directory
        const uploadsDir = path.resolve(process.cwd(), 'uploads');
        if (fs.existsSync(uploadsDir)) {
          const files = fs.readdirSync(uploadsDir);
          const matchingFile = files.find(f => 
            f.toLowerCase().includes(path.basename(filePath, path.extname(filePath)).toLowerCase()) ||
            f.toLowerCase() === filePath.toLowerCase()
          );
          if (matchingFile) {
            finalFilePath = path.join(uploadsDir, matchingFile);
            console.log(`✅ File ditemukan di uploads: ${finalFilePath}`);
          }
        }

        if (!finalFilePath) {
          throw new Error(
            `File tidak ditemukan: ${rawFilePath}\n` +
            `Tried paths:\n${possiblePaths.map(p => `  - ${p}`).join('\n')}\n` +
            `Current working directory: ${process.cwd()}\n` +
            `Uploads directory: ${path.resolve(process.cwd(), 'uploads')}`
          );
        }
      }

      filePath = finalFilePath;

      const fileName = path.basename(filePath);
      const fileExtension = path.extname(fileName).slice(1).toLowerCase();
      
      if (!['pdf', 'docx'].includes(fileExtension)) {
        throw new Error(`File type tidak didukung: ${fileExtension}. Hanya PDF dan DOCX yang didukung.`);
      }

      console.log(`📄 Membaca file lengkap: ${fileName} (${filePath})`);

      // Step 2: Extract SEMUA text dari file
      const fileExtractionResult = await extractTextFromFile(filePath, fileExtension as 'pdf' | 'docx');
      const fullText = fileExtractionResult.extractedText;
      const pagesCount = fileExtractionResult.pagesCount;

      if (!fullText || fullText.trim().length === 0) {
        throw new Error('Tidak dapat mengekstrak teks dari dokumen. Pastikan file berisi konten yang dapat dibaca.');
      }

      console.log(`✅ Berhasil mengekstrak ${fullText.length} karakter dari ${pagesCount} halaman`);

      // Step 3: Gunakan AI untuk mengekstrak SEMUA konfigurasi dari dokumen
      console.log(`🔍 Mengekstrak SEMUA konfigurasi dari dokumen menggunakan AI...`);
      const model = getLanguageModel();

      const extractionPrompt = `Anda adalah expert dalam menganalisis dokumen hardening checklist untuk Windows Server.

Saya akan memberikan SELURUH konten dokumen hardening checklist. Tugas Anda adalah mengekstrak SEMUA konfigurasi keamanan yang disebutkan dalam dokumen.

Dokumen ini adalah: ${fileName}
OS Version: ${osVersion}

Konten dokumen lengkap:
${fullText}

PENTING: Ekstrak SEMUA konfigurasi yang disebutkan, termasuk:
1. Password Policy (semua setting: history, age, length, complexity, reversible encryption)
2. Account Lockout Policy (duration, threshold, reset counter)
3. User Rights Assignment (semua rights yang disebutkan)
4. Security Options (semua security options yang disebutkan)
5. Network Security settings
6. Remote Desktop settings
7. Audit Policy settings
8. System Services (NTP, antivirus, dll)
9. Firewall settings
10. Registry settings
11. File permissions
12. Group Policy settings
13. Dan SEMUA konfigurasi keamanan lainnya yang disebutkan

Formatkan sebagai JSON dengan struktur:
{
  "Password Policy": {
    "Enforce password history": "nilai yang ditemukan atau 'Not Found'",
    "Maximum password age": "nilai yang ditemukan atau 'Not Found'",
    "Minimum password age": "nilai yang ditemukan atau 'Not Found'",
    "Minimum password length": "nilai yang ditemukan atau 'Not Found'",
    "Password must meet complexity requirements": "Enabled/Disabled/Not Found",
    "Store passwords using reversible encryption": "Enabled/Disabled/Not Found"
  },
  "Account Lockout Policy": {
    "Account lockout duration": "nilai atau 'Not Found'",
    "Account lockout threshold": "nilai atau 'Not Found'",
    "Reset account lockout counter after": "nilai atau 'Not Found'"
  },
  "User Rights Assignment": {
    "Access this computer from the network": "nilai atau 'Not Found'",
    "Log on as a service": "nilai atau 'Not Found'",
    // ... semua user rights yang disebutkan
  },
  "Security Options": {
    "Accounts: Guest account status": "Enabled/Disabled/Not Found",
    "Accounts: Rename administrator account": "nilai atau 'Not Found'",
    // ... semua security options yang disebutkan
  },
  "Network Security": {
    // ... semua network security settings
  },
  "Remote Desktop": {
    "Remote Desktop Services: Require secure RDP communication": "nilai atau 'Not Found'",
    // ... semua RDP settings
  },
  "Audit Policy": {
    // ... semua audit policy settings
  },
  "System Services": {
    "Time Synchronization (NTP)": "Enabled/Disabled/Not Found",
    "Windows Defender": "Enabled/Disabled/Not Found",
    // ... semua system services
  },
  "Firewall": {
    // ... firewall settings jika disebutkan
  },
  "Other Settings": {
    // ... konfigurasi lain yang ditemukan
  }
}

HARAP DIPERHATIKAN:
- Ekstrak SEMUA konfigurasi yang disebutkan, jangan hanya sebagian
- Jika nilai tidak disebutkan, gunakan "Not Found"
- Jika disebutkan "Enabled" atau "Disabled", gunakan nilai tersebut
- Jika disebutkan angka (misalnya "24 passwords"), gunakan angka tersebut
- Pastikan untuk mengekstrak SEMUA kategori yang disebutkan dalam dokumen

Return HANYA JSON, tanpa penjelasan tambahan.`;

      const configExtractionResult = await generateText({
        model,
        prompt: extractionPrompt,
        maxOutputTokens: 8000, // Allow large output untuk ekstraksi lengkap
      });

      // Parse extracted configurations
      let extractedConfigurations: any = {};
      try {
        const jsonMatch = configExtractionResult.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedConfigurations = JSON.parse(jsonMatch[0]);
          console.log(`✅ Berhasil mengekstrak konfigurasi dari ${Object.keys(extractedConfigurations).length} kategori`);
        } else {
          throw new Error('Tidak dapat menemukan JSON dalam response');
        }
      } catch (parseError) {
        console.warn('⚠️ Error parsing JSON, mencoba extraction ulang...');
        // Try again with more specific prompt
        const retryPrompt = `Extract JSON from this text:\n\n${configExtractionResult.text}\n\nReturn ONLY valid JSON, no other text.`;
        const retryResult = await generateText({
          model,
          prompt: retryPrompt,
          maxOutputTokens: 4000,
        });
        const retryJson = retryResult.text.match(/\{[\s\S]*\}/);
        if (retryJson) {
          extractedConfigurations = JSON.parse(retryJson[0]);
        } else {
          throw new Error(`Gagal mengekstrak konfigurasi: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }
      }

      // Step 4: Lakukan scoring menggunakan logic yang sama dengan CIS Benchmark Tool
      // (Kita tidak bisa memanggil tool lain langsung, jadi kita implementasikan logic-nya di sini)
      console.log(`📊 Melakukan scoring berdasarkan CIS Benchmark TERBARU...`);
      
      // Import logic dari CIS Benchmark tool (kita akan menggunakan AI untuk scoring)
      const scoringPrompt = `Sebagai expert CIS Benchmark auditor, lakukan scoring lengkap untuk konfigurasi berikut:

OS Version: ${osVersion}
Extracted Configurations:
${JSON.stringify(extractedConfigurations, null, 2)}

PENTING: Setiap kontrol HARUS disertai dengan:
- Link sumber resmi CIS Benchmark yang bisa diverifikasi (contoh: https://www.cisecurity.org/cis-benchmarks/)
- Nomor section/referensi spesifik dari dokumen CIS Benchmark resmi
- Control ID CIS Benchmark (contoh: 1.1.1, 2.1.1, dll)

Lakukan analisis dan scoring berdasarkan CIS Benchmark TERBARU untuk ${osVersion}. Bandingkan setiap konfigurasi dengan rekomendasi CIS Benchmark dan berikan:
1. Overall Score (0-100)
2. Compliance Level (Excellent/Good/Fair/Poor/Critical)
3. officialUrl: LINK WEBSITE RESMI CIS Benchmark (contoh: https://www.cisecurity.org/cis-benchmarks/ atau https://www.cisecurity.org/benchmark/windows-server-2016)
4. documentUrl: LINK ke dokumen CIS Benchmark resmi jika tersedia
5. Total Checks, Passed Checks, Failed Checks, Critical Findings
6. Detailed Results untuk setiap kontrol dengan field:
   - category, controlId (contoh: "1.1.1"), controlName, currentValue, recommendedValue, status, severity
   - description, recommendation, impact
   - benchmarkReference (contoh: "Section 1.1.1")
   - sourceUrl: LINK sumber untuk kontrol ini (bisa link utama atau link spesifik jika tersedia)
   - officialDocumentUrl: LINK ke dokumen resmi
7. Priority Actions (action, priority, estimatedEffort)

Formatkan sebagai JSON dengan struktur yang sama seperti CIS Benchmark Scoring Tool output. Pastikan setiap kontrol memiliki sourceUrl yang jelas dan bisa diverifikasi.`;

      const scoringResultText = await generateText({
        model,
        prompt: scoringPrompt,
        maxOutputTokens: 12000, // Large output untuk scoring detail dengan semua kontrol
      });

      // Parse scoring result
      let scoringResult: any;
      try {
        const scoringJson = scoringResultText.text.match(/\{[\s\S]*\}/);
        if (scoringJson) {
          scoringResult = JSON.parse(scoringJson[0]);
        } else {
          // Fallback: create basic scoring result
          scoringResult = {
            osVersion,
            overallScore: 0,
            complianceLevel: 'Critical',
            totalChecks: 0,
            passedChecks: 0,
            failedChecks: 0,
            criticalFindings: 0,
            detailedResults: [],
            summary: 'Scoring sedang diproses...',
            priorityActions: [],
          };
        }
      } catch (parseError) {
        console.warn('⚠️ Error parsing scoring result, menggunakan fallback');
        scoringResult = {
          osVersion,
          overallScore: 0,
          complianceLevel: 'Critical',
          totalChecks: 0,
          passedChecks: 0,
          failedChecks: 0,
          criticalFindings: 0,
          detailedResults: [],
          summary: 'Error parsing scoring result',
          priorityActions: [],
        };
      }

      // Step 5: Buat analisis comprehensive
      console.log(`📝 Membuat analisis comprehensive...`);
      
      const analysisPrompt = `Anda adalah expert CIS Benchmark auditor dengan pengalaman bertahun-tahun. Buatkan analisis SANGAT LENGKAP, DETAIL, dan KOMPREHENSIF dari hasil scoring hardening berikut.

PENTING: Berikan analisis yang SANGAT DETAIL dan LENGKAP. Jangan singkat-singkat. Jelaskan SEMUA aspek dengan mendalam.

OS Version: ${osVersion}
Overall Score: ${scoringResult.overallScore}%
Compliance Level: ${scoringResult.complianceLevel}
Total Checks: ${scoringResult.totalChecks}
Passed: ${scoringResult.passedChecks}
Failed: ${scoringResult.failedChecks}
Critical Findings: ${scoringResult.criticalFindings}

Detailed Results (SEMUA kontrol yang dianalisis):
${JSON.stringify(scoringResult.detailedResults, null, 2)}

Priority Actions:
${JSON.stringify(scoringResult.priorityActions, null, 2)}

Buatkan analisis yang SANGAT LENGKAP dan mencakup:

1. **EXECUTIVE SUMMARY** (untuk management):
   - Ringkasan eksekutif lengkap tentang status compliance
   - Skor keseluruhan dan interpretasinya
   - Temuan kritis yang perlu perhatian segera
   - Rekomendasi prioritas untuk management
   - Dampak bisnis dari temuan-temuan tersebut

2. **DETAILED FINDINGS ANALYSIS** (analisis SANGAT DETAIL setiap temuan):
   Untuk SETIAP kontrol yang dianalisis (baik yang PASS maupun FAIL), berikan:
   - Nama kontrol dan ID CIS Benchmark
   - Konfigurasi saat ini (current value)
   - Rekomendasi CIS Benchmark (recommended value)
   - Status compliance (Compliant/Non-Compliant/Needs Verification)
   - Severity level dan penjelasan mengapa severity tersebut
   - Penjelasan DETAIL mengapa kontrol ini penting
   - Dampak keamanan jika tidak compliant
   - Contoh serangan yang mungkin terjadi jika tidak compliant
   - Best practices terkait kontrol ini
   - Referensi ke CIS Benchmark dan standar keamanan lainnya

3. **RISK ASSESSMENT** (penilaian risiko SANGAT DETAIL):
   Untuk setiap temuan non-compliant, berikan:
   - Likelihood (kemungkinan terjadi serangan): Low/Medium/High/Critical
   - Impact (dampak jika terjadi serangan): Low/Medium/High/Critical
   - Risk Score (Likelihood × Impact)
   - Penjelasan DETAIL tentang risiko yang dihadapi
   - Skenario serangan yang mungkin terjadi
   - Dampak terhadap bisnis dan operasional
   - Dampak terhadap compliance dan audit

4. **REMEDIATION PLAN** (rencana perbaikan SANGAT DETAIL dan ACTIONABLE):
   Untuk setiap temuan non-compliant, berikan:
   - Langkah-langkah teknis DETAIL untuk memperbaiki
   - Command atau konfigurasi yang perlu diubah (jika applicable)
   - Screenshot atau dokumentasi yang diperlukan
   - Testing steps untuk memverifikasi perbaikan
   - Rollback plan jika terjadi masalah
   - Estimated effort (waktu yang dibutuhkan)
   - Dependencies (hal-hal yang perlu disiapkan terlebih dahulu)
   - Resources yang diperlukan (tools, access, dll)
   - Timeline yang realistis

5. **COMPLIANCE GAP ANALYSIS** (analisis gap SANGAT DETAIL):
   - Perbandingan detail antara konfigurasi saat ini dengan CIS Benchmark
   - Gap analysis per kategori (Password Policy, Account Lockout, dll)
   - Trend compliance (apakah ada peningkatan atau penurunan)
   - Benchmarking dengan best practices industri
   - Rekomendasi untuk mencapai compliance level yang lebih tinggi

6. **RECOMMENDATIONS** (rekomendasi prioritas SANGAT DETAIL):
   - Rekomendasi prioritas tinggi (Critical findings)
   - Rekomendasi prioritas sedang (High findings)
   - Rekomendasi prioritas rendah (Medium/Low findings)
   - Roadmap perbaikan jangka pendek (1-3 bulan)
   - Roadmap perbaikan jangka menengah (3-6 bulan)
   - Roadmap perbaikan jangka panjang (6-12 bulan)
   - Rekomendasi untuk continuous improvement
   - Rekomendasi untuk monitoring dan maintenance

7. **ADDITIONAL INSIGHTS**:
   - Best practices tambahan yang tidak tercakup dalam CIS Benchmark
   - Rekomendasi untuk hardening tambahan
   - Tips untuk mempertahankan compliance
   - Rekomendasi untuk audit dan monitoring berkala

PENTING:
- Berikan penjelasan yang SANGAT DETAIL dan LENGKAP untuk SETIAP bagian
- Jangan singkat-singkat atau hanya memberikan ringkasan
- Jelaskan dengan bahasa yang jelas dan mudah dipahami
- Berikan contoh konkret dan actionable
- Gunakan format yang terstruktur dengan headings dan subheadings yang jelas
- Total output harus SANGAT LENGKAP dan DETAIL (minimal 3000-5000 kata)
- Pastikan SEMUA temuan dianalisis dengan detail, tidak ada yang terlewat`;

      const comprehensiveAnalysisResult = await generateText({
        model,
        prompt: analysisPrompt,
        maxOutputTokens: 16000, // SANGAT BESAR untuk analisis yang sangat lengkap dan detail
      });

      return {
        documentInfo: {
          fileName,
          pagesCount,
          totalCharacters: fullText.length,
        },
        extractedConfigurations,
        benchmarkInfo: {
          version: scoringResult.benchmarkVersion || 'Latest',
          source: scoringResult.benchmarkSource || 'CIS Benchmark',
          officialUrl: scoringResult.officialUrl || 'https://www.cisecurity.org/cis-benchmarks/',
          documentUrl: scoringResult.documentUrl || scoringResult.officialUrl || 'https://www.cisecurity.org/cis-benchmarks/',
          lastUpdated: new Date().toISOString(),
        },
        scoringResults: scoringResult,
        comprehensiveAnalysis: comprehensiveAnalysisResult.text,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error in analyze hardening checklist:', errorMessage);
      throw new Error(`Gagal menganalisis hardening checklist: ${errorMessage}`);
    }
  },
});

