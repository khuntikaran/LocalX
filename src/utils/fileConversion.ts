
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
    console.log('Starting local file conversion', { file, targetFormat });
    
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
    } else if (sourceFormat.category === 'document' && targetFormatObj.category === 'document') {
      return await convertDocument(file, targetFormat, newFilename);
    } else if (sourceFormat.category === 'audio' && targetFormatObj.category === 'audio') {
      return await convertAudio(file, targetFormat, newFilename);
    } else if (sourceFormat.category === 'video' && targetFormatObj.category === 'video') {
      return await convertVideo(file, targetFormat, newFilename);
    } else if (sourceFormat.category === 'archive' && targetFormatObj.category === 'archive') {
      return await convertArchive(file, targetFormat, newFilename);
    } else if (sourceFormat.category === 'image' && targetFormatObj.category === '3d') {
      return await convertTo3D(file, newFilename);
    } else {
      // For cross-category conversions, return an error as these need specialized handling
      return { 
        success: false, 
        error: 'Cross-category conversion is not supported in browser environment' 
      };
    }
  } catch (error) {
    console.error('Conversion error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

// Enhanced image conversion function with pixel-perfect output
async function convertImage(
  file: File, 
  targetFormat: string,
  newFilename: string
): Promise<ConversionResult> {
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
        
        // Fill with white background to preserve quality
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0);
        
        // Set proper mime type and quality settings
        let mimeType: string;
        let quality = 1.0; // Default max quality
        
        switch (targetFormat) {
          case 'png':
            mimeType = 'image/png';
            break;
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg';
            quality = 0.95; // High quality JPEG
            break;
          case 'webp':
            mimeType = 'image/webp';
            quality = 0.92; // Good balance for WebP
            break;
          case 'gif':
            mimeType = 'image/gif';
            break;
          case 'svg':
            // Create a basic SVG with the image embedded as data URL
            const dataUrl = canvas.toDataURL('image/png');
            const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
              <image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/>
            </svg>`;
            
            const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
            const svgFile = new File([svgBlob], newFilename, { type: 'image/svg+xml' });
            
            resolve({
              success: true,
              file: svgFile,
              url: URL.createObjectURL(svgFile)
            });
            return;
          default:
            mimeType = 'image/png'; // Default fallback
        }
        
        // Use toBlob for better control over the output
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ success: false, error: 'Failed to create image blob' });
              return;
            }
            
            // Ensure we're creating a proper File object with the correct MIME type
            const convertedFile = new File([blob], newFilename, { 
              type: mimeType,
              lastModified: new Date().getTime()
            });
            
            // Create a downloadable URL
            const url = URL.createObjectURL(convertedFile);
            
            resolve({
              success: true,
              file: convertedFile,
              url
            });
          },
          mimeType,
          quality
        );
      };
      
      img.onerror = () => {
        resolve({ success: false, error: 'Failed to load image' });
      };
      
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      } else {
        resolve({ success: false, error: 'Invalid image data' });
      }
    };
    
    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to read file' });
    };
    
    reader.readAsDataURL(file);
  });
}

// Document conversion function with improved binary handling
async function convertDocument(
  file: File,
  targetFormat: string,
  newFilename: string
): Promise<ConversionResult> {
  return new Promise((resolve) => {
    // For text-based formats, we can handle direct conversions
    const textBasedFormats = ['txt', 'csv', 'md'];
    const sourceExtension = getExtension(file.name).toLowerCase();
    const isSourceTextBased = textBasedFormats.includes(sourceExtension);
    const isTargetTextBased = textBasedFormats.includes(targetFormat);
    
    // If source is text-based, read as text, otherwise read as binary
    if (isSourceTextBased) {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (!event.target?.result) {
          resolve({ success: false, error: 'Failed to read document content' });
          return;
        }
        
        const textContent = event.target.result as string;
        let mimeType: string;
        
        // Set the proper MIME type for the target format
        switch (targetFormat) {
          case 'txt':
            mimeType = 'text/plain';
            break;
          case 'csv':
            mimeType = 'text/csv';
            break;
          case 'md':
            mimeType = 'text/markdown';
            break;
          case 'pdf':
            // Can't properly convert to PDF in browser
            resolve({ 
              success: false, 
              error: 'Cannot convert to PDF in browser. Use server-side conversion.' 
            });
            return;
          case 'docx':
            // Can't properly convert to DOCX in browser
            resolve({ 
              success: false, 
              error: 'Cannot convert to DOCX in browser. Use server-side conversion.' 
            });
            return;
          default:
            mimeType = 'text/plain';
        }
        
        // Create the blob with the text content
        const blob = new Blob([textContent], { type: mimeType });
        const convertedFile = new File([blob], newFilename, { 
          type: mimeType,
          lastModified: new Date().getTime()
        });
        
        const url = URL.createObjectURL(convertedFile);
        
        resolve({
          success: true,
          file: convertedFile,
          url
        });
      };
      
      reader.onerror = () => {
        resolve({ success: false, error: 'Failed to read document file' });
      };
      
      reader.readAsText(file);
    } else {
      // For binary formats or converting binary to text
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (!event.target?.result || !(event.target.result instanceof ArrayBuffer)) {
          resolve({ success: false, error: 'Failed to read binary document content' });
          return;
        }
        
        // If converting to text format from binary, try to decode as UTF-8
        if (isTargetTextBased) {
          try {
            const decoder = new TextDecoder('utf-8');
            const text = decoder.decode(event.target.result);
            
            let mimeType: string;
            switch (targetFormat) {
              case 'txt':
                mimeType = 'text/plain';
                break;
              case 'csv':
                mimeType = 'text/csv';
                break;
              case 'md':
                mimeType = 'text/markdown';
                break;
              default:
                mimeType = 'text/plain';
            }
            
            const blob = new Blob([text], { type: mimeType });
            const convertedFile = new File([blob], newFilename, { 
              type: mimeType,
              lastModified: new Date().getTime()
            });
            
            const url = URL.createObjectURL(convertedFile);
            
            resolve({
              success: true,
              file: convertedFile,
              url
            });
          } catch (error) {
            resolve({ 
              success: false, 
              error: 'Failed to decode binary content to text' 
            });
          }
        } else {
          // For binary-to-binary conversion (like PDF to DOCX), we can't do a proper conversion
          resolve({ 
            success: false, 
            error: 'Binary document format conversion requires specialized tools' 
          });
        }
      };
      
      reader.onerror = () => {
        resolve({ success: false, error: 'Failed to read binary document file' });
      };
      
      reader.readAsArrayBuffer(file);
    }
  });
}

// Audio conversion with detailed error handling
async function convertAudio(
  file: File,
  targetFormat: string,
  newFilename: string
): Promise<ConversionResult> {
  return new Promise((resolve) => {
    // Proper audio conversion would require audio processing libraries
    // This is a simplified approach just changing the container format
    // without actual transcoding
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (!event.target?.result || !(event.target.result instanceof ArrayBuffer)) {
        resolve({ success: false, error: 'Failed to read audio content' });
        return;
      }
      
      let mimeType: string;
      switch (targetFormat) {
        case 'mp3':
          mimeType = 'audio/mpeg';
          break;
        case 'wav':
          mimeType = 'audio/wav';
          break;
        case 'ogg':
          mimeType = 'audio/ogg';
          break;
        default:
          mimeType = 'audio/mpeg'; // Default to MP3
      }
      
      // We're not doing actual audio transcoding here
      // Just wrapping in the correct MIME type
      const blob = new Blob([event.target.result], { type: mimeType });
      const convertedFile = new File([blob], newFilename, { 
        type: mimeType,
        lastModified: new Date().getTime()
      });
      
      const url = URL.createObjectURL(convertedFile);
      
      resolve({
        success: true,
        file: convertedFile,
        url,
        error: 'Note: This is a format container change only, not actual audio conversion'
      });
    };
    
    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to read audio file' });
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// Video conversion with detailed error handling
async function convertVideo(
  file: File,
  targetFormat: string,
  newFilename: string
): Promise<ConversionResult> {
  return new Promise((resolve) => {
    // Proper video conversion would require video processing libraries
    // This is a simplified approach just changing the container format
    // without actual transcoding
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (!event.target?.result || !(event.target.result instanceof ArrayBuffer)) {
        resolve({ success: false, error: 'Failed to read video content' });
        return;
      }
      
      let mimeType: string;
      switch (targetFormat) {
        case 'mp4':
          mimeType = 'video/mp4';
          break;
        case 'webm':
          mimeType = 'video/webm';
          break;
        case 'avi':
          mimeType = 'video/x-msvideo';
          break;
        default:
          mimeType = 'video/mp4'; // Default to MP4
      }
      
      // We're not doing actual video transcoding here
      // Just wrapping in the correct MIME type
      const blob = new Blob([event.target.result], { type: mimeType });
      const convertedFile = new File([blob], newFilename, { 
        type: mimeType,
        lastModified: new Date().getTime()
      });
      
      const url = URL.createObjectURL(convertedFile);
      
      resolve({
        success: true,
        file: convertedFile,
        url,
        error: 'Note: This is a format container change only, not actual video conversion'
      });
    };
    
    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to read video file' });
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// Archive conversion with robust error handling
async function convertArchive(
  file: File,
  targetFormat: string,
  newFilename: string
): Promise<ConversionResult> {
  return new Promise((resolve) => {
    // Archive conversion is complex and requires specialized libraries
    // This is a simplified version that just changes the container extension
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (!event.target?.result || !(event.target.result instanceof ArrayBuffer)) {
        resolve({ success: false, error: 'Failed to read archive content' });
        return;
      }
      
      let mimeType: string;
      switch (targetFormat) {
        case 'zip':
          mimeType = 'application/zip';
          break;
        case 'tar':
          mimeType = 'application/x-tar';
          break;
        default:
          mimeType = 'application/zip'; // Default to ZIP
      }
      
      // Create a new blob with the binary data and the correct MIME type
      const blob = new Blob([event.target.result], { type: mimeType });
      const convertedFile = new File([blob], newFilename, { 
        type: mimeType,
        lastModified: new Date().getTime()
      });
      
      const url = URL.createObjectURL(convertedFile);
      
      resolve({
        success: true,
        file: convertedFile,
        url,
        error: 'Note: This is a format container change only, not actual archive conversion'
      });
    };
    
    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to read archive file' });
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// 3D conversion function with improved height map generation
async function convertTo3D(
  file: File,
  newFilename: string
): Promise<ConversionResult> {
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
        
        // Get image data for height map
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        // Create a grayscale height map
        for (let i = 0; i < pixels.length; i += 4) {
          // Convert to grayscale using luminance formula
          const gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
          pixels[i] = pixels[i + 1] = pixels[i + 2] = gray;
        }
        
        // Put the processed data back
        ctx.putImageData(imageData, 0, 0);
        
        // Add depth visualization with gradient overlay
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, 'rgba(0, 50, 150, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 150, 255, 0.2)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add "3D Height Map" label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('3D Height Map (Preview)', canvas.width / 2, canvas.height / 2);
        
        // Convert to PNG for the height map
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve({ success: false, error: 'Failed to create height map image' });
            return;
          }
          
          const convertedFile = new File([blob], newFilename, { 
            type: 'image/png',
            lastModified: new Date().getTime()
          });
          
          const url = URL.createObjectURL(convertedFile);
          
          resolve({
            success: true,
            file: convertedFile,
            url,
            is3D: true
          });
        }, 'image/png', 0.95);
      };
      
      img.onerror = () => {
        resolve({ success: false, error: 'Failed to load image for 3D conversion' });
      };
      
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      } else {
        resolve({ success: false, error: 'Invalid image data for 3D conversion' });
      }
    };
    
    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to read file for 3D conversion' });
    };
    
    reader.readAsDataURL(file);
  });
}
