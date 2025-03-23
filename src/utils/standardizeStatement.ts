
import { StatementRow, StandardizedStatement } from "../types";

export const standardizeStatement = async (file: File): Promise<StandardizedStatement> => {
  try {
    const content = await readFile(file);
    const rows = parseCSV(content);
    
    // Get bank name from filename (e.g., "HDFC-Input-Case1.csv" -> "HDFC")
    const bankName = getBankNameFromFilename(file.name);
    
    // Identify the format based on header row and bank name
    const format = identifyFormat(rows[0], bankName);
    
    // Remove header row
    const dataRows = rows.slice(1);
    
    // Standardize data
    const standardizedRows = dataRows.map(row => standardizeRow(row, format));
    
    // Generate output filename
    const outputFilename = generateOutputFilename(file.name);
    
    return {
      rows: standardizedRows,
      filename: outputFilename
    };
  } catch (error) {
    console.error("Error standardizing statement:", error);
    throw new Error("Failed to standardize statement");
  }
};

// Helper function to read file contents
const readFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};

// Helper function to parse CSV
const parseCSV = (content: string): string[][] => {
  const lines = content.split(/\r\n|\n/);
  return lines
    .filter(line => line.trim())
    .map(line => {
      // Detect delimiter (comma or semicolon)
      const delimiter = line.includes(';') ? ';' : ',';
      return line.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, ''));
    });
};

// Extract bank name from filename
const getBankNameFromFilename = (filename: string): string => {
  const match = filename.match(/^([A-Za-z]+)-/);
  return match ? match[1].toUpperCase() : "";
};

// Generate output filename (e.g., "HDFC-Input-Case1.csv" -> "HDFC-Output-Case1.csv")
const generateOutputFilename = (inputFilename: string): string => {
  return inputFilename.replace(/Input/i, "Output");
};

// Define column mapping structure
interface ColumnMapping {
  date: number;
  description: number;
  debit: number;
  credit: number;
  currency?: number;
  cardName?: number;
  transactionType?: number;
  location?: number;
}

// Identify statement format based on header row and bank name
const identifyFormat = (headerRow: string[], bankName: string): ColumnMapping => {
  // Default mapping
  let mapping: ColumnMapping = {
    date: -1,
    description: -1,
    debit: -1,
    credit: -1
  };
  
  // Find column indices based on header names
  headerRow.forEach((header, index) => {
    const headerLower = header.toLowerCase();
    
    if (headerLower.includes('date')) {
      mapping.date = index;
    } else if (headerLower.includes('description') || headerLower.includes('transactions') || headerLower.includes('details')) {
      mapping.description = index;
    } else if (headerLower.includes('debit')) {
      mapping.debit = index;
    } else if (headerLower.includes('credit')) {
      mapping.credit = index;
    } else if (headerLower.includes('domestic')) {
      mapping.transactionType = index;
    } else if (headerLower.includes('international')) {
      mapping.transactionType = index;
    } else if (headerLower.includes('rahul') || headerLower.includes('ritu')) {
      mapping.cardName = index;
    }
  });
  
  // Bank-specific adjustments
  switch (bankName) {
    case 'HDFC':
      // HDFC specific mapping logic
      break;
    case 'ICICI':
      // ICICI specific mapping logic
      break;
    case 'AXIS':
      // Axis specific mapping logic
      break;
    case 'IDFC':
      // IDFC specific mapping logic
      break;
  }
  
  return mapping;
};

// Standardize a single row based on the identified format
const standardizeRow = (row: string[], format: ColumnMapping): StatementRow => {
  // Extract values from row
  const rawDate = row[format.date] || '';
  const description = row[format.description] || '';
  
  // Parse debit amount (handle different formats)
  const debit = parseAmount(row[format.debit]);
  
  // Parse credit amount (handle different formats)
  const credit = parseAmount(row[format.credit]);
  
  // Standardize date to DD-MM-YYYY format
  const date = standardizeDate(rawDate);
  
  // Determine transaction type (Domestic/International)
  const transactionType = determineTransactionType(row, format);
  
  // Determine card owner (Rahul/Ritu)
  const cardName = determineCardName(row, format, description);
  
  // Determine currency (default INR for domestic, USD/EUR/GBP for international)
  const currency = determineCurrency(row, format, transactionType);
  
  // Extract location from description if available
  const location = extractLocation(description);
  
  return {
    date,
    description,
    debit,
    credit,
    currency,
    cardName,
    transactionType,
    location
  };
};

