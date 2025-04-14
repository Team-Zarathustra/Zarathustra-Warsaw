// components/military-intelligence/utils/fileParserUtils.ts
import { toast } from './toastService';

/**
 * Extract text content from files of different formats
 * Currently supports: .txt, .pdf (text layer only)
 */
export const extractTextFromFile = async (file: File): Promise<string> => {
  const fileName = file.name.toLowerCase();
  
  // Simple text file
  if (fileName.endsWith('.txt')) {
    return readTextFile(file);
  }
  
  // PDF file
  if (fileName.endsWith('.pdf')) {
    try {
      // If we have the PDF.js library, use it
      if (typeof window !== 'undefined' && 'pdfjsLib' in window) {
        return extractTextFromPdf(file);
      } else {
        // Fallback if PDF.js is not available
        console.warn('PDF.js library not available. Attempting to read as text.');
        return readTextFile(file);
      }
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      toast.error('Failed to extract text from PDF. Please try a text file instead.');
      return readTextFile(file); // Fallback to read as text
    }
  }
  
  // Word documents would require additional libraries like mammoth.js
  if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
    // Currently not supported directly in browser
    // Would require server-side processing or additional libraries
    toast.error('Word document parsing is limited. For best results, please convert to text.');
    return readTextFile(file); // Try to read as text, may not work well
  }
  
  // Default fallback
  return readTextFile(file);
};

/**
 * Check if a file should be processed as a SIGINT file
 * @param file File to check
 * @returns boolean True if the file should be processed as SIGINT
 */
export const isSigintFile = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  return fileName.endsWith('.sig') || 
         fileName.endsWith('.sigint') || 
         fileName.endsWith('.bin') ||
         // For our test case, also consider .json as SIGINT
         fileName.endsWith('.json');
};

/**
 * Read a file as text using FileReader
 */
const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        resolve(content || '');
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsText(file);
  });
};

/**
 * Read a file as an ArrayBuffer
 * @param file The file to read
 * @returns Promise resolving to an ArrayBuffer
 */
export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        if (e.target?.result instanceof ArrayBuffer) {
          resolve(e.target.result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * For JSON SIGINT files, convert them to a binary format
 * This helps with testing when we have JSON SIGINT samples
 * @param jsonContent The JSON SIGINT data as a string
 * @returns ArrayBuffer containing the JSON data
 */
export const convertJsonToBinary = (jsonContent: string): ArrayBuffer => {
  // Convert the JSON string to a Uint8Array
  const encoder = new TextEncoder();
  const uint8Array = encoder.encode(jsonContent);
  
  // Convert to ArrayBuffer
  return uint8Array.buffer;
};

/**
 * Extract text from PDF using PDF.js
 * Note: This requires PDF.js to be loaded in the application
 * and accessible via window.pdfjsLib
 */
const extractTextFromPdf = async (file: File): Promise<string> => {
  // Check if PDF.js is available
  if (typeof window === 'undefined' || !('pdfjsLib' in window)) {
    throw new Error('PDF.js library is not available');
  }
  
  // Type assertion for PDF.js library
  const pdfjsLib = (window as any).pdfjsLib;
  
  // Read file as array buffer
  const arrayBuffer = await file.arrayBuffer();
  
  // Load the PDF document
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;
  
  let extractedText = '';
  
  // Process each page
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    
    // Extract text from the page
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    
    extractedText += pageText + '\n\n';
  }
  
  return extractedText;
};

/**
 * Process multiple files and combine their text content
 */
export const batchProcessFiles = async (files: File[]): Promise<string> => {
  try {
    const textPromises = files.map(async (file) => {
      // Skip SIGINT files when batch processing for text
      if (isSigintFile(file)) {
        return `--- FILE: ${file.name} (SIGINT DATA - BINARY) ---\n\n`;
      }
      
      const text = await extractTextFromFile(file);
      return `--- FILE: ${file.name} ---\n\n${text}\n\n`;
    });
    
    const texts = await Promise.all(textPromises);
    return texts.join('--- END FILE ---\n\n');
  } catch (error) {
    console.error('Error processing files:', error);
    toast.error('Error processing one or more files');
    throw error;
  }
};