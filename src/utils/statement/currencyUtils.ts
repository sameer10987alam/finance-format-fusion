
// Helper function to determine currency
export const determineCurrency = (transactionType: string, description: string): string => {
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
