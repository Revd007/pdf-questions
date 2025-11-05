import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';

// Dynamic import untuk pdf2json agar tidak di-bundle (menghindari CommonJS issues)
// pdf2json menggunakan util.inherits yang tidak kompatibel dengan ES modules saat bundling
let PDFParser: any = null;

async function getPDFParser() {
  if (!PDFParser) {
    // @ts-ignore - Dynamic import untuk menghindari bundling issues
    const pdf2jsonModule = await import('pdf2json');
    PDFParser = pdf2jsonModule.default || pdf2jsonModule;
  }
  return PDFParser;
}

// Simple function to extract text from PDF using pure JavaScript
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<{ extractedText: string; pagesCount: number }> {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error('Invalid PDF file: empty buffer');
  }

  console.log('🔍 Extracting text from PDF...');

  // Dynamic import PDFParser saat runtime
  const PDFParserClass = await getPDFParser();

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
  const extension = fileType || filePath.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      const pdfBuffer = fs.readFileSync(filePath);
      return await extractTextFromPDF(pdfBuffer);
    
    case 'docx':
      return await extractTextFromDOCX(filePath);
    
    case 'xlsx':
      return await extractTextFromXLSX(filePath);
    
    case 'csv':
      return await extractTextFromCSV(filePath);
    
    case 'txt':
      return await extractTextFromTXT(filePath);
    
    default:
      throw new Error(`File type not supported: ${extension}. Supported types: pdf, docx, xlsx, csv, txt`);
  }
}
