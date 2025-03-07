
import { useState, useEffect, useRef } from 'react';
import { convertFile, ConversionResult } from '../utils/fileConversion';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface ConversionState {
  isConverting: boolean;
  progress: number;
  result: ConversionResult | null;
  error: string | null;
}

export function useFileConversion() {
  const [state, setState] = useState<ConversionState>({
    isConverting: false,
    progress: 0,
    result: null,
    error: null
  });
  
  const { user } = useAuth();
  const isPremium = user?.subscription === 'premium';
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean up object URLs when component unmounts or when result changes
  useEffect(() => {
    return () => {
      if (state.result?.url) {
        URL.revokeObjectURL(state.result.url);
      }
      // Clear interval if it exists
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [state.result]);
  
  const startConversion = async (file: File, targetFormat: string) => {
    console.log(`Starting conversion of ${file.name} to ${targetFormat}`);
    
    // Reset state
    setState({
      isConverting: true,
      progress: 0,
      result: null,
      error: null
    });
    
    try {
      // Check file size restrictions - 5MB for free, 100MB for premium
      const maxSize = isPremium ? 100 * 1024 * 1024 : 5 * 1024 * 1024;
      
      if (file.size > maxSize) {
        setState(prev => ({
          ...prev,
          isConverting: false,
          error: `File too large. ${isPremium ? 'Premium' : 'Free'} plan allows ${isPremium ? '100MB' : '5MB'} max.`
        }));
        
        toast.error("File size limit exceeded", {
          description: `${isPremium ? 'Premium' : 'Free'} plan allows ${isPremium ? '100MB' : '5MB'} max.`
        });
        
        return null;
      }

      // Clear any existing interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      // Inform user about processing
      toast.info("Processing file", {
        description: "Your file is being processed, please wait..."
      });
      
      // Simulate progress
      progressIntervalRef.current = setInterval(() => {
        setState(prev => {
          if (!prev.isConverting || prev.progress >= 85) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
            }
            return prev;
          }
          return {
            ...prev,
            progress: Math.min(prev.progress + Math.random() * 2, 85)
          };
        });
      }, 300);
      
      console.log(`Converting file: ${file.name}, size: ${file.size}, type: ${file.type}`);
      
      // Perform the actual conversion
      const result = await convertFile(file, targetFormat);
      
      // Clear interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      console.log("Conversion result:", result);
      
      if (result.success) {
        toast.success("Conversion completed", {
          description: "Your file has been successfully converted and is ready to download"
        });
        
        // Validate the converted file
        console.log("Converted file details:", {
          name: result.file?.name,
          size: result.file?.size,
          type: result.file?.type,
          url: result.url ? (result.url.substring(0, 50) + "...") : "No URL"
        });
        
        setState({
          isConverting: false,
          progress: 100,
          result,
          error: null
        });
      } else {
        toast.error("Conversion failed", {
          description: result.error || "An error occurred during conversion"
        });
        
        setState({
          isConverting: false,
          progress: 0,
          result: null,
          error: result.error || 'Conversion failed'
        });
      }
      
      return result;
    } catch (error) {
      console.error("Conversion error:", error);
      
      // Clear interval on error
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      toast.error("Conversion error", {
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
      
      setState({
        isConverting: false,
        progress: 0,
        result: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
      
      return null;
    }
  };
  
  const reset = () => {
    // Release any object URLs to prevent memory leaks
    if (state.result?.url) {
      URL.revokeObjectURL(state.result.url);
    }
    
    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    setState({
      isConverting: false,
      progress: 0,
      result: null,
      error: null
    });
  };
  
  return {
    ...state,
    startConversion,
    reset,
    isPremium
  };
}
