
import { StatementRow, StandardizedStatement } from "../types";
import { readCSVFile } from "./fileHelpers";

export const standardizeStatement = async (file: File): Promise<StandardizedStatement> => {
  try {
    // Read the CSV file
    const rows = await readCSVFile(file);
    
    // Get bank name from filename (e.g., "HDFC-Input-Case1.csv" -> "HDFC")
    const bankName = getBankNameFromFilename(file.name);
    
    // Identify the format based on header row and bank name
    const format = identifyFormat(rows[0], bankName);
    
    // Remove header row
    const dataRows = rows.slice(1);
    
    // Standardize data
    const standardizedRows = dataRows
      .filter(row => row.length > 0 && row.some(cell => cell.trim() !== ''))
      .map(row => standardizeRow(row, format, bankName));
    
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

// Helper function to get bank name from filename
const getBankNameFromFilename = (filename: string): string => {
  const match = filename.match(/^([A-Za-z]+)/);
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
  debit: number[];
  credit: number[];
  currency?: number;
  cardName?: number[];
  transactionType?: number[];
  location?: number;
}

// Identify statement format based on header row and bank name
const identifyFormat = (headerRow: string[], bankName: string): ColumnMapping => {
  // Default mapping with arrays for multiple possible columns
  let mapping: ColumnMapping = {
    date: -1,
    description: -1,
    debit: [],
    credit: [],
    cardName: [],
    transactionType: []
  };
  
  // Find column indices based on header names
  headerRow.forEach((header, index) => {
    const headerLower = header.toLowerCase();
    
    if (headerLower.includes('date')) {
      mapping.date = index;
    } 
    else if (headerLower.includes('description') || headerLower.includes('transactions') || 
             headerLower.includes('details') || headerLower.includes('particulars')) {
      mapping.description = index;
    } 
    else if (headerLower.includes('debit') || headerLower.includes('amount') || 
             headerLower === 'dr' || headerLower === 'withdrawal') {
      mapping.debit.push(index);
    } 
    else if (headerLower.includes('credit') || headerLower === 'cr' || 
             headerLower === 'deposit') {
      mapping.credit.push(index);
    } 
    else if (headerLower.includes('domestic')) {
      if (!mapping.transactionType) mapping.transactionType = [];
      mapping.transactionType.push(index);
    } 
    else if (headerLower.includes('international')) {
      if (!mapping.transactionType) mapping.transactionType = [];
      mapping.transactionType.push(index);
    } 
    else if (headerLower.includes('rahul') || headerLower.includes('ritu') || 
             headerLower.includes('card')) {
      if (!mapping.cardName) mapping.cardName = [];
      mapping.cardName.push(index);
    }
  });
  
  // Bank-specific adjustments
  switch (bankName) {
    case 'HDFC':
      // Handle HDFC specific format
      break;
    case 'ICICI':
      // Handle ICICI specific format
      break;
    case 'AXIS':
      // Handle Axis specific format
      break;
    case 'IDFC':
      // Handle IDFC specific format
      break;
  }
  
  return mapping;
};

// Standardize a single row based on the identified format
const standardizeRow = (row: string[], format: ColumnMapping, bankName: string): StatementRow => {
  // Extract values from row
  const rawDate = row[format.date] || '';
  const description = row[format.description] || '';
  
  // Initialize debit and credit as null
  let debit: number | null = null;
  let credit: number | null = null;
  let cardName = 'Rahul'; // Default card name
  let transactionType = 'Domestic'; // Default transaction type
  
  // Process debit amounts from possible columns
  for (const debitIndex of format.debit) {
    if (debitIndex >= 0 && debitIndex < row.length && row[debitIndex] && row[debitIndex].trim() !== '') {
      const amount = parseAmount(row[debitIndex]);
      if (amount !== null && amount > 0) {
        debit = amount;
        break; // Use the first valid debit amount
      }
    }
  }
  
  // Process credit amounts from possible columns
  for (const creditIndex of format.credit) {
    if (creditIndex >= 0 && creditIndex < row.length && row[creditIndex] && row[creditIndex].trim() !== '') {
      const amount = parseAmount(row[creditIndex]);
      if (amount !== null && amount > 0) {
        credit = amount;
        break; // Use the first valid credit amount
      }
    }
  }
  
  // Determine transaction type (Domestic/International)
  if (format.transactionType && format.transactionType.length > 0) {
    for (const typeIndex of format.transactionType) {
      if (typeIndex >= 0 && typeIndex < row.length) {
        const cellValue = row[typeIndex]?.toLowerCase() || '';
        if (cellValue.includes('international')) {
          transactionType = 'International';
          break;
        }
      }
    }
  } else {
    // Try to infer from description
    if (description.toLowerCase().includes('international') || 
        /\b(usd|eur|gbp|pound|euro|dollar)\b/i.test(description)) {
      transactionType = 'International';
    }
  }
  
  // Determine card owner (Rahul/Ritu)
  if (format.cardName && format.cardName.length > 0) {
    for (const nameIndex of format.cardName) {
      if (nameIndex >= 0 && nameIndex < row.length) {
        const cellValue = row[nameIndex]?.toLowerCase() || '';
        if (cellValue.includes('ritu')) {
          cardName = 'Ritu';
          break;
        }
      }
    }
  } else {
    // Try to infer from description
    if (description.toLowerCase().includes('ritu')) {
      cardName = 'Ritu';
    }
  }
  
  // Standardize date to DD-MM-YYYY format
  const date = standardizeDate(rawDate);
  
  // Determine currency based on transaction type
  const currency = determineCurrency(transactionType, description);
  
  // Extract location from description
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
  
  // Remove any extra spaces
  dateStr = dateStr.trim();
  
  // Check for DD-MM-YYYY or DD/MM/YYYY format
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(dateStr)) {
    const parts = dateStr.split(/[-/.]/);
    // Ensure day and month are two digits
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    return `${day}-${month}-${parts[2]}`;
  }
  
  // Check for MM-DD-YYYY or MM/DD/YYYY format
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(dateStr)) {
    const parts = dateStr.split(/[-/.]/);
    // Ensure day and month are two digits
    const day = parts[1].padStart(2, '0');
    const month = parts[0].padStart(2, '0');
    return `${day}-${month}-${parts[2]}`;
  }
  
  // Check for DD-MM-YY or DD/MM/YY format
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2}$/.test(dateStr)) {
    const parts = dateStr.split(/[-/.]/);
    // Ensure day and month are two digits
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    return `${day}-${month}-20${parts[2]}`;
  }
  
  // If no format matches, return as is
  return dateStr;
};

