
import React, { useState, useCallback, useRef } from 'react';
import { FileIcon, UploadIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';

interface FileDropzoneProps {
  onFileDrop: (file: File) => void;
  isConverting: boolean;
  allowedFormats?: string[];
}

export const FileDropzone = ({ 
  onFileDrop, 
  isConverting, 
  allowedFormats 
}: FileDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const isPremium = user?.subscription === 'premium';
  
  const maxFileSize = isPremium ? 100 * 1024 * 1024 : 5 * 1024 * 1024; // 100MB for premium, 5MB for free
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxFileSize) {
      alert(`File too large. ${isPremium ? 'Premium' : 'Free'} plan allows ${isPremium ? '100MB' : '5MB'} max.`);
      return false;
    }
    
    // Check file type if allowedFormats is provided
    if (allowedFormats && allowedFormats.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const isAllowed = allowedFormats.some(format => 
        format.toLowerCase() === fileExtension.toLowerCase() ||
        format.toLowerCase() === `.${fileExtension.toLowerCase()}`
      );
      
      if (!isAllowed) {
        alert(`File type not supported. Allowed formats: ${allowedFormats.join(', ')}`);
        return false;
      }
    }
    
    return true;
  };
  
  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        onFileDrop(droppedFile);
      }
    }
  }, [onFileDrop, validateFile]);
  
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        onFileDrop(selectedFile);
      }
    }
  }, [onFileDrop, validateFile]);
  
  const handleButtonClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);
  
  const handleRemoveFile = useCallback(() => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);
  
  return (
    <div 
      className={`w-full max-w-xl mx-auto transition-all duration-300 ease-in-out ${
        isDragging ? 'scale-102 shadow-2xl' : ''
      }`}
    >
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleFileDrop}
        className={`relative flex flex-col items-center justify-center w-full p-8 transition-all duration-300 border-2 border-dashed rounded-xl backdrop-blur-lg ${
          isDragging 
            ? 'border-indigo-500 bg-indigo-500/5 file-drop-active shadow-lg shadow-indigo-500/20' 
            : 'border-gray-300 hover:border-indigo-400/70 dark:border-gray-700'
        } ${
          file 
            ? 'glass-card backdrop-blur-md bg-white/10 border-white/20 dark:bg-gray-900/30 dark:border-gray-700/30' 
            : 'bg-white/5 dark:bg-gray-900/20'
        }`}
      >
        {!file ? (
          <>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className={`w-20 h-20 mb-4 rounded-full flex items-center justify-center bg-gradient-to-r ${
                isDragging 
                  ? 'from-indigo-500 to-purple-500 animate-pulse' 
                  : 'from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700'
              }`}>
                <UploadIcon
                  className={`w-8 h-8 ${
                    isDragging ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}
                />
              </div>
              <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
                Drag & drop your file here
              </h3>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                or click to browse files
              </p>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                {isPremium 
                  ? 'Premium: Up to 100MB' 
                  : 'Free: Up to 5MB'}
              </p>
              {allowedFormats && allowedFormats.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Allowed formats: {allowedFormats.join(', ')}
                </p>
              )}
              <Button
                type="button"
                onClick={handleButtonClick}
                className="mt-4 animate-fade-in bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-0"
                disabled={isConverting}
              >
                Browse Files
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
            />
          </>
        ) : (
          <div className="w-full animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 truncate dark:text-white">
                Selected File:
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                disabled={isConverting}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center p-4 space-x-4 glass-card backdrop-blur-md border border-white/20 dark:border-gray-700/30 rounded-lg shadow-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                <FileIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate dark:text-white">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
