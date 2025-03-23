
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { StatementRow } from '@/types';
import { downloadCSV } from '@/utils/fileHelpers';

interface ResultsTableProps {
  data: StatementRow[];
  filename: string;
  onReset: () => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ data, filename, onReset }) => {
  const handleDownload = () => {
    // Prepare data for CSV
    const headers = [
      'Date', 
      'Transaction Description', 
      'Debit', 
      'Credit', 
      'Currency', 
      'Card Name', 
      'Transaction Type', 
      'Location'
    ];
    
    const rows = data.map(row => [
      row.date,
      row.description,
      row.debit?.toString() || '',
      row.credit?.toString() || '',
      row.currency,
      row.cardName,
      row.transactionType,
      row.location
    ]);
    
    // Download the file
    downloadCSV([headers, ...rows], filename);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Standardized Statement</h3>
        <div className="flex space-x-2">
          <Button onClick={onReset} variant="outline">
            Upload Another File
          </Button>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableCaption>Standardized data from {filename}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Debit</TableHead>
              <TableHead>Credit</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Card Name</TableHead>
              <TableHead>Transaction Type</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell className="max-w-xs truncate">{row.description}</TableCell>
                  <TableCell>{row.debit !== null ? row.debit.toFixed(2) : ''}</TableCell>
                  <TableCell>{row.credit !== null ? row.credit.toFixed(2) : ''}</TableCell>
                  <TableCell>{row.currency}</TableCell>
                  <TableCell>{row.cardName}</TableCell>
                  <TableCell>{row.transactionType}</TableCell>
                  <TableCell>{row.location}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No data to display
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {data.length > 10 && (
        <div className="flex justify-end mt-4">
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResultsTable;
