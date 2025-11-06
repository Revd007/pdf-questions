import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

// Dynamic import untuk pdf2json agar tidak di-bundle (menghindari CommonJS issues)
// pdf2json menggunakan util.inherits yang tidak kompatibel dengan ES modules saat bundling
// Menggunakan createRequire untuk runtime loading yang benar-benar tidak di-bundle
let PDFParser: any = null;
let pdf2jsonLoaded = false;

async function getPDFParser() {
  if (!PDFParser && !pdf2jsonLoaded) {
    pdf2jsonLoaded = true;
    try {
      // Use createRequire untuk runtime require yang tidak di-bundle
      // String literal dengan variable untuk menghindari static analysis
      const requireModule = createRequire(import.meta.url);
      const pdf2jsonPath = 'pdf2json';
      PDFParser = requireModule(pdf2jsonPath);
      // Handle both default export and named export
      PDFParser = PDFParser.default || PDFParser || PDFParser.PDFParser;
    } catch (error) {
      // Fallback: try dynamic import sebagai last resort
      try {
        // @ts-ignore
        const pdf2jsonModule: any = await import('pdf2json');
        PDFParser = pdf2jsonModule.default || pdf2jsonModule || (pdf2jsonModule as any).PDFParser;
      } catch (importError) {
        console.error('Failed to load pdf2json:', error);
        throw new Error('PDF parsing library (pdf2json) is not available. Please ensure pdf2json is installed.');
      }
    }
  }
  return PDFParser;
}

