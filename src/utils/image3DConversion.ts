
import * as THREE from 'three';

interface Image3DResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Convert an image to a simple 3D model (height map)
export async function convertImageTo3D(imageFile: File): Promise<Image3DResult> {
  try {
    // Load the image
    const imageUrl = URL.createObjectURL(imageFile);
    const image = await loadImage(imageUrl);
    
    // Create a height map from the image
    const { canvas, heightData } = await createHeightMap(image);
    
    // Create a simple 3D model (a plane with displacement)
    const modelUrl = await create3DModel(heightData, canvas.width, canvas.height);
    
    // Clean up
    URL.revokeObjectURL(imageUrl);
    
    return {
      success: true,
      url: modelUrl
    };
  } catch (error) {
    console.error('Error converting image to 3D:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Load an image from a URL
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

// Create a height map from an image
async function createHeightMap(image: HTMLImageElement): Promise<{canvas: HTMLCanvasElement, heightData: Float32Array}> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // Resize to a reasonable size for 3D conversion
  const maxSize = 256;
  let width = image.width;
  let height = image.height;
  
  if (width > height) {
    if (width > maxSize) {
      height = Math.floor(height * (maxSize / width));
      width = maxSize;
    }
  } else {
    if (height > maxSize) {
      width = Math.floor(width * (maxSize / height));
      height = maxSize;
    }
  }
  
  canvas.width = width;
  canvas.height = height;
  
  // Draw the image to the canvas
  ctx.drawImage(image, 0, 0, width, height);
  
  // Get the image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Create height data from the image brightness
  const heightData = new Float32Array(width * height);
  
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    
    // Calculate brightness (0 to 1)
    const brightness = (r + g + b) / (3 * 255);
    heightData[i] = brightness;
  }
  
  return { canvas, heightData };
}

// Create a 3D model from height data
async function create3DModel(heightData: Float32Array, width: number, height: number): Promise<string> {
  // Create a scene
  const scene = new THREE.Scene();
  
  // Create a camera
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 0, 0);
  
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  
  // Create a geometry
  const geometry = new THREE.PlaneGeometry(10, 10, width - 1, height - 1);
  
  // Apply height data to the geometry
  const vertices = geometry.attributes.position.array;
  for (let i = 0; i < heightData.length; i++) {
    // Set the y (height) component of each vertex
    // @ts-ignore - accessing geometry data directly
    vertices[i * 3 + 1] = heightData[i] * 2;
  }
  
  // Update the geometry
  geometry.computeVertexNormals();
  
  // Create a material
  const material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    wireframe: false,
    side: THREE.DoubleSide,
  });
  
  // Create a mesh
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  scene.add(mesh);
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
  
  // Render the scene
  renderer.render(scene, camera);
  
  // Get the data URL
  const dataUrl = renderer.domElement.toDataURL('image/png');
  
  return dataUrl;
}
