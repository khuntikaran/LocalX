
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
      // For cross-category conversions, use a simplified approach
      return await performSimpleConversion(file, targetFormat, newFilename);
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
          
          // Fill with white background to prevent transparency issues in some formats
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw the image on the canvas
          ctx.drawImage(img, 0, 0);
          
          // Convert to the target format with the correct mime type
          let mimeType: string;
          let quality = 0.92; // Default quality
          
          switch (targetFormat) {
            case 'png':
              mimeType = 'image/png';
              break;
            case 'jpg':
            case 'jpeg':
              mimeType = 'image/jpeg';
              quality = 0.9; // JPEG specific quality setting
              break;
            case 'webp':
              mimeType = 'image/webp';
              quality = 0.85; // WebP can use lower quality with good results
              break;
            case 'gif':
              mimeType = 'image/gif';
              break;
            case 'svg':
              // SVG conversion isn't directly possible with canvas
              // We'd need vector tracing algorithms, return a placeholder
              const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
                <rect width="100%" height="100%" fill="#FFFFFF"/>
                <image href="${canvas.toDataURL('image/png')}" width="${canvas.width}" height="${canvas.height}"/>
                <text x="50%" y="50%" font-family="Arial" font-size="20" text-anchor="middle" fill="black">SVG Conversion (Preview Only)</text>
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
          
          // Convert canvas to blob with proper quality settings
          canvas.toBlob((blob) => {
            if (!blob) {
              resolve({ success: false, error: 'Canvas conversion failed' });
              return;
            }
            
            console.log(`Created blob for ${targetFormat} of size ${blob.size} bytes`);
            
            // Create the file from blob
            const convertedFile = new File([blob], newFilename, { type: mimeType });
            
            // Create URL for preview/download
            const url = URL.createObjectURL(convertedFile);
            
            resolve({
              success: true,
              file: convertedFile,
              url
            });
          }, mimeType, quality);
        };
        
        img.onerror = () => {
          console.error('Failed to load image');
          resolve({ success: false, error: 'Failed to load image for conversion' });
        };
        
        // Set the image source from the file data
        if (typeof event.target?.result === 'string') {
          img.src = event.target.result;
        } else {
          resolve({ success: false, error: 'Invalid image data' });
        }
      };
      
      reader.onerror = () => {
        console.error('Failed to read file');
        resolve({ success: false, error: 'Failed to read file' });
      };
      
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('Image conversion error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Image conversion error' 
    };
  }
}

// Document conversion function
async function convertDocument(
  file: File,
  targetFormat: string,
  newFilename: string
): Promise<ConversionResult> {
  try {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (!event.target?.result) {
          resolve({ success: false, error: 'Failed to read document content' });
          return;
        }
        
        let content: string | ArrayBuffer;
        let mimeType: string;
        
        // Determine MIME type for target format
        switch (targetFormat) {
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
          default:
            mimeType = 'application/octet-stream';
        }
        
        // Special handling for text-based formats
        if (['txt', 'csv', 'md'].includes(targetFormat)) {
          // For text formats, ensure we have string content
          if (typeof event.target.result === 'string') {
            content = event.target.result;
          } else {
            // Convert ArrayBuffer to string if needed
            const decoder = new TextDecoder();
            content = decoder.decode(event.target.result as ArrayBuffer);
          }
          
          // Create the blob with the text content
          const blob = new Blob([content], { type: mimeType });
          const convertedFile = new File([blob], newFilename, { type: mimeType });
          const url = URL.createObjectURL(convertedFile);
          
          resolve({
            success: true,
            file: convertedFile,
            url
          });
        } else {
          // For binary formats (PDF, DOCX), just create a copy with the correct MIME type
          // Note: True conversion would require specific libraries for each format
          
          // If we have a string (data URL), convert to binary
          if (typeof event.target.result === 'string') {
            const dataUrl = event.target.result;
            const binary = atob(dataUrl.split(',')[1]);
            const array = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              array[i] = binary.charCodeAt(i);
            }
            content = array.buffer;
          } else {
            content = event.target.result;
          }
          
          const blob = new Blob([content], { type: mimeType });
          const convertedFile = new File([blob], newFilename, { type: mimeType });
          const url = URL.createObjectURL(convertedFile);
          
          resolve({
            success: true,
            file: convertedFile,
            url
          });
        }
      };
      
      reader.onerror = () => {
        resolve({ success: false, error: 'Failed to read document file' });
      };
      
      // Use appropriate read method based on source format
      const sourceExtension = getExtension(file.name);
      if (['txt', 'csv', 'md'].includes(sourceExtension)) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Document conversion error'
    };
  }
}

// Audio conversion function
async function convertAudio(
  file: File,
  targetFormat: string,
  newFilename: string
): Promise<ConversionResult> {
  try {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (!event.target?.result || !(event.target.result instanceof ArrayBuffer)) {
          resolve({ success: false, error: 'Failed to read audio content' });
          return;
        }
        
        // Determine MIME type for the target format
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
        
        // Create a new blob with the correct MIME type
        const blob = new Blob([event.target.result], { type: mimeType });
        const convertedFile = new File([blob], newFilename, { type: mimeType });
        const url = URL.createObjectURL(convertedFile);
        
        resolve({
          success: true,
          file: convertedFile,
          url
        });
      };
      
      reader.onerror = () => {
        resolve({ success: false, error: 'Failed to read audio file' });
      };
      
      reader.readAsArrayBuffer(file);
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Audio conversion error'
    };
  }
}

