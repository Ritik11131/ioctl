import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  /**
   * Export any array of objects as XLSX or CSV, with custom headers and nested support.
   * @param data Array of objects to export
   * @param fileName Filename (no extension)
   * @param keyHeaderMap Array of { field, header, subfield? }
   * @param fileType 'xlsx' | 'csv'
   */
  exportToSpreadsheet(
    data: any[],
    fileName: string,
    keyHeaderMap: { field: string; header: string; subfield?: string }[],
    fileType: 'xlsx' | 'csv' = 'xlsx'
  ): void {
    if (!data || !data.length || !keyHeaderMap || !keyHeaderMap.length) return;

    // Build export data according to keys and subfields
    const exportData = data.map(row => {
      const out: any = {};
      keyHeaderMap.forEach(col => {
        if (col.subfield) {
          // Nested data, e.g. row.state.name
          out[col.header] = row[col.field]?.[col.subfield] ?? '';
        } else {
          out[col.header] = row[col.field] ?? '';
        }
      });
      return out;
    });

    // The header order from config
    const headers = keyHeaderMap.map(col => col.header);

    // Create worksheet
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData, { header: headers });

    // Overwrite header row for correct order and label
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A1" });

    // Workbook setup
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // Download
    const ext = fileType === 'csv' ? 'csv' : 'xlsx';
    XLSX.writeFile(wb, `${fileName}.${ext}`, { bookType: ext });
  }
}
