import { createWorker } from 'tesseract.js';
import { parseBIISText, BIISParseResult, ParsedBIISCourse } from './biisParser';
import { matchBuetCourse } from './buetCatalog';
import type { CourseType } from '../types';

export interface GridInfo {
  hasGrid: boolean;
  xLines: number[];
  yLines: number[];
  width: number;
  height: number;
}

const GP_TO_GRADE_MAP: Record<number, string> = {
  4.00: 'A+',
  3.75: 'A',
  3.50: 'A-',
  3.25: 'B+',
  3.00: 'B',
  2.75: 'B-',
  2.50: 'C+',
  2.25: 'C',
  2.00: 'D',
  0.00: 'F',
};

function snapGradePoint(val: number): number {
  const gps = [4.00, 3.75, 3.50, 3.25, 3.00, 2.75, 2.50, 2.25, 2.00, 0.00];
  let closest = gps[0];
  let minDiff = Math.abs(val - closest);
  for (const g of gps) {
    const diff = Math.abs(val - g);
    if (diff < minDiff) {
      minDiff = diff;
      closest = g;
    }
  }
  return closest;
}

function snapCredit(val: number): number {
  const std = [0.75, 1.50, 2.00, 3.00, 4.00, 6.00];
  if (isNaN(val) || val <= 0) return 3.0;
  let closest = std[0];
  let minDiff = Math.abs(val - closest);
  for (const c of std) {
    const diff = Math.abs(val - c);
    if (diff < minDiff) {
      minDiff = diff;
      closest = c;
    }
  }
  return closest;
}

/**
 * Loads image into an HTMLImageElement
 */
function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for scanning'));

    if (typeof source === 'string') {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
}

/**
 * Detects table grid lines (red or dark borders) from pixel data
 */
function analyzeGrid(ctx: CanvasRenderingContext2D, width: number, height: number): GridInfo {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const rowDividerCounts = new Array(height).fill(0);
  const colDividerCounts = new Array(width).fill(0);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // BIIS standard red table borders (#c00000 or #990000)
      const isRedBorder = r > 80 && (r - g) > 20 && (r - b) > 20;
      if (isRedBorder) {
        rowDividerCounts[y]++;
        colDividerCounts[x]++;
      }
    }
  }

  // Find candidate horizontal lines (at least 30% of width)
  const candidateY: number[] = [];
  for (let y = 0; y < height; y++) {
    if (rowDividerCounts[y] > width * 0.28) {
      candidateY.push(y);
    }
  }

  // Cluster adjacent lines within 3px
  const yLines: number[] = [];
  for (const y of candidateY) {
    if (yLines.length === 0 || y > yLines[yLines.length - 1] + 3) {
      yLines.push(y);
    }
  }

  // Find candidate vertical lines (at least 30% of height)
  const candidateX: number[] = [];
  for (let x = 0; x < width; x++) {
    if (colDividerCounts[x] > height * 0.28) {
      candidateX.push(x);
    }
  }

  const xLines: number[] = [];
  for (const x of candidateX) {
    if (xLines.length === 0 || x > xLines[xLines.length - 1] + 3) {
      xLines.push(x);
    }
  }

  // We require at least 3 horizontal lines (Header + at least 1 course row + bottom)
  // and at least 4 vertical lines (Course No, Title, Credits, Grade/GP)
  const hasGrid = yLines.length >= 3 && xLines.length >= 4;

  return { hasGrid, xLines, yLines, width, height };
}

/**
 * Slices a region of a canvas, applies 3x high-DPI scaling and watermark removal
 */
