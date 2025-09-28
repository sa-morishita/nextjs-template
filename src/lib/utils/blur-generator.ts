const TARGET_SIZE = 8;
const JPEG_QUALITY = 0.3;
const BLUR_FILTER = 'blur(1px)';

export const generateClientBlurDataURL = async (
  file: File,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      try {
        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;

        ctx.filter = BLUR_FILTER;
        ctx.drawImage(img, 0, 0, TARGET_SIZE, TARGET_SIZE);

        const blurDataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

        URL.revokeObjectURL(img.src);

        resolve(blurDataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
};
