
export const readCSVFile = (file: File): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (!event.target?.result) {
        reject(new Error("Failed to read file"));
        return;
      }
      
      try {
        console.log("Reading CSV file content...");
        const content = event.target.result as string;
        
        // Try to detect the delimiter (comma, semicolon, tab)
        const firstLine = content.split('\n')[0];
        let delimiter = ','; // default
        
        if (firstLine.includes(';')) {
          delimiter = ';';
        } else if (firstLine.includes('\t')) {
          delimiter = '\t';
        }
        
        console.log(`Detected delimiter: '${delimiter === '\t' ? 'tab' : delimiter}'`);
        
        const rows = content.split('\n').map(row => {
          // Handle quoted values correctly
          const result = [];
          let inQuotes = false;
          let currentValue = '';
          
          for (let i = 0; i < row.length; i++) {
            const char = row[i];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
              result.push(currentValue.trim());
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          
          // Add the last value
          result.push(currentValue.trim());
          
          // Clean up double quotes
          return result.map(cell => cell.replace(/^"(.*)"$/, '$1').replace(/""/g, '"'));
        });
        
        const filteredRows = rows.filter(row => row.some(cell => cell !== ''));
        console.log(`CSV parsed: ${filteredRows.length} rows`);
        
        resolve(filteredRows);
      } catch (error) {
        console.error("Error parsing CSV:", error);
        reject(new Error("Error parsing CSV file"));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };
    
    reader.readAsText(file);
  });
};

export const downloadCSV = (data: string[][], filename: string) => {
  const csvContent = data
    .map(row => row.map(cell => {
      // Wrap cells with commas or quotes in double quotes
      if (cell && (cell.includes(',') || cell.includes('"'))) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(','))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
