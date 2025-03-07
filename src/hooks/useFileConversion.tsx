
import { useState } from 'react';
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
        return null;
      }

      toast.info("Converting locally", {
        description: "Your file is being processed on your device, not on our servers"
      });
      
      // Show progress updates
      const progressInterval = setInterval(() => {
        setState(prev => {
          // Only update progress if still converting
          if (!prev.isConverting || prev.progress >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return {
            ...prev,
            progress: Math.min(prev.progress + Math.random() * 5, 90)
          };
        });
      }, 300);
      
      console.log(`Converting file: ${file.name}, size: ${file.size}, type: ${file.type}`);
      
      // Perform the conversion
      const result = await convertFile(file, targetFormat);
      
      console.log("Conversion result:", result);
      
      // Clear the interval and set the final state
      clearInterval(progressInterval);
      
      if (result.success) {
        toast.success("Conversion completed", {
          description: "Your file has been successfully converted and is ready to download"
        });
        
        // Verify the converted file
        console.log("Converted file:", {
          name: result.file?.name,
          size: result.file?.size,
          type: result.file?.type
        });
      } else {
        toast.error("Conversion failed", {
          description: result.error || "An error occurred during conversion"
        });
      }
      
      setState({
        isConverting: false,
        progress: result.success ? 100 : 0,
        result,
        error: result.success ? null : (result.error || 'Conversion failed')
      });
      
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
