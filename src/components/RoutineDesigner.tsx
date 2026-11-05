import React, { useState, useRef, useMemo } from 'react';
import {
  DayOfWeek,
  RoutineMetadata,
  RoutineSlot,
  Course,
  CourseType,
} from '../types';
import { SemesterStore } from '../types/semester';
import {
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { IPE_CURRICULUM_DATA } from '../utils/ipeCurriculum';

export interface RoutineDesignerProps {
  store?: SemesterStore;
  routine?: RoutineMetadata;
  courses?: Course[];
  currentSemesterId?: string;
  onUpdateRoutine?: (updated: RoutineMetadata) => void;
  onLoadSampleRoutine?: () => void;
  onStartBlank?: () => void;
}

const DAYS: DayOfWeek[] = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];

const PERIODS: { id: number; name: string; timeRange: string }[] = [
  { id: 1, name: 'Period 1', timeRange: '8:00 - 8:50' },
  { id: 2, name: 'Period 2', timeRange: '9:00 - 9:50' },
  { id: 3, name: 'Period 3', timeRange: '10:00 - 10:50' },
  { id: 4, name: 'Period 4', timeRange: '11:00 - 11:50' },
  { id: 5, name: 'Period 5', timeRange: '12:00 - 12:50' },
  { id: 6, name: 'Period 6', timeRange: '1:00 - 1:30' },
];