// Simple function to extract text from PDF using pure JavaScript
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<{ extractedText: string; pagesCount: number }> {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error('Invalid PDF file: empty buffer');
  }

  console.log('🔍 Extracting text from PDF...');

  // Dynamic import PDFParser saat runtime menggunakan createRequire
  const PDFParserClass = await getPDFParser();
  
  if (!PDFParserClass) {
    throw new Error('PDFParser class not available. pdf2json may not be properly installed.');
  }

  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParserClass();

    pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
      try {
        let extractedText = '';
        let pageCount = 0;

        if (pdfData && pdfData.Pages) {
          pageCount = pdfData.Pages.length;

          for (const page of pdfData.Pages) {
            if (page.Texts) {
              for (const textItem of page.Texts) {
                if (textItem.R) {
                  for (const textRun of textItem.R) {
                    if (textRun.T) {
                      // Decode URI component to get readable text
                      const decodedText = decodeURIComponent(textRun.T);
                      extractedText += decodedText + ' ';
                    }
                  }
                }
              }
            }
            extractedText += '\n\n'; // Add page break
          }
        }

        extractedText = extractedText.trim();

        if (!extractedText) {
          reject(new Error('No text could be extracted from the PDF'));
          return;
        }

        console.log(`✅ Extracted ${extractedText.length} characters from ${pageCount} pages`);

        resolve({
          extractedText,
          pagesCount: pageCount,
        });
      } catch (error) {
        reject(new Error(`Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });

    pdfParser.on('pdfParser_dataError', (error: any) => {
      reject(new Error(`PDF parsing failed: ${error.parserError || error.message || 'Unknown error'}`));
    });

    // Parse the PDF buffer
    pdfParser.parseBuffer(pdfBuffer);
  });
}

/**
 * Extract text from DOCX (Word) files
 */
export async function extractTextFromDOCX(filePath: string): Promise<{ extractedText: string; pagesCount: number }> {
  console.log('🔍 Extracting text from DOCX...');

  try {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });

    if (!result.value || result.value.trim().length === 0) {
      throw new Error('No text could be extracted from the DOCX file');
    }

    const extractedText = result.value.trim();
    
    // Estimate pages (approximately 500 words per page)
    const words = extractedText.split(/\s+/).length;
    const pagesCount = Math.max(1, Math.ceil(words / 500));

    console.log(`✅ Extracted ${extractedText.length} characters from estimated ${pagesCount} pages`);

    return {
      extractedText,
      pagesCount,
    };
  } catch (error) {
    throw new Error(`DOCX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from XLSX (Excel) files
 */
export async function extractTextFromXLSX(filePath: string): Promise<{ extractedText: string; pagesCount: number }> {
  console.log('🔍 Extracting text from XLSX...');

  try {
    const workbook = XLSX.readFile(filePath);
    let extractedText = '';
    let sheetCount = 0;

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      sheetCount++;
      const sheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      extractedText += `\n\n=== Sheet: ${sheetName} ===\n\n`;

      // Convert rows to text
      for (const row of sheetData as any[][]) {
        const rowText = row
          .map((cell: any) => {
            if (cell === null || cell === undefined) return '';
            return String(cell).trim();
          })
          .filter((cell: string) => cell.length > 0)
          .join(' | ');
        
        if (rowText) {
          extractedText += rowText + '\n';
        }
      }
    }

    extractedText = extractedText.trim();

    if (!extractedText) {
      throw new Error('No text could be extracted from the XLSX file');
    }

    // Estimate pages (approximately 50 rows per page)
    const rows = extractedText.split('\n').length;
    const pagesCount = Math.max(1, Math.ceil(rows / 50));

    console.log(`✅ Extracted ${extractedText.length} characters from ${sheetCount} sheet(s), estimated ${pagesCount} pages`);

    return {
      extractedText,
      pagesCount,
    };
  } catch (error) {
    throw new Error(`XLSX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from CSV files
 */
export async function extractTextFromCSV(filePath: string): Promise<{ extractedText: string; pagesCount: number }> {
  console.log('🔍 Extracting text from CSV...');

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const csvData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    let extractedText = '';

    // Convert rows to text
    for (const row of csvData as any[][]) {
      const rowText = row
        .map((cell: any) => {
          if (cell === null || cell === undefined) return '';
          return String(cell).trim();
        })
        .filter((cell: string) => cell.length > 0)
        .join(' | ');
      
      if (rowText) {
        extractedText += rowText + '\n';
      }
    }

    extractedText = extractedText.trim();

    if (!extractedText) {
      throw new Error('No text could be extracted from the CSV file');
    }

    // Estimate pages (approximately 50 rows per page)
    const rows = extractedText.split('\n').length;
    const pagesCount = Math.max(1, Math.ceil(rows / 50));

    console.log(`✅ Extracted ${extractedText.length} characters from ${rows} rows, estimated ${pagesCount} pages`);

    return {
      extractedText,
      pagesCount,
    };
  } catch (error) {
    throw new Error(`CSV extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from TXT files
 */
export async function extractTextFromTXT(filePath: string): Promise<{ extractedText: string; pagesCount: number }> {
  console.log('🔍 Extracting text from TXT...');

  try {
    const extractedText = fs.readFileSync(filePath, 'utf-8').trim();

    if (!extractedText) {
      throw new Error('No text could be extracted from the TXT file');
    }

    // Estimate pages (approximately 500 words per page)
    const words = extractedText.split(/\s+/).length;
    const pagesCount = Math.max(1, Math.ceil(words / 500));

    console.log(`✅ Extracted ${extractedText.length} characters, estimated ${pagesCount} pages`);

    return {
      extractedText,
      pagesCount,
    };
  } catch (error) {
    throw new Error(`TXT extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Auto-detect file type and extract text
 */
export async function extractTextFromFile(filePath: string, fileType?: string): Promise<{ extractedText: string; pagesCount: number }> {
  // Normalize path
  const normalizedPath = path.normalize(filePath);
  
  // Check if file exists
  if (!fs.existsSync(normalizedPath)) {
    throw new Error(`File tidak ditemukan: ${normalizedPath}`);
  }

  const extension = fileType || path.extname(normalizedPath).slice(1).toLowerCase();

  switch (extension) {
    case 'pdf':
      console.log(`📄 Reading PDF file: ${normalizedPath}`);
      const pdfBuffer = fs.readFileSync(normalizedPath);
      return await extractTextFromPDF(pdfBuffer);
    
    case 'docx':
      return await extractTextFromDOCX(normalizedPath);
    
    case 'xlsx':
      return await extractTextFromXLSX(normalizedPath);
    
    case 'csv':
      return await extractTextFromCSV(normalizedPath);
    
    case 'txt':
      return await extractTextFromTXT(normalizedPath);
    
    default:
      throw new Error(`File type not supported: ${extension}. Supported types: pdf, docx, xlsx, csv, txt`);
  }
}
