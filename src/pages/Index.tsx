
import React, { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import ResultsTable from '@/components/ResultsTable';
import { StandardizedStatement } from '@/types';

const Index: React.FC = () => {
  const [result, setResult] = useState<StandardizedStatement | null>(null);

  const handleFileProcessed = (standardizedData: StandardizedStatement) => {
    setResult(standardizedData);
    toast({
      title: "File processed successfully",
      description: `Standardized ${standardizedData.rows.length} transactions`,
    });
  };

  const handleError = (errorMessage: string) => {
    toast({
      variant: "destructive",
      title: "Error",
      description: errorMessage,
    });
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {!result ? (
            <>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">
                  Standardize Your Bank Statements
                </h2>
                <p className="text-muted-foreground">
                  Upload statement CSV files from HDFC, ICICI, AXIS, or IDFC to convert them to a standardized format.
                </p>
              </div>
              
              <div className="grid gap-6">
                <FileUpload 
                  onFileProcessed={handleFileProcessed} 
                  onError={handleError} 
                />
                
                <div className="bg-muted/50 rounded-lg p-4 border">
                  <h3 className="font-medium mb-2">Supported Formats</h3>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• HDFC Bank credit card statements</li>
                    <li>• ICICI Bank credit card statements</li>
                    <li>• Axis Bank credit card statements</li>
                    <li>• IDFC Bank credit card statements</li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <ResultsTable 
              data={result.rows}
              filename={result.filename}
              onReset={handleReset}
            />
          )}
        </div>
      </main>
      
      <footer className="py-6 border-t">
        <div className="container text-center text-sm text-muted-foreground">
          Card Statement Standardizer - A tool to standardize bank statements
        </div>
      </footer>
    </div>
  );
};

export default Index;
