
// Helper function to extract location from description
export const extractLocation = (description: string): string => {
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
