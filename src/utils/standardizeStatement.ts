
import { StatementRow, StandardizedStatement } from "../types";
import { readCSVFile } from "./fileHelpers";

export const standardizeStatement = async (file: File): Promise<StandardizedStatement> => {
  try {
    // Read the CSV file
    const rows = await readCSVFile(file);
    console.log("First few rows:", rows.slice(0, 5));
    
    // Get bank name from filename (e.g., "HDFC-Input-Case1.csv" -> "HDFC")
    const bankName = getBankNameFromFilename(file.name);
    
    // Process rows to handle the multi-section format
    const standardizedRows = processMultiSectionCSV(rows, bankName);
    
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

// Process CSV that may have multiple sections (Domestic/International, Rahul/Ritu)
const processMultiSectionCSV = (rows: string[][], bankName: string): StatementRow[] => {
  const standardizedRows: StatementRow[] = [];
  
  let currentSection = ""; // Can be "Domestic" or "International"
  let currentCardHolder = "Rahul"; // Default card holder
  let isHeaderRow = true;
  
  // Define column indices for the current section
  let dateIndex = -1;
  let debitIndex = -1;
  let creditIndex = -1;
  let descriptionIndex = -1;
  
  // Process each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    // Skip empty rows
    if (row.length === 0 || row.every(cell => cell.trim() === "")) {
      continue;
    }
    
    console.log(`Processing row ${i}:`, row);
    
    // Check if this row is a section header
    if (row.some(cell => cell.includes("Domestic") || cell.includes("International"))) {
      // This is a section header row, determine the transaction type
      currentSection = row.find(cell => cell.includes("Domestic") || cell.includes("International")) || "";
      console.log(`Found section header: ${currentSection}`);
      isHeaderRow = true;
      continue;
    }
    
    // Check if this row contains card holder info (Rahul/Ritu)
    if (row.some(cell => cell.trim() === "Rahul" || cell.trim() === "Ritu")) {
      const cardHolderCell = row.find(cell => cell.trim() === "Rahul" || cell.trim() === "Ritu");
      if (cardHolderCell) {
        currentCardHolder = cardHolderCell.trim();
        console.log(`Found card holder: ${currentCardHolder}`);
      }
      continue;
    }
    
    // Check if this is a column header row
    if (isHeaderRow) {
      // Find column indices
      dateIndex = row.findIndex(cell => /date/i.test(cell));
      debitIndex = row.findIndex(cell => /debit/i.test(cell));
      creditIndex = row.findIndex(cell => /credit/i.test(cell));
      descriptionIndex = row.findIndex(cell => 
        /description|details|particulars|transaction/i.test(cell));
      
      console.log(`Found column indices - Date: ${dateIndex}, Debit: ${debitIndex}, ` +
                 `Credit: ${creditIndex}, Description: ${descriptionIndex}`);
      
      isHeaderRow = false;
      continue;
    }
    
    // Only process rows that have at least date and some transaction info
    if (dateIndex >= 0 && dateIndex < row.length && 
        row[dateIndex] && row[dateIndex].trim() !== "" &&
        ((debitIndex >= 0 && debitIndex < row.length && row[debitIndex].trim() !== "") || 
         (creditIndex >= 0 && creditIndex < row.length && row[creditIndex].trim() !== ""))) {
      
      // Get the transaction type from the current section
      const transactionType = currentSection.includes("International") ? "International" : "Domestic";
      
      // Extract transaction details
      const date = standardizeDate(row[dateIndex]);
      const description = descriptionIndex >= 0 && descriptionIndex < row.length ? 
                         row[descriptionIndex] : "";
      
      // Parse debit/credit amounts
      let debit: number | null = null;
      let credit: number | null = null;
      
      if (debitIndex >= 0 && debitIndex < row.length && row[debitIndex].trim() !== "") {
        debit = parseAmount(row[debitIndex]);
      }
      
      if (creditIndex >= 0 && creditIndex < row.length && row[creditIndex].trim() !== "") {
        credit = parseAmount(row[creditIndex]);
      }
      
      // Determine currency based on transaction type
      const currency = determineCurrency(transactionType, description);
      
      // Extract location from description
      const location = extractLocation(description);
      
      // Create a standardized row
      standardizedRows.push({
        date,
        description,
        debit,
        credit,
        currency,
        cardName: currentCardHolder,
        transactionType,
        location
      });
      
      console.log(`Added standardized row:`, standardizedRows[standardizedRows.length - 1]);
    }
  }
  
  return standardizedRows;
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
  if (!dateStr || dateStr.trim() === '') return '';
  
  // Remove any extra spaces
  dateStr = dateStr.trim();
  console.log(`Standardizing date: ${dateStr}`);
  
  // Format like "28-01-2018" is already in the right format
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Check for DD/MM/YYYY format
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('/');
    // Ensure day and month are two digits
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    return `${day}-${month}-${parts[2]}`;
  }
  
  // Check for MM/DD/YYYY format (commonly used in some statements)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('/');
    // Ensure day and month are two digits
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    return `${day}-${month}-${parts[2]}`;
  }
  
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
  
  // Check for YYYY-MM-DD format (ISO format)
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(dateStr)) {
    const parts = dateStr.split(/[-/.]/);
    // Ensure day and month are two digits
    const day = parts[2].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    return `${day}-${month}-${parts[0]}`;
  }
  
  // If no format matches, return as is
  console.log(`Could not standardize date format: ${dateStr}`);
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
  if (!description) return '';
  
  // Extract location from the description
  // We're looking for location at the end of the description
  const words = description.split(/\s+/);
  if (words.length > 0) {
    // Check if the last word is a location (often it's the case in the format you showed)
    const lastWord = words[words.length - 1];
    if (lastWord && !/^\d+$/.test(lastWord)) {
      return lastWord;
    }
    
    // If last word is not a potential location, check for known cities in the description
    const knownCities = [
      'DELHI', 'NEWDELHI', 'BANGALORE', 'MUMBAI', 'CHENNAI', 
      'KOLKATA', 'JAIPUR', 'GURGAON', 'GURUGRAM', 'NOIDA'
    ];
    
    for (const city of knownCities) {
      if (description.includes(city)) {
        return city;
      }
    }
    
    // If description contains multiple potential locations, return the last one
    // This is based on the pattern in your example where location appears at the end
    for (let i = words.length - 1; i >= 0; i--) {
      if (words[i] && words[i].length > 3 && !/^\d+$/.test(words[i])) {
        return words[i];
      }
    }
  }
  
  return '';
};