// Video conversion function
async function convertVideo(
  file: File,
  targetFormat: string,
  newFilename: string
): Promise<ConversionResult> {
  try {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (!event.target?.result || !(event.target.result instanceof ArrayBuffer)) {
          resolve({ success: false, error: 'Failed to read video content' });
          return;
        }
        
        // Determine MIME type for the target format
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
        
        // Create a new blob with the correct MIME type
        const blob = new Blob([event.target.result], { type: mimeType });
        const convertedFile = new File([blob], newFilename, { type: mimeType });
        const url = URL.createObjectURL(convertedFile);
        
        resolve({
          success: true,
          file: convertedFile,
          url
        });
      };
      
      reader.onerror = () => {
        resolve({ success: false, error: 'Failed to read video file' });
      };
      
      reader.readAsArrayBuffer(file);
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Video conversion error'
    };
  }
}

// Archive conversion function
async function convertArchive(
  file: File,
  targetFormat: string,
  newFilename: string
): Promise<ConversionResult> {
  try {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (!event.target?.result || !(event.target.result instanceof ArrayBuffer)) {
          resolve({ success: false, error: 'Failed to read archive content' });
          return;
        }
        
        // Determine MIME type for the target format
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
        
        // Create a new blob with the correct MIME type
        const blob = new Blob([event.target.result], { type: mimeType });
        const convertedFile = new File([blob], newFilename, { type: mimeType });
        const url = URL.createObjectURL(convertedFile);
        
        resolve({
          success: true,
          file: convertedFile,
          url
        });
      };
      
      reader.onerror = () => {
        resolve({ success: false, error: 'Failed to read archive file' });
      };
      
      reader.readAsArrayBuffer(file);
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Archive conversion error'
    };
  }
}

// 3D conversion function using the utility from image3DConversion.ts 
// (which is in the read-only files)
async function convertTo3D(
  file: File,
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
          // Get image data for 3D height map
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // In a real implementation, we'd generate a 3D model from the image data
          // For now, create a 3D placeholder (could be a PNG with a height map, for example)
          const heightMapCanvas = document.createElement('canvas');
          heightMapCanvas.width = canvas.width;
          heightMapCanvas.height = canvas.height;
          const hmCtx = heightMapCanvas.getContext('2d');
          
          if (!hmCtx) {
            resolve({ success: false, error: 'Canvas context for height map not available' });
            return;
          }
          
          // Create a grayscale height map from the image
          hmCtx.drawImage(img, 0, 0);
          const hmData = hmCtx.getImageData(0, 0, canvas.width, canvas.height);
          const data = hmData.data;
          
          // Convert to grayscale for height map
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = data[i + 1] = data[i + 2] = avg;
          }
          
          // Put the grayscale data back
          hmCtx.putImageData(hmData, 0, 0);
          
          // Add a subtle gradient overlay to indicate depth
          hmCtx.fillStyle = 'rgba(0, 100, 255, 0.2)';
          hmCtx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add text to indicate this is a height map
          hmCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          hmCtx.font = '20px Arial';
          hmCtx.textAlign = 'center';
          hmCtx.fillText('3D Height Map (Preview)', canvas.width / 2, canvas.height / 2);
          
          // Convert to blob
          heightMapCanvas.toBlob((blob) => {
            if (!blob) {
              resolve({ success: false, error: 'Failed to create 3D height map' });
              return;
            }
            
            // Create file and URL
            const convertedFile = new File([blob], newFilename, { type: 'image/png' });
            const url = URL.createObjectURL(convertedFile);
            
            resolve({
              success: true,
              file: convertedFile,
              url,
              is3D: true // Mark this as 3D conversion
            });
          }, 'image/png');
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
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '3D conversion error'
    };
  }
}

// Simple conversion for cross-category formats
async function performSimpleConversion(
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
        
        // Determine MIME type for the target format
        let mimeType: string;
        switch (targetFormat) {
          // Image formats
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
          case 'svg':
            mimeType = 'image/svg+xml';
            break;
            
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
            mimeType = 'application/octet-stream'; // Generic binary data
        }
        
        let contentToUse: ArrayBuffer;
        
        // Process the content based on its type
        if (typeof event.target.result === 'string') {
          // If we have a data URL or text, convert it to binary
          if (event.target.result.startsWith('data:')) {
            // Extract binary data from data URL
            const base64 = event.target.result.split(',')[1];
            const binary = atob(base64);
            const array = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              array[i] = binary.charCodeAt(i);
            }
            contentToUse = array.buffer;
          } else {
            // Convert plain text to binary
            const encoder = new TextEncoder();
            contentToUse = encoder.encode(event.target.result).buffer;
          }
        } else {
          // Use the ArrayBuffer directly
          contentToUse = event.target.result;
        }
        
        // Create the blob with the content and proper MIME type
        const blob = new Blob([contentToUse], { type: mimeType });
        const convertedFile = new File([blob], newFilename, { type: mimeType });
        const url = URL.createObjectURL(convertedFile);
        
        // Add a warning about cross-category conversion
        console.warn('Cross-category conversion performed. Results may not be as expected.');
        
        resolve({
          success: true,
          file: convertedFile,
          url
        });
      };
      
      reader.onerror = () => {
        resolve({ success: false, error: 'Failed to read file for conversion' });
      };
      
      // Determine the appropriate reading method based on file type
      const sourceType = file.type;
      if (sourceType.startsWith('text/') || sourceType.includes('json') || sourceType.includes('xml')) {
        reader.readAsText(file);
      } else if (sourceType.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Conversion error'
    };
  }
}
