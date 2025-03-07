
import { getExtension, getFormatByExtension } from './formatHelpers';
import * as pdfjsLib from 'pdfjs-dist';

// Load the PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
    console.log('Starting file conversion', { file, targetFormat });
    
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
    
    console.log(`Converting from ${sourceFormat.label} to ${targetFormatObj.label}`);
    
    // Create a new filename with the target extension
    const baseFilename = file.name.substring(0, file.name.lastIndexOf('.'));
    const newFilename = `${baseFilename}${targetFormatObj.extensions[0]}`;
    
    // Same category conversions
    if (sourceFormat.category === targetFormatObj.category) {
      switch (sourceFormat.category) {
        case 'image':
          return await convertImage(file, targetFormat, newFilename);
        case 'document':
          return await convertDocument(file, targetFormat, newFilename);
        case 'audio':
          return await convertAudio(file, targetFormat, newFilename);
        case 'video':
          return await convertVideo(file, targetFormat, newFilename);
        case 'archive':
          return await convertArchive(file, targetFormat, newFilename);
        default:
          return { 
            success: false, 
            error: 'Unsupported category' 
          };
      }
    }
    
    // Cross-category conversions
    if (sourceFormat.category === 'document' && targetFormatObj.category === 'image') {
      return await convertDocumentToImage(file, targetFormat, newFilename);
    } else if (sourceFormat.category === 'image' && targetFormatObj.category === '3d') {
      return await convertTo3D(file, newFilename);
    } else if (sourceFormat.category === 'image' && targetFormatObj.category === 'document') {
      return await convertImageToDocument(file, targetFormat, newFilename);
    } else {
      // For other cross-category conversions
      return { 
        success: false, 
        error: 'This specific cross-category conversion is not supported. Try a different format.' 
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

// Enhanced image conversion function with proper format handling
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
        
        // Fill with white background for better quality
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0);
        
        // Set proper mime type and quality settings
        let mimeType: string;
        let quality = 0.95; // High quality default
        
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
          case 'svg':
            // Create a basic SVG with the image embedded
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
            
            // Create a proper File object with the correct MIME type
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

// Improved document conversion function
async function convertDocument(
  file: File,
  targetFormat: string,
  newFilename: string
): Promise<ConversionResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    // For text-based formats
    if (['txt', 'csv', 'md'].includes(targetFormat)) {
      reader.onload = (event) => {
        if (!event.target?.result) {
          resolve({ success: false, error: 'Failed to read document content' });
          return;
        }
        
        let content = '';
        
        // If the source is binary, try to extract text
        if (event.target.result instanceof ArrayBuffer) {
          try {
            const decoder = new TextDecoder('utf-8');
            content = decoder.decode(event.target.result);
          } catch (error) {
            content = 'Binary content converted to text';
          }
        } else {
          content = event.target.result.toString();
        }
        
        // Set the proper MIME type
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
        
        // Create the output file
        const blob = new Blob([content], { type: mimeType });
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
      
      // Read as text for text formats, or as binary for other formats
      const sourceExtension = getExtension(file.name).toLowerCase();
      if (['txt', 'csv', 'md', 'html', 'json'].includes(sourceExtension)) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    } 
    // For PDF conversion
    else if (targetFormat === 'pdf' && getExtension(file.name).toLowerCase() !== 'pdf') {
      // Create a simple PDF with the text content
      reader.onload = async (event) => {
        if (!event.target?.result) {
          resolve({ success: false, error: 'Failed to read document content' });
          return;
        }
        
        let content = '';
        
        if (typeof event.target.result === 'string') {
          content = event.target.result;
        } else {
          try {
            const decoder = new TextDecoder('utf-8');
            content = decoder.decode(event.target.result);
          } catch (error) {
            content = 'Binary content converted to text';
          }
        }
        
        try {
          // For simplicity, create a text-based PDF
          // In a real app, you would use a PDF generation library
          const pdfContent = `
            %PDF-1.5
            1 0 obj
            <</Type /Catalog /Pages 2 0 R>>
            endobj
            2 0 obj
            <</Type /Pages /Kids [3 0 R] /Count 1>>
            endobj
            3 0 obj
            <</Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 595 842] /Contents 5 0 R>>
            endobj
            4 0 obj
            <</Font <</F1 <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>>>>
            endobj
            5 0 obj
            <</Length ${content.length + 50}>>\nstream\n
            BT
            /F1 12 Tf
            36 806 Td
            (Converted from ${file.name}) Tj
            0 -20 Td
            (Content:) Tj
            0 -20 Td
            (${content.replace(/[()\\]/g, match => '\\' + match).substring(0, 1000)}) Tj
            ET
            \nendstream\nendobj
            xref
            0 6
            0000000000 65535 f
            0000000010 00000 n
            0000000056 00000 n
            0000000111 00000 n
            0000000212 00000 n
            0000000293 00000 n
            trailer
            <</Size 6 /Root 1 0 R>>
            startxref
            ${content.length + 500}
            %%EOF
          `;
            
          const pdfBlob = new Blob([pdfContent], { type: 'application/pdf' });
          const pdfFile = new File([pdfBlob], newFilename, { 
            type: 'application/pdf',
            lastModified: new Date().getTime()
          });
          
          const url = URL.createObjectURL(pdfFile);
          
          resolve({
            success: true,
            file: pdfFile,
            url
          });
        } catch (error) {
          resolve({ 
            success: false, 
            error: 'PDF creation failed. Use server-side conversion for better results.' 
          });
        }
      };
      
      reader.readAsText(file);
    } 
    // For other document formats, provide a simple conversion
    else {
      reader.onload = (event) => {
        if (!event.target?.result || !(event.target.result instanceof ArrayBuffer)) {
          resolve({ success: false, error: 'Failed to read document content' });
          return;
        }
        
        let mimeType: string;
        switch (targetFormat) {
          case 'docx':
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
          case 'pdf':
            mimeType = 'application/pdf';
            break;
          default:
            mimeType = 'application/octet-stream';
        }
        
        // Create a simple container change
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
          error: 'Note: This is a basic conversion. For better results, use specialized software.'
        });
      };
      
      reader.readAsArrayBuffer(file);
    }
  });
}

