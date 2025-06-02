/**
 * Export data to CSV format
 * @param data Array of objects to export
 * @param filename Name of the file to save as
 */
export function exportToCsv<T extends Record<string, any>>(data: T[], filename: string) {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  // Extract headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  let csvContent = [
    headers.join(','), // header row
    ...data.map(row => 
      headers.map(fieldName => 
        `"${String(row[fieldName] ?? '').replace(/"/g, '""')}"`
      ).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format date for display in exports
 */
export function formatExportDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
