
import React, { useState } from 'react';
import { formats, getFormatByExtension, groupFormatsByCategory } from '../utils/formatHelpers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckIcon, ImageIcon, FileTextIcon, MusicIcon, VideoIcon, ArchiveIcon, Package } from 'lucide-react';

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
  archive: <ArchiveIcon className="w-4 h-4" />,
  '3d': <Package className="w-4 h-4" />
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
      <div className="text-center p-4 glass-card backdrop-blur-md bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400">
        <p>Source format not recognized. Please try a different file.</p>
      </div>
    );
  }
  
  const groupedFormats = groupFormatsByCategory();
  
  // Filter out the source format from the options
  const formatOptions = groupedFormats[sourceFormatObj.category]?.filter(
    format => format.id !== sourceFormatObj.id
  ) || [];
  
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    
    // When changing the category, clear the selected format
    if (value !== sourceFormatObj.category) {
      onSelectFormat('');
    }
  };
  
  // Check if source format is an image and 3D conversion is available
  const show3DOption = sourceFormatObj.category === 'image';
  
  return (
    <div className="w-full max-w-xl mx-auto mt-8 animate-fade-up">
      <div className="mb-4">
        <Label className="text-base font-medium">Source Format:</Label>
        <div className="mt-2 p-3 glass-card backdrop-blur-md bg-white/10 border border-white/20 dark:bg-gray-900/30 dark:border-gray-700/30 rounded-lg flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
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
        <Tabs defaultValue={sourceFormatObj.category} value={selectedTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className={`grid ${show3DOption ? 'grid-cols-6' : 'grid-cols-5'} mb-4 p-1 backdrop-blur-md bg-white/10 border border-white/20 dark:bg-gray-900/30 dark:border-gray-700/30 rounded-lg`}>
            <TabsTrigger value="image" disabled={isConverting} className="data-[state=active]:bg-gradient-to-r from-blue-500 to-indigo-500 data-[state=active]:text-white">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Image</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="document" disabled={isConverting} className="data-[state=active]:bg-gradient-to-r from-blue-500 to-indigo-500 data-[state=active]:text-white">
              <div className="flex items-center space-x-2">
                <FileTextIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Document</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="audio" disabled={isConverting} className="data-[state=active]:bg-gradient-to-r from-blue-500 to-indigo-500 data-[state=active]:text-white">
              <div className="flex items-center space-x-2">
                <MusicIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Audio</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="video" disabled={isConverting} className="data-[state=active]:bg-gradient-to-r from-blue-500 to-indigo-500 data-[state=active]:text-white">
              <div className="flex items-center space-x-2">
                <VideoIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Video</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="archive" disabled={isConverting} className="data-[state=active]:bg-gradient-to-r from-blue-500 to-indigo-500 data-[state=active]:text-white">
              <div className="flex items-center space-x-2">
                <ArchiveIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Archive</span>
              </div>
            </TabsTrigger>
            {show3DOption && (
              <TabsTrigger value="3d" disabled={isConverting} className="data-[state=active]:bg-gradient-to-r from-blue-500 to-indigo-500 data-[state=active]:text-white">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">3D</span>
                </div>
              </TabsTrigger>
            )}
          </TabsList>
          
          {/* Standard category conversion tabs */}
          {Object.keys(groupedFormats).filter(cat => cat !== '3d').map((category) => (
            <TabsContent key={category} value={category} className="pt-2">
              {category !== sourceFormatObj.category ? (
                <div className="p-4 glass-card backdrop-blur-md bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-800 mb-4 dark:text-amber-400">
                  <p>
                    Cross-category conversions require specialized processing and may result in quality loss.
                  </p>
                </div>
              ) : null}
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {groupedFormats[category]
                  ?.filter(format => format.id !== sourceFormatObj.id)
                  .map((format) => (
                    <Button
                      key={format.id}
                      variant={selectedFormat === format.id ? "default" : "outline"}
                      className={`justify-start h-auto py-3 px-4 backdrop-blur-md ${
                        selectedFormat === format.id 
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 border-0 text-white" 
                          : "glass-card bg-white/10 border-white/20 dark:bg-gray-900/30 dark:border-gray-700/30"
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
              
              {(!groupedFormats[category] || groupedFormats[category].filter(format => format.id !== sourceFormatObj.id).length === 0) && (
                <p className="text-center text-gray-500 my-4 dark:text-gray-400">
                  No conversion options available for this category.
                </p>
              )}
            </TabsContent>
          ))}
          
          {/* Special 3D conversion tab */}
          {show3DOption && (
            <TabsContent key="3d" value="3d" className="pt-2">
              <div className="p-4 glass-card backdrop-blur-md bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-800 mb-4 dark:text-blue-400">
                <p>
                  Convert your image to a 3D height map. Works best with images that have clear contrast.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant={selectedFormat === '3d' ? "default" : "outline"}
                  className={`justify-start h-auto py-3 px-4 ${
                    selectedFormat === '3d' 
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 border-0 text-white" 
                      : "glass-card backdrop-blur-md bg-white/10 border-white/20 dark:bg-gray-900/30 dark:border-gray-700/30"
                  }`}
                  onClick={() => onSelectFormat('3d')}
                  disabled={isConverting}
                >
                  <div className="flex items-center space-x-2 w-full">
                    <div className="flex-shrink-0">
                      {selectedFormat === '3d' ? (
                        <CheckIcon className="h-5 w-5 text-white" />
                      ) : (
                        <Package className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">3D Height Map</span>
                      <span className="text-xs opacity-70">Image to 3D conversion</span>
                    </div>
                  </div>
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};
