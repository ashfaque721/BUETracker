import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Plus,
  BookOpen,
  ChevronDown,
} from 'lucide-react';
import { ParsedBIISCourse } from '../utils/biisParser';
import { scanBIISScreenshot, generateSampleBIISScreenshot } from '../utils/ocrService';
import { SEMESTER_PRESETS } from '../utils/buetCatalog';
import { BUET_GRADE_SCALE } from '../types';

interface BIISScreenshotScannerProps {
  onConfirmCourses: (
    courses: ParsedBIISCourse[],
    summary: { termGpa?: number; totalCredits?: number }
  ) => void;
  onAutoSubmit?: () => void;
  targetSemesterLabel?: string;
}

export const BIISScreenshotScanner: React.FC<BIISScreenshotScannerProps> = ({
  onConfirmCourses,
  onAutoSubmit,
  targetSemesterLabel,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('Ready');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedCourses, setDetectedCourses] = useState<ParsedBIISCourse[]>([]);
  const [totalCredits, setTotalCredits] = useState<number>(0);
  const [termGpa, setTermGpa] = useState<number | undefined>(undefined);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  // Recalculate GPA & Credits whenever detectedCourses change
  const recalculateSummary = useCallback((courseList: ParsedBIISCourse[]) => {
    let totCredits = 0;
    let totPoints = 0;
    courseList.forEach((c) => {
      totCredits += c.credits;
      totPoints += c.credits * c.gradePoint;
    });
    setTotalCredits(Number(totCredits.toFixed(2)));
    setTermGpa(totCredits > 0 ? Number((totPoints / totCredits).toFixed(2)) : undefined);
  }, []);

  // Run OCR on an image (dataURL, Blob, or File)
  const processImageForOCR = async (imageSrc: File | Blob | string) => {
    try {
      setIsScanning(true);
      setErrorMessage(null);
      setScanProgress(5);
      setScanStatusText('Preparing image for high-precision scan...');

      if (typeof imageSrc !== 'string') {
        const previewUrl = URL.createObjectURL(imageSrc);
        setImagePreview(previewUrl);
      } else {
        setImagePreview(imageSrc);
      }

      const { result } = await scanBIISScreenshot(imageSrc, (pct, msg) => {
        setScanProgress(pct);
        setScanStatusText(msg);
      });

      if (!result.success || result.courses.length === 0) {
        setErrorMessage(
          'Could not detect courses clearly in this screenshot. Please ensure the BIIS table is visible, or select a standard semester preset template.'
        );
        setIsScanning(false);
        return;
      }

      setDetectedCourses(result.courses);
      if (result.termGpa !== undefined) {
        setTermGpa(result.termGpa);
      }
      if (result.totalCredits !== undefined) {
        setTotalCredits(result.totalCredits);
      }
      recalculateSummary(result.courses);

      // Auto-notify parent with detected courses
      onConfirmCourses(result.courses, {
        termGpa: result.termGpa,
        totalCredits: result.totalCredits,
      });

      setIsScanning(false);
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMessage(err.message || 'Failed to scan image. Please try again.');
      setIsScanning(false);
    }
  };

  // Handle Preset Template Selection
  const handleSelectPreset = (presetId: string) => {
    const preset = SEMESTER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const courses: ParsedBIISCourse[] = preset.courses.map((c) => ({
      code: c.code,
      title: c.title,
      credits: c.credits,
      grade: 'A+',
      gradePoint: 4.0,
      type: c.type,
    }));

    setDetectedCourses(courses);
    setImagePreview(null);
    setShowPresetDropdown(false);
    recalculateSummary(courses);

    onConfirmCourses(courses, {
      termGpa: 4.0,
      totalCredits: Number(preset.courses.reduce((acc, c) => acc + c.credits, 0).toFixed(2)),
    });
  };

  // Handle Clipboard Paste (Ctrl+V)
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          processImageForOCR(file);
          return;
        }
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0].type.startsWith('image/')) {
      processImageForOCR(files[0]);
    }
  };

  // Handle File Input Selection
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processImageForOCR(files[0]);
    }
  };

  // Handle Sample Screenshot Demo
  const handleLoadSample = () => {
    const sampleDataUrl = generateSampleBIISScreenshot();
    processImageForOCR(sampleDataUrl);
  };

  // Row update handlers
  const handleUpdateCourseField = (
    index: number,
    field: keyof ParsedBIISCourse,
    value: any
  ) => {
    setDetectedCourses((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      // If grade changed, sync gradePoint
      if (field === 'grade') {
        const scale = BUET_GRADE_SCALE.find((s) => s.grade === value);
        if (scale) {
          target.gradePoint = scale.gradePoint;
        }
      }

      // If gradePoint changed, sync grade
      if (field === 'gradePoint') {
        const val = parseFloat(value);
        if (!isNaN(val)) {
          target.gradePoint = val;
          const match = BUET_GRADE_SCALE.find((s) => Math.abs(s.gradePoint - val) < 0.05);
          if (match) {
            target.grade = match.grade;
          }
        }
      }

      // If credits changed, ensure number
      if (field === 'credits') {
        target.credits = Number(value) || 0;
      }

      updated[index] = target;
      recalculateSummary(updated);
      onConfirmCourses(updated, { termGpa, totalCredits });
      return updated;
    });
  };

  const handleDeleteCourse = (index: number) => {
    setDetectedCourses((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      recalculateSummary(updated);
      onConfirmCourses(updated, { termGpa, totalCredits });
      return updated;
    });
  };

  const handleAddNewRow = () => {
    const newCourse: ParsedBIISCourse = {
      code: 'NEW 101',
      title: 'New Course',
      credits: 3.0,
      grade: 'A+',
      gradePoint: 4.0,
      type: 'theory',
    };
    setDetectedCourses((prev) => {
      const updated = [...prev, newCourse];
      recalculateSummary(updated);
      onConfirmCourses(updated, { termGpa, totalCredits });
      return updated;
    });
  };

  const handleConfirm = () => {
    if (detectedCourses.length === 0) return;
    onConfirmCourses(detectedCourses, { termGpa, totalCredits });
    if (onAutoSubmit) {
      onAutoSubmit();
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setDetectedCourses([]);
    setErrorMessage(null);
    setScanProgress(0);
  };

  return (
    <div className="space-y-4">
      {/* INITIAL / DROPZONE STATE (No Image & No Detected Courses) */}
      {!imagePreview && detectedCourses.length === 0 && (
        <div
          ref={dropzoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all duration-200 ${
            isDragOver
              ? 'border-emerald-500 bg-emerald-950/20 scale-[1.01]'
              : 'border-white/15 bg-zinc-900/60 hover:border-emerald-500/50 hover:bg-zinc-900'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="image/*"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center text-emerald-400 shadow-md">
              <Camera className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Paste Screenshot or Drop Image
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
                Take a snippet of your BIIS table with <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/10 font-mono text-[10px] text-zinc-300">Win + Shift + S</kbd>, then press{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/10 font-mono text-[10px] text-emerald-300 font-bold">Ctrl + V</kbd>!
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-white/10 transition btn-tactile"
              >
                <UploadCloud className="w-4 h-4 text-emerald-400" />
                <span>Browse Screenshot</span>
              </button>

              <button
                type="button"
                onClick={handleLoadSample}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 text-xs font-semibold border border-emerald-800/60 transition btn-tactile"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Try Sample BIIS Sheet</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 text-xs font-semibold border border-blue-800/60 transition btn-tactile"
                >
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>Select Semester Preset</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>

                {showPresetDropdown && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-2 z-20 space-y-1 text-left animate-modal-in">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 px-2 py-1 block">
                      Common BUET Curricula (1-Click)
                    </span>
                    {SEMESTER_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.id)}
                        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-zinc-800 text-zinc-200 text-xs font-medium text-left flex items-center justify-between transition"
                      >
                        <span>{preset.name}</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          {preset.courses.length} crs
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCANNING IN PROGRESS STATE */}
      {isScanning && (
        <div className="p-6 rounded-3xl bg-zinc-900 border border-emerald-500/30 space-y-4 animate-fade-in text-center">
          <div className="relative max-h-48 overflow-hidden rounded-2xl border border-white/10 bg-black/40 mx-auto max-w-md">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Scanning Screenshot"
                className="w-full object-cover opacity-60 filter grayscale"
              />
            )}
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-pulse top-1/2 -translate-y-1/2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-xs">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Scanning with Pixel Table Isolation & OCR...</span>
            </div>

            <p className="text-xs text-zinc-400">{scanStatusText}</p>

            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-white/10 max-w-md mx-auto">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300 shadow-[0_0_8px_#10b981]"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ERROR NOTICE */}
      {errorMessage && !isScanning && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <span className="font-semibold block">Scan Notice</span>
            <p className="text-red-300/90 leading-relaxed">{errorMessage}</p>
            <div className="pt-1 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1 rounded-lg bg-red-900/60 hover:bg-red-900 text-white font-medium text-[11px] transition"
              >
                Choose Another Image
              </button>
              <button
                type="button"
                onClick={handleLoadSample}
                className="px-3 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-medium text-[11px] transition border border-emerald-800"
              >
                Use Crisp Sample Sheet
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('ipe_1_1')}
                className="px-3 py-1 rounded-lg bg-blue-950 hover:bg-blue-900 text-blue-300 font-medium text-[11px] transition border border-blue-800"
              >
                Load Standard 1-1 Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXTRACTED COURSES REVIEW & CONFIRM STATE */}
      {!isScanning && detectedCourses.length > 0 && (
        <div className="space-y-4 animate-modal-in">
          {/* Header Summary Card */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-100 block">
                  Extracted {detectedCourses.length} Courses Successfully
                </span>
                <span className="text-[11px] text-zinc-400">
                  Target: {targetSemesterLabel || 'Previous Semester'} • You can adjust grades/credits below
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono tabular-nums">
              <div className="px-3 py-1 rounded-xl bg-zinc-800 border border-white/10 text-xs">
                <span className="text-zinc-400 text-[10px] block uppercase">Credits</span>
                <span className="text-zinc-100 font-bold">{totalCredits.toFixed(2)}</span>
              </div>
              <div className="px-3 py-1 rounded-xl bg-emerald-950 border border-emerald-800/80 text-xs">
                <span className="text-emerald-400 text-[10px] block uppercase">Term GPA</span>
                <span className="text-emerald-300 font-bold">{(termGpa || 0).toFixed(2)}</span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-white/10 transition btn-tactile"
                title="Rescan another screenshot or choose another template"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Editable Courses Table */}
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-zinc-900/80">
            <div className="max-h-64 overflow-y-auto divide-y divide-white/[0.06]">
              {detectedCourses.map((c, idx) => (
                <div
                  key={idx}
                  className="p-3 sm:px-4 flex items-center justify-between gap-3 text-xs hover:bg-zinc-800/50 transition"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <input
                      type="text"
                      value={c.code}
                      onChange={(e) => handleUpdateCourseField(idx, 'code', e.target.value.toUpperCase())}
                      className="w-24 px-2 py-1 rounded-lg bg-zinc-800 border border-white/10 text-zinc-100 font-mono font-bold text-xs focus:outline-none focus:border-emerald-500 uppercase"
                    />

                    <input
                      type="text"
                      value={c.title}
                      onChange={(e) => handleUpdateCourseField(idx, 'title', e.target.value)}
                      className="flex-1 px-2 py-1 rounded-lg bg-zinc-800 border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500 truncate"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-zinc-500 font-mono">Cr</span>
                      <input
                        type="number"
                        step="0.25"
                        min="0.5"
                        max="6"
                        value={c.credits}
                        onChange={(e) => handleUpdateCourseField(idx, 'credits', e.target.value)}
                        className="w-14 px-1.5 py-1 rounded-lg bg-zinc-800 border border-white/10 text-zinc-100 font-mono text-center text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <select
                      value={c.grade}
                      onChange={(e) => handleUpdateCourseField(idx, 'grade', e.target.value)}
                      className="px-2 py-1 rounded-lg bg-zinc-800 border border-white/10 text-zinc-100 font-bold text-xs focus:outline-none focus:border-emerald-500"
                    >
                      {BUET_GRADE_SCALE.map((g) => (
                        <option key={g.grade} value={g.grade}>
                          {g.grade} ({g.gradePoint.toFixed(2)})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateCourseField(
                          idx,
                          'type',
                          c.type === 'theory' ? 'sessional' : 'theory'
                        )
                      }
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        c.type === 'sessional'
                          ? 'bg-amber-950 text-amber-400 border-amber-800'
                          : 'bg-blue-950 text-blue-400 border-blue-800'
                      }`}
                      title="Click to toggle Theory / Sessional"
                    >
                      {c.type === 'sessional' ? 'Lab' : 'Th'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteCourse(idx)}
                      className="p-1 rounded-lg hover:bg-red-950/60 text-zinc-400 hover:text-red-400 transition"
                      title="Remove row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Table Footer Actions */}
            <div className="p-3 bg-zinc-950/60 border-t border-white/[0.06] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleAddNewRow}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 font-medium btn-tactile text-[11px]"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Add Missing Course</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition btn-tactile"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Import ({detectedCourses.length} Courses)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
