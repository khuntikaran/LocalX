
import { useState } from 'react';
import { convertFile, ConversionResult } from '../utils/fileConversion';
import { useAuth } from '../context/AuthContext';

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
        return;
      }
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setState(prev => {
          if (prev.progress >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return {
            ...prev,
            progress: Math.min(prev.progress + Math.random() * 10, 90)
          };
        });
      }, 200);
      
      // Perform the conversion
      const result = await convertFile(file, targetFormat);
      
      // Clear the interval and set the final state
      clearInterval(progressInterval);
      
      setState({
        isConverting: false,
        progress: 100,
        result,
        error: result.success ? null : (result.error || 'Conversion failed')
      });
      
      return result;
    } catch (error) {
      setState({
        isConverting: false,
        progress: 0,
        result: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
  };
  
  const reset = () => {
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
