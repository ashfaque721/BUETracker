import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  FileDown,
  Plus,
  Trash2,
  X,
  ChevronDown,
  MoreHorizontal,
  Check,
  RotateCcw,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

// ---------------------------------------------------------------------------
// Types & Schedule Constants (BUET Ordinance)
// ---------------------------------------------------------------------------
export type DayOfWeek = 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday';
export type CourseType = 'theory' | 'sessional';

export interface RoutineSlot {
  id: string;
  day: DayOfWeek;
  periodId: number; // 1..6, or 7 for afternoon lab
  span: number;     // 1, 2, or 3 consecutive periods
  code: string;     // e.g. "ME 243", "IPE 205"
  nickname: string; // e.g. "Solid Mech", "Mfg I"
  teacher?: string; // e.g. "SA Ma'am"
  room?: string;    // e.g. "Room 317", "SM Lab"
  type: CourseType;
}

export interface PeriodHeader {
  id: number;
  name: string;
  timeRange: string;
  isBreak?: boolean;
}

export const PERIODS: PeriodHeader[] = [
  { id: 1, name: 'Period 1', timeRange: '8:00 - 8:50' },
  { id: 2, name: 'Period 2', timeRange: '9:00 - 9:50' },
  { id: 3, name: 'Period 3', timeRange: '10:00 - 10:50' },
  { id: 4, name: 'Period 4', timeRange: '11:00 - 11:50' },
  { id: 5, name: 'Period 5', timeRange: '12:00 - 12:50' },
  { id: 6, name: 'Period 6', timeRange: '1:00 - 1:30' },
  { id: 0, name: 'BREAK', timeRange: '1:30 - 2:30', isBreak: true },
  { id: 7, name: 'Period 7', timeRange: '2:30 - 5:00' },
];

export const DAYS: DayOfWeek[] = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];

// ---------------------------------------------------------------------------
// Realistic BUET Student Sample Routine (IPE '23 Level-2 Term-1)
// ---------------------------------------------------------------------------
export const SAMPLE_BUET_SLOTS: RoutineSlot[] = [
  // Saturday
  {
    id: 'sat_p1',
    day: 'Saturday',
    periodId: 1,
    span: 1,
    code: 'ME 243',
    nickname: 'Solid Mech',
    teacher: "SA Ma'am",
    room: 'Room 317',
    type: 'theory',
  },
  {
    id: 'sat_p2',
    day: 'Saturday',
    periodId: 2,
    span: 1,
    code: 'IPE 205',
    nickname: 'Mfg I',
    teacher: 'Kayes Sir',
    room: 'Room 317',
    type: 'theory',
  },
  {
    id: 'sat_p4_5',
    day: 'Saturday',
    periodId: 4,
    span: 2,
    code: 'ME 244',
    nickname: 'Solid Mech Lab',
    teacher: 'SA / NA',
    room: 'SM Lab',
    type: 'sessional',
  },

  // Sunday
  {
    id: 'sun_p2',
    day: 'Sunday',
    periodId: 2,
    span: 1,
    code: 'MATH 291',
    nickname: 'Diff Equations',
    teacher: 'Dr. Farhana',
    room: 'Room 317',
    type: 'theory',
  },
  {
    id: 'sun_p3',
    day: 'Sunday',
    periodId: 3,
    span: 1,
    code: 'ME 265',
    nickname: 'Thermal Eng',
    teacher: 'Prof. Tariq',
    room: 'Room 317',
    type: 'theory',
  },
  {
    id: 'sun_p7',
    day: 'Sunday',
    periodId: 7,
    span: 1,
    code: 'IPE 206',
    nickname: 'Mfg Lab I',
    teacher: 'Kayes / RH',
    room: 'Machine Tools Lab',
    type: 'sessional',
  },

  // Monday
  {
    id: 'mon_p1',
    day: 'Monday',
    periodId: 1,
    span: 1,
    code: 'ME 243',
    nickname: 'Solid Mech',
    teacher: "SA Ma'am",
    room: 'Room 317',
    type: 'theory',
  },
  {
    id: 'mon_p2',
    day: 'Monday',
    periodId: 2,
    span: 1,
    code: 'IPE 207',
    nickname: 'Operations Mgmt',
    teacher: 'SZ Sir',
    room: 'Room 317',
    type: 'theory',
  },
  {
    id: 'mon_p3',
    day: 'Monday',
    periodId: 3,
    span: 1,
    code: 'HUM 211',
    nickname: 'Sociology',
    teacher: 'NA',
    room: 'Room 317',
    type: 'theory',
  },
  {
    id: 'mon_p7',
    day: 'Monday',
    periodId: 7,
    span: 1,
    code: 'ME 266',
    nickname: 'Thermal Lab',
    teacher: 'Prof. Tariq',
    room: 'Heat Engine Lab',
    type: 'sessional',
  },

  // Tuesday
  {
    id: 'tue_p1',
    day: 'Tuesday',
    periodId: 1,
    span: 1,
    code: 'IPE 205',
    nickname: 'Mfg I',
    teacher: 'Kayes Sir',
    room: 'Room 317',
    type: 'theory',
  },
  {
    id: 'tue_p2',
    day: 'Tuesday',
    periodId: 2,
    span: 1,
    code: 'ME 265',
    nickname: 'Thermal Eng',
    teacher: 'Prof. Tariq',
    room: 'Room 317',
    type: 'theory',
  },
  {
    id: 'tue_p4',
    day: 'Tuesday',
    periodId: 4,
    span: 1,
    code: 'MATH 291',
    nickname: 'Diff Equations',
    teacher: 'Dr. Farhana',
    room: 'Room 317',
    type: 'theory',
  },

  // Wednesday
  {
    id: 'wed_p2',
    day: 'Wednesday',
    periodId: 2,
    span: 1,
    code: 'IPE 207',
    nickname: 'Operations Mgmt',
    teacher: 'SZ Sir',
    room: 'Room 317',
    type: 'theory',
  },
  {
    id: 'wed_p3',
    day: 'Wednesday',
    periodId: 3,
    span: 1,
    code: 'HUM 211',
    nickname: 'Sociology',
    teacher: 'NA',
    room: 'Room 317',
    type: 'theory',
  },
  {
    id: 'wed_p4_5',
    day: 'Wednesday',
    periodId: 4,
    span: 2,
    code: 'IPE 208',
    nickname: 'Metallurgy Lab',
    teacher: 'Dr. Kayes',
    room: 'Material Lab',
    type: 'sessional',
  },
];