// Helper function to parse amount values
const parseAmount = (value: string | undefined): number | null => {
  if (!value || value.trim() === '') return null;
  
  // Remove currency symbols, commas, and spaces
  const cleaned = value.replace(/[₹$€£,\s]/g, '');
  const amount = parseFloat(cleaned);
  
  return isNaN(amount) ? null : amount;
};

// Helper function to standardize date format to DD-MM-YYYY
const standardizeDate = (dateStr: string): string => {
  if (!dateStr) return '';
  
  // Try various date formats
  let dateParts: string[] = [];
  
  // Check for DD-MM-YYYY format
  if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(dateStr)) {
    dateParts = dateStr.split(/[-/]/);
    return `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`;
  }
  
  // Check for MM-DD-YYYY format
  if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(dateStr)) {
    dateParts = dateStr.split(/[-/]/);
    return `${dateParts[1]}-${dateParts[0]}-${dateParts[2]}`;
  }
  
  // Check for DD-MM-YY format
  if (/^\d{2}[-/]\d{2}[-/]\d{2}$/.test(dateStr)) {
    dateParts = dateStr.split(/[-/]/);
    return `${dateParts[0]}-${dateParts[1]}-20${dateParts[2]}`;
  }
  
  return dateStr; // Return as is if format not recognized
};

// Helper function to determine transaction type
const determineTransactionType = (row: string[], format: ColumnMapping): string => {
  if (format.transactionType !== undefined && format.transactionType >= 0) {
    const cellValue = row[format.transactionType]?.toLowerCase() || '';
    if (cellValue.includes('international')) return 'International';
    if (cellValue.includes('domestic')) return 'Domestic';
  }
  
  // Default to Domestic if not specified
  return 'Domestic';
};

// Helper function to determine card name
const determineCardName = (row: string[], format: ColumnMapping, description: string): string => {
  if (format.cardName !== undefined && format.cardName >= 0) {
    const cellValue = row[format.cardName]?.toLowerCase() || '';
    if (cellValue.includes('rahul')) return 'Rahul';
    if (cellValue.includes('ritu')) return 'Ritu';
  }
  
  // Try to extract from description
  if (description.toLowerCase().includes('rahul')) return 'Rahul';
  if (description.toLowerCase().includes('ritu')) return 'Ritu';
  
  // Default
  return 'Rahul';
};

// Helper function to determine currency
const determineCurrency = (row: string[], format: ColumnMapping, transactionType: string): string => {
  // If we have a specific currency column, use it
  if (format.currency !== undefined && format.currency >= 0) {
    const cellValue = row[format.currency] || '';
    if (cellValue.includes('USD')) return 'USD';
    if (cellValue.includes('EUR')) return 'EUR';
    if (cellValue.includes('GBP')) return 'GBP';
    if (cellValue.includes('INR')) return 'INR';
  }
  
  // Domestic transactions are typically in INR
  if (transactionType === 'Domestic') return 'INR';
  
  // For international, try to guess from the description or default to USD
  return 'USD';
};

// Helper function to extract location from description
const extractLocation = (description: string): string => {
  // This is a simplified implementation
  // In a real application, we would use more sophisticated pattern matching
  
  // Check for common location patterns like "at LOCATION" or "in LOCATION"
  const locationPatterns = [
    /\bat\s+([A-Za-z\s]+)(?:,|\s|$)/i,
    /\bin\s+([A-Za-z\s]+)(?:,|\s|$)/i,
    /\bPOS\s+([A-Za-z\s]+)(?:,|\s|$)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return '';
};