export const RoutineDesigner: React.FC<RoutineDesignerProps> = ({
  store,
  routine,
  courses = [],
  currentSemesterId,
  onUpdateRoutine,
}) => {
  const timetableRef = useRef<HTMLDivElement>(null);

  const activeCurriculum = currentSemesterId ? IPE_CURRICULUM_DATA[currentSemesterId] : null;
  const activeTermLabel = store?.currentTermId || activeCurriculum?.shortLabel || currentSemesterId || 'Term';

  // Normalize timetable slots: read from store.routineSlots if provided, else fallback to routine.slots
  const activeSlots = useMemo(() => {
    if (store) {
      return store.routineSlots.map((s) => ({
        id: s.id,
        day: s.day as DayOfWeek,
        periodId: s.periodIndex,
        span: s.details?.span || 1,
        courseId: undefined,
        customCode: s.courseCode,
        customNickname: s.details?.nickname || s.details?.title || s.courseCode,
        customTeacher: s.details?.teacher,
        customRoom: s.details?.room,
        type: s.details?.type,
      }));
    }
    return routine?.slots || [];
  }, [store, store?.routineSlots, routine?.slots]);

  // Filter courses strictly for the active semester (ZERO leakage from other terms)
  const semesterCourseOptions = useMemo(() => {
    if (store) {
      // Strictly isolated to currentTermId courses from useSemesterStore
      return store.currentCourses.map((c) => ({
        id: c.code,
        code: c.code,
        title: c.title,
        nickname: c.nickname || c.title,
        credits: c.credits,
        type: (c.type.toUpperCase() === 'SESSIONAL' ? 'sessional' : 'theory') as CourseType,
        teacher: c.teacher,
        room: c.room,
      }));
    }

    const map = new Map<
      string,
      {
        id?: string;
        code: string;
        title: string;
        nickname: string;
        credits: number;
        type: CourseType;
        teacher?: string;
        room?: string;
      }
    >();

    // 1. Official BUET IPE curriculum courses for this semester
    if (activeCurriculum) {
      for (const c of activeCurriculum.courses) {
        map.set(c.code, {
          id: `c_${currentSemesterId}_${c.code.replace(/[^a-zA-Z0-9]/g, '_')}`,
          code: c.code,
          title: c.title,
          nickname: c.nickname || c.title,
          credits: c.credits,
          type: c.type,
          teacher: c.teacher,
          room: c.room,
        });
      }
    }

    // 2. User's registered courses for this semester
    const matchingCourses = courses.filter(
      (c) => !currentSemesterId || c.semesterId === currentSemesterId
    );
    for (const c of matchingCourses) {
      map.set(c.code, {
        id: c.id,
        code: c.code,
        title: c.title,
        nickname: c.nickname || c.title,
        credits: c.credits,
        type: c.type,
        teacher: c.teacher,
        room: c.room,
      });
    }

    return Array.from(map.values());
  }, [store, store?.currentCourses, courses, currentSemesterId, activeCurriculum]);

  const theoryCourses = semesterCourseOptions.filter((c) => c.type === 'theory');
  const sessionalCourses = semesterCourseOptions.filter((c) => c.type === 'sessional');

  // Cell Edit Modal State
  const [editingCell, setEditingCell] = useState<{
    day: DayOfWeek;
    periodId: number;
    existingSlot?: (typeof activeSlots)[0];
  } | null>(null);

  const [formCode, setFormCode] = useState('');
  const [formNickname, setFormNickname] = useState('');
  const [formTeacher, setFormTeacher] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formType, setFormType] = useState<CourseType>('theory');
  const [formSpan, setFormSpan] = useState<number>(1);
  const [formCourseId, setFormCourseId] = useState<string>('');

  const handleCellClick = (day: DayOfWeek, periodId: number) => {
    const existing = activeSlots.find((s) => s.day === day && s.periodId === periodId);
    if (existing) {
      setFormCode(existing.customCode || '');
      setFormNickname(existing.customNickname || '');
      setFormTeacher(existing.customTeacher || '');
      setFormRoom(existing.customRoom || '');
      setFormSpan(existing.span || 1);
      setFormCourseId(existing.courseId || '');

      const matchedCourse = semesterCourseOptions.find(
        (c) => c.code === existing.customCode
      );
      setFormType(
        matchedCourse?.type ||
          (periodId === 7 || (existing.span && existing.span > 1) ? 'sessional' : 'theory')
      );
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

  const handleCourseSelect = (selectedCode: string) => {
    if (!selectedCode) {
      setFormCourseId('');
      return;
    }
    const selected = semesterCourseOptions.find((c) => c.code === selectedCode);
    if (selected) {
      setFormCode(selected.code);
      setFormNickname(selected.nickname || selected.title);
      setFormType(selected.type);
      setFormCourseId(selected.id || '');
      if (selected.teacher) setFormTeacher(selected.teacher);
      if (selected.room) setFormRoom(selected.room);

      if (selected.type === 'sessional' && editingCell && editingCell.periodId <= 5) {
        setFormSpan(3);
      } else if (selected.type === 'theory') {
        setFormSpan(1);
      }
    }
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCell || !formCode.trim()) return;

    const code = formCode.trim().toUpperCase();
    const title = formNickname.trim() || code;
    const teacher = formTeacher.trim() || undefined;
    const room = formRoom.trim() || undefined;
    const span = formSpan;
    const type = formType === 'sessional' ? 'SESSIONAL' : 'THEORY';

    if (store) {
      store.assignRoutineSlot(editingCell.day, editingCell.periodId, code, {
        title,
        nickname: title,
        teacher,
        room,
        span,
        type,
      });
    } else if (onUpdateRoutine && routine) {
      let updatedSlots = [...routine.slots];
      if (editingCell.existingSlot) {
        updatedSlots = updatedSlots.filter((s) => s.id !== editingCell.existingSlot!.id);
      }

      const newSlot: RoutineSlot = {
        id: editingCell.existingSlot ? editingCell.existingSlot.id : `slot_${Date.now()}`,
        day: editingCell.day,
        periodId: editingCell.periodId,
        span,
        courseId: formCourseId || undefined,
        customCode: code,
        customNickname: title,
        customTeacher: teacher,
        customRoom: room,
      };

      updatedSlots.push(newSlot);
      onUpdateRoutine({
        ...routine,
        slots: updatedSlots,
      });
    }

    setEditingCell(null);
  };

  const handleDeleteSlot = () => {
    if (!editingCell) return;

    if (store) {
      store.removeRoutineSlot(editingCell.day, editingCell.periodId);
    } else if (editingCell.existingSlot && onUpdateRoutine && routine) {
      const updatedSlots = routine.slots.filter((s) => s.id !== editingCell.existingSlot!.id);
      onUpdateRoutine({
        ...routine,
        slots: updatedSlots,
      });
    }

    setEditingCell(null);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* ----------------------------------------------------------------- */}
      {/* Hero Workspace: Centered Timetable Grid                            */}
      {/* ----------------------------------------------------------------- */}
      <div
        id="buet-timetable-grid"
        ref={timetableRef}
        className="w-full rounded-2xl border border-white/[0.06] bg-[#0d0e11] overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse table-fixed min-w-[1040px]">
            {/* Header: Day, Periods 1-6, RECESS, Period 7 (Lab) */}
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#0d0e11]">
                {/* Day Header (SAT..WED) */}
                <th className="w-16 p-2.5 text-center border-r border-white/[0.06]">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                    Day
                  </span>
                </th>

                {/* Periods 1 to 6 */}
                {PERIODS.map((p) => (
                  <th
                    key={p.id}
                    className="p-2.5 border-r border-white/[0.06] w-[12%] text-center"
                  >
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-semibold text-zinc-300">
                        {p.name}
                      </span>
                      <span className="text-xs text-zinc-400 font-normal tabular-nums mt-0.5">
                        {p.timeRange}
                      </span>
                    </div>
                  </th>
                ))}

                {/* Continuous Recess Header */}
                <th className="w-14 p-2 text-center border-r border-white/[0.06] bg-zinc-950/40">
                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] tracking-widest text-amber-500/80 font-bold block">
                      RECESS
                    </span>
                    <span className="text-xs text-zinc-400 font-normal tabular-nums block mt-0.5">
                      1:30 - 2:30
                    </span>
                  </div>
                </th>

                {/* Period 7 (Afternoon Lab Block) */}
                <th className="p-2.5 w-52 text-center">
                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-semibold text-zinc-300">
                      Period 7 (Lab)
                    </span>
                    <span className="text-xs text-zinc-400 font-normal tabular-nums mt-0.5">
                      2:30 - 5:00
                    </span>
                  </div>
                </th>
              </tr>
            </thead>

            {/* Rows: Saturday to Wednesday */}
            <tbody className="divide-y divide-white/[0.06]">
              {DAYS.map((day, dayIndex) => {
                const spannedPeriodIds = new Set<number>();

                return (
                  <tr key={day} className="h-28">
                    {/* Day Column (Left): SAT, SUN, MON, TUE, WED */}
                    <td className="w-16 p-2.5 text-center bg-[#0d0e11] select-none border-r border-white/[0.06] align-middle">
                      <span className="text-sm font-bold tracking-wider text-zinc-200 block uppercase">
                        {day.slice(0, 3)}
                      </span>
                    </td>

                    {/* Periods 1 to 6 */}
                    {[1, 2, 3, 4, 5, 6].map((pId) => {
                      if (spannedPeriodIds.has(pId)) {
                        return null;
                      }

                      const slot = activeSlots.find((s) => s.day === day && s.periodId === pId);
                      const span = slot?.span || 1;

                      if (span > 1) {
                        for (let i = 1; i < span; i++) {
                          spannedPeriodIds.add(pId + i);
                        }
                      }

                      // Match associated course type if available
                      const matchedCourse = semesterCourseOptions.find(
                        (c) => c.code === slot?.customCode
                      );
                      const isSessional =
                        (slot as any)?.type === 'SESSIONAL' ||
                        (slot as any)?.type === 'sessional' ||
                        matchedCourse?.type === 'sessional' ||
                        span > 1 ||
                        /lab|sessional|drawing|shop/i.test(slot?.customNickname || '');

                      return (
                        <td
                          key={pId}
                          colSpan={span}
                          onClick={() => handleCellClick(day, pId)}
                          className={`p-1.5 border-r border-white/[0.06] transition-colors align-middle cursor-pointer ${
                            slot
                              ? 'bg-zinc-900/30 hover:bg-zinc-800/40'
                              : 'hover:bg-white/[0.02]'
                          }`}
                        >
                          {slot ? (
                            <div
                              className={`h-full min-h-[96px] rounded-xl border bg-zinc-900/90 hover:border-white/[0.14] transition-all flex flex-col items-center justify-center text-center p-2.5 cursor-pointer relative ${
                                isSessional
                                  ? 'border-violet-500/30 border-l-[3px] border-l-violet-400'
                                  : 'border-white/[0.06]'
                              }`}
                            >
                              {/* Line 1 (Course Code): Bold 14px, high-contrast */}
                              <span className="text-white font-semibold text-sm block">
                                {slot.customCode || 'CLASS'}
                              </span>

                              {/* Line 2 (Topic): Regular 12px, muted text */}
                              <span className="text-zinc-300 text-xs mt-0.5 block truncate max-w-full font-normal">
                                {(slot.customNickname || slot.customCode || '').replace(/^\(|\)$/g, '')}
                              </span>

                              {/* Line 3 (Teacher): Regular 11px/12px, soft gray (NO room numbers!) */}
                              <span className="text-zinc-400 text-xs mt-1 block truncate max-w-full font-normal">
                                {slot.customTeacher || 'TBA'}
                              </span>
                            </div>
                          ) : (
                            /* Empty Slot with Subtle Hairline Outline */
                            <div className="h-full min-h-[96px] rounded-xl border border-white/[0.05] hover:border-white/[0.12] hover:bg-white/[0.02] flex items-center justify-center transition-all cursor-pointer group">
                              <Plus className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Unbroken Recess Column: Single continuous vertical divider running down the entire 5 days */}
                    {dayIndex === 0 && (
                      <td
                        rowSpan={DAYS.length}
                        className="w-14 border-r border-white/[0.06] text-center bg-zinc-950/50 select-none p-2 align-middle"
                      >
                        <div className="h-full min-h-[520px] flex flex-col items-center justify-center gap-4">
                          <span className="text-[10px] font-semibold tracking-[0.25em] text-amber-500/80 [writing-mode:vertical-rl] rotate-180 uppercase select-none">
                            PRAYER & LUNCH BREAK
                          </span>
                          <span className="text-xs text-zinc-400 [writing-mode:vertical-rl] rotate-180 tabular-nums">
                            1:30 — 2:30 PM
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Period 7 (Afternoon Lab Slot: 2:30 - 5:00) */}
                    {(() => {
                      const slot = activeSlots.find((s) => s.day === day && s.periodId === 7);
                      return (
                        <td
                          onClick={() => handleCellClick(day, 7)}
                          className={`p-1.5 transition-colors align-middle cursor-pointer ${
                            slot
                              ? 'bg-zinc-900/30 hover:bg-zinc-800/40'
                              : 'hover:bg-white/[0.02]'
                          }`}
                        >
                          {slot ? (
                            <div className="h-full min-h-[96px] rounded-xl border border-violet-500/30 border-l-[3px] border-l-violet-400 bg-zinc-900/90 hover:border-white/[0.14] transition-all flex flex-col items-center justify-center text-center p-2.5 cursor-pointer relative">
                              {/* Line 1 (Course Code): Bold 14px, high-contrast */}
                              <span className="text-white font-semibold text-sm block">
                                {slot.customCode || 'LAB'}
                              </span>

                              {/* Line 2 (Topic): Regular 12px, muted text */}
                              <span className="text-zinc-300 text-xs mt-0.5 block truncate max-w-full font-normal">
                                {(slot.customNickname || slot.customCode || '').replace(/^\(|\)$/g, '')}
                              </span>

                              {/* Line 3 (Teacher): Regular 11px/12px, soft gray (NO room numbers!) */}
                              <span className="text-zinc-400 text-xs mt-1 block truncate max-w-full font-normal">
                                {slot.customTeacher || 'Lab Instructors'}
                              </span>
                            </div>
                          ) : (
                            /* Empty Lab Slot with Subtle Hairline Outline */
                            <div className="h-full min-h-[96px] rounded-xl border border-white/[0.05] hover:border-white/[0.12] hover:bg-white/[0.02] flex items-center justify-center transition-all cursor-pointer group">
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
      {/* Slot Edit / Add Dialog                                             */}
      {/* ----------------------------------------------------------------- */}
      {editingCell && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#14151a] border border-white/[0.08] shadow-2xl p-5 space-y-4 animate-modal-in">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-xs font-semibold text-zinc-100">
                  {editingCell.existingSlot ? 'Edit Class Slot' : 'Add Class'}
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {editingCell.day} • {editingCell.periodId === 7 ? 'Period 7 (Lab)' : `Period ${editingCell.periodId}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-3.5 text-xs">
              {/* Course Dropdown Filtered to Current Semester */}
              <div>
                <label className="block text-zinc-400 font-medium mb-1 text-[11px] flex items-center justify-between">
                  <span>
                    Course Dropdown ({activeTermLabel})
                  </span>
                  <span className="text-[10px] text-emerald-400 font-normal">Auto-fills slot</span>
                </label>
                <select
                  value={formCode}
                  onChange={(e) => handleCourseSelect(e.target.value)}
                  className="w-full bg-[#1b1d24] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-white/20 transition-colors cursor-pointer text-xs"
                >
                  <option value="">-- Select {activeTermLabel} Course or Enter Below --</option>
                  {theoryCourses.length > 0 && (
                    <optgroup label="Theory Courses (Continuous Assessment)">
                      {theoryCourses.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} — {c.nickname || c.title} ({c.credits.toFixed(1)} cr)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {sessionalCourses.length > 0 && (
                    <optgroup label="Sessional / Lab Courses">
                      {sessionalCourses.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} — {c.nickname || c.title} ({c.credits.toFixed(2)} cr)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

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
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 text-zinc-100 uppercase focus:outline-none focus:border-white/20 transition-colors"
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
                    className={`py-1.5 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      formType === 'theory'
                        ? 'bg-white/[0.08] text-zinc-100 border-white/20'
                        : 'bg-white/[0.02] text-zinc-400 border-white/[0.06] hover:bg-white/[0.04]'
                    }`}
                  >
                    Theory
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('sessional')}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      formType === 'sessional'
                        ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
                        : 'bg-white/[0.02] text-zinc-400 border-white/[0.06] hover:bg-white/[0.04]'
                    }`}
                  >
                    Sessional / Lab
                  </button>
                </div>
              </div>

              {/* Teacher Initials */}
              <div>
                <label className="block text-zinc-400 font-medium mb-1 text-[11px]">
                  Teacher Initials
                </label>
                <input
                  type="text"
                  placeholder="e.g. SA Ma'am, Kayes Sir"
                  value={formTeacher}
                  onChange={(e) => setFormTeacher(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>

              {/* Duration / Span (for morning periods 1-5) */}
              {editingCell.periodId <= 5 && (
                <div>
                  <label className="block text-zinc-400 font-medium mb-1 text-[11px]">
                    Period Duration
                  </label>
                  <div className="flex items-center gap-3">
                    {[1, 2, 3].map((num) => (
                      <label key={num} className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                        <input
                          type="radio"
                          name="periodSpan"
                          value={num}
                          checked={formSpan === num}
                          onChange={() => setFormSpan(num)}
                          className="accent-violet-500 cursor-pointer"
                        />
                        <span>{num} {num === 1 ? 'Period (50m)' : `Periods (${num * 50}m)`}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                {editingCell.existingSlot ? (
                  <button
                    type="button"
                    onClick={handleDeleteSlot}
                    className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs py-1.5 px-2 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Slot</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCell(null)}
                    className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-medium transition-colors shadow-xs cursor-pointer"
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
