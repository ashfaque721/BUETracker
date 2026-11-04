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
        // Ensure minimum width of 1400px for crisp character edges
        const scale = Math.max(1, 1400 / img.naturalWidth);
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource));
          return;
        }

        // Draw image scaled
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Fetch image data for high-contrast binarization / grayscale
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          // Standard luminance formula
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;

          // Gentle contrast stretch: push dark text to darker, bright paper to whiter
          const enhanced = gray > 190 ? 255 : gray < 110 ? 0 : gray;

          data[i] = enhanced;
          data[i + 1] = enhanced;
          data[i + 2] = enhanced;
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
    onProgress?.(10, 'Enhancing screenshot clarity...');
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

    onProgress?.(50, 'Extracting text from grade sheet table...');
    const ret = await worker.recognize(preprocessedDataUrl);
    await worker.terminate();

    const rawText = ret.data.text || '';
    onProgress?.(95, 'Parsing BUET courses, credits & GPA...');

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
    { code: 'MATH 191', title: 'Differential and Integral Calculus', credit: '3.00', grade: 'A+', gp: '4.00' },
    { code: 'PHY 109', title: 'Physics I (Heat, Waves and Optics)', credit: '3.00', grade: 'A', gp: '3.75' },
    { code: 'CHEM 109', title: 'Chemistry I', credit: '3.00', grade: 'A+', gp: '4.00' },
    { code: 'HUM 101', title: 'English and Economics', credit: '3.00', grade: 'A-', gp: '3.50' },
    { code: 'ME 160', title: 'Mechanical Engineering Drawing-I', credit: '1.50', grade: 'A+', gp: '4.00' },
    { code: 'PHY 102', title: 'Physics Sessional', credit: '0.75', grade: 'A+', gp: '4.00' },
    { code: 'CHEM 114', title: 'Inorganic Quantitative Analysis Sessional', credit: '0.75', grade: 'A+', gp: '4.00' },
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
  ctx.fillText('Total Credits Earned: 15.00    |    Term GPA: 3.85', 920, y + 26);

  return canvas.toDataURL('image/png');
}
