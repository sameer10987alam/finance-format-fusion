
// Helper function to parse amount values
export const parseAmount = (value: string | undefined): number | null => {
  if (!value || value.trim() === '') return null;
  
  // Remove currency symbols, commas, and spaces
  const cleaned = value.replace(/[₹$€£,\s]/g, '');
  const amount = parseFloat(cleaned);
  
  return isNaN(amount) ? null : amount;
};
