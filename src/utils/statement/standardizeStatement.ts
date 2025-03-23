
import { StatementRow, StandardizedStatement } from "../../types";
import { readCSVFile } from "../fileHelpers";
import { processMultiSectionCSV } from "./sectionUtils";
import { getBankNameFromFilename, generateOutputFilename } from "./filenameUtils";

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
