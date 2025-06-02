import React from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToCsv } from '@/lib/utils/exportUtils';

type ExportFormat = 'csv' | 'pdf';

// Base type for exportable data
type ExportableData = Record<string, string | number | boolean | null | undefined>;

interface ExportButtonProps {
  data: ExportableData[];
  filename: string;
  disabled?: boolean;
  className?: string;
  onExport?: (format: ExportFormat) => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filename,
  disabled = false,
  className = '',
  onExport,
}) => {
  const handleExport = (format: ExportFormat) => {
    if (onExport) {
      onExport(format);
      return;
    }

    if (format === 'csv' && data.length > 0) {
      exportToCsv(data, filename);
    } else if (format === 'pdf') {
      console.log('PDF export not yet implemented');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`gap-2 ${className}`}
          disabled={disabled}
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')} disabled>
          <FileText className="mr-2 h-4 w-4" />
          <span>PDF (Coming Soon)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;