// Helper function to determine currency
const determineCurrency = (transactionType: string, description: string): string => {
  if (transactionType === 'Domestic') {
    return 'INR';
  }
  
  // Try to extract currency from description
  const descLower = description.toLowerCase();
  if (descLower.includes('usd') || descLower.includes('dollar')) {
    return 'USD';
  }
  if (descLower.includes('eur') || descLower.includes('euro')) {
    return 'EUR';
  }
  if (descLower.includes('gbp') || descLower.includes('pound')) {
    return 'POUND';
  }
  
  // Default for international transactions if not determined
  return 'USD';
};

// Helper function to extract location from description
const extractLocation = (description: string): string => {
  // This is a simplified approach for extracting location
  const descLower = description.toLowerCase();
  
  // Common Indian cities
  const indianCities = ['delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 
                        'pune', 'ahmedabad', 'jaipur', 'noida', 'gurgaon'];
  
  // Common international cities
  const internationalCities = ['new york', 'newyork', 'london', 'paris', 'tokyo', 'sydney', 
                               'dubai', 'singapore', 'hong kong', 'berlin', 'toronto', 
                               'california', 'dusseldorf', 'dublin'];
  
  // Check for cities in the description
  const allCities = [...indianCities, ...internationalCities];
  for (const city of allCities) {
    if (descLower.includes(city)) {
      // For compound names, return the simplified version
      if (city === 'new york') return 'newyork';
      if (city === 'hong kong') return 'hongkong';
      return city;
    }
  }
  
  // If no city is found, look for any location patterns
  const locationPatterns = [
    /\bat\s+([A-Za-z\s]+)(?:,|\s|$)/i,
    /\bin\s+([A-Za-z\s]+)(?:,|\s|$)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      return match[1].trim().toLowerCase();
    }
  }
  
  return '';
};
