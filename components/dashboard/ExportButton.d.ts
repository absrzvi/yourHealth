import React from 'react';

type ExportFormat = 'csv' | 'pdf';

export interface ExportButtonProps {
  data: Record<string, any>[];
  filename: string;
  disabled?: boolean;
  className?: string;
  onExport?: (format: ExportFormat) => void;
}

declare const ExportButton: React.FC<ExportButtonProps>;

export default ExportButton;