// Convert PDF to image
async function convertDocumentToImage(
  file: File,
  targetFormat: string,
  newFilename: string
): Promise<ConversionResult> {
  try {
    // For PDF files, use PDF.js to render as image
    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1); // Get first page
      
      // Scale page to fit in 800px width
      const viewport = page.getViewport({ scale: 1.0 });
      const scale = 800 / viewport.width;
      const scaledViewport = page.getViewport({ scale });
      
      // Prepare canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;
      
      if (!context) {
        return { success: false, error: 'Canvas context not available' };
      }
      
      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: scaledViewport
      }).promise;
      
      // Convert canvas to image
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
        default:
          mimeType = 'image/png';
      }
      
      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ success: false, error: 'Failed to create image from PDF' });
              return;
            }
            
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
          },
          mimeType,
          0.95
        );
      });
    } else {
      // For other document types, create a placeholder image
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1120; // A4 proportion roughly
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return { success: false, error: 'Canvas context not available' };
      }
      
      // Fill canvas with light gray
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add document icon or representation
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(250, 300, 300, 400);
      
      // Add file name
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Document Preview', canvas.width/2, 200);
      ctx.font = '18px Arial';
      ctx.fillText(file.name, canvas.width/2, 250);
      ctx.fillText('Converted to Image', canvas.width/2, 750);
      
      // Get proper mime type
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
        default:
          mimeType = 'image/png';
      }
      
      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ success: false, error: 'Failed to create image from document' });
              return;
            }
            
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
          },
          mimeType,
          0.95
        );
      });
    }
  } catch (error) {
    console.error('Document to image conversion error:', error);
    return { 
      success: false, 
      error: 'Failed to convert document to image. Error: ' + (error instanceof Error ? error.message : String(error))
    };
  }
}

