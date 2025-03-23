
export const readCSVFile = (file: File): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (!event.target?.result) {
        reject(new Error("Failed to read file"));
        return;
      }
      
      const content = event.target.result as string;
      const rows = content.split('\n').map(row => {
        // Handle both comma and semicolon delimiters
        const delimiter = row.includes(';') ? ';' : ',';
        return row.split(delimiter).map(cell => cell.trim().replace(/"/g, ''));
      });
      
      resolve(rows.filter(row => row.some(cell => cell !== '')));
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
