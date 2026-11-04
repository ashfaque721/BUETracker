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
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Check,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { SEED_ROUTINE } from '../db';

interface RoutineDesignerProps {
  routine: RoutineMetadata;
  courses: Course[];
  onUpdateRoutine: (updated: RoutineMetadata) => void;
}

export const RoutineDesigner: React.FC<RoutineDesignerProps> = ({
  routine,
  courses,
  onUpdateRoutine,
}) => {
  const routineRef = useRef<HTMLDivElement>(null);
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
  const [customColor, setCustomColor] = useState<string>('#b91c1c');
  const [span, setSpan] = useState<number>(1);

  // Header editing
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [tempTitle, setTempTitle] = useState(routine.title);
  const [tempSubTitle, setTempSubTitle] = useState(routine.subTitle);
  const [tempEffectiveDate, setTempEffectiveDate] = useState(routine.effectiveDate);

  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Quick Preset Colors
  const PRESET_COLORS = [
    { name: 'BUET Crimson', hex: '#b91c1c' },
    { name: 'Sapphire Blue', hex: '#2563eb' },
    { name: 'Emerald Green', hex: '#059669' },
    { name: 'Amber Gold', hex: '#d97706' },
    { name: 'Royal Violet', hex: '#7c3aed' },
    { name: 'Teal Cyan', hex: '#0891b2' },
    { name: 'Rose Pink', hex: '#e11d48' },
    { name: 'Dark Slate', hex: '#475569' },
  ];

  // Helper to open edit slot modal
  const handleCellClick = (day: DayOfWeek, periodId: number) => {
    const existingSlot = routine.slots.find(
      (s) => s.day === day && s.periodId === periodId
    );

    setSelectedSlot({ day, periodId, existingSlot });

    if (existingSlot) {
      setSelectedCourseId(existingSlot.courseId || '');
      setCustomCode(existingSlot.customCode || '');
      setCustomNickname(existingSlot.customNickname || '');
      setCustomTeacher(existingSlot.customTeacher || '');
      setCustomRoom(existingSlot.customRoom || '');
      setCustomColor(existingSlot.customColor || '#b91c1c');
      setSpan(existingSlot.span || 1);
    } else {
      setSelectedCourseId('');
      setCustomCode('');
      setCustomNickname('');
      setCustomTeacher('');
      setCustomRoom('');
      setCustomColor('#b91c1c');
      setSpan(1);
    }
  };

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
    if (!courseId) return;

    const course = courses.find((c) => c.id === courseId);
    if (course) {
      setCustomCode(course.code);
      setCustomNickname(`(${course.nickname || course.title})`);
      setCustomTeacher(course.teacher || '');
      setCustomRoom(course.room || '');
      setCustomColor(course.color || '#b91c1c');
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

    // Remove any slots that collide with this new slot or overlap with its span
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

  const handleLoadSeedPreset = () => {
    if (window.confirm('Load default Level-2 Term-1 Section A timetable preset?')) {
      onUpdateRoutine(SEED_ROUTINE);
    }
  };

  const handleClearRoutine = () => {
    if (window.confirm('Clear all slots in current timetable?')) {
      onUpdateRoutine({
        ...routine,
        slots: [],
      });
    }
  };

  // High-Resolution PNG Exporter (2.5x crisp render)
  const handleExportPNG = async () => {
    if (!routineRef.current) return;
    try {
      setIsExporting(true);
      setExportNotice('Rendering Razor-Sharp 2.5× DPI PNG...');

      const dataUrl = await toPng(routineRef.current, {
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `${routine.title.replace(/[\s\W]+/g, '_')}_BUET_Routine.png`;
      link.href = dataUrl;
      link.click();

      setExportNotice('PNG Downloaded Successfully (High-Resolution)!');
      setTimeout(() => setExportNotice(null), 3500);
    } catch (err) {
      console.error('Export PNG failed:', err);
      setExportNotice('Failed to export PNG.');
    } finally {
      setIsExporting(false);
    }
  };

  // High-Resolution PDF Exporter (A4 Landscape)
  const handleExportPDF = async () => {
    if (!routineRef.current) return;
    try {
      setIsExporting(true);
      setExportNotice('Generating Crisp A4 Landscape Vector PDF...');

      const dataUrl = await toPng(routineRef.current, {
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

      setExportNotice('PDF Exported Successfully (A4 Landscape)!');
      setTimeout(() => setExportNotice(null), 3500);
    } catch (err) {
      console.error('Export PDF failed:', err);
      setExportNotice('Failed to export PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper to check if a day & period is covered by a spanning slot
  const getSlotCovering = (day: DayOfWeek, periodId: number) => {
    return routine.slots.find((s) => {
      if (s.day !== day) return false;
      return periodId >= s.periodId && periodId < s.periodId + s.span;
    });
  };

  return (
    <div className="space-y-6">
      {/* Studio Header & Action Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 p-5 rounded-3xl shadow-xl no-print">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-amber-800 border border-red-500/30 flex items-center justify-center text-white shadow-lg shadow-red-950/60">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white">
                BUET Departmental Routine Studio
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800/80">
                Official Periods
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sat–Wed • Periods 1–6 (8:00–1:30) • Recess (1:30–2:30) • Period 7 Lab (2:30–5:00)
            </p>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Buttons */}
          <button
            onClick={handleLoadSeedPreset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Load IPE'23 Section A Timetable Preset"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Sec A Preset</span>
          </button>

          <button
            onClick={() => setIsEditingHeader(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Edit Header</span>
          </button>

          {/* Export PNG */}
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/60 transition disabled:opacity-50"
            title="Export 2.5× DPI Ultra-Crisp PNG (Ctrl+E)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PNG (2.5×)</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-lg shadow-red-950/60 transition disabled:opacity-50"
            title="Export A4 Landscape PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF (A4)</span>
          </button>

          {/* Print */}
          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Print Routine (Ctrl+P)"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3.5 bg-blue-950/80 border border-blue-600/80 rounded-2xl text-xs text-blue-200 flex items-center justify-between animate-fade-in no-print">
          <span className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            {exportNotice}
          </span>
        </div>
      )}

      {/* Routine Studio Workbench / Document Canvas Container */}
      <div className="bg-slate-900/40 p-4 sm:p-8 rounded-3xl border border-slate-800/80 shadow-2xl overflow-x-auto">
        <div className="flex justify-between items-center mb-3 text-xs text-slate-400 px-2 no-print">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Official Timetable Canvas • Click any cell to assign or edit course details
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            A4 Landscape Aspect Ratio • Crisp 2.5× Scale
          </span>
        </div>

        {/* The Printable Paper Container */}
        <div
          ref={routineRef}
          className="min-w-[1040px] bg-white text-slate-900 p-8 rounded-2xl shadow-2xl border-2 border-slate-300 select-none print:m-0 print:p-2 print:shadow-none print:border-none"
          style={{ fontFamily: 'Inter, Arial, sans-serif' }}
        >
          {/* Header Banner matching BUET Timetable Standards */}
          <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-[11px] uppercase tracking-widest font-black text-red-900 bg-red-50 px-3.5 py-0.5 rounded-full border border-red-200">
                Bangladesh University of Engineering and Technology (BUET)
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase mt-1">
              {routine.title}
            </h1>
            <p className="text-xs font-bold text-slate-700 mt-0.5 tracking-wide">{routine.subTitle}</p>
            <div className="flex items-center justify-center gap-4 mt-1.5 text-[11px] text-slate-600 font-semibold">
              <span className="font-mono">{routine.effectiveDate}</span>
              <span>•</span>
              <span>Class Duration: 50 Min (Theory) / 150 Min (Lab)</span>
            </div>
          </div>

          {/* Timetable Table Grid */}
          <table className="w-full border-collapse border-2 border-slate-900 text-xs text-center table-fixed">
            <thead>
              <tr className="bg-slate-100 text-slate-950 border-b-2 border-slate-900">
                {/* Day Header */}
                <th className="w-24 p-2.5 font-black border-r-2 border-slate-900 text-xs uppercase bg-slate-200">
                  Day \ Period
                </th>

                {/* Periods 1 to 6 */}
                {BUET_PERIODS.filter((p) => p.id >= 1 && p.id <= 6).map((period) => (
                  <th key={period.id} className="p-2 border-r border-slate-600 font-bold">
                    <div className="text-xs font-black uppercase text-slate-950">
                      {period.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-600 font-semibold mt-0.5">
                      {period.timeRange}
                    </div>
                  </th>
                ))}

                {/* Fixed RECESS Column Header */}
                <th className="w-14 p-1 border-r border-slate-700 bg-amber-100/90 text-amber-950 font-bold">
                  <div className="text-[10px] font-black uppercase tracking-wider">RECESS</div>
                  <div className="text-[9px] font-mono font-bold mt-0.5">1:30–2:30</div>
                </th>

                {/* Period 7 (Afternoon Lab) */}
                <th className="w-40 p-2 border-slate-900 bg-blue-50 font-bold">
                  <div className="text-xs font-black uppercase text-blue-950">
                    Period 7 (LAB)
                  </div>
                  <div className="text-[10px] font-mono text-blue-800 font-semibold mt-0.5">
                    2:30 - 5:00 PM
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {BUET_DAYS.map((day, dayIndex) => {
                let skipPeriods = 0;

                return (
                  <tr
                    key={day}
                    className={`border-b-2 border-slate-900 ${
                      dayIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                    }`}
                  >
                    {/* Day Label */}
                    <td className="p-2.5 font-black border-r-2 border-slate-900 text-slate-950 text-xs uppercase bg-slate-100/80">
                      {day}
                    </td>

                    {/* Periods 1 to 6 */}
                    {[1, 2, 3, 4, 5, 6].map((periodId) => {
                      if (skipPeriods > 0) {
                        skipPeriods--;
                        return null; // Don't render covered cell
                      }

                      const coveringSlot = getSlotCovering(day, periodId);

                      // If this cell is the starting slot
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
                            className="p-2 border-r border-slate-600 align-middle cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-inset transition-all relative group"
                            style={{
                              backgroundColor: `${coveringSlot.customColor || '#b91c1c'}12`,
                              borderLeft: `4px solid ${coveringSlot.customColor || '#b91c1c'}`,
                            }}
                            title="Click to edit or remove class slot"
                          >
                            <div className="flex flex-col justify-center items-center py-0.5">
                              {/* Line 1: Course Code */}
                              <div
                                className="text-xs font-black tracking-wide"
                                style={{ color: coveringSlot.customColor || '#800000' }}
                              >
                                {coveringSlot.customCode}
                              </div>

                              {/* Line 2: Nickname */}
                              {coveringSlot.customNickname && (
                                <div className="text-[11px] font-bold text-slate-700 leading-tight mt-0.5">
                                  {coveringSlot.customNickname}
                                </div>
                              )}

                              {/* Line 3: Teacher */}
                              {coveringSlot.customTeacher && (
                                <div className="text-[10px] text-slate-600 font-semibold italic mt-0.5">
                                  {coveringSlot.customTeacher}
                                </div>
                              )}

                              {/* Line 4: Room */}
                              {coveringSlot.customRoom && (
                                <div className="text-[9px] font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-300 mt-1 shadow-xs">
                                  {coveringSlot.customRoom}
                                </div>
                              )}
                            </div>

                            {/* Hover Edit Hint Pill */}
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                              <span className="p-0.5 rounded bg-white/90 text-blue-600 shadow-sm border border-slate-300">
                                <Edit2 className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          </td>
                        );
                      }

                      // Empty Slot
                      return (
                        <td
                          key={periodId}
                          onClick={() => handleCellClick(day, periodId)}
                          className="p-1 border-r border-slate-300 align-middle text-slate-300 hover:bg-blue-50/70 hover:text-blue-500 cursor-pointer transition-colors group"
                          title="Click to assign class"
                        >
                          <div className="py-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-4 h-4 text-blue-500" />
                          </div>
                        </td>
                      );
                    })}

                    {/* Fixed Recess / Prayer & Lunch Break Column */}
                    {dayIndex === 0 && (
                      <td
                        rowSpan={5}
                        className="w-14 border-r border-slate-700 bg-amber-50 p-1 text-center align-middle font-bold text-amber-900 border-b-2 border-slate-900"
                      >
                        <div className="flex flex-col items-center justify-center gap-2 py-4">
                          <span className="text-[10px] font-black uppercase tracking-widest [writing-mode:vertical-rl] rotate-180 text-amber-950">
                            PRAYER & LUNCH BREAK (1:30 - 2:30 PM)
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Period 7 (Afternoon Lab: 2:30 - 5:00) */}
                    {(() => {
                      const labSlot = routine.slots.find(
                        (s) => s.day === day && s.periodId === 7
                      );

                      if (labSlot) {
                        return (
                          <td
                            key={7}
                            onClick={() => handleCellClick(day, 7)}
                            className="p-2 border-slate-900 align-middle cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-inset transition relative group"
                            style={{
                              backgroundColor: `${labSlot.customColor || '#7c3aed'}15`,
                              borderLeft: `4px solid ${labSlot.customColor || '#7c3aed'}`,
                            }}
                            title="Click to edit or remove lab slot"
                          >
                            <div className="flex flex-col items-center justify-center py-1">
                              <span className="text-[8px] font-black text-red-700 uppercase tracking-wider bg-red-100 px-1.5 py-0.5 rounded border border-red-200">
                                SESSIONAL / LAB
                              </span>
                              <div
                                className="text-xs font-black tracking-wide mt-1"
                                style={{ color: labSlot.customColor || '#1e3a8a' }}
                              >
                                {labSlot.customCode}
                              </div>
                              {labSlot.customNickname && (
                                <div className="text-[11px] font-bold text-slate-800 mt-0.5">
                                  {labSlot.customNickname}
                                </div>
                              )}
                              {labSlot.customTeacher && (
                                <div className="text-[10px] text-slate-600 font-semibold italic mt-0.5">
                                  {labSlot.customTeacher}
                                </div>
                              )}
                              {labSlot.customRoom && (
                                <div className="text-[9px] font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-300 mt-1 shadow-xs">
                                  {labSlot.customRoom}
                                </div>
                              )}
                            </div>

                            {/* Hover Edit Pill */}
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                              <span className="p-0.5 rounded bg-white/90 text-blue-600 shadow-sm border border-slate-300">
                                <Edit2 className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={7}
                          onClick={() => handleCellClick(day, 7)}
                          className="p-2 border-slate-300 align-middle text-slate-300 hover:bg-blue-50/70 hover:text-blue-500 cursor-pointer transition group"
                          title="Click to assign Lab / Sessional"
                        >
                          <div className="py-4 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-4 h-4 text-blue-500" />
                            <span className="text-[9px] text-blue-600 font-bold">
                              Assign Lab
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

          {/* Routine Footer Notes */}
          <div className="mt-4 pt-3 border-t border-slate-300 flex flex-wrap items-center justify-between text-[11px] text-slate-600 font-medium">
            <div className="flex items-center gap-4">
              <span>* BUET Academic Week runs Saturday through Wednesday. Thursday & Friday are official weekends.</span>
            </div>
            <div className="font-bold text-slate-800">
              Generated via BUETracker Academic Suite
            </div>
          </div>
        </div>
      </div>

      {/* Edit Header Modal */}
      {isEditingHeader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in no-print">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-400" />
                Edit Routine Header & Department Info
              </h3>
              <button
                onClick={() => setIsEditingHeader(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Routine Main Title
                </label>
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Class Routine of IPE'23 Section A"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Sub-Title (Level, Term & Department)
                </label>
                <input
                  type="text"
                  value={tempSubTitle}
                  onChange={(e) => setTempSubTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Level-2 Term-1 | Department of Industrial & Production Engineering, BUET"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Effective Date / Session
                </label>
                <input
                  type="text"
                  value={tempEffectiveDate}
                  onChange={(e) => setTempEffectiveDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Effective from: November 2026"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsEditingHeader(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveHeader}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition shadow-md"
              >
                Save Header
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Slot Modal with Live Preview */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in no-print">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  {selectedSlot.day} — {selectedSlot.periodId === 7 ? 'Period 7 (2:30 - 5:00 PM)' : `Period ${selectedSlot.periodId}`}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedSlot.periodId === 7
                    ? 'Dedicated Afternoon Sessional / Lab Slot'
                    : 'Class / Lecture Slot'}
                </p>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Live Visual Preview of Cell */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Live Timetable Cell Preview
              </span>
              <div
                className="p-3 rounded-xl border border-slate-300 bg-white text-center shadow-md"
                style={{
                  borderLeft: `4px solid ${customColor}`,
                  backgroundColor: `${customColor}12`,
                }}
              >
                <div className="text-xs font-black tracking-wide" style={{ color: customColor }}>
                  {customCode || 'COURSE CODE'}
                </div>
                <div className="text-[11px] font-bold text-slate-700 mt-0.5">
                  {customNickname || '(Topic Nickname)'}
                </div>
                <div className="text-[10px] text-slate-600 font-semibold italic mt-0.5">
                  {customTeacher || "Teacher's Name"}
                </div>
                <div className="inline-block text-[9px] font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300 mt-1 shadow-xs">
                  {customRoom || 'Room: ---'}
                </div>
              </div>
            </div>

            {/* Quick Select from Registered Courses */}
            {courses.length > 0 && (
              <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/80">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  Quick Fill from Course Manager
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleCourseSelect(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="">-- Choose Course to Auto-Fill --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.title} ({c.type.toUpperCase()}) {c.teacher ? `• ${c.teacher}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Detailed Slot Fields */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Course Code (Bold) *
                  </label>
                  <input
                    type="text"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    placeholder="e.g. ME 243, IPE 205"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Topic / Nickname in ()
                  </label>
                  <input
                    type="text"
                    value={customNickname}
                    onChange={(e) => setCustomNickname(e.target.value)}
                    placeholder="e.g. (Solid Mech)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-emerald-400" />
                    Teacher's Name
                  </label>
                  <input
                    type="text"
                    value={customTeacher}
                    onChange={(e) => setCustomTeacher(e.target.value)}
                    placeholder="e.g. SA Ma'am, Kayes Sir"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-400" />
                    Room / Lab Details
                  </label>
                  <input
                    type="text"
                    value={customRoom}
                    onChange={(e) => setCustomRoom(e.target.value)}
                    placeholder="e.g. Room: IPE 317"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Color Presets Palette */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Cell Accent Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setCustomColor(color.hex)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        customColor === color.hex ? 'scale-110 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer ml-1"
                    title="Custom Color"
                  />
                </div>
              </div>

              {/* Period Span (for multi-period morning labs) */}
              {selectedSlot.periodId !== 7 && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-purple-400" />
                    Span (Periods)
                  </label>
                  <select
                    value={span}
                    onChange={(e) => setSpan(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={1}>1 Period (Standard Lecture: 50 Min)</option>
                    <option value={2}>2 Periods (Double Lecture: 110 Min)</option>
                    <option value={3}>3 Periods (Morning Lab Block: 170 Min)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              {selectedSlot.existingSlot ? (
                <button
                  type="button"
                  onClick={handleDeleteSlot}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/80 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Cell
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSlot}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/60 transition"
                >
                  Save to Timetable
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
