
import React, { useState, useEffect } from 'react';
import { FileDropzone } from './FileDropzone';
import { ConversionOptions } from './ConversionOptions';
import { getExtension } from '../utils/formatHelpers';
import { useFileConversion } from '../hooks/useFileConversion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RotateCw, Download, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';

export const FileConverter = () => {
  const [file, setFile] = useState<File | null>(null);
  const [sourceFormat, setSourceFormat] = useState<string>('');
  const [targetFormat, setTargetFormat] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { 
    isConverting, 
    progress, 
    result, 
    error,
    startConversion,
    reset,
    isPremium
  } = useFileConversion();
  
  const { 
    isAuthenticated, 
    user, 
    incrementConversionsUsed, 
    hasRemainingFreeConversions 
  } = useAuth();
  
  useEffect(() => {
    if (file) {
      const extension = getExtension(file.name);
      setSourceFormat(extension);
      setTargetFormat(null);
    } else {
      setSourceFormat('');
      setTargetFormat(null);
    }
  }, [file]);
  
  const handleFileDrop = (droppedFile: File) => {
    setFile(droppedFile);
    reset();
  };
  
  const handleFormatSelect = (format: string) => {
    setTargetFormat(format);
  };
  
  const handleConvert = async () => {
    if (!file || !targetFormat) {
      toast({
        title: "Error",
        description: "Please select a file and target format",
        variant: "destructive"
      });
      return;
    }
    
    // Check if user has free conversions left
    if (!hasRemainingFreeConversions) {
      toast({
        title: "Free limit reached",
        description: "You've used your 5 free conversions. Please upgrade to premium to continue.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const conversionResult = await startConversion(file, targetFormat);
      
      if (conversionResult?.success && isAuthenticated) {
        // Only increment if conversion was successful and user is logged in
        await incrementConversionsUsed();
      }
    } catch (error) {
      console.error('Conversion error:', error);
    }
  };
  
  const handleDownload = () => {
    if (result?.url) {
      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.file?.name || `converted.${targetFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Download started",
        description: "Your file has been successfully downloaded",
      });
    }
  };
  
  const handleReset = () => {
    setFile(null);
    setSourceFormat('');
    setTargetFormat(null);
    reset();
  };
  
  // Show remaining conversions for free users
  const getRemainingConversions = () => {
    if (!isAuthenticated || !user) return 10; // Updated to 10
    if (user.subscription === 'premium') return '∞';
    return Math.max(0, user.maxFreeConversions - user.conversionsUsed);
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Convert Your Files Locally
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Your files stay on your device. No uploads to external servers.
        </p>
        
        {isAuthenticated && (
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            {user?.subscription === 'premium' ? (
              <>Premium Account</>
            ) : (
              <>Conversions left: {getRemainingConversions()}</>
            )}
          </div>
        )}
      </div>
      
      {/* Conversion limit warning for non-premium users */}
      {isAuthenticated && 
       user?.subscription !== 'premium' && 
       user?.conversionsUsed >= 6 && // Updated threshold
       user?.conversionsUsed < user?.maxFreeConversions && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800/30 dark:text-yellow-400">
          <p className="font-medium">You have {user.maxFreeConversions - user.conversionsUsed} free conversions left</p>
          <p className="text-sm mt-1">Upgrade to premium for unlimited conversions.</p>
          <div className="mt-3">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">Upgrade Now</Button>
            </Link>
          </div>
        </div>
      )}
      
      {/* Free limit reached message */}
      {!hasRemainingFreeConversions && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 flex items-start space-x-3 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400">
          <Lock className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Free limit reached</p>
            <p className="text-sm mt-1">You've used all 10 free conversions. Upgrade to premium for unlimited conversions.</p>
            <div className="mt-3">
              <Link to="/dashboard">
                <Button>Upgrade to Premium</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {!result ? (
        <>
          <FileDropzone 
            onFileDrop={handleFileDrop} 
            isConverting={isConverting}
          />
          
          {file && sourceFormat && (
            <ConversionOptions
              sourceFormat={sourceFormat}
              onSelectFormat={handleFormatSelect}
              selectedFormat={targetFormat}
              isConverting={isConverting}
            />
          )}
          
          {file && targetFormat && (
            <div className="mt-8 text-center animate-fade-up">
              <Button
                onClick={handleConvert}
                disabled={isConverting || !targetFormat || !hasRemainingFreeConversions}
                className="w-full sm:w-auto"
                size="lg"
              >
                {isConverting ? (
                  <>
                    <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  'Convert Now'
                )}
              </Button>
              
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {isPremium ? 'Premium: No limitations' : 'Free: Up to 5MB'}
              </p>
            </div>
          )}
          
          {isConverting && (
            <div className="mt-8 animate-fade-in">
              <div className="flex justify-between mb-2 text-sm">
                <span>Converting...</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="w-full h-2" />
            </div>
          )}
          
          {error && (
            <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 flex items-start space-x-3 animate-fade-in dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Conversion failed</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-scale-in dark:bg-gray-800 dark:border-gray-700">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Conversion Complete!
            </h3>
            <p className="text-gray-600 mt-1 dark:text-gray-400">
              Your file has been successfully converted
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
            <Button
              onClick={handleDownload}
              size="lg"
              className="w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Download File
            </Button>
            
            <Button
              onClick={handleReset}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              Convert Another File
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
