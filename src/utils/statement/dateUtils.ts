
// Helper function to standardize date format to DD-MM-YYYY
export const standardizeDate = (dateStr: string): string => {
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
