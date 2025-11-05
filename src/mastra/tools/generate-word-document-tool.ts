import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

const OUTPUT_DIR = process.env.OUTPUT_DIR || './outputs';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Generate Word Document Tool
 * Membuat dokumen Word (DOCX) dari konten yang diberikan
 */
export const generateWordDocumentTool = createTool({
  id: 'generate-word-document-tool',
  description: 'Generate dokumen Word (DOCX) dari konten yang diberikan. Ideal untuk membuat laporan compliance, hardening reports, audit reports, dan dokumentasi lainnya dalam format Word. Tool ini dapat membuat dokumen dengan struktur yang rapi termasuk headings, paragraphs, tables, dan formatting.',
  inputSchema: z.object({
    title: z.string().describe('Judul dokumen'),
    sections: z.array(
      z.object({
        heading: z.string().describe('Judul section'),
        content: z.union([
          z.string().describe('Konten text biasa'),
          z.array(
            z.object({
              type: z.enum(['paragraph', 'list', 'table']),
              text: z.string().optional().describe('Text untuk paragraph atau list item'),
              items: z.array(z.string()).optional().describe('List items jika type = list'),
              tableData: z.array(z.array(z.string())).optional().describe('Data tabel jika type = table'),
              tableHeaders: z.array(z.string()).optional().describe('Header tabel jika type = table'),
            })
          ).describe('Structured content'),
        ]),
      })
    ).describe('Array of sections dengan heading dan content'),
    fileName: z.string().optional().describe('Nama file output (opsional, akan di-generate otomatis jika tidak disediakan)'),
  }),
  outputSchema: z.object({
    fileName: z.string().describe('Nama file yang dihasilkan'),
    filePath: z.string().describe('Path lengkap ke file yang dihasilkan'),
    fileSize: z.number().describe('Ukuran file dalam bytes'),
    message: z.string().describe('Pesan konfirmasi'),
  }),
  execute: async ({ context }) => {
    const { title, sections, fileName: providedFileName } = context;

    try {
      console.log(`📝 Generating Word document: ${title}`);

      const children: (Paragraph | Table)[] = [];

      // Add title
      children.push(
        new Paragraph({
          text: title,
          heading: HeadingLevel.TITLE,
          spacing: { after: 400 },
        })
      );

      // Process each section
      for (const section of sections) {
        // Add section heading
        children.push(
          new Paragraph({
            text: section.heading,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 200 },
          })
        );

        // Process content
        if (typeof section.content === 'string') {
          // Simple text content
          const paragraphs = section.content.split('\n\n').filter(p => p.trim());
          for (const para of paragraphs) {
            children.push(
              new Paragraph({
                text: para.trim(),
                spacing: { after: 200 },
              })
            );
          }
        } else if (Array.isArray(section.content)) {
          // Structured content
          for (const item of section.content) {
            if (item.type === 'paragraph' && item.text) {
              children.push(
                new Paragraph({
                  text: item.text,
                  spacing: { after: 200 },
                })
              );
            } else if (item.type === 'list' && item.items) {
              for (const listItem of item.items) {
                children.push(
                  new Paragraph({
                    text: listItem,
                    bullet: { level: 0 },
                    spacing: { after: 100 },
                  })
                );
              }
            } else if (item.type === 'table' && item.tableData && item.tableHeaders && item.tableHeaders.length > 0) {
              // Create table
              const tableRows: TableRow[] = [];
              const headerCount = item.tableHeaders.length;
              
              // Header row
              tableRows.push(
                new TableRow({
                  children: item.tableHeaders.map(
                    header => new TableCell({
                      children: [new Paragraph({ text: header })],
                      width: { size: 100 / headerCount, type: WidthType.PERCENTAGE },
                    })
                  ),
                })
              );

              // Data rows
              for (const rowData of item.tableData) {
                tableRows.push(
                  new TableRow({
                    children: rowData.map(
                      cell => new TableCell({
                        children: [new Paragraph({ text: cell })],
                        width: { size: 100 / rowData.length, type: WidthType.PERCENTAGE },
                      })
                    ),
                  })
                );
              }

              children.push(
                new Table({
                  rows: tableRows,
                })
              );
            }
          }
        }
      }

      // Create document
      const doc = new Document({
        sections: [
          {
            children,
          },
        ],
      });

      // Generate filename
      const fileName = providedFileName || `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.docx`;
      const filePath = path.join(OUTPUT_DIR, fileName);

      // Save document
      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(filePath, buffer);

      console.log(`✅ Word document generated: ${filePath}`);

      return {
        fileName,
        filePath,
        fileSize: buffer.length,
        message: `Dokumen Word "${fileName}" berhasil dibuat di ${filePath}. Ukuran file: ${(buffer.length / 1024).toFixed(2)} KB`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error generating Word document:', errorMessage);
      throw new Error(`Gagal membuat dokumen Word: ${errorMessage}`);
    }
  },
});

