import { BloodTestParser } from './BloodTestParser';
import { DnaReportParser } from './DnaReportParser';
import { MicrobiomeReportParser } from './MicrobiomeReportParser';

export async function parseReport(reportType: string, fileType: string, content: string) {
  reportType = reportType.toLowerCase();
  fileType = fileType.toLowerCase();
  if (reportType === 'blood' && fileType === 'text/csv') {
    const parser = new BloodTestParser();
    return await parser.parse(content);
  }
  if (reportType === 'dna' && fileType === 'text/csv') {
    const parser = new DnaReportParser();
    return await parser.parse(content);
  }
  if (reportType === 'microbiome' && fileType === 'application/json') {
    const parser = new MicrobiomeReportParser();
    return await parser.parse(content);
  }
  throw new Error(`No parser available for file type: ${reportType} (${fileType})`);
}
