
import { StatementRow } from "../../types";
import { standardizeDate } from "./dateUtils";
import { parseAmount } from "./amountUtils";
import { determineCurrency } from "./currencyUtils";
import { extractLocation } from "./locationUtils";

// Process CSV that may have multiple sections (Domestic/International, Rahul/Ritu)
export const processMultiSectionCSV = (rows: string[][], bankName: string): StatementRow[] => {
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
