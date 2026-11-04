import React, { useState, useRef } from 'react';
import {
  BUET_DAYS,
  BUET_PERIODS,
  Course,
  DayOfWeek,
  RoutineMetadata,
  RoutineSlot,
} from '../types';
import {
  Download,
  Printer,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  Clock,
  Layers,
  MapPin,
  User,
  BookOpen,
  RotateCcw,
  Check,
  Eye,
  LayoutGrid,
  ChevronDown,
  FileText,
  Coffee,
  HelpCircle,
  PlusCircle,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { SEED_ROUTINE } from '../db';

interface RoutineDesignerProps {
  routine: RoutineMetadata;
  courses: Course[];
  onUpdateRoutine: (updated: RoutineMetadata) => void;
  onLoadSampleRoutine?: () => void;
  onStartBlank?: () => void;
}

export const RoutineDesigner: React.FC<RoutineDesignerProps> = ({
  routine,
  courses,
  onUpdateRoutine,
  onLoadSampleRoutine,
  onStartBlank,
}) => {
  const exportCanvasRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'studio' | 'document'>('studio');

  const [selectedSlot, setSelectedSlot] = useState<{
    day: DayOfWeek;
    periodId: number;
    existingSlot?: RoutineSlot;
  } | null>(null);

  // Edit Modal State
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [customCode, setCustomCode] = useState<string>('');
  const [customNickname, setCustomNickname] = useState<string>('');
  const [customTeacher, setCustomTeacher] = useState<string>('');
  const [customRoom, setCustomRoom] = useState<string>('');
  const [customColor, setCustomColor] = useState<string>('#991b1b');
  const [span, setSpan] = useState<number>(1);

  // Quick Add Course Form in Slot Modal
  const [showQuickAddCourse, setShowQuickAddCourse] = useState(false);

  // Header editing
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [tempTitle, setTempTitle] = useState(routine.title);
  const [tempSubTitle, setTempSubTitle] = useState(routine.subTitle);
  const [tempEffectiveDate, setTempEffectiveDate] = useState(routine.effectiveDate);

  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const TEACHER_SUGGESTIONS = ['SA Ma\'am', 'Kayes Sir', 'NA', 'Dr. Farhana', 'Prof. Tariq'];
  const ROOM_SUGGESTIONS = ['Room 317', 'Machine Tools Lab', 'SM Lab', 'CAD Lab', 'IPE Dept'];

  const PRESET_COLORS = [
    { name: 'BUET Crimson', hex: '#991b1b' },
    { name: 'Blue', hex: '#2563eb' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Violet', hex: '#7c3aed' },
    { name: 'Rose', hex: '#f43f5e' },
  ];

  const handleCellClick = (day: DayOfWeek, periodId: number) => {
    const existingSlot = routine.slots.find(
      (s) => s.day === day && s.periodId === periodId
    );

    setSelectedSlot({ day, periodId, existingSlot });
    setShowQuickAddCourse(false);

    if (existingSlot) {
      setSelectedCourseId(existingSlot.courseId || '');
      setCustomCode(existingSlot.customCode || '');
      setCustomNickname(existingSlot.customNickname || '');
      setCustomTeacher(existingSlot.customTeacher || '');
      setCustomRoom(existingSlot.customRoom || '');
      setCustomColor(existingSlot.customColor || '#991b1b');
      setSpan(existingSlot.span || 1);
    } else {
      setSelectedCourseId('');
      setCustomCode('');
      setCustomNickname('');
      setCustomTeacher('');
      setCustomRoom('');
      setCustomColor('#991b1b');
      setSpan(1);
    }
  };

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
    if (!courseId) return;

    const course = courses.find((c) => c.id === courseId);
    if (course) {
      setCustomCode(course.code);
      setCustomNickname(course.nickname ? `(${course.nickname})` : `(${course.title})`);
      setCustomTeacher(course.teacher || '');
      setCustomRoom(course.room || '');
      setCustomColor(course.color || '#991b1b');
    }
  };

  const handleSaveSlot = () => {
    if (!selectedSlot) return;

    const { day, periodId, existingSlot } = selectedSlot;
    if (!customCode.trim()) {
      handleDeleteSlot();
      return;
    }

    const newSlot: RoutineSlot = {
      id: existingSlot ? existingSlot.id : `slot_${day}_${periodId}_${Date.now()}`,
      day,
      periodId,
      span: Math.max(1, Math.min(3, span)),
      courseId: selectedCourseId || undefined,
      customCode: customCode.trim(),
      customNickname: customNickname.trim().startsWith('(')
        ? customNickname.trim()
        : customNickname.trim()
        ? `(${customNickname.trim()})`
        : '',
      customTeacher: customTeacher.trim(),
      customRoom: customRoom.trim(),
      customColor,
    };

    const periodsCovered = new Set<number>();
    for (let i = 0; i < newSlot.span; i++) {
      periodsCovered.add(periodId + i);
    }

    const filteredSlots = routine.slots.filter((s) => {
      if (s.day !== day) return true;
      if (s.id === existingSlot?.id) return false;
      for (let i = 0; i < s.span; i++) {
        if (periodsCovered.has(s.periodId + i)) {
          return false;
        }
      }
      return true;
    });

    onUpdateRoutine({
      ...routine,
      slots: [...filteredSlots, newSlot],
    });

    setSelectedSlot(null);
  };

  const handleDeleteSlot = () => {
    if (!selectedSlot || !selectedSlot.existingSlot) {
      setSelectedSlot(null);
      return;
    }

    onUpdateRoutine({
      ...routine,
      slots: routine.slots.filter((s) => s.id !== selectedSlot.existingSlot!.id),
    });
    setSelectedSlot(null);
  };

  const handleSaveHeader = () => {
    onUpdateRoutine({
      ...routine,
      title: tempTitle,
      subTitle: tempSubTitle,
      effectiveDate: tempEffectiveDate,
    });
    setIsEditingHeader(false);
  };

  const handleExportPNG = async () => {
    if (!exportCanvasRef.current) return;
    try {
      setIsExporting(true);
      setExportNotice('Rendering Crisp 2.5× DPI PNG...');

      const dataUrl = await toPng(exportCanvasRef.current, {
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `${routine.title.replace(/[\s\W]+/g, '_')}_BUET_Routine.png`;
      link.href = dataUrl;
      link.click();

      setExportNotice('PNG Downloaded (2.5× DPI High-Res)');
      setTimeout(() => setExportNotice(null), 3000);
    } catch (err) {
      console.error('Export PNG failed:', err);
      setExportNotice('Failed to export PNG');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!exportCanvasRef.current) return;
    try {
      setIsExporting(true);
      setExportNotice('Generating A4 Landscape Vector PDF...');

      const dataUrl = await toPng(exportCanvasRef.current, {
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const printWidth = pageWidth - margin * 2;
      const imgProps = pdf.getImageProperties(dataUrl);
      const printHeight = (imgProps.height * printWidth) / imgProps.width;
      const yOffset = printHeight < pageHeight ? (pageHeight - printHeight) / 2 : margin;

      pdf.addImage(dataUrl, 'PNG', margin, yOffset, printWidth, Math.min(printHeight, pageHeight - margin * 2));
      pdf.save(`${routine.title.replace(/[\s\W]+/g, '_')}_BUET_Routine.pdf`);

      setExportNotice('PDF Exported (A4 Landscape)');
      setTimeout(() => setExportNotice(null), 3000);
    } catch (err) {
      console.error('Export PDF failed:', err);
      setExportNotice('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const getSlotCovering = (day: DayOfWeek, periodId: number) => {
    return routine.slots.find((s) => {
      if (s.day !== day) return false;
      return periodId >= s.periodId && periodId < s.periodId + s.span;
    });
  };

  return (
    <div className="space-y-4">
      {/* Sleek Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 surface-card no-print">
        {/* Left: Routine Metadata Title with Inline Edit */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-semibold tracking-tight text-zinc-100">
              {routine.title}
            </h2>
            <span className="text-xs text-zinc-400 font-medium hidden md:inline">
              • {routine.effectiveDate}
            </span>
          </div>

          <button
            onClick={() => setIsEditingHeader(true)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition btn-tactile"
            title="Edit Timetable Title & Date"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Quick Actions (Presets, View Switcher, Exports) */}
        <div className="flex items-center gap-2.5">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (onLoadSampleRoutine) {
                  onLoadSampleRoutine();
                } else {
                  onUpdateRoutine(SEED_ROUTINE);
                }
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 border border-white/[0.08] transition btn-tactile"
              title="Reset timetable to official Section A preset"
            >
              Load Sec A
            </button>
            <button
              onClick={() => {
                if (window.confirm('Clear all timetable class slots?')) {
                  onUpdateRoutine({ ...routine, slots: [] });
                }
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 border border-transparent hover:border-white/[0.08] transition btn-tactile"
              title="Clear all classes"
            >
              Clear
            </button>
          </div>

          <div className="h-4 w-[1px] bg-white/[0.08]" />

          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs">
            <button
              onClick={() => setViewMode('studio')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition btn-tactile ${
                viewMode === 'studio'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-400" />
              <span>Studio Grid</span>
            </button>
            <button
              onClick={() => setViewMode('document')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition btn-tactile ${
                viewMode === 'document'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-red-400" />
              <span>Print Preview</span>
            </button>
          </div>

          <div className="h-4 w-[1px] bg-white/[0.08]" />

          {/* Export PNG */}
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold border border-white/10 transition btn-tactile disabled:opacity-50"
            title="Download PNG (2.5× DPI High Resolution)"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export PNG</span>
          </button>

          {/* Print / Export PDF */}
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold border border-white/10 transition btn-tactile disabled:opacity-50"
            title="Generate A4 Landscape Vector PDF"
          >
            <FileText className="w-3.5 h-3.5 text-red-400" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition btn-tactile"
            title="System Print Routine (Ctrl+P)"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-zinc-900 border border-blue-500/30 rounded-xl text-xs text-blue-300 flex items-center gap-2.5 animate-fade-in no-print shadow-md">
          <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
          <span className="font-medium">{exportNotice}</span>
        </div>
      )}

      {/* VIEW 1: STUDIO GRID (Dark Zinc 900 / 800) */}
      {viewMode === 'studio' && (
        <div className="surface-card p-4 sm:p-5 overflow-x-auto">
          {/* Subtitle Bar */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-white/[0.08] text-[10px] font-mono tabular-nums font-semibold uppercase tracking-wider">
                BUET Saturday – Wednesday Timetable
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                {routine.subTitle}
              </span>
            </div>
            <div className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
              <span>Click empty slot to add • Click class card to edit</span>
            </div>
          </div>

          <table className="w-full border-collapse text-xs text-center table-fixed min-w-[1020px]">
            <thead>
              <tr className="border-b border-white/[0.08] text-zinc-400">
                <th className="w-24 p-3 text-left font-semibold text-xs tracking-tight text-zinc-300">
                  Day
                </th>
                {BUET_PERIODS.filter((p) => p.id >= 1 && p.id <= 6).map((period) => (
                  <th key={period.id} className="p-2 border-l border-white/[0.08]">
                    <div className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-zinc-800 text-[11px] font-semibold text-zinc-200">
                      {period.name}
                    </div>
                    <div className="text-[10px] font-mono tabular-nums text-zinc-400 mt-1">{period.timeRange}</div>
                  </th>
                ))}
                <th className="w-14 p-1 border-l border-white/[0.08] text-amber-400 font-semibold text-[10px] uppercase tracking-wider">
                  <div className="flex flex-col items-center gap-0.5">
                    <Coffee className="w-3.5 h-3.5 text-amber-400" />
                    <span>Break</span>
                  </div>
                </th>
                <th className="w-40 p-2 border-l border-white/[0.08]">
                  <div className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-800/80 text-[11px] font-semibold text-purple-300">
                    Period 7 (Lab)
                  </div>
                  <div className="text-[10px] font-mono tabular-nums text-zinc-400 mt-1">2:30 – 5:00 PM</div>
                </th>
              </tr>
            </thead>

            <tbody>
              {BUET_DAYS.map((day, dayIndex) => {
                let skipPeriods = 0;
                return (
                  <tr key={day} className="border-b border-white/[0.08] hover:bg-zinc-800/30 transition-colors">
                    {/* Day Column */}
                    <td className="p-3 text-left font-semibold text-zinc-200 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                        <span>{day}</span>
                      </div>
                    </td>

                    {/* Periods 1 to 6 */}
                    {[1, 2, 3, 4, 5, 6].map((periodId) => {
                      if (skipPeriods > 0) {
                        skipPeriods--;
                        return null;
                      }

                      const coveringSlot = getSlotCovering(day, periodId);

                      if (coveringSlot && coveringSlot.periodId === periodId) {
                        const spanCount = Math.min(coveringSlot.span, 7 - periodId);
                        if (spanCount > 1) {
                          skipPeriods = spanCount - 1;
                        }

                        return (
                          <td
                            key={periodId}
                            colSpan={spanCount}
                            onClick={() => handleCellClick(day, periodId)}
                            className="p-1.5 border-l border-white/[0.08] align-middle cursor-pointer"
                          >
                            <div
                              className="p-2.5 rounded-xl border transition group hover:scale-[1.01] shadow-xs text-left"
                              style={{
                                backgroundColor: `${coveringSlot.customColor || '#991b1b'}1a`,
                                borderColor: `${coveringSlot.customColor || '#991b1b'}60`,
                              }}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className="font-mono tabular-nums font-bold text-xs tracking-tight"
                                  style={{ color: coveringSlot.customColor || '#f87171' }}
                                >
                                  {coveringSlot.customCode}
                                </span>
                                {spanCount > 1 && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 font-mono tabular-nums text-zinc-300 border border-white/10">
                                    {spanCount}P Block
                                  </span>
                                )}
                              </div>

                              {coveringSlot.customNickname && (
                                <div className="text-xs text-zinc-200 font-medium truncate mt-0.5">
                                  {coveringSlot.customNickname}
                                </div>
                              )}

                              <div className="flex items-center justify-between gap-1 mt-1.5 text-[10px] text-zinc-400">
                                {coveringSlot.customTeacher ? (
                                  <span className="truncate italic text-zinc-400">{coveringSlot.customTeacher}</span>
                                ) : (
                                  <span />
                                )}
                                {coveringSlot.customRoom && (
                                  <span className="font-mono tabular-nums text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded text-[9px] shrink-0 border border-white/10">
                                    {coveringSlot.customRoom}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      }

                      {/* Foolproof Beginner-Friendly Empty Slot */}
                      return (
                        <td
                          key={periodId}
                          onClick={() => handleCellClick(day, periodId)}
                          className="p-1.5 border-l border-white/[0.08] align-middle cursor-pointer hover:bg-zinc-800/40 transition-colors group"
                        >
                          <div className="h-16 rounded-xl border border-dashed border-white/[0.1] group-hover:border-emerald-500/50 flex flex-col items-center justify-center gap-1 transition">
                            <Plus className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 transition" />
                            <span className="text-[9px] text-zinc-600 group-hover:text-emerald-400 font-medium transition">
                              + Add
                            </span>
                          </div>
                        </td>
                      );
                    })}

                    {/* Fixed Recess Break Column (1:30 - 2:30) */}
                    {dayIndex === 0 && (
                      <td
                        rowSpan={5}
                        className="w-14 border-l border-white/[0.08] recess-pattern text-center align-middle"
                      >
                        <div className="[writing-mode:vertical-rl] rotate-180 text-[10px] uppercase font-bold tracking-widest text-amber-400/90 mx-auto py-6">
                          Prayer & Lunch Break
                        </div>
                      </td>
                    )}

                    {/* Period 7 (Lab) Slot */}
                    {(() => {
                      const labSlot = routine.slots.find((s) => s.day === day && s.periodId === 7);
                      if (labSlot) {
                        return (
                          <td
                            key={7}
                            onClick={() => handleCellClick(day, 7)}
                            className="p-1.5 border-l border-white/[0.08] align-middle cursor-pointer"
                          >
                            <div
                              className="p-2.5 rounded-xl border transition group hover:scale-[1.01] shadow-xs text-left"
                              style={{
                                backgroundColor: `${labSlot.customColor || '#7c3aed'}1a`,
                                borderColor: `${labSlot.customColor || '#7c3aed'}60`,
                              }}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className="font-mono tabular-nums font-bold text-xs tracking-tight"
                                  style={{ color: labSlot.customColor || '#c084fc' }}
                                >
                                  {labSlot.customCode}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 font-bold uppercase tracking-wider border border-purple-800">
                                  Lab
                                </span>
                              </div>

                              {labSlot.customNickname && (
                                <div className="text-xs text-zinc-200 font-medium truncate mt-0.5">
                                  {labSlot.customNickname}
                                </div>
                              )}

                              <div className="flex items-center justify-between gap-1 mt-1.5 text-[10px] text-zinc-400">
                                <span className="truncate italic">{labSlot.customTeacher || 'Lab Sessional'}</span>
                                {labSlot.customRoom && (
                                  <span className="font-mono tabular-nums text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded text-[9px] shrink-0 border border-white/10">
                                    {labSlot.customRoom}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      }
                      return (
                        <td
                          key={7}
                          onClick={() => handleCellClick(day, 7)}
                          className="p-1.5 border-l border-white/[0.08] align-middle cursor-pointer hover:bg-zinc-800/40 transition-colors group"
                        >
                          <div className="h-16 rounded-xl border border-dashed border-white/[0.1] group-hover:border-purple-500/50 flex flex-col items-center justify-center gap-1 transition">
                            <Plus className="w-3.5 h-3.5 text-zinc-600 group-hover:text-purple-400 transition" />
                            <span className="text-[9px] text-zinc-600 group-hover:text-purple-400 font-medium transition">
                              + Assign Lab
                            </span>
                          </div>
                        </td>
                      );
                    })()}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 2: DOCUMENT VIEW (Pristine Printable Paper Canvas) */}
      <div className={viewMode === 'document' ? 'block' : 'hidden'}>
        <div className="p-4 sm:p-6 rounded-2xl bg-zinc-900 border border-white/[0.08] overflow-x-auto shadow-2xl">
          <div
            ref={exportCanvasRef}
            className="min-w-[1040px] bg-white text-zinc-950 p-8 rounded-xl routine-paper select-none"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          >
            {/* Clean Academic Header */}
            <div className="text-center border-b-2 border-zinc-900 pb-4 mb-4">
              <div className="text-[12px] uppercase tracking-widest font-bold text-red-900 mb-1">
                Bangladesh University of Engineering and Technology (BUET)
              </div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-950 uppercase">
                {routine.title}
              </h1>
              <p className="text-xs text-zinc-700 font-semibold mt-0.5">{routine.subTitle}</p>
              <div className="text-[11px] text-zinc-600 font-medium mt-1">
                Effective: {routine.effectiveDate} • Theory Periods: 50 Min / Sessional Lab: 150 Min
              </div>
            </div>

            {/* Document Table Grid */}
            <table className="w-full border-collapse border-2 border-zinc-900 text-xs text-center table-fixed">
              <thead>
                <tr className="bg-zinc-100 text-zinc-950 border-b-2 border-zinc-900 font-bold text-[11px]">
                  <th className="w-24 p-2.5 border-r border-zinc-400 uppercase">Day</th>
                  {BUET_PERIODS.filter((p) => p.id >= 1 && p.id <= 6).map((period) => (
                    <th key={period.id} className="p-2 border-r border-zinc-300">
                      <div>{period.name}</div>
                      <div className="text-[9px] text-zinc-600 font-normal">{period.timeRange}</div>
                    </th>
                  ))}
                  <th className="w-12 p-1 border-r border-zinc-400 bg-amber-50 text-amber-950 text-[10px] uppercase font-bold">
                    Break
                  </th>
                  <th className="w-36 p-2 border-zinc-900 bg-zinc-50">
                    <div>Period 7 (Lab)</div>
                    <div className="text-[9px] text-zinc-600 font-normal">2:30 – 5:00 PM</div>
                  </th>
                </tr>
              </thead>

              <tbody>
                {BUET_DAYS.map((day, dayIndex) => {
                  let skipPeriods = 0;
                  return (
                    <tr key={day} className="border-b border-zinc-400">
                      <td className="p-2.5 border-r border-zinc-900 font-bold text-zinc-950 bg-zinc-50 text-xs">
                        {day}
                      </td>

                      {[1, 2, 3, 4, 5, 6].map((periodId) => {
                        if (skipPeriods > 0) {
                          skipPeriods--;
                          return null;
                        }

                        const coveringSlot = getSlotCovering(day, periodId);
                        if (coveringSlot && coveringSlot.periodId === periodId) {
                          const spanCount = Math.min(coveringSlot.span, 7 - periodId);
                          if (spanCount > 1) skipPeriods = spanCount - 1;

                          return (
                            <td
                              key={periodId}
                              colSpan={spanCount}
                              className="p-2 border-r border-zinc-400 align-middle"
                              style={{
                                backgroundColor: `${coveringSlot.customColor || '#991b1b'}0d`,
                                borderLeft: `3px solid ${coveringSlot.customColor || '#991b1b'}`,
                              }}
                            >
                              <div className="font-bold text-xs" style={{ color: coveringSlot.customColor || '#800000' }}>
                                {coveringSlot.customCode}
                              </div>
                              {coveringSlot.customNickname && (
                                <div className="text-[10px] text-zinc-800 font-semibold">
                                  {coveringSlot.customNickname}
                                </div>
                              )}
                              {coveringSlot.customTeacher && (
                                <div className="text-[9px] text-zinc-600 italic">
                                  {coveringSlot.customTeacher}
                                </div>
                              )}
                              {coveringSlot.customRoom && (
                                <div className="text-[9px] text-zinc-900 font-mono mt-0.5 font-medium">
                                  {coveringSlot.customRoom}
                                </div>
                              )}
                            </td>
                          );
                        }

                        return <td key={periodId} className="p-1 border-r border-zinc-300" />;
                      })}

                      {dayIndex === 0 && (
                        <td
                          rowSpan={5}
                          className="w-12 border-r border-zinc-400 bg-amber-50/70 p-1 text-center align-middle font-bold text-amber-950"
                        >
                          <div className="[writing-mode:vertical-rl] rotate-180 text-[10px] uppercase tracking-wider mx-auto py-3">
                            Prayer & Lunch Break
                          </div>
                        </td>
                      )}

                      {(() => {
                        const labSlot = routine.slots.find((s) => s.day === day && s.periodId === 7);
                        if (labSlot) {
                          return (
                            <td
                              key={7}
                              className="p-2 align-middle border-zinc-400"
                              style={{
                                backgroundColor: `${labSlot.customColor || '#7c3aed'}0d`,
                                borderLeft: `3px solid ${labSlot.customColor || '#7c3aed'}`,
                              }}
                            >
                              <div className="text-[8px] font-bold text-zinc-500 uppercase">Sessional Lab</div>
                              <div className="font-bold text-xs" style={{ color: labSlot.customColor || '#581c87' }}>
                                {labSlot.customCode}
                              </div>
                              {labSlot.customNickname && (
                                <div className="text-[10px] text-zinc-800 font-semibold">{labSlot.customNickname}</div>
                              )}
                              {labSlot.customRoom && (
                                <div className="text-[9px] text-zinc-900 font-mono font-medium">{labSlot.customRoom}</div>
                              )}
                            </td>
                          );
                        }
                        return <td key={7} className="p-1" />;
                      })()}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-4 pt-2 border-t border-zinc-300 flex justify-between text-[10px] text-zinc-500">
              <span>* Official BUET Academic Timetable • Saturday through Wednesday</span>
              <span>Rendered with BUETracker</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Header Modal */}
      {isEditingHeader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in no-print">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl text-zinc-200 space-y-4 animate-modal-in">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-red-400" />
                Edit Timetable Header
              </h3>
              <button
                onClick={() => setIsEditingHeader(false)}
                className="text-zinc-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Routine Title</label>
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-red-500 transition"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Subtitle / Department / Section</label>
                <input
                  type="text"
                  value={tempSubTitle}
                  onChange={(e) => setTempSubTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-red-500 transition"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Effective Date / Term Info</label>
                <input
                  type="text"
                  value={tempEffectiveDate}
                  onChange={(e) => setTempEffectiveDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-red-500 transition"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <button
                onClick={() => setIsEditingHeader(false)}
                className="px-4 py-2 rounded-xl text-zinc-300 hover:bg-zinc-800 text-xs font-medium btn-tactile"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveHeader}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md transition btn-tactile"
              >
                Save Header
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Beginner-Friendly Focused Slot Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in no-print">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl text-zinc-200 space-y-4 animate-modal-in">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-zinc-100">
                  {selectedSlot.day} • {selectedSlot.periodId === 7 ? 'Period 7 (2:30–5:00 Lab)' : `Period ${selectedSlot.periodId}`}
                </h3>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                  Assign or customize this class slot
                </p>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="text-zinc-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            {/* Select Course dropdown OR Quick Add New */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-zinc-400 font-medium">Select Registered Course</label>
                <button
                  type="button"
                  onClick={() => setShowQuickAddCourse(!showQuickAddCourse)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                >
                  {showQuickAddCourse ? 'Select existing' : '+ Quick Add New'}
                </button>
              </div>

              {!showQuickAddCourse ? (
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleCourseSelect(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="">-- Choose Course from List --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.title} ({c.type})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] space-y-2 text-xs">
                  <span className="text-[11px] text-emerald-400 font-medium">Type course details directly below:</span>
                </div>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Course Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="ME 243"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-1.5 text-zinc-100 font-mono tabular-nums font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Nickname / Topic</label>
                  <input
                    type="text"
                    placeholder="(Solid Mech)"
                    value={customNickname}
                    onChange={(e) => setCustomNickname(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Teacher with suggestions */}
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Teacher Initials / Name</label>
                <input
                  type="text"
                  placeholder="SA Ma'am"
                  value={customTeacher}
                  onChange={(e) => setCustomTeacher(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="text-[10px] text-zinc-500 self-center">Suggestions:</span>
                  {TEACHER_SUGGESTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCustomTeacher(t)}
                      className="px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] border border-white/[0.06] transition"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Room / Lab with suggestions */}
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Room / Lab Details</label>
                <input
                  type="text"
                  placeholder="Room 317"
                  value={customRoom}
                  onChange={(e) => setCustomRoom(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-1.5 text-zinc-100 font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="text-[10px] text-zinc-500 self-center">Suggestions:</span>
                  {ROOM_SUGGESTIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCustomRoom(r)}
                      className="px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] border border-white/[0.06] transition font-mono tabular-nums"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Toggle (Single Period vs Multi-Period / Lab Block) */}
              {selectedSlot.periodId <= 5 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-zinc-400 font-medium">Duration Toggle</label>
                    <span className="text-[10px] text-zinc-500">Merges consecutive slots automatically</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSpan(1)}
                      className={`py-2 rounded-xl border text-xs font-semibold transition btn-tactile ${
                        span === 1
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                          : 'bg-zinc-900 text-zinc-400 border-white/[0.08] hover:text-white'
                      }`}
                    >
                      1 Period (50m)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpan(2)}
                      className={`py-2 rounded-xl border text-xs font-semibold transition btn-tactile ${
                        span === 2
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                          : 'bg-zinc-900 text-zinc-400 border-white/[0.08] hover:text-white'
                      }`}
                    >
                      2 Periods (100m)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpan(3)}
                      className={`py-2 rounded-xl border text-xs font-semibold transition btn-tactile ${
                        span === 3
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                          : 'bg-zinc-900 text-zinc-400 border-white/[0.08] hover:text-white'
                      }`}
                    >
                      3 Periods Lab
                    </button>
                  </div>
                </div>
              )}

              {/* Color Preset Palette */}
              <div>
                <label className="block text-zinc-400 mb-1.5 font-medium">Card Highlight Color</label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setCustomColor(color.hex)}
                      className={`w-6 h-6 rounded-full border-2 transition ${
                        customColor === color.hex ? 'border-white scale-110' : 'border-transparent opacity-75'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
              {selectedSlot.existingSlot ? (
                <button
                  type="button"
                  onClick={handleDeleteSlot}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-xs transition btn-tactile"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Slot</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className="px-3 py-1.5 rounded-xl text-zinc-300 hover:bg-zinc-800 text-xs btn-tactile"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSlot}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition btn-tactile"
                >
                  Save to Routine
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
