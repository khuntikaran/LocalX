
import { useState, useEffect } from 'react';
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
  
  // Clean up object URLs when component unmounts or when result changes
  useEffect(() => {
    return () => {
      if (state.result?.url) {
        URL.revokeObjectURL(state.result.url);
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

      // Inform user about local processing
      toast.info("Processing locally", {
        description: "Your file is being processed on your device, ensuring privacy"
      });
      
      // Simulate progress
      let progressInterval = setInterval(() => {
        setState(prev => {
          if (!prev.isConverting || prev.progress >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return {
            ...prev,
            progress: Math.min(prev.progress + Math.random() * 3, 90) // Slower, more realistic progress
          };
        });
      }, 300);
      
      console.log(`Converting file: ${file.name}, size: ${file.size}, type: ${file.type}`);
      
      // Perform the actual conversion
      const result = await convertFile(file, targetFormat);
      
      // Clear interval and set final state
      clearInterval(progressInterval);
      progressInterval = 0;
      
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
          url: result.url?.substring(0, 50) + "..."
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
