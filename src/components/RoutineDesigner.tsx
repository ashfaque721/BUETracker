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
  Info,
  Clock,
  Layers,
  MapPin,
  User,
  BookOpen,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

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
  const [customColor, setCustomColor] = useState<string>('#3b82f6');
  const [span, setSpan] = useState<number>(1);

  // Header editing
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [tempTitle, setTempTitle] = useState(routine.title);
  const [tempSubTitle, setTempSubTitle] = useState(routine.subTitle);
  const [tempEffectiveDate, setTempEffectiveDate] = useState(routine.effectiveDate);

  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Helper to open edit slot modal
  const handleCellClick = (day: DayOfWeek, periodId: number) => {
    // Find if slot exists at this day & period
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
      setCustomColor(existingSlot.customColor || '#3b82f6');
      setSpan(existingSlot.span || 1);
    } else {
      setSelectedCourseId('');
      setCustomCode('');
      setCustomNickname('');
      setCustomTeacher('');
      setCustomRoom('');
      setCustomColor('#3b82f6');
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
      setCustomColor(course.color || '#3b82f6');
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
      // Check collision
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

  // High-Resolution PNG Exporter (2x scale for print quality)
  const handleExportPNG = async () => {
    if (!routineRef.current) return;
    try {
      setIsExporting(true);
      setExportNotice('Generating Crisp 2X High-Res PNG...');

      const dataUrl = await toPng(routineRef.current, {
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
        style: {
          borderRadius: '0px',
        },
      });

      const link = document.createElement('a');
      link.download = `${routine.title.replace(/[\s\W]+/g, '_')}_BUET_Routine.png`;
      link.href = dataUrl;
      link.click();

      setExportNotice('PNG Downloaded Successfully!');
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
      setExportNotice('Generating A4 Landscape Vector PDF...');

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

      // Fit with margins
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

  const handlePrint = () => {
    window.print();
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
      {/* Control Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-xl shadow-lg no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-950/80 border border-red-700/60 flex items-center justify-center text-red-400 font-bold">
            <Calendar className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              BUET Departmental Routine Designer
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/60 text-red-300 border border-red-700/50">
                Official Period Schedule
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Sat-Wed Timetable • Period 1 to 6 • Recess/Break (1:30 - 2:30) • Dedicated Afternoon Lab (2:30 - 5:00)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsEditingHeader(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-400" />
            Edit Routine Header
          </button>

          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow transition disabled:opacity-50"
            title="Export high resolution 2X crisp image (Ctrl+E)"
          >
            <Download className="w-3.5 h-3.5" />
            Export PNG (2X Crisp)
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-700 hover:bg-red-600 text-white shadow transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF (A4 Landscape)
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Print Routine (Ctrl+P)"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            Print
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-blue-900/60 border border-blue-600 rounded-lg text-sm text-blue-200 flex items-center justify-between animate-fade-in no-print">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            {exportNotice}
          </span>
        </div>
      )}

      {/* Routine Display Card / Container to Export */}
      <div className="overflow-x-auto pb-4">
        <div
          ref={routineRef}
          className="min-w-[1020px] bg-white text-slate-900 p-6 rounded-xl shadow-2xl border-2 border-slate-400 select-none print:m-0 print:p-2 print:shadow-none print:border-none"
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          {/* Header Banner replicating BUET Departmental format */}
          <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest font-extrabold text-red-900 bg-red-100 px-3 py-0.5 rounded-full border border-red-300">
                Bangladesh University of Engineering and Technology (BUET)
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-wide text-slate-950 uppercase">
              {routine.title}
            </h1>
            <p className="text-sm font-semibold text-slate-700 mt-0.5">{routine.subTitle}</p>
            <div className="flex items-center justify-center gap-6 mt-1 text-xs text-slate-600 font-medium">
              <span>{routine.effectiveDate}</span>
              <span>•</span>
              <span>Standard Class Duration: 50 Min (Theory) / 150 Min (Lab)</span>
            </div>
          </div>

          {/* Timetable Table Grid */}
          <table className="w-full border-collapse border-2 border-slate-900 text-xs text-center table-fixed">
            <thead>
              <tr className="bg-slate-100 text-slate-950 border-b-2 border-slate-900">
                {/* Day Header */}
                <th className="w-24 p-2 font-bold border-r-2 border-slate-900 text-sm uppercase bg-slate-200">
                  Day \ Period
                </th>

                {/* Period 1 to 6 */}
                {BUET_PERIODS.filter((p) => p.id >= 1 && p.id <= 6).map((period) => (
                  <th key={period.id} className="p-2 border-r border-slate-700 font-bold">
                    <div className="text-xs font-black uppercase text-slate-900">
                      {period.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-600 font-semibold">
                      {period.timeRange}
                    </div>
                  </th>
                ))}

                {/* Break Column Header */}
                <th className="w-14 p-1 border-r border-slate-700 bg-amber-100 text-amber-950 font-bold">
                  <div className="text-[10px] font-black uppercase tracking-wider">RECESS</div>
                  <div className="text-[9px] font-mono font-medium">1:30-2:30</div>
                </th>

                {/* Period 7 (Afternoon Lab) */}
                <th className="w-36 p-2 border-slate-900 bg-blue-50/70 font-bold">
                  <div className="text-xs font-black uppercase text-blue-950">
                    Period 7 (LAB)
                  </div>
                  <div className="text-[10px] font-mono text-blue-800 font-semibold">
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
                      dayIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    }`}
                  >
                    {/* Day Label */}
                    <td className="p-2 font-black border-r-2 border-slate-900 text-slate-900 text-xs uppercase bg-slate-100">
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
                            className="p-1.5 border-r border-slate-600 align-middle cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-inset transition-all"
                            style={{
                              backgroundColor: `${coveringSlot.customColor || '#3b82f6'}15`,
                              borderLeft: `4px solid ${coveringSlot.customColor || '#3b82f6'}`,
                            }}
                            title="Click to edit or remove slot"
                          >
                            <div className="flex flex-col justify-center items-center py-1">
                              {/* Line 1: Course Code */}
                              <div
                                className="text-xs font-black tracking-wide"
                                style={{ color: coveringSlot.customColor || '#1e3a8a' }}
                              >
                                {coveringSlot.customCode}
                              </div>
                              {/* Line 2: Nickname */}
                              {coveringSlot.customNickname && (
                                <div className="text-[11px] font-bold text-slate-700 leading-tight">
                                  {coveringSlot.customNickname}
                                </div>
                              )}
                              {/* Line 3: Teacher */}
                              {coveringSlot.customTeacher && (
                                <div className="text-[10px] text-slate-600 font-medium italic mt-0.5">
                                  {coveringSlot.customTeacher}
                                </div>
                              )}
                              {/* Line 4: Room */}
                              {coveringSlot.customRoom && (
                                <div className="text-[10px] font-bold text-slate-800 bg-white/80 px-1.5 py-0.2 rounded border border-slate-300 mt-0.5">
                                  {coveringSlot.customRoom}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      }

                      // Empty Slot
                      return (
                        <td
                          key={periodId}
                          onClick={() => handleCellClick(day, periodId)}
                          className="p-1 border-r border-slate-300 align-middle text-slate-300 hover:bg-blue-50 hover:text-blue-500 cursor-pointer transition-colors group"
                          title="Click to assign course"
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
                        className="w-14 border-r border-slate-700 bg-amber-50/80 p-1 text-center align-middle font-bold text-amber-900 border-b-2 border-slate-900"
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
                            className="p-2 border-slate-900 align-middle cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-inset transition"
                            style={{
                              backgroundColor: `${labSlot.customColor || '#7c3aed'}20`,
                              borderLeft: `4px solid ${labSlot.customColor || '#7c3aed'}`,
                            }}
                            title="Click to edit or remove lab slot"
                          >
                            <div className="flex flex-col items-center justify-center py-1">
                              <span className="text-[9px] font-black text-red-700 uppercase tracking-wider bg-red-100 px-1.5 py-0.5 rounded">
                                SESSIONAL / LAB
                              </span>
                              <div
                                className="text-xs font-black tracking-wide mt-0.5"
                                style={{ color: labSlot.customColor || '#1e3a8a' }}
                              >
                                {labSlot.customCode}
                              </div>
                              {labSlot.customNickname && (
                                <div className="text-[11px] font-bold text-slate-800">
                                  {labSlot.customNickname}
                                </div>
                              )}
                              {labSlot.customTeacher && (
                                <div className="text-[10px] text-slate-600 italic">
                                  {labSlot.customTeacher}
                                </div>
                              )}
                              {labSlot.customRoom && (
                                <div className="text-[10px] font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-300 mt-0.5">
                                  {labSlot.customRoom}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={7}
                          onClick={() => handleCellClick(day, 7)}
                          className="p-2 border-slate-300 align-middle text-slate-300 hover:bg-blue-50 hover:text-blue-500 cursor-pointer transition group"
                          title="Click to assign Lab / Sessional"
                        >
                          <div className="py-4 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-4 h-4 text-blue-500" />
                            <span className="text-[10px] text-blue-600 font-semibold">
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
            <div className="font-semibold text-slate-800">
              Generated via BUETracker Native Suite
            </div>
          </div>
        </div>
      </div>

      {/* Edit Header Modal */}
      {isEditingHeader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in no-print">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-lg w-full shadow-2xl text-white space-y-4">
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

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Routine Main Title
                </label>
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Class Routine of IPE'23 Section A"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Sub-Title (Level, Term & Department)
                </label>
                <input
                  type="text"
                  value={tempSubTitle}
                  onChange={(e) => setTempSubTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Level-2 Term-1 | Department of Industrial & Production Engineering, BUET"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Effective Date / Session
                </label>
                <input
                  type="text"
                  value={tempEffectiveDate}
                  onChange={(e) => setTempEffectiveDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Effective from: November 2026"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsEditingHeader(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveHeader}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition"
              >
                Save Header
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Slot Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in no-print">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  {selectedSlot.day} — {selectedSlot.periodId === 7 ? 'Period 7 (2:30 - 5:00 PM)' : `Period ${selectedSlot.periodId}`}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedSlot.periodId === 7
                    ? 'Dedicated Afternoon Sessional / Lab Slot'
                    : 'Class / Tutorial Slot'}
                </p>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Quick Select from Registered Courses */}
            {courses.length > 0 && (
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  Quick Assign from Course Manager
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleCourseSelect(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
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

            {/* Detailed Slot Fields matching BUET Cell format */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Line 1: Course Code (Bold) *
                </label>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="e.g. ME 243, IPE 205, ME 244"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Line 2: Course Nickname / Topic in Parentheses
                </label>
                <input
                  type="text"
                  value={customNickname}
                  onChange={(e) => setCustomNickname(e.target.value)}
                  placeholder="e.g. (Solid Mech), (Mfg I Lab)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-emerald-400" />
                    Line 3: Teacher's Name
                  </label>
                  <input
                    type="text"
                    value={customTeacher}
                    onChange={(e) => setCustomTeacher(e.target.value)}
                    placeholder="e.g. SA Ma'am, Kayes Sir"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-400" />
                    Line 4: Room / Lab Details
                  </label>
                  <input
                    type="text"
                    value={customRoom}
                    onChange={(e) => setCustomRoom(e.target.value)}
                    placeholder="e.g. Room: IPE 317, SM Lab"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
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
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value={1}>1 Period (Standard)</option>
                      <option value={2}>2 Periods (Double Slot)</option>
                      <option value={3}>3 Periods (Morning Lab)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400">{customColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              {selectedSlot.existingSlot ? (
                <button
                  type="button"
                  onClick={handleDeleteSlot}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 transition"
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
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSlot}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow transition"
                >
                  Save Slot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