function sliceAndBinarizeCanvas(
  sourceCanvas: HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number,
  scale = 3.0
): string {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(10, Math.round(w * scale));
  canvas.height = Math.max(10, Math.round(h * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, x, y, w, h, 0, 0, canvas.width, canvas.height);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const isRedBorder = r > 80 && (r - g) > 20 && (r - b) > 20;
    // Pure dark text in BIIS table (r, g, b < 120), eliminating hollow watermark and light background
    const isDarkText = r < 120 && g < 120 && b < 120 && !isRedBorder;

    const val = isDarkText ? 0 : 255;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Preprocesses whole image for general fallback OCR
 */
export async function preprocessImage(imageSource: File | Blob | string): Promise<string> {
  const img = await loadImage(imageSource);
  const canvas = document.createElement('canvas');
  const scale = Math.max(3.5, 2200 / img.naturalWidth);
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) return typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const isRedBorder = r > 70 && (r - g) > 20 && (r - b) > 20;
    const isDarkText = r < 120 && g < 120 && b < 120 && !isRedBorder;

    const val = isDarkText ? 0 : 255;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Scans a BIIS screenshot using dual-engine approach:
 * 1. High-precision Table Grid Cell Slicing (pixel-perfect row/cell isolation)
 * 2. Adaptive Binarized Full-Table OCR + BUET Ordinance Fuzzy Matcher (Fallback)
 */
export async function scanBIISScreenshot(
  imageSource: File | Blob | string,
  onProgress?: (percent: number, message: string) => void
): Promise<{ rawText: string; result: BIISParseResult }> {
  try {
    onProgress?.(10, 'Loading and analyzing screenshot structure...');
    const img = await loadImage(imageSource);

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not initialize canvas context');
    ctx.drawImage(img, 0, 0);

    // Step 1: Detect Table Grid
    onProgress?.(20, 'Detecting academic table grid boundaries...');
    const grid = analyzeGrid(ctx, canvas.width, canvas.height);

    // Initialize Tesseract Worker
    onProgress?.(30, 'Starting local OCR engine...');
    const worker = await createWorker('eng', 1, {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          const pct = Math.round(35 + (m.progress || 0) * 55);
          onProgress?.(pct, `Reading grade sheet... ${pct}%`);
        }
      },
    });

    let courses: ParsedBIISCourse[] = [];
    let detectedGpa: number | undefined = undefined;
    let fullRawText = '';

    if (grid.hasGrid && grid.xLines.length >= 5) {
      // STRATEGY 1: Pixel-Perfect Grid Cell / Row Slicing
      onProgress?.(40, `Found BIIS table grid (${grid.yLines.length - 2} courses detected)...`);
      await worker.setParameters({ tessedit_pageseg_mode: '7' as any }); // Single line mode

      const xL = grid.xLines;
      const yL = grid.yLines;

      for (let i = 1; i < yL.length - 1; i++) {
        const yTop = yL[i] + 1;
        const yBot = yL[i + 1] - 1;
        const rowH = yBot - yTop;
        if (rowH < 8) continue;

        const pct = Math.round(40 + (i / (yL.length - 2)) * 45);
        onProgress?.(pct, `Reading course row ${i} of ${yL.length - 2}...`);

        // Slice Course No, Title, Credit, Grade, Grade Point
        const codeSlice = sliceAndBinarizeCanvas(canvas, xL[0] + 1, yTop, xL[1] - xL[0] - 2, rowH);
        const titleSlice = sliceAndBinarizeCanvas(canvas, xL[1] + 1, yTop, xL[2] - xL[1] - 2, rowH);
        const creditSlice = sliceAndBinarizeCanvas(canvas, xL[2] + 1, yTop, xL[3] - xL[2] - 2, rowH);
        const gradeSlice = sliceAndBinarizeCanvas(canvas, xL[3] + 1, yTop, xL[4] - xL[3] - 2, rowH);
        const gpSlice = sliceAndBinarizeCanvas(canvas, xL[4] + 1, yTop, (xL[5] || canvas.width) - xL[4] - 2, rowH);

        const [codeRet, titleRet, creditRet, gradeRet, gpRet] = await Promise.all([
          worker.recognize(codeSlice),
          worker.recognize(titleSlice),
          worker.recognize(creditSlice),
          worker.recognize(gradeSlice),
          worker.recognize(gpSlice),
        ]);

        const rawCode = (codeRet.data.text || '').trim();
        const rawTitle = (titleRet.data.text || '').trim();
        const rawCredit = (creditRet.data.text || '').trim();
        const rawGrade = (gradeRet.data.text || '').trim();
        const rawGp = (gpRet.data.text || '').trim().replace(',', '.');

        fullRawText += `${rawCode} | ${rawTitle} | ${rawCredit} | ${rawGrade} | ${rawGp}\n`;

        // Match against BUET Course Catalog
        const match = matchBuetCourse(rawCode, rawTitle);
        const code = match ? match.code : (rawCode.toUpperCase() || `COURSE ${i}`);
        const title = match ? match.title : (rawTitle || `Course ${code}`);
        const credits = match ? match.credits : snapCredit(parseFloat(rawCredit));
        const type: CourseType = match ? match.type : (credits <= 1.5 ? 'sessional' : 'theory');

        // Parse Grade Point & Grade
        const parsedGp = parseFloat(rawGp);
        const gradePoint = !isNaN(parsedGp) ? snapGradePoint(parsedGp) : 4.00;
        const grade = GP_TO_GRADE_MAP[gradePoint] || 'A+';

        courses.push({
          code,
          title,
          credits,
          grade,
          gradePoint,
          type,
        });
      }

      // Check Footer for Sheet GPA (below the last horizontal line)
      if (yL.length > 0) {
        const botY = yL[yL.length - 1] + 1;
        const botH = canvas.height - botY;
        if (botH > 10) {
          const footerSlice = sliceAndBinarizeCanvas(canvas, 0, botY, canvas.width, botH);
          const footerRet = await worker.recognize(footerSlice);
          fullRawText += `\nFooter: ${footerRet.data.text}\n`;
          const gpaMatch = footerRet.data.text.match(/GPA[:\s]+([0-4]\.\d{2})/i);
          if (gpaMatch) {
            detectedGpa = parseFloat(gpaMatch[1]);
          }
        }
      }
    }

    // STRATEGY 2: Fallback to Full Table OCR if grid detection was not applicable
    if (courses.length === 0) {
      onProgress?.(50, 'Using adaptive full-sheet recognition...');
      const preprocessed = await preprocessImage(imageSource);
      await worker.setParameters({ tessedit_pageseg_mode: '6' as any });
      const ret = await worker.recognize(preprocessed);
      fullRawText = ret.data.text || '';
      const fallbackResult = parseBIISText(fullRawText);
      courses = fallbackResult.courses;
      detectedGpa = fallbackResult.termGpa;
    }

    await worker.terminate();
    onProgress?.(95, 'Finalizing course calculation...');

    let totalCredits = 0;
    let totalPoints = 0;
    courses.forEach((c) => {
      totalCredits += c.credits;
      totalPoints += c.credits * c.gradePoint;
    });

    const calculatedGpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : undefined;
    const finalGpa = detectedGpa ?? calculatedGpa;

    const parseResult: BIISParseResult = {
      success: courses.length > 0,
      courses,
      termGpa: finalGpa,
      totalCredits: Number(totalCredits.toFixed(2)),
      rawCount: courses.length,
      errors: [],
    };

    onProgress?.(100, `Done! Extracted ${courses.length} courses with GPA ${finalGpa || '0.00'}`);
    return { rawText: fullRawText, result: parseResult };
  } catch (err: any) {
    console.error('Scan error:', err);
    throw new Error(err.message || 'Failed to scan screenshot');
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

  // Red table border styling (exact BIIS styling)
  ctx.strokeStyle = '#c00000';
  ctx.lineWidth = 1;

  // Header column text
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
  ctx.strokeRect(35, 102, 890, 32);
  ctx.textAlign = 'left';
  ctx.fillText('Course No', 50, 123);
  ctx.fillText('Course Title', 180, 123);
  ctx.textAlign = 'center';
  ctx.fillText('Credit Hours', 600, 123);
  ctx.fillText('Grade', 730, 123);
  ctx.fillText('Grade Point', 850, 123);

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

  let y = 134;
  sampleRows.forEach((row) => {
    ctx.strokeStyle = '#c00000';
    ctx.strokeRect(35, y, 890, 30);

    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.fillText(row.code, 50, y + 20);

    ctx.font = '12px "Segoe UI", Arial, sans-serif';
    ctx.fillText(row.title, 180, y + 20);

    ctx.textAlign = 'center';
    ctx.fillText(row.credit, 600, y + 20);

    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.fillText(row.grade, 730, y + 20);

    ctx.font = '12px "Segoe UI", Arial, sans-serif';
    ctx.fillText(row.gp, 850, y + 20);

    y += 30;
  });

  // Footer summary
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('GPA: 3.59', 925, y + 26);

  return canvas.toDataURL('image/png');
}
