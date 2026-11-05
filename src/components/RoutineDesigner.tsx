import React, { useState, useRef, useEffect } from 'react';
import {
  DayOfWeek,
  PeriodDefinition,
  RoutineMetadata,
  RoutineSlot,
  Course,
  CourseType,
} from '../types';
import {
  Download,
  FileDown,
  Plus,
  Trash2,
  X,
  ChevronDown,
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

const DAYS: DayOfWeek[] = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];

const PERIODS: { id: number; name: string; timeRange: string; isBreak?: boolean }[] = [
  { id: 1, name: 'Period 1', timeRange: '8:00 - 8:50' },
  { id: 2, name: 'Period 2', timeRange: '9:00 - 9:50' },
  { id: 3, name: 'Period 3', timeRange: '10:00 - 10:50' },
  { id: 4, name: 'Period 4', timeRange: '11:00 - 11:50' },
  { id: 5, name: 'Period 5', timeRange: '12:00 - 12:50' },
  { id: 6, name: 'Period 6', timeRange: '1:00 - 1:30' },
  { id: 0, name: 'BREAK', timeRange: '1:30 - 2:30', isBreak: true },
  { id: 7, name: 'Period 7', timeRange: '2:30 - 5:00' },
];

export const RoutineDesigner: React.FC<RoutineDesignerProps> = ({
  routine,
  courses,
  onUpdateRoutine,
  onLoadSampleRoutine,
}) => {
  const timetableRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Editable Title State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(routine.title || 'Class Routine — Section A');

  // Export State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Cell Edit Modal State
  const [editingCell, setEditingCell] = useState<{
    day: DayOfWeek;
    periodId: number;
    existingSlot?: RoutineSlot;
  } | null>(null);

  const [formCode, setFormCode] = useState('');
  const [formNickname, setFormNickname] = useState('');
  const [formTeacher, setFormTeacher] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formType, setFormType] = useState<CourseType>('theory');
  const [formSpan, setFormSpan] = useState<number>(1);
  const [formCourseId, setFormCourseId] = useState<string>('');

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (routine.title) {
      setTitleText(routine.title);
    }
  }, [routine.title]);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (titleText.trim() && titleText !== routine.title) {
      onUpdateRoutine({
        ...routine,
        title: titleText.trim(),
      });
    }
  };

  const handleCellClick = (day: DayOfWeek, periodId: number) => {
    const existing = routine.slots.find((s) => s.day === day && s.periodId === periodId);
    if (existing) {
      setFormCode(existing.customCode || '');
      setFormNickname(existing.customNickname || '');
      setFormTeacher(existing.customTeacher || '');
      setFormRoom(existing.customRoom || '');
      setFormSpan(existing.span || 1);
      setFormCourseId(existing.courseId || '');

      const matchedCourse = courses.find((c) => c.id === existing.courseId || c.code === existing.customCode);
      setFormType(matchedCourse?.type || (periodId === 7 || (existing.span && existing.span > 1) ? 'sessional' : 'theory'));
    } else {
      setFormCode('');
      setFormNickname('');
      setFormTeacher('');
      setFormRoom('');
      setFormSpan(1);
      setFormCourseId('');
      setFormType(periodId === 7 ? 'sessional' : 'theory');
    }
    setEditingCell({ day, periodId, existingSlot: existing });
  };

  const handleCourseSelect = (courseId: string) => {
    setFormCourseId(courseId);
    const selected = courses.find((c) => c.id === courseId);
    if (selected) {
      setFormCode(selected.code);
      setFormNickname(selected.nickname || selected.title);
      setFormType(selected.type);
      if (selected.teacher) setFormTeacher(selected.teacher);
      if (selected.room) setFormRoom(selected.room);
    }
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCell || !formCode.trim()) return;

    let updatedSlots = [...routine.slots];

    // Remove old slot if updating
    if (editingCell.existingSlot) {
      updatedSlots = updatedSlots.filter((s) => s.id !== editingCell.existingSlot!.id);
    }

    const newSlot: RoutineSlot = {
      id: editingCell.existingSlot ? editingCell.existingSlot.id : `slot_${Date.now()}`,
      day: editingCell.day,
      periodId: editingCell.periodId,
      span: formSpan,
      courseId: formCourseId || undefined,
      customCode: formCode.trim().toUpperCase(),
      customNickname: formNickname.trim() || formCode.trim(),
      customTeacher: formTeacher.trim() || undefined,
      customRoom: formRoom.trim() || undefined,
    };

    updatedSlots.push(newSlot);

    onUpdateRoutine({
      ...routine,
      slots: updatedSlots,
    });

    setEditingCell(null);
  };

  const handleDeleteSlot = () => {
    if (!editingCell?.existingSlot) return;
    const updatedSlots = routine.slots.filter((s) => s.id !== editingCell.existingSlot!.id);
    onUpdateRoutine({
      ...routine,
      slots: updatedSlots,
    });
    setEditingCell(null);
  };

  const handleExportPNG = async () => {
    if (!timetableRef.current) return;
    setIsExportOpen(false);
    setIsExporting(true);

    try {
      const dataUrl = await toPng(timetableRef.current, {
        pixelRatio: 2,
        backgroundColor: '#0d0e11',
      });
      const link = document.createElement('a');
      link.download = `${titleText.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!timetableRef.current) return;
    setIsExportOpen(false);
    setIsExporting(true);

    try {
      const dataUrl = await toPng(timetableRef.current, {
        pixelRatio: 2,
        backgroundColor: '#0d0e11',
      });
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      const imgWidth = 280;
      const imgHeight = (timetableRef.current.offsetHeight * imgWidth) / timetableRef.current.offsetWidth;
      pdf.addImage(dataUrl, 'PNG', 8, 12, imgWidth, Math.min(imgHeight, 185));
      pdf.save(`${titleText.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ----------------------------------------------------------------- */}
      {/* 1. Uncluttered Routine Action Bar                                 */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Editable Routine Title */}
        <div className="flex-1">
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleBlur();
              }}
              className="bg-transparent text-lg font-semibold tracking-tight text-zinc-100 border-b border-white/20 focus:outline-none pb-0.5"
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              className="text-lg font-semibold tracking-tight text-zinc-100 hover:text-white cursor-pointer group flex items-center gap-2"
              title="Click to rename routine"
            >
              <span>{titleText}</span>
              <span className="opacity-0 group-hover:opacity-40 text-xs font-normal text-zinc-400">
                ✎
              </span>
            </h1>
          )}
        </div>

        {/* Right: Understated Template Button + Single Export ▾ Dropdown */}
        <div className="flex items-center gap-3 shrink-0">
          {onLoadSampleRoutine && (
            <button
              onClick={onLoadSampleRoutine}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors py-1.5 px-2"
            >
              Load Sample Template
            </button>
          )}

          {/* Single Primary Action Button: Export ▾ */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium border border-white/[0.08] transition-colors shadow-xs"
            >
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {isExportOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl bg-[#14151a] border border-white/[0.08] shadow-2xl p-1 z-40 text-xs">
                <button
                  onClick={handleExportPNG}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/[0.04] text-zinc-200 transition-colors flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Save as PNG</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/[0.04] text-zinc-200 transition-colors flex items-center gap-2"
                >
                  <FileDown className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Save as PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 2. The Timetable Grid (Saturday to Wednesday)                      */}
      {/* ----------------------------------------------------------------- */}
      <div
        ref={timetableRef}
        className="rounded-2xl border border-white/[0.06] bg-[#0d0e11] overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left table-fixed min-w-[980px]">
            {/* Header: Periods 1-6, BREAK, Period 7 (Lab) */}
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#0d0e11]">
                <th className="w-20 p-3 text-[11px] font-mono text-zinc-400 uppercase tracking-wider text-center">
                  Day
                </th>
                {PERIODS.map((p) => {
                  if (p.isBreak) {
                    return (
                      <th
                        key="break-header"
                        className="w-14 p-2 text-center border-l border-white/[0.06] bg-transparent"
                      >
                        <span className="text-[10px] font-mono tracking-widest text-zinc-400 block">
                          RECESS
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400 block mt-0.5">
                          1:30 - 2:30
                        </span>
                      </th>
                    );
                  }

                  return (
                    <th
                      key={p.id}
                      className={`p-3 border-l border-white/[0.06] ${
                        p.id === 7 ? 'w-44' : 'w-[12%]'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-zinc-300">
                          {p.id === 7 ? 'Period 7 (Lab)' : p.name}
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-zinc-400 mt-0.5">
                          {p.timeRange}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Rows: Saturday to Wednesday */}
            <tbody className="divide-y divide-white/[0.06]">
              {DAYS.map((day) => {
                const spannedPeriodIds = new Set<number>();

                return (
                  <tr key={day} className="h-24">
                    {/* Day Column */}
                    <td className="p-3 text-center bg-[#0d0e11] select-none">
                      <span className="text-xs font-mono font-medium text-zinc-400 block uppercase">
                        {day.slice(0, 3)}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">
                        BUET
                      </span>
                    </td>

                    {/* Periods 1 to 6 */}
                    {[1, 2, 3, 4, 5, 6].map((pId) => {
                      if (spannedPeriodIds.has(pId)) {
                        return null;
                      }

                      const slot = routine.slots.find((s) => s.day === day && s.periodId === pId);
                      const span = slot?.span || 1;

                      if (span > 1) {
                        for (let i = 1; i < span; i++) {
                          spannedPeriodIds.add(pId + i);
                        }
                      }

                      // Match associated course type if available
                      const matchedCourse = courses.find(
                        (c) => c.id === slot?.courseId || (slot?.customCode && c.code === slot.customCode)
                      );
                      const isSessional =
                        matchedCourse?.type === 'sessional' ||
                        span > 1 ||
                        /lab|sessional|drawing|shop/i.test(slot?.customNickname || '');

                      return (
                        <td
                          key={pId}
                          colSpan={span}
                          onClick={() => handleCellClick(day, pId)}
                          className={`p-1.5 border-l border-white/[0.06] transition-colors relative group align-top ${
                            slot
                              ? 'bg-zinc-900/40 hover:bg-zinc-800/50 cursor-pointer'
                              : 'hover:bg-white/[0.02] cursor-pointer'
                          }`}
                        >
                          {slot ? (
                            <div className="h-full min-h-[76px] rounded-xl p-2.5 flex flex-col justify-between border border-white/[0.06] bg-zinc-900/90 hover:border-white/[0.12] transition-colors">
                              {/* Line 1: Course Code & Subtle Category Pill */}
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-xs font-semibold font-mono tracking-tight text-zinc-100">
                                  {slot.customCode || 'CLASS'}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-medium ${
                                    isSessional
                                      ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  }`}
                                >
                                  {isSessional ? 'Lab' : 'Theory'}
                                </span>
                              </div>

                              {/* Line 2: Course Nickname */}
                              <div className="text-[11px] text-zinc-400 truncate mt-1">
                                {slot.customNickname || slot.customCode}
                              </div>

                              {/* Line 3: Teacher • Room */}
                              <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5 truncate mt-2">
                                <span>{slot.customTeacher || 'TBA'}</span>
                                {slot.customRoom && (
                                  <>
                                    <span>•</span>
                                    <span className="text-zinc-400">{slot.customRoom}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : (
                            /* Empty Slot: Quiet hover with faint '+' icon */
                            <div className="h-full min-h-[76px] flex items-center justify-center">
                              <Plus className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Calm Vertical BREAK Column */}
                    <td className="w-14 border-l border-white/[0.06] text-center bg-transparent select-none p-1">
                      <div className="h-full min-h-[76px] flex flex-col items-center justify-center opacity-40">
                        <span className="text-[9px] font-mono tracking-widest text-zinc-400 [writing-mode:vertical-rl] rotate-180">
                          BREAK
                        </span>
                      </div>
                    </td>

                    {/* Period 7 (Afternoon Lab Slot) */}
                    {(() => {
                      const slot = routine.slots.find((s) => s.day === day && s.periodId === 7);
                      return (
                        <td
                          onClick={() => handleCellClick(day, 7)}
                          className={`p-1.5 border-l border-white/[0.06] transition-colors relative group align-top ${
                            slot
                              ? 'bg-zinc-900/40 hover:bg-zinc-800/50 cursor-pointer'
                              : 'hover:bg-white/[0.02] cursor-pointer'
                          }`}
                        >
                          {slot ? (
                            <div className="h-full min-h-[76px] rounded-xl p-2.5 flex flex-col justify-between border border-white/[0.06] bg-zinc-900/90 hover:border-white/[0.12] transition-colors">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-xs font-semibold font-mono tracking-tight text-zinc-100">
                                  {slot.customCode || 'LAB'}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                  Lab Block
                                </span>
                              </div>
                              <div className="text-[11px] text-zinc-400 truncate mt-1">
                                {slot.customNickname || slot.customCode}
                              </div>
                              <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5 truncate mt-2">
                                <span>{slot.customTeacher || 'Lab Instructors'}</span>
                                {slot.customRoom && (
                                  <>
                                    <span>•</span>
                                    <span className="text-zinc-400">{slot.customRoom}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="h-full min-h-[76px] flex items-center justify-center">
                              <Plus className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                            </div>
                          )}
                        </td>
                      );
                    })()}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 3. Slot Edit / Add Dialog                                         */}
      {/* ----------------------------------------------------------------- */}
      {editingCell && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#14151a] border border-white/[0.08] shadow-2xl p-5 space-y-4 animate-modal-in">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-xs font-semibold text-zinc-100">
                  {editingCell.existingSlot ? 'Edit Class Slot' : 'Add Class'}
                </h3>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                  {editingCell.day} • {editingCell.periodId === 7 ? 'Period 7 (Lab)' : `Period ${editingCell.periodId}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-3.5 text-xs">
              {/* Quick Select from existing courses if available */}
              {courses.length > 0 && (
                <div>
                  <label className="block text-zinc-400 font-medium mb-1 text-[11px]">
                    Select Registered Course (Optional)
                  </label>
                  <select
                    value={formCourseId}
                    onChange={(e) => handleCourseSelect(e.target.value)}
                    className="w-full bg-[#1b1d24] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-white/20 transition-colors"
                  >
                    <option value="">-- Custom or Select Course --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.nickname || c.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Course Code */}
              <div>
                <label className="block text-zinc-400 font-medium mb-1 text-[11px]">
                  Course Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ME 243 or IPE 205"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 text-zinc-100 font-mono uppercase focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>

              {/* Course Nickname */}
              <div>
                <label className="block text-zinc-400 font-medium mb-1 text-[11px]">
                  Nickname / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Solid Mech, Mfg I"
                  value={formNickname}
                  onChange={(e) => setFormNickname(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>

              {/* Course Type Toggle */}
              <div>
                <label className="block text-zinc-400 font-medium mb-1 text-[11px]">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('theory')}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-medium transition-colors ${
                      formType === 'theory'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-white/[0.02] text-zinc-400 border-white/[0.06] hover:bg-white/[0.04]'
                    }`}
                  >
                    Theory
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('sessional')}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-medium transition-colors ${
                      formType === 'sessional'
                        ? 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                        : 'bg-white/[0.02] text-zinc-400 border-white/[0.06] hover:bg-white/[0.04]'
                    }`}
                  >
                    Sessional / Lab
                  </button>
                </div>
              </div>

              {/* Teacher & Room */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1 text-[11px]">
                    Teacher Initials
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SA Ma'am"
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1 text-[11px]">
                    Room / Lab
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 317"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              {/* Duration / Span (for morning periods 1-5) */}
              {editingCell.periodId <= 5 && (
                <div>
                  <label className="block text-zinc-400 font-medium mb-1 text-[11px]">
                    Period Span (Consecutive Slots)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormSpan(s)}
                        className={`flex-1 py-1 rounded-lg border text-xs font-mono transition-colors ${
                          formSpan === s
                            ? 'bg-white/[0.1] text-zinc-100 border-white/20 font-semibold'
                            : 'bg-white/[0.02] text-zinc-400 border-white/[0.06] hover:bg-white/[0.04]'
                        }`}
                      >
                        {s} {s === 1 ? 'Period' : 'Periods'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                {editingCell.existingSlot ? (
                  <button
                    type="button"
                    onClick={handleDeleteSlot}
                    className="text-red-400 hover:text-red-300 text-xs transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCell(null)}
                    className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-white/[0.1] hover:bg-white/[0.16] text-zinc-100 font-medium text-xs border border-white/10 transition-colors shadow-xs"
                  >
                    Save Slot
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
