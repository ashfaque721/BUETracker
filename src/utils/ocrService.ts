import { createWorker } from 'tesseract.js';
import { parseBIISText, BIISParseResult } from './biisParser';

/**
 * Preprocesses an image on an offscreen canvas to maximize OCR accuracy:
 * - Upscales low-res screenshots
 * - Applies contrast enhancement & grayscale conversion
 */
export async function preprocessImage(imageSource: File | Blob | string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // Low-resolution screenshots (e.g. 700x279) need 3.5x scale so font height is >= 35px
        const scale = Math.max(3.5, 2200 / img.naturalWidth);
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Fetch image data for high-contrast binarization & watermark/border elimination
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // BIIS red table borders: high red, lower green & blue
          const isRedBorder = r > 70 && (r - g) > 20 && (r - b) > 20;

          // Pure dark text in BIIS table (r, g, b < 115)
          // The "Not Official" watermark is light gray (r, g, b > 130) or hollow
          const isDarkText = r < 115 && g < 115 && b < 115 && !isRedBorder;

          if (isDarkText) {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
          } else {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for OCR processing'));
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      img.src = URL.createObjectURL(imageSource);
    }
  });
}

/**
 * Scans a BIIS screenshot (File, Blob, or base64 data URL) using Tesseract OCR
 * and parses it into BUET course models.
 */
export async function scanBIISScreenshot(
  imageSource: File | Blob | string,
  onProgress?: (percent: number, message: string) => void
): Promise<{ rawText: string; result: BIISParseResult }> {
  try {
    onProgress?.(10, 'Enhancing screenshot clarity & removing watermarks...');
    const preprocessedDataUrl = await preprocessImage(imageSource);

    onProgress?.(25, 'Initializing local OCR engine...');
    const worker = await createWorker('eng', 1, {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          const pct = Math.round(30 + (m.progress || 0) * 60);
          onProgress?.(pct, `Reading grade sheet... ${pct}%`);
        } else if (m.status) {
          onProgress?.(30, `${m.status}...`);
        }
      },
    });

    onProgress?.(45, 'Configuring character detection for BUET tables...');
    await worker.setParameters({
      tessedit_pageseg_mode: '6' as any, // Single uniform block of text
    });

    onProgress?.(60, 'Extracting courses, credits and grades...');
    const ret = await worker.recognize(preprocessedDataUrl);
    await worker.terminate();

    const rawText = ret.data.text || '';
    onProgress?.(95, 'Reconciling BUET Ordinance course codes & GPA...');

    const parseResult = parseBIISText(rawText);
    onProgress?.(100, 'Scan completed!');

    return { rawText, result: parseResult };
  } catch (error: any) {
    console.error('OCR Processing error:', error);
    throw new Error(error.message || 'Failed to scan screenshot');
  }
}

/**
 * Generates an authentic, crisp sample BUET BIIS screenshot on a canvas
 * to enable instant 1-click testing of the OCR scanner.
 */
export function generateSampleBIISScreenshot(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - BIIS portal crisp clean white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top banner styling
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Bangladesh University of Engineering and Technology (BUET)', 480, 42);

  ctx.font = '14px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Academic Result Sheet — Term Final Examination Results', 480, 68);

  // Divider
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(35, 86);
  ctx.lineTo(925, 86);
  ctx.stroke();

  // Table header background
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(35, 102, 890, 36);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(35, 102, 890, 36);

  // Header column text
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Course No', 55, 125);
  ctx.fillText('Course Title', 180, 125);
  ctx.textAlign = 'center';
  ctx.fillText('Credit', 590, 125);
  ctx.fillText('Grade', 700, 125);
  ctx.fillText('Grade Point', 830, 125);

  const sampleRows = [
    { code: 'CHEM 114', title: 'Inorganic Quantitative Analysis Sessional', credit: '1.50', grade: 'A', gp: '3.75' },
    { code: 'CHEM 119', title: 'Chemistry - I', credit: '3.00', grade: 'B+', gp: '3.25' },
    { code: 'HUM 102', title: 'English Language Practice', credit: '1.50', grade: 'A-', gp: '3.50' },
    { code: 'HUM 211', title: 'Sociology', credit: '2.00', grade: 'A+', gp: '4.00' },
    { code: 'IPE 105', title: 'Principles of Cost and Management Accounting', credit: '3.00', grade: 'A', gp: '3.75' },
    { code: 'MATH 191', title: 'Differential and Integral Calculus', credit: '4.00', grade: 'A+', gp: '4.00' },
    { code: 'ME 160', title: 'Mechanical Engineering Drawing - I', credit: '1.50', grade: 'A', gp: '3.75' },
    { code: 'PHY 117', title: 'Structure of Matter, Electricity, Magnetism and Modern Physics', credit: '3.00', grade: 'B-', gp: '2.75' },
    { code: 'SHOP 170', title: 'Machine Shop', credit: '0.75', grade: 'A+', gp: '4.00' },
  ];

  let y = 142;
  sampleRows.forEach((row, i) => {
    if (i % 2 === 1) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(35, y - 5, 890, 32);
    }
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(35, y - 5, 890, 32);

    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
    ctx.fillText(row.code, 55, y + 17);

    ctx.font = '13px "Segoe UI", Arial, sans-serif';
    ctx.fillText(row.title, 180, y + 17);

    ctx.textAlign = 'center';
    ctx.fillText(row.credit, 590, y + 17);

    ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
    ctx.fillText(row.grade, 700, y + 17);

    ctx.font = '13px "Segoe UI", Arial, sans-serif';
    ctx.fillText(row.gp, 830, y + 17);

    y += 32;
  });

  // Footer summary
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('GPA: 3.59', 920, y + 26);

  return canvas.toDataURL('image/png');
}