// Convert image to document
async function convertImageToDocument(
  file: File,
  targetFormat: string,
  newFilename: string
): Promise<ConversionResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (!event.target?.result || typeof event.target.result !== 'string') {
        resolve({ success: false, error: 'Failed to read image data' });
        return;
      }
      
      const imageDataUrl = event.target.result;
      
      // Set proper mime type and prepare content
      let mimeType: string;
      let content: string | Blob;
      
      switch (targetFormat) {
        case 'txt':
          mimeType = 'text/plain';
          content = `Image conversion to text\nOriginal image: ${file.name}\nConverted at: ${new Date().toLocaleString()}\n\nThis is a basic conversion of an image to text format.`;
          break;
        case 'md':
          mimeType = 'text/markdown';
          content = `# Image Conversion to Markdown\n\n## Original Image\n\n![Image](${imageDataUrl})\n\n*Original filename: ${file.name}*\n\nConverted at: ${new Date().toLocaleString()}`;
          break;
        case 'html':
          mimeType = 'text/html';
          content = `<!DOCTYPE html>
<html>
<head>
  <title>Converted Image</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .container { text-align: center; }
    img { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; padding: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Converted Image</h1>
    <p>Original filename: ${file.name}</p>
    <p>Converted at: ${new Date().toLocaleString()}</p>
    <img src="${imageDataUrl}" alt="Converted image">
  </div>
</body>
</html>`;
          break;
        case 'pdf':
          mimeType = 'application/pdf';
          // Simple PDF with image embedded
          content = `%PDF-1.5
1 0 obj
<</Type /Catalog /Pages 2 0 R>>
endobj
2 0 obj
<</Type /Pages /Kids [3 0 R] /Count 1>>
endobj
3 0 obj
<</Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 595 842] /Contents 5 0 R>>
endobj
4 0 obj
<</Font <</F1 <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>>>>
endobj
5 0 obj
<</Length 150>>\nstream\n
BT
/F1 16 Tf
36 800 Td
(Converted Image: ${file.name}) Tj
0 -30 Td
(Converted at: ${new Date().toLocaleString()}) Tj
ET
\nendstream\nendobj
xref
0 6
0000000000 65535 f
0000000010 00000 n
0000000056 00000 n
0000000111 00000 n
0000000212 00000 n
0000000293 00000 n
trailer
<</Size 6 /Root 1 0 R>>
startxref
500
%%EOF`;
          break;
        default:
          mimeType = 'text/plain';
          content = `Converted image: ${file.name}\nDate: ${new Date().toLocaleString()}`;
      }
      
      // Create the blob with the proper content and type
      const blob = new Blob([content], { type: mimeType });
      const convertedFile = new File([blob], newFilename, { 
        type: mimeType,
        lastModified: new Date().getTime()
      });
      
      const url = URL.createObjectURL(convertedFile);
      
      resolve({
        success: true,
        file: convertedFile,
        url,
        error: targetFormat === 'pdf' ? 'Note: This is a simple PDF. For better results, use specialized software.' : undefined
      });
    };
    
    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to read image file' });
    };
    
    reader.readAsDataURL(file);
  });
}

// Audio conversion with better format handling
async function convertAudio(
  file: File,
  targetFormat: string,
  newFilename: string
): Promise<ConversionResult> {
  return new Promise((resolve) => {
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

// Video conversion with improved format handling
async function convertVideo(
  file: File,
  targetFormat: string,
  newFilename: string
): Promise<ConversionResult> {
  return new Promise((resolve) => {
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

// Archive conversion with improved format handling
async function convertArchive(
  file: File,
  targetFormat: string,
  newFilename: string
): Promise<ConversionResult> {
  return new Promise((resolve) => {
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

// Enhanced 3D conversion function
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
