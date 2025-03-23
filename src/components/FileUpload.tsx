
import React, { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import { standardizeStatement } from '@/utils/standardizeStatement';
import { StandardizedStatement } from '@/types';

interface FileUploadProps {
  onFileProcessed: (result: StandardizedStatement) => void;
  onError: (error: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileProcessed, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };
  
  const processFile = async (file: File) => {
    // Check if file is CSV
    if (!file.name.toLowerCase().endsWith('.csv')) {
      onError('Please upload a CSV file');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const result = await standardizeStatement(file);
      onFileProcessed(result);
    } catch (error) {
      onError('Error processing file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div 
      className={`relative rounded-lg border-2 border-dashed p-12 transition-all
        ${isDragging ? 'border-primary bg-muted/50' : 'border-border'}
        ${isProcessing ? 'opacity-50' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={triggerFileInput}
    >
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
      />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        <UploadCloud className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">
            Drag and drop your CSV file here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports CSV files from HDFC, ICICI, AXIS, and IDFC banks
          </p>
        </div>
      </div>
      
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
          <div className="flex flex-col items-center space-y-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <p className="text-sm font-medium">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
