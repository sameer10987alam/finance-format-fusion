
// Helper function to get bank name from filename
export const getBankNameFromFilename = (filename: string): string => {
  const match = filename.match(/^([A-Za-z]+)/);
  return match ? match[1].toUpperCase() : "";
};

// Generate output filename (e.g., "HDFC-Input-Case1.csv" -> "HDFC-Output-Case1.csv")
export const generateOutputFilename = (inputFilename: string): string => {
  return inputFilename.replace(/Input/i, "Output");
};
