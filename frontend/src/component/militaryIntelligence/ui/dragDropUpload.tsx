// components/military-intelligence/ui/DragDropUpload.tsx
import React, { useState, useRef, useCallback } from 'react';
import { FileUp, FileText, X, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { 
  extractTextFromFile, 
  readFileAsArrayBuffer, 
  isSigintFile,
  convertJsonToBinary
} from '../utils/fileParserUtils';

// Import your logo
import ZarathrustraLogo from '../assets/zarathustra-logo.png';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content?: string;
  isSigint: boolean;
  status: 'uploaded' | 'processing' | 'error' | 'ready';
  error?: string;
}

interface DragDropUploadProps {
  onFilesProcessed: (files: File[]) => void;
  onFileContentLoaded: (fileId: string, content: string, file?: File) => void;
  setReportText?: React.Dispatch<React.SetStateAction<string>>;
  setSignalData?: React.Dispatch<React.SetStateAction<ArrayBuffer | null>>;
  maxFiles?: number;
  acceptedFileTypes?: string;
  onFileRemoved?: () => void;
  t: (key: string) => string;
  isAnalyzing: boolean;
}

const DragDropUpload: React.FC<DragDropUploadProps> = ({
  onFilesProcessed,
  onFileContentLoaded,
  setReportText,
  setSignalData,
  onFileRemoved,
  maxFiles = 10,
  acceptedFileTypes = ".txt,.pdf,.doc,.docx,.sig,.sigint,.bin,.json",
  t,
  isAnalyzing
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragCountRef = useRef<number>(0);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current++;
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current--;
    if (dragCountRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const processFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    if (fileArray.length > 0) {
      const filesToProcess = fileArray.slice(0, maxFiles);
      
      const newUploadedFiles: UploadedFile[] = filesToProcess.map(file => {
        const fileIsSigint = isSigintFile(file);
        return {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          isSigint: fileIsSigint,
          status: 'processing'
        };
      });
      
      setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
      
      // Track HUMINT and SIGINT files separately
      let hasHumintData = false;
      let hasSigintData = false;
      let combinedHumintText = '';
      
      // Process each file
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        const fileId = newUploadedFiles[i].id;
        const fileIsSigint = newUploadedFiles[i].isSigint;
        
        try {
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, status: 'processing' } : f
          ));
          
          if (fileIsSigint) {
            // Process as SIGINT file
            hasSigintData = true;
            
            try {
              // Special case: handle .json SIGINT files for testing
              if (file.name.toLowerCase().endsWith('.json')) {
                // Read as text first to parse the JSON
                const jsonContent = await extractTextFromFile(file);
                
                try {
                  // Parse and validate JSON
                  JSON.parse(jsonContent);
                  
                  // Convert valid JSON to binary
                  const binaryData = convertJsonToBinary(jsonContent);
                  
                  // Set signal data
                  if (setSignalData) {
                    setSignalData(binaryData);
                  }
                  
                  // Update file status
                  setUploadedFiles(prev => prev.map(f => 
                    f.id === fileId ? { ...f, status: 'ready', content: 'SIGINT Binary Data' } : f
                  ));
                  
                  // Notify parent with a placeholder content string
                  onFileContentLoaded(fileId, 'SIGINT_BINARY_DATA', file);
                  
                } catch (jsonError) {
                  throw new Error('Invalid JSON format in SIGINT file');
                }
              } else {
                // Standard binary SIGINT file
                const binaryData = await readFileAsArrayBuffer(file);
                
                // Set the signal data
                if (setSignalData) {
                  setSignalData(binaryData);
                }
                
                // Update file status
                setUploadedFiles(prev => prev.map(f => 
                  f.id === fileId ? { ...f, status: 'ready', content: 'SIGINT Binary Data' } : f
                ));
                
                // Notify parent with a placeholder content string
                onFileContentLoaded(fileId, 'SIGINT_BINARY_DATA', file);
              }
            } catch (binaryError) {
              console.error('Error processing SIGINT file:', binaryError);
              setUploadedFiles(prev => prev.map(f => 
                f.id === fileId ? { 
                  ...f, 
                  status: 'error', 
                  error: 'Failed to process SIGINT data' 
                } : f
              ));
            }
          } else {
            // Process as HUMINT (text) file
            hasHumintData = true;
            
            const content = await extractTextFromFile(file);
            
            // Update local file status
            setUploadedFiles(prev => prev.map(f => 
              f.id === fileId ? { ...f, status: 'ready', content } : f
            ));
            
            // Add to combined HUMINT text
            if (combinedHumintText) {
              combinedHumintText += `\n\n--- NEW REPORT ---\n\n${content}`;
            } else {
              combinedHumintText = content;
            }
            
            // Notify parent component
            onFileContentLoaded(fileId, content, file);
          }
        } catch (error) {
          console.error('Error reading file:', error);
          
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, status: 'error', error: 'Failed to read file content' } : f
          ));
        }
      }
      
      // Set the report text state if it exists and we have HUMINT data
      if (setReportText && hasHumintData) {
        setReportText(combinedHumintText);
      }
      
      // Notify parent component of all processed files
      onFilesProcessed(filesToProcess);
    }
  }, [maxFiles, onFileContentLoaded, onFilesProcessed, setReportText, setSignalData]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCountRef.current = 0;
    
    const { files } = e.dataTransfer;
    processFiles(files);
  }, [processFiles]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  }, [processFiles]);

  const handleRemoveFile = useCallback((fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setUploadedFiles(prev => {
      // Check if we're removing the last file of a specific type
      const fileToRemove = prev.find(file => file.id === fileId);
      const updatedFiles = prev.filter(file => file.id !== fileId);
      
      // If no files remain, notify parent component
      if (updatedFiles.length === 0 && onFileRemoved) {
        onFileRemoved();
      } else if (fileToRemove) {
        // Check if we're removing the last SIGINT file
        if (fileToRemove.isSigint && !updatedFiles.some(f => f.isSigint)) {
          // Last SIGINT file removed, clear signal data
          if (setSignalData) {
            setSignalData(null);
          }
        }
        
        // If we're removing the last HUMINT file
        if (!fileToRemove.isSigint && !updatedFiles.some(f => !f.isSigint)) {
          // Last HUMINT file removed, clear report text
          if (setReportText) {
            setReportText('');
          }
        }
      }
      
      return updatedFiles;
    });
  }, [onFileRemoved, setReportText, setSignalData]);

  const handleBrowseClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return (
          <div className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
        );
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getFileTypeIcon = (file: UploadedFile) => {
    if (file.isSigint) {
      // Special icon for SIGINT files
      return <FileUp className="w-4 h-4 text-purple-600" />;
    }
    return <FileText className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Hidden file input element */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFileTypes}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={isAnalyzing}
      />
      
      {/* Modern upload layout */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Drop Area - Modern rectangular design */}
        <div className="flex-1">
          <div
              onClick={handleBrowseClick}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative cursor-pointer
                w-full min-h-[350px] rounded-lg
                flex flex-col items-center justify-center
                transition-all duration-200 ease-in-out
                ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}
                ${isDragging 
                  ? 'bg-blue-50 border-2 border-blue-400 shadow-lg' 
                  : 'bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 hover:border-blue-300 hover:shadow-md'}
              `}
            >
            {/* File Upload Icon and Logo */}
            <div className="mb-4 flex flex-col items-center">
              <div className="mb-2">
                <img 
                  src={ZarathrustraLogo} 
                  alt="Zarathustra Logo" 
                  className="w-16 h-16 object-contain transition-all duration-200"
                />
              </div>
              <div className={`p-2 rounded-full ${isDragging ? 'bg-blue-100' : 'bg-gray-100'} transition-colors duration-200`}>
                <Upload className={`h-6 w-6 ${isDragging ? 'text-blue-500' : 'text-gray-500'}`} />
              </div>
            </div>
            
            {/* Text prompt */}
            <div className="text-center px-4">
              <p className={`font-medium text-base transition-colors duration-200 ${isDragging ? 'text-blue-600' : 'text-gray-700'}`}>
                {isDragging
                  ? t('dropFilesHere') || 'Drop files here'
                  : t('dragAndDropFiles') || 'Drag and drop field reports here'}
              </p>
              
              <p className="mt-2 text-sm text-gray-500">
                or
              </p>
              
              <button
                type="button"
                onClick={handleBrowseClick}
                className="mt-2 px-4 py-2 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                Browse files
              </button>
              
              <p className="mt-4 text-xs text-gray-500">
                {t('supportedFileTypes') || 'Supported file types'}: TXT, PDF, DOC, DOCX, SIGINT, JSON
              </p>
            </div>
          </div>
        </div>
        
        {/* Files List - Now integrated into the layout and matching height */}
        {uploadedFiles.length > 0 && (
          <div className="flex-1">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">
                {t('uploadedFiles') || 'Uploaded Files'}
              </h4>
              <span className="text-xs text-gray-500">{uploadedFiles.length} {uploadedFiles.length === 1 ? 'file' : 'files'}</span>
            </div>
            
            <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm 
                            h-[323px] flex flex-col"> {/* Changed min-h to h for fixed height */}
              <div className="flex-1 overflow-y-auto"> {/* Removed max-height, using flex-1 instead */}
                {uploadedFiles.map(file => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      {/* File icon */}
                      <div className={`w-8 h-8 rounded-full ${file.isSigint ? 'bg-purple-50' : 'bg-blue-50'} flex items-center justify-center`}>
                        {getFileTypeIcon(file)}
                      </div>
                      
                      <div className="truncate max-w-[180px]">
                        <p className="text-sm text-gray-700 font-medium truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                          {file.isSigint && <span className="ml-1 text-purple-600 font-medium">SIGINT</span>}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-4">
                        {getStatusIcon(file.status)}
                      </div>
                      
                      <button
                        type="button"
                        onClick={(e) => handleRemoveFile(file.id, e)}
                        className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        disabled={isAnalyzing}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* File upload status summary - Now positioned at bottom */}
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0"> {/* Added flex-shrink-0 */}
                <span className="text-xs text-gray-500">
                  {uploadedFiles.filter(f => f.status === 'ready').length} of {uploadedFiles.length} files processed
                </span>
                
                {/* Show file type summary */}
                <div className="mt-1 text-xs text-gray-500 flex items-center">
                  <span className="mr-2">
                    {uploadedFiles.filter(f => !f.isSigint).length} HUMINT
                  </span>
                  <span>
                    {uploadedFiles.filter(f => f.isSigint).length} SIGINT
                  </span>
                </div>
                
                {uploadedFiles.some(f => f.status === 'error') && (
                  <div className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Some files could not be processed
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile view for uploaded files - nicer presentation for smaller screens */}
      <div className="md:hidden mt-6">
        {uploadedFiles.length > 0 && (
          <div className="w-full">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">
                {t('uploadedFiles') || 'Uploaded Files'}
              </h4>
              <span className="text-xs text-gray-500">{uploadedFiles.length} {uploadedFiles.length === 1 ? 'file' : 'files'}</span>
            </div>
            
            <div className="rounded-lg overflow-hidden border border-gray-200 divide-y divide-gray-200 shadow-sm max-h-60 overflow-y-auto bg-white">
              {uploadedFiles.map(file => (
                <div
                  key={file.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {/* File icon */}
                    <div className={`w-8 h-8 rounded-full ${file.isSigint ? 'bg-purple-50' : 'bg-blue-50'} flex items-center justify-center`}>
                      {getFileTypeIcon(file)}
                    </div>
                    
                    <div className="truncate max-w-[180px]">
                      <p className="text-sm text-gray-700 font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                        {file.isSigint && <span className="ml-1 text-purple-600 font-medium">SIGINT</span>}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-4">
                      {getStatusIcon(file.status)}
                    </div>
                    
                    <button
                      type="button"
                      onClick={(e) => handleRemoveFile(file.id, e)}
                      className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      disabled={isAnalyzing}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DragDropUpload;