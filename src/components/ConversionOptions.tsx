
import React, { useState } from 'react';
import { formats, getFormatByExtension, groupFormatsByCategory } from '../utils/formatHelpers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckIcon, ImageIcon, FileTextIcon, MusicIcon, VideoIcon, ArchiveIcon } from 'lucide-react';

interface ConversionOptionsProps {
  sourceFormat: string;
  onSelectFormat: (format: string) => void;
  selectedFormat: string | null;
  isConverting: boolean;
}

const categoryIcons = {
  image: <ImageIcon className="w-4 h-4" />,
  document: <FileTextIcon className="w-4 h-4" />,
  audio: <MusicIcon className="w-4 h-4" />,
  video: <VideoIcon className="w-4 h-4" />,
  archive: <ArchiveIcon className="w-4 h-4" />
};

export const ConversionOptions: React.FC<ConversionOptionsProps> = ({
  sourceFormat,
  onSelectFormat,
  selectedFormat,
  isConverting
}) => {
  const sourceFormatObj = getFormatByExtension(sourceFormat);
  const [selectedTab, setSelectedTab] = useState<string>(sourceFormatObj?.category || 'image');
  
  if (!sourceFormatObj) {
    return (
      <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100 dark:bg-red-900/20 dark:border-red-800/30">
        <p className="text-red-600 dark:text-red-400">
          Source format not recognized. Please try a different file.
        </p>
      </div>
    );
  }
  
  const groupedFormats = groupFormatsByCategory();
  
  // Filter out the source format from the options
  const formatOptions = groupedFormats[sourceFormatObj.category].filter(
    format => format.id !== sourceFormatObj.id
  );
  
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    
    // When changing the category, clear the selected format
    if (value !== sourceFormatObj.category) {
      onSelectFormat('');
    }
  };
  
  return (
    <div className="w-full max-w-xl mx-auto mt-8 animate-fade-up">
      <div className="mb-4">
        <Label className="text-base font-medium">Source Format:</Label>
        <div className="mt-2 p-3 bg-gray-50 rounded-lg flex items-center space-x-3 dark:bg-gray-800">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
            {categoryIcons[sourceFormatObj.category]}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {sourceFormatObj.label}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {sourceFormatObj.description}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <Label className="text-base font-medium mb-2 block">Convert To:</Label>
        <Tabs defaultValue={sourceFormatObj.category} value={selectedTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="image" disabled={isConverting}>
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Image</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="document" disabled={isConverting}>
              <div className="flex items-center space-x-2">
                <FileTextIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Document</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="audio" disabled={isConverting}>
              <div className="flex items-center space-x-2">
                <MusicIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Audio</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="video" disabled={isConverting}>
              <div className="flex items-center space-x-2">
                <VideoIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Video</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="archive" disabled={isConverting}>
              <div className="flex items-center space-x-2">
                <ArchiveIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Archive</span>
              </div>
            </TabsTrigger>
          </TabsList>
          
          {Object.keys(groupedFormats).map((category) => (
            <TabsContent key={category} value={category} className="pt-2">
              {category !== sourceFormatObj.category ? (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 text-amber-800 mb-4 dark:bg-amber-900/20 dark:border-amber-800/30 dark:text-amber-400">
                  <p>
                    Cross-category conversions require specialized processing and may result in quality loss.
                  </p>
                </div>
              ) : null}
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {groupedFormats[category]
                  .filter(format => format.id !== sourceFormatObj.id)
                  .map((format) => (
                    <Button
                      key={format.id}
                      variant={selectedFormat === format.id ? "default" : "outline"}
                      className={`justify-start h-auto py-3 px-4 ${
                        selectedFormat === format.id ? "border-primary" : ""
                      }`}
                      onClick={() => onSelectFormat(format.id)}
                      disabled={isConverting}
                    >
                      <div className="flex items-center space-x-2 w-full">
                        <div className="flex-shrink-0">
                          {selectedFormat === format.id ? (
                            <CheckIcon className="h-5 w-5 text-white" />
                          ) : (
                            categoryIcons[category]
                          )}
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{format.label}</span>
                          <span className="text-xs opacity-70">{format.extensions[0]}</span>
                        </div>
                      </div>
                    </Button>
                  ))}
              </div>
              
              {groupedFormats[category].filter(format => format.id !== sourceFormatObj.id).length === 0 && (
                <p className="text-center text-gray-500 my-4">
                  No conversion options available for this category.
                </p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};
