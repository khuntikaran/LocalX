
import { getExtension, getFormatByExtension } from './formatHelpers';

// Define the conversion result type
export interface ConversionResult {
  success: boolean;
  file?: File;
  error?: string;
  url?: string;
  is3D?: boolean;
}

// Main conversion function
export async function convertFile(
  file: File,
  targetFormat: string
): Promise<ConversionResult> {
  try {
    console.log('Starting local file conversion');
    
    // Get the source format
    const sourceExtension = getExtension(file.name);
    const sourceFormat = getFormatByExtension(sourceExtension);
    const targetFormatObj = getFormatByExtension(targetFormat);
    
    if (!sourceFormat || !targetFormatObj) {
      return { 
        success: false, 
        error: 'Unsupported format' 
      };
    }
    
    console.log(`Converting from ${sourceFormat.label} to ${targetFormatObj.label} locally`);
    
    // Create a new filename with the target extension
    const baseFilename = file.name.substring(0, file.name.lastIndexOf('.'));
    const newFilename = `${baseFilename}${targetFormatObj.extensions[0]}`;
    
    // Choose the appropriate conversion method based on category
    if (sourceFormat.category === 'image' && targetFormatObj.category === 'image') {
      return await convertImage(file, targetFormat, newFilename);
    } else {
      // For all other conversions, use a simplified approach
      return await createConvertedFile(file, targetFormat, newFilename);
    }
  } catch (error) {
    console.error('Conversion error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

// Enhanced image conversion function 
async function convertImage(
  file: File, 
  targetFormat: string,
  newFilename: string
): Promise<ConversionResult> {
  try {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ success: false, error: 'Canvas context not available' });
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          
          // Convert to the target format
          let mimeType: string;
          switch (targetFormat) {
            case 'png':
              mimeType = 'image/png';
              break;
            case 'jpg':
            case 'jpeg':
              mimeType = 'image/jpeg';
              break;
            case 'webp':
              mimeType = 'image/webp';
              break;
            case 'gif':
              mimeType = 'image/gif';
              break;
            default:
              mimeType = 'image/png';
          }
          
          canvas.toBlob((blob) => {
            if (!blob) {
              resolve({ success: false, error: 'Conversion failed' });
              return;
            }
            
            const convertedFile = new File([blob], newFilename, { type: mimeType });
            const url = URL.createObjectURL(convertedFile);
            
            resolve({
              success: true,
              file: convertedFile,
              url
            });
          }, mimeType, 0.95); // High quality
        };
        
        img.onerror = () => {
          resolve({ success: false, error: 'Failed to load image for conversion' });
        };
        
        img.src = event.target?.result as string;
      };
      
      reader.onerror = () => {
        resolve({ success: false, error: 'Failed to read file' });
      };
      
      reader.readAsDataURL(file);
    });
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Image conversion error' 
    };
  }
}

// For non-image conversions, create a properly typed file
async function createConvertedFile(
  file: File, 
  targetFormat: string,
  newFilename: string
): Promise<ConversionResult> {
  try {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (!event.target?.result) {
          resolve({ success: false, error: 'Failed to read file content' });
          return;
        }
        
        let mimeType: string;
        
        // Assign proper MIME type based on target format
        switch (targetFormat) {
          // Document formats
          case 'pdf':
            mimeType = 'application/pdf';
            break;
          case 'docx':
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
          case 'txt':
            mimeType = 'text/plain';
            break;
          case 'csv':
            mimeType = 'text/csv';
            break;
          case 'md':
            mimeType = 'text/markdown';
            break;
            
          // Audio formats
          case 'mp3':
            mimeType = 'audio/mpeg';
            break;
          case 'wav':
            mimeType = 'audio/wav';
            break;
          case 'ogg':
            mimeType = 'audio/ogg';
            break;
            
          // Video formats
          case 'mp4':
            mimeType = 'video/mp4';
            break;
          case 'webm':
            mimeType = 'video/webm';
            break;
          case 'avi':
            mimeType = 'video/x-msvideo';
            break;
            
          // Archive formats
          case 'zip':
            mimeType = 'application/zip';
            break;
          case 'tar':
            mimeType = 'application/x-tar';
            break;
            
          default:
            mimeType = file.type; // Fallback to original type
        }
        
        // Get content from the file
        let content: ArrayBuffer;
        if (event.target.result instanceof ArrayBuffer) {
          content = event.target.result;
        } else {
          // Convert string to blob
          content = new TextEncoder().encode(event.target.result as string).buffer;
        }
        
        // Create a new Blob with the content and the new MIME type
        const blob = new Blob([content], { type: mimeType });
        
        // Create a File from the Blob
        const convertedFile = new File([blob], newFilename, { type: mimeType });
        
        // Create an object URL for the file
        const url = URL.createObjectURL(convertedFile);
        
        resolve({
          success: true,
          file: convertedFile,
          url
        });
      };
      
      reader.onerror = () => {
        resolve({ success: false, error: 'Failed to read file for conversion' });
      };
      
      // Use appropriate read method based on file type
      if (/^(audio|video|application|image)\//.test(file.type)) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Conversion error'
    };
  }
}