// ---------------------------------------------------------------------------
// Component Props (Optional to allow standalone usage)
// ---------------------------------------------------------------------------
export interface ClassRoutineViewProps {
  initialTitle?: string;
  initialSlots?: RoutineSlot[];
  activeTab?: 'routine' | 'assessment' | 'courses' | 'analytics';
  onTabChange?: (tab: 'routine' | 'assessment' | 'courses' | 'analytics') => void;
  onUpdateSlots?: (slots: RoutineSlot[]) => void;
}

export const ClassRoutineView: React.FC<ClassRoutineViewProps> = ({
  initialTitle = 'Class Routine — Section A',
  initialSlots = SAMPLE_BUET_SLOTS,
  activeTab: controlledActiveTab,
  onTabChange,
  onUpdateSlots,
}) => {
  // Navigation State
  const [internalTab, setInternalTab] = useState<'routine' | 'assessment' | 'courses' | 'analytics'>('routine');
  const activeNavTab = controlledActiveTab ?? internalTab;

  // Routine Content State
  const [routineTitle, setRoutineTitle] = useState(initialTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [slots, setSlots] = useState<RoutineSlot[]>(initialSlots);

  // UI Dropdowns & Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Slot Editing State
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

  const timetableRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const menuDropdownRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleTabClick = (tab: 'routine' | 'assessment' | 'courses' | 'analytics') => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Sync external slots if prop changes
  useEffect(() => {
    if (initialSlots && initialSlots.length > 0) {
      setSlots(initialSlots);
    }
  }, [initialSlots]);

  // Open Edit Modal for a cell
  const handleCellClick = (day: DayOfWeek, periodId: number) => {
    const existing = slots.find((s) => s.day === day && s.periodId === periodId);
    if (existing) {
      setFormCode(existing.code);
      setFormNickname(existing.nickname);
      setFormTeacher(existing.teacher || '');
      setFormRoom(existing.room || '');
      setFormType(existing.type);
      setFormSpan(existing.span || 1);
    } else {
      setFormCode('');
      setFormNickname('');
      setFormTeacher('');
      setFormRoom('');
      setFormType(periodId === 7 ? 'sessional' : 'theory');
      setFormSpan(1);
    }
    setEditingCell({ day, periodId, existingSlot: existing });
  };

  // Save Slot
  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCell || !formCode.trim()) return;

    let updatedSlots = [...slots];

    // Remove existing if replacing or overlapping
    if (editingCell.existingSlot) {
      updatedSlots = updatedSlots.filter((s) => s.id !== editingCell.existingSlot!.id);
    }

    const newSlot: RoutineSlot = {
      id: editingCell.existingSlot ? editingCell.existingSlot.id : `slot_${Date.now()}`,
      day: editingCell.day,
      periodId: editingCell.periodId,
      span: formSpan,
      code: formCode.trim().toUpperCase(),
      nickname: formNickname.trim() || formCode.trim(),
      teacher: formTeacher.trim() || undefined,
      room: formRoom.trim() || undefined,
      type: formType,
    };

    updatedSlots.push(newSlot);
    setSlots(updatedSlots);
    if (onUpdateSlots) onUpdateSlots(updatedSlots);

    setEditingCell(null);
    showToast(`Updated ${newSlot.code}`);
  };

  // Delete Slot
  const handleDeleteSlot = () => {
    if (!editingCell?.existingSlot) return;
    const updated = slots.filter((s) => s.id !== editingCell.existingSlot!.id);
    setSlots(updated);
    if (onUpdateSlots) onUpdateSlots(updated);
    setEditingCell(null);
    showToast('Class removed');
  };

  // Load Sample Template
  const handleLoadSample = () => {
    setSlots(SAMPLE_BUET_SLOTS);
    if (onUpdateSlots) onUpdateSlots(SAMPLE_BUET_SLOTS);
    showToast('Loaded BUET IPE \'23 sample schedule');
  };

  // Clear Routine
  const handleClearRoutine = () => {
    setSlots([]);
    if (onUpdateSlots) onUpdateSlots([]);
    setIsMenuOpen(false);
    showToast('Routine cleared');
  };

  // Export as PNG
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
      link.download = `${routineTitle.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
      showToast('Exported routine as high-res PNG');
    } catch (err) {
      console.error(err);
      showToast('Failed to export PNG');
    } finally {
      setIsExporting(false);
    }
  };

  // Export as PDF
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
      pdf.save(`${routineTitle.replace(/\s+/g, '_')}.pdf`);
      showToast('Exported routine as clean PDF');
    } catch (err) {
      console.error(err);
      showToast('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e11] text-zinc-300 font-sans selection:bg-emerald-950 selection:text-emerald-200 antialiased flex flex-col">
      {/* ------------------------------------------------------------------- */}
      {/* 1. Single Unified Top Window Bar                                     */}
      {/* ------------------------------------------------------------------- */}
      <header className="h-12 border-b border-white/[0.06] bg-[#0d0e11] px-4 flex items-center justify-between select-none shrink-0 sticky top-0 z-30">
        {/* Left: App Title & Term Pill */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold tracking-tight text-zinc-100">
            BUET Tracker
          </span>
          <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] font-mono tabular-nums text-zinc-400">
            IPE '23 • L-2 T-1
          </span>
        </div>

        {/* Center: Clean Segmented Pill Navigation */}
        <nav className="flex items-center p-0.5 rounded-lg bg-zinc-900/90 border border-white/[0.06]">
          {(['routine', 'assessment', 'courses', 'analytics'] as const).map((tab) => {
            const isActive = activeNavTab === tab;
            const label = tab.charAt(0).toUpperCase() + tab.slice(1);
            return (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`px-3 py-1 rounded-md text-xs transition-colors duration-100 capitalize ${
                  isActive
                    ? 'bg-white/[0.08] text-zinc-100 font-medium shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* Right: Secondary Menu & Desktop Window Controls */}
        <div className="flex items-center gap-3">
          {/* Secondary '···' Icon Button */}
          <div className="relative" ref={menuDropdownRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] transition-colors"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-[#14151a] border border-white/[0.08] shadow-2xl p-1 z-40 text-xs">
                <button
                  onClick={() => {
                    handleLoadSample();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/[0.04] text-zinc-300 hover:text-zinc-100 transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Reset to Sample</span>
                </button>
                <button
                  onClick={handleClearRoutine}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-950/40 text-red-400 hover:text-red-300 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Timetable</span>
                </button>
              </div>
            )}
          </div>

          {/* Simulated Native Window Controls */}
          <div className="flex items-center gap-1.5 pl-2.5 border-l border-white/[0.08]">
            <span className="w-3 h-3 rounded-full bg-zinc-800 hover:bg-red-500/80 transition-colors cursor-pointer" />
            <span className="w-3 h-3 rounded-full bg-zinc-800 hover:bg-amber-500/80 transition-colors cursor-pointer" />
            <span className="w-3 h-3 rounded-full bg-zinc-800 hover:bg-emerald-500/80 transition-colors cursor-pointer" />
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------- */}
      {/* 2. Routine Action Bar (Minimal, Uncluttered)                         */}
      {/* ------------------------------------------------------------------- */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col space-y-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Editable Routine Title */}
          <div className="flex-1">
            {isEditingTitle ? (
              <input
                type="text"
                autoFocus
                value={routineTitle}
                onChange={(e) => setRoutineTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingTitle(false);
                }}
                className="bg-transparent text-lg font-semibold tracking-tight text-zinc-100 border-b border-white/20 focus:outline-none pb-0.5"
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-lg font-semibold tracking-tight text-zinc-100 hover:text-white cursor-pointer group flex items-center gap-2"
                title="Click to rename"
              >
                <span>{routineTitle}</span>
                <span className="opacity-0 group-hover:opacity-40 text-xs font-normal text-zinc-400">
                  ✎
                </span>
              </h1>
            )}
          </div>

          {/* Right: Exactly ONE Primary Action (Export ▾) + Understated Sample Button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleLoadSample}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors py-1.5 px-2"
            >
              Load Sample Template
            </button>

            {/* Single Export Dropdown */}
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

        {/* ------------------------------------------------------------------- */}
        {/* 3. The Timetable Grid (Saturday to Wednesday)                        */}
        {/* ------------------------------------------------------------------- */}
        <div
          ref={timetableRef}
          className="rounded-2xl border border-white/[0.06] bg-[#0d0e11] overflow-hidden shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left table-fixed min-w-[980px]">
              {/* Header Row: Periods 1 to 6, BREAK, Period 7 (Lab) */}
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#0d0e11]">
                  <th className="w-16 p-3 text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider text-center border-r border-white/[0.06]">
                    Day
                  </th>
                  {[1, 2, 3, 4, 5, 6].map((pId) => {
                    const p = PERIODS.find((item) => item.id === pId)!;
                    return (
                      <th
                        key={p.id}
                        className="p-3 border-r border-white/[0.06] w-[11.8%]"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-zinc-200">
                            {p.name}
                          </span>
                          <span className="text-[11px] font-mono tabular-nums text-zinc-400 mt-0.5">
                            {p.timeRange}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="w-14 p-2 text-center border-r border-white/[0.06] bg-zinc-950/30">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-mono tracking-widest text-amber-500/80 font-bold block">
                        RECESS
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400 block mt-0.5 tabular-nums">
                        1:30 - 2:30
                      </span>
                    </div>
                  </th>
                  <th className="p-3 w-56">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-zinc-200">
                        Period 7 (Lab Block)
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-zinc-400 mt-0.5">
                        2:30 - 5:00
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>

              {/* Day Rows: Saturday to Wednesday */}
              <tbody className="divide-y divide-white/[0.06]">
                {DAYS.map((day, dayIndex) => {
                  const spannedPeriodIds = new Set<number>();

                  return (
                    <tr key={day} className="h-28">
                      {/* Day Label Cell */}
                      <td className="w-16 p-3 text-center bg-[#0d0e11] select-none border-r border-white/[0.06] align-middle">
                        <span className="text-sm font-bold font-mono tracking-wider text-zinc-200 block uppercase">
                          {day.slice(0, 3)}
                        </span>
                      </td>

                      {/* Morning Periods (1 to 6) */}
                      {[1, 2, 3, 4, 5, 6].map((pId) => {
                        if (spannedPeriodIds.has(pId)) {
                          return null;
                        }

                        const slot = slots.find((s) => s.day === day && s.periodId === pId);
                        const span = slot?.span || 1;

                        if (span > 1) {
                          for (let i = 1; i < span; i++) {
                            spannedPeriodIds.add(pId + i);
                          }
                        }

                        const isSessional = slot?.type === 'sessional' || span > 1;

                        return (
                          <td
                            key={pId}
                            colSpan={span}
                            onClick={() => handleCellClick(day, pId)}
                            className={`p-2 border-r border-white/[0.06] transition-colors relative group align-top ${
                              slot
                                ? 'bg-zinc-900/30 hover:bg-zinc-800/40 cursor-pointer'
                                : 'hover:bg-white/[0.02] cursor-pointer'
                            }`}
                          >
                            {slot ? (
                              <div
                                className={`h-full min-h-[96px] rounded-xl p-3 flex flex-col justify-between border bg-zinc-900/90 hover:border-white/[0.14] transition-all relative ${
                                  isSessional
                                    ? 'border-violet-500/30 border-l-[3px] border-l-violet-400'
                                    : 'border-white/[0.06]'
                                }`}
                              >
                                {/* Line 1: Course Code & Optional Sessional/Lab tag (NO green theory badge!) */}
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className="text-sm font-bold font-mono tracking-tight text-white">
                                    {slot.code}
                                  </span>
                                  {isSessional && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-violet-500/15 text-violet-300 border border-violet-500/20">
                                      Lab
                                    </span>
                                  )}
                                </div>

                                {/* Line 2: Course Nickname */}
                                <div className="text-xs text-zinc-300 font-medium leading-snug mt-1 break-words">
                                  {slot.nickname}
                                </div>

                                {/* Line 3: Instructor & Room Tag */}
                                <div className="text-xs text-zinc-400 font-mono flex flex-wrap items-center gap-1.5 pt-1.5 mt-auto">
                                  <span>{slot.teacher || 'TBA'}</span>
                                  {slot.room && (
                                    <>
                                      <span className="text-zinc-600">•</span>
                                      <span className="text-zinc-400">{slot.room}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            ) : (
                              /* Empty Cell: Quiet hover with faint '+' icon */
                              <div className="h-full min-h-[96px] flex items-center justify-center">
                                <Plus className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Unbroken Recess Column */}
                      {dayIndex === 0 && (
                        <td
                          rowSpan={DAYS.length}
                          className="w-14 border-r border-white/[0.06] text-center bg-zinc-950/50 select-none p-2 align-middle"
                        >
                          <div className="h-full min-h-[520px] flex flex-col items-center justify-center gap-4">
                            <span className="text-[10px] font-mono font-semibold tracking-[0.25em] text-amber-500/80 [writing-mode:vertical-rl] rotate-180 uppercase select-none">
                              PRAYER & LUNCH BREAK
                            </span>
                            <span className="text-[9px] font-mono text-zinc-400 [writing-mode:vertical-rl] rotate-180 tabular-nums">
                              1:30 — 2:30 PM
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Period 7 (Afternoon Lab Slot) */}
                      {(() => {
                        const slot = slots.find((s) => s.day === day && s.periodId === 7);
                        return (
                          <td
                            onClick={() => handleCellClick(day, 7)}
                            className={`p-2 transition-colors relative group align-top ${
                              slot
                                ? 'bg-zinc-900/30 hover:bg-zinc-800/40 cursor-pointer'
                                : 'hover:bg-white/[0.02] cursor-pointer'
                            }`}
                          >
                            {slot ? (
                              <div className="h-full min-h-[96px] rounded-xl p-3 flex flex-col justify-between border border-violet-500/30 border-l-[3px] border-l-violet-400 bg-zinc-900/90 hover:border-white/[0.14] transition-all">
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className="text-sm font-bold font-mono tracking-tight text-white">
                                    {slot.code}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-violet-500/15 text-violet-300 border border-violet-500/20">
                                    Lab Block
                                  </span>
                                </div>
                                <div className="text-xs text-zinc-300 font-medium leading-snug mt-1 break-words">
                                  {slot.nickname}
                                </div>
                                <div className="text-xs text-zinc-400 font-mono flex flex-wrap items-center gap-1.5 pt-1.5 mt-auto">
                                  <span>{slot.teacher || 'Lab Instructors'}</span>
                                  {slot.room && (
                                    <>
                                      <span className="text-zinc-600">•</span>
                                      <span className="text-zinc-400">{slot.room}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="h-full min-h-[96px] flex items-center justify-center">
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
      </main>

      {/* ------------------------------------------------------------------- */}
      {/* 4. Slot Edit / Add Dialog (Subtle, Focused)                          */}
      {/* ------------------------------------------------------------------- */}
      {editingCell && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#14151a] border border-white/[0.08] shadow-2xl p-5 space-y-4">
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

              {/* Duration / Span (for morning periods) */}
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

              {/* Modal Action Buttons */}
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

      {/* ------------------------------------------------------------------- */}
      {/* 5. Minimalist Toast Notification                                     */}
      {/* ------------------------------------------------------------------- */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#181920] border border-white/[0.08] text-zinc-200 px-3.5 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-xs">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default ClassRoutineView;
