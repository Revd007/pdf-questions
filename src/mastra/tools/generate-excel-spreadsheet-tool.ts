import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_DIR = process.env.OUTPUT_DIR || './outputs';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Generate Excel Spreadsheet Tool
 * Membuat dokumen Excel (XLSX) dari data yang diberikan
 * Ideal untuk membuat compliance checklists, gap analysis matrices, audit findings tracking, dll.
 */
export const generateExcelSpreadsheetTool = createTool({
  id: 'generate-excel-spreadsheet-tool',
  description: 'Generate dokumen Excel (XLSX) dari data yang diberikan. Ideal untuk membuat compliance checklists, gap analysis matrices, audit findings tracking, risk assessment matrices, dan data tracking lainnya dalam format Excel dengan sheets, tables, dan formatting yang rapi.',
  inputSchema: z.object({
    fileName: z.string().describe('Nama file Excel yang akan dibuat'),
    sheets: z.array(
      z.object({
        name: z.string().describe('Nama sheet'),
        headers: z.array(z.string()).describe('Header kolom untuk sheet ini'),
        rows: z.array(
          z.array(z.string()).describe('Array of cell values. Setiap cell value akan dikonversi otomatis: string tetap string, number/boolean akan dikonversi ke string saat diperlukan.')
        ).describe('Data rows untuk sheet ini. Setiap row adalah array of strings. Untuk number atau boolean, kirim sebagai string (contoh: "123" untuk number, "true" untuk boolean).'),
        autoFilter: z.boolean().optional().default(true).describe('Enable auto-filter untuk headers'),
        columnWidths: z.array(z.number()).optional().describe('Width untuk setiap kolom (opsional)'),
      })
    ).describe('Array of sheets dengan nama, headers, dan rows'),
  }),
  outputSchema: z.object({
    fileName: z.string().describe('Nama file yang dihasilkan'),
    filePath: z.string().describe('Path lengkap ke file yang dihasilkan'),
    fileSize: z.number().describe('Ukuran file dalam bytes'),
    sheetsCount: z.number().describe('Jumlah sheets yang dibuat'),
    message: z.string().describe('Pesan konfirmasi'),
  }),
  execute: async ({ context }) => {
    const { fileName: providedFileName, sheets } = context;

    try {
      console.log(`📊 Generating Excel spreadsheet: ${providedFileName}`);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'DTK AI - PT Duta Teknologi Kreatif';
      workbook.created = new Date();

      // Process each sheet
      for (const sheetConfig of sheets) {
        const worksheet = workbook.addWorksheet(sheetConfig.name);

        // Add headers
        const headerRow = worksheet.addRow(sheetConfig.headers);
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' },
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        // Set column widths if provided
        if (sheetConfig.columnWidths) {
          sheetConfig.columnWidths.forEach((width, index) => {
            worksheet.getColumn(index + 1).width = width;
          });
        } else {
          // Auto-size columns based on headers
          sheetConfig.headers.forEach((header, index) => {
            worksheet.getColumn(index + 1).width = Math.max(header.length + 5, 15);
          });
        }

        // Add data rows
        for (const rowData of sheetConfig.rows) {
          // Convert row data to proper types (handle string to number/boolean conversion)
          const processedRow = rowData.map(cell => {
            if (cell === null || cell === undefined || cell === '') {
              return '';
            }
            
            // If it's already a number or boolean, keep it
            if (typeof cell === 'number' || typeof cell === 'boolean') {
              return cell;
            }
            
            // If it's a string, try to convert to number or boolean if possible
            if (typeof cell === 'string') {
              // Try to convert to number
              const numValue = Number(cell);
              if (!isNaN(numValue) && cell.trim() !== '' && !isNaN(parseFloat(cell))) {
                // Check if it's an integer or float
                return Number.isInteger(numValue) ? numValue : parseFloat(cell);
              }
              
              // Try to convert to boolean
              const lowerCell = cell.toLowerCase().trim();
              if (lowerCell === 'true') return true;
              if (lowerCell === 'false') return false;
              
              // Otherwise keep as string
              return cell;
            }
            
            // Convert other types to string
            return String(cell);
          });
          worksheet.addRow(processedRow);
        }

        // Enable auto-filter if requested
        if (sheetConfig.autoFilter) {
          worksheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: sheetConfig.rows.length + 1, column: sheetConfig.headers.length },
          };
        }

        // Freeze header row
        worksheet.views = [
          {
            state: 'frozen',
            ySplit: 1,
          },
        ];
      }

      // Generate filename
      const fileName = providedFileName.endsWith('.xlsx') 
        ? providedFileName 
        : `${providedFileName}.xlsx`;
      const filePath = path.join(OUTPUT_DIR, fileName);

      // Save workbook
      await workbook.xlsx.writeFile(filePath);

      const stats = fs.statSync(filePath);

      console.log(`✅ Excel spreadsheet generated: ${filePath}`);

      return {
        fileName,
        filePath,
        fileSize: stats.size,
        sheetsCount: sheets.length,
        message: `Dokumen Excel "${fileName}" berhasil dibuat di ${filePath} dengan ${sheets.length} sheet(s). Ukuran file: ${(stats.size / 1024).toFixed(2)} KB`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error generating Excel spreadsheet:', errorMessage);
      throw new Error(`Gagal membuat dokumen Excel: ${errorMessage}`);
    }
  },
});

