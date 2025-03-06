export interface FormatOption {
  id: string;
  label: string;
  description: string;
  category: 'image' | 'document' | 'audio' | 'video' | 'archive' | '3d';
  extensions: string[];
}

// Available conversion formats
export const formats: FormatOption[] = [
  // Image formats
  {
    id: 'png',
    label: 'PNG',
    description: 'Portable Network Graphics',
    category: 'image',
    extensions: ['.png']
  },
  {
    id: 'jpg',
    label: 'JPG',
    description: 'Joint Photographic Experts Group',
    category: 'image',
    extensions: ['.jpg', '.jpeg']
  },
  {
    id: 'webp',
    label: 'WebP',
    description: 'Web Picture format',
    category: 'image',
    extensions: ['.webp']
  },
  {
    id: 'gif',
    label: 'GIF',
    description: 'Graphics Interchange Format',
    category: 'image',
    extensions: ['.gif']
  },
  {
    id: 'svg',
    label: 'SVG',
    description: 'Scalable Vector Graphics',
    category: 'image',
    extensions: ['.svg']
  },
  
  // 3D format
  {
    id: '3d',
    label: '3D Model',
    description: 'Convert image to 3D height map',
    category: '3d',
    extensions: ['.png']
  },
  
  // Document formats
  {
    id: 'pdf',
    label: 'PDF',
    description: 'Portable Document Format',
    category: 'document',
    extensions: ['.pdf']
  },
  {
    id: 'docx',
    label: 'DOCX',
    description: 'Microsoft Word Document',
    category: 'document',
    extensions: ['.docx']
  },
  {
    id: 'txt',
    label: 'TXT',
    description: 'Plain Text',
    category: 'document',
    extensions: ['.txt']
  },
  {
    id: 'csv',
    label: 'CSV',
    description: 'Comma-Separated Values',
    category: 'document',
    extensions: ['.csv']
  },
  {
    id: 'md',
    label: 'MD',
    description: 'Markdown',
    category: 'document',
    extensions: ['.md']
  },
  
  // Audio formats
  {
    id: 'mp3',
    label: 'MP3',
    description: 'MPEG Audio Layer III',
    category: 'audio',
    extensions: ['.mp3']
  },
  {
    id: 'wav',
    label: 'WAV',
    description: 'Waveform Audio File Format',
    category: 'audio',
    extensions: ['.wav']
  },
  {
    id: 'ogg',
    label: 'OGG',
    description: 'Ogg Vorbis Audio',
    category: 'audio',
    extensions: ['.ogg']
  },
  
  // Video formats
  {
    id: 'mp4',
    label: 'MP4',
    description: 'MPEG-4 Video',
    category: 'video',
    extensions: ['.mp4']
  },
  {
    id: 'webm',
    label: 'WebM',
    description: 'Web Video Format',
    category: 'video',
    extensions: ['.webm']
  },
  {
    id: 'avi',
    label: 'AVI',
    description: 'Audio Video Interleave',
    category: 'video',
    extensions: ['.avi']
  },
  
  // Archive formats
  {
    id: 'zip',
    label: 'ZIP',
    description: 'Zip Archive',
    category: 'archive',
    extensions: ['.zip']
  },
  {
    id: 'tar',
    label: 'TAR',
    description: 'Tape Archive',
    category: 'archive',
    extensions: ['.tar']
  }
];

// Get format information by extension
export function getFormatByExtension(extension: string): FormatOption | undefined {
  // Normalize extension with leading dot
  const normalizedExt = extension.startsWith('.') ? extension : `.${extension}`;
  
  return formats.find(format => 
    format.extensions.includes(normalizedExt.toLowerCase())
  );
}

// Get extension from filename
export function getExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 1);
}

// Check if a format conversion is possible
export function isConversionPossible(fromFormat: string, toFormat: string): boolean {
  const sourceFormat = getFormatByExtension(fromFormat);
  const targetFormat = getFormatByExtension(toFormat);
  
  if (!sourceFormat || !targetFormat) return false;
  
  // For this demo, we'll say conversions within the same category are possible
  return sourceFormat.category === targetFormat.category;
}

// Group formats by category
export function groupFormatsByCategory() {
  return formats.reduce((groups, format) => {
    if (!groups[format.category]) {
      groups[format.category] = [];
    }
    groups[format.category].push(format);
    return groups;
  }, {} as Record<string, FormatOption[]>);
}
