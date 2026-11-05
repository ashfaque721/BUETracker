import React, { useState, useMemo } from 'react';
import { useSemesterStore } from '../hooks/useSemesterStore';
import { SemesterStore, Course, ClassTest } from '../types/semester';
import {
  Plus,
  Trash2,
  ChevronRight,
  BookOpen,
  Info,
  X,
  Check,
} from 'lucide-react';

export interface AssessmentViewProps {
  store?: SemesterStore;
  // Optional fallback props for backwards compatibility
  courses?: Course[];
  onUpdateCourse?: (course: Course) => void;
}

// Official BUET Attendance Slabs (Ordinance Standard)
const BUET_ATTENDANCE_SLABS = [
  { min: 90, max: 100, points: 10, label: '≥ 90% (10/10 marks)' },
  { min: 85, max: 89.99, points: 9, label: '85% – 89% (9/10 marks)' },
  { min: 80, max: 84.99, points: 8, label: '80% – 84% (8/10 marks)' },
  { min: 75, max: 79.99, points: 7, label: '75% – 79% (7/10 marks)' },
  { min: 70, max: 74.99, points: 6, label: '70% – 74% (6/10 marks)' },
  { min: 65, max: 69.99, points: 5, label: '65% – 69% (5/10 marks)' },
  { min: 60, max: 64.99, points: 4, label: '60% – 64% (4/10 marks)' },
  { min: 0, max: 59.99, points: 0, label: '< 60% (Non-Collegiate / 0 marks)' },
];

const TARGET_GRADES = [
  { grade: 'A+', minPercentage: 80, gradePoint: 4.0 },
  { grade: 'A', minPercentage: 75, gradePoint: 3.75 },
  { grade: 'A-', minPercentage: 70, gradePoint: 3.5 },
  { grade: 'B+', minPercentage: 65, gradePoint: 3.25 },
  { grade: 'B', minPercentage: 60, gradePoint: 3.0 },
  { grade: 'B-', minPercentage: 55, gradePoint: 2.75 },
  { grade: 'C+', minPercentage: 50, gradePoint: 2.5 },
  { grade: 'C', minPercentage: 45, gradePoint: 2.25 },
  { grade: 'D', minPercentage: 40, gradePoint: 2.0 },
];

export const AssessmentView: React.FC<AssessmentViewProps> = ({ store: propStore }) => {
  // Use provided store or instantiate local hook
  const defaultStore = useSemesterStore('L-2 T-2');
  const store = propStore || defaultStore;

  const {
    currentTheoryCourses,
    addAttendance,
    addOrUpdateCT,
    setCourses,
  } = store;

  // Selected course code among currentTheoryCourses
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>(
    currentTheoryCourses[0]?.code || 'ME 243'
  );

  // Selected Target Grade for Term Final calculation (Default: A+)
  const [selectedTargetGrade, setSelectedTargetGrade] = useState<string>('A+');
  const [showAllThresholds, setShowAllThresholds] = useState<boolean>(false);
  const [showSlabsModal, setShowSlabsModal] = useState<boolean>(false);

  // New / Edit Class Test Form State
  const [isAddingCT, setIsAddingCT] = useState<boolean>(false);
  const [ctName, setCtName] = useState<string>('');
  const [ctScore, setCtScore] = useState<string>('');
  const [ctOutOf, setCtOutOf] = useState<string>('20');
  const [editingCTIndex, setEditingCTIndex] = useState<number | null>(null);

  // Ensure selected course exists in currentTheoryCourses
  const activeCourse = useMemo(() => {
    return (
      currentTheoryCourses.find((c) => c.code === selectedCourseCode) ||
      currentTheoryCourses[0]
    );
  }, [currentTheoryCourses, selectedCourseCode]);

  // Sync selectedCourseCode if courses list changes
  React.useEffect(() => {
    if (activeCourse && activeCourse.code !== selectedCourseCode) {
      setSelectedCourseCode(activeCourse.code);
    }
  }, [activeCourse, selectedCourseCode]);

  // ---------------------------------------------------------------------------
  // Calculations for Active Course
  // ---------------------------------------------------------------------------
  const courseCredits = activeCourse?.credits || 3.0;

  // 1. Attendance Metrics
  const attendedCount = activeCourse?.attendance?.attended ?? 0;
  const conductedCount = activeCourse?.attendance?.conducted ?? 0;
  const attendancePercentage =
    conductedCount > 0
      ? Math.round((attendedCount / conductedCount) * 1000) / 10
      : 100.0;

  // Match slab
  const matchedSlab = useMemo(() => {
    return (
      BUET_ATTENDANCE_SLABS.find(
        (s) => attendancePercentage >= s.min && attendancePercentage <= s.max
      ) || BUET_ATTENDANCE_SLABS[BUET_ATTENDANCE_SLABS.length - 1]
    );
  }, [attendancePercentage]);

  const slabPoints = matchedSlab.points; // out of 10
  const maxAttendanceMarks = courseCredits * 10; // 10% weight = 10 * credits
  const attendanceMarksObtained = (slabPoints / 10) * maxAttendanceMarks; // = slabPoints * credits
  const isNonCollegiate = attendancePercentage < 60;

  // Safe bunks to maintain 60% collegiate standing
  const safeBunksTo60 = useMemo(() => {
    if (conductedCount === 0 || attendancePercentage < 60) return 0;
    return Math.max(0, Math.floor(attendedCount / 0.6 - conductedCount));
  }, [attendedCount, conductedCount, attendancePercentage]);

  // 2. Class Test (CT) Metrics
  const classTests = useMemo(() => {
    return activeCourse?.classTests || [];
  }, [activeCourse]);

  const maxCTMarks = courseCredits * 20; // 20% weight = 20 * credits
  const bestCount = Math.max(1, classTests.length > 1 ? classTests.length - 1 : classTests.length);

  const countedCTs = useMemo(() => {
    return classTests.filter((t) => t.isCounted);
  }, [classTests]);

  const totalCTMarks = useMemo(() => {
    const sum = countedCTs.reduce((acc, t) => {
      const max = t.outOf > 0 ? t.outOf : 20;
      const normalized20 = (t.score / max) * 20;
      return acc + normalized20;
    }, 0);
    return Math.round(sum * 100) / 100;
  }, [countedCTs]);

  const ctAverageScore =
    countedCTs.length > 0 ? Math.round((totalCTMarks / countedCTs.length) * 100) / 100 : 0;

  // 3. Continuous Marks (30% Weight)
  const totalContinuousMarks = Math.round((attendanceMarksObtained + totalCTMarks) * 100) / 100;
  const maxContinuousMarks = courseCredits * 30; // 10 + 20 = 30 * credits

  // 4. Term Final Target (70% Weight) — Live Hero Card Calculation
  const maxTFMarks = courseCredits * 70; // 70 * credits (e.g. 210 for 3.0 cr, 280 for 4.0 cr)
  const totalCourseMarks = courseCredits * 100; // 100 * credits (e.g. 300 for 3.0 cr, 400 for 4.0 cr)

  const activeTargetScale =
    TARGET_GRADES.find((g) => g.grade === selectedTargetGrade) || TARGET_GRADES[0];

  const requiredCourseMarks = (activeTargetScale.minPercentage / 100) * totalCourseMarks;
  const rawTFMarksNeeded = Math.round((requiredCourseMarks - totalContinuousMarks) * 100) / 100;
  const requiredTFMarks = Math.max(0, rawTFMarksNeeded);
  const requiredTFPercentage =
    maxTFMarks > 0 ? Math.round((rawTFMarksNeeded / maxTFMarks) * 1000) / 10 : 0;

  const targetSectionA = Math.round((requiredTFMarks / 2) * 10) / 10;
  const targetSectionB = Math.round((requiredTFMarks / 2) * 10) / 10;

  // Grade threshold breakdown for progressive disclosure
  const gradeThresholds = useMemo(() => {
    return TARGET_GRADES.map((scale) => {
      const reqTotal = (scale.minPercentage / 100) * totalCourseMarks;
      const needed = Math.max(0, Math.round((reqTotal - totalContinuousMarks) * 10) / 10);
      const pct = maxTFMarks > 0 ? Math.round((needed / maxTFMarks) * 1000) / 10 : 0;
      return {
        ...scale,
        reqTotal,
        needed,
        pct,
      };
    });
  }, [totalCourseMarks, totalContinuousMarks, maxTFMarks]);

  // ---------------------------------------------------------------------------
  // Action Handlers Connected to Real State
  // ---------------------------------------------------------------------------
  const handleAttended = () => {
    if (!activeCourse) return;
    addAttendance(activeCourse.code, true);
  };

  const handleMissed = () => {
    if (!activeCourse) return;
    addAttendance(activeCourse.code, false);
  };

  const handleOpenAddCT = () => {
    setEditingCTIndex(null);
    setCtName(`CT ${classTests.length + 1}`);
    setCtScore('');
    setCtOutOf('20');
    setIsAddingCT(true);
  };

  const handleOpenEditCT = (idx: number, ct: ClassTest) => {
    setEditingCTIndex(idx);
    setCtName(ct.name || `CT ${idx + 1}`);
    setCtScore(String(ct.score));
    setCtOutOf(String(ct.outOf));
    setIsAddingCT(true);
  };

  const handleSaveCT = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse) return;

    const score = parseFloat(ctScore);
    const outOf = parseFloat(ctOutOf);

    if (isNaN(score) || isNaN(outOf) || outOf <= 0) return;

    const targetIndex = editingCTIndex !== null ? editingCTIndex : classTests.length;
    addOrUpdateCT(activeCourse.code, targetIndex, score, outOf);

    setIsAddingCT(false);
    setEditingCTIndex(null);
    setCtName('');
    setCtScore('');
    setCtOutOf('20');
  };

  const handleDeleteCT = (ctIndex: number) => {
    if (!activeCourse) return;
    const remaining = classTests.filter((_, idx) => idx !== ctIndex);
    // Recalculate best n using setCourses
    setCourses((prev) =>
      prev.map((c) => {
        if (c.code === activeCourse.code) {
          return {
            ...c,
            classTests: remaining,
          };
        }
        return c;
      })
    );
  };

  // Empty State: No theory courses in current term
  if (!activeCourse || currentTheoryCourses.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto py-16 text-center text-zinc-400 space-y-4 animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center mx-auto text-zinc-400">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-zinc-200">No Theory Courses Active</h3>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
          Switch to an active term or register theory courses to track continuous assessment and calculate Term Final targets.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in font-sans select-none">
      {/* ----------------------------------------------------------------- */}
      {/* 1. Clean Course Switcher Tabs (Top Row) — Filter ONLY Theory      */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          {currentTheoryCourses.map((c) => {
            const isSelected = c.code === activeCourse.code;
            return (
              <button
                key={c.code}
                onClick={() => setSelectedCourseCode(c.code)}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-800 text-white font-medium border border-white/10 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                {c.code}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowSlabsModal(true)}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer shrink-0 ml-3"
          title="View official BUET attendance ordinance slabs"
        >
          <Info className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ordinance Slabs</span>
        </button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 2-Column Responsive Layout                                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =============================================================== */}
        {/* Left Column: Streamlined Continuous Marks (30%)                 */}
        {/* =============================================================== */}
        <div className="lg:col-span-6 space-y-6">
          {/* A. Minimalist Attendance Section (10% Weight) */}
          <div className="bg-[#121316] border border-white/[0.06] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Attendance</h3>
              <span className="text-xs text-zinc-400 tabular-nums">10% Weight</span>
            </div>

            <div>
              <div className="text-3xl font-semibold tracking-tight text-white tabular-nums">
                {attendancePercentage.toFixed(1)}%
              </div>
              <p className="text-xs text-zinc-400 mt-1 tabular-nums">
                {slabPoints} / 10 marks • {safeBunksTo60} safe bunks available
              </p>
            </div>

            {/* Clean Horizontal Bar with 60% Tick Mark */}
            <div className="relative w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  attendancePercentage >= 60 ? 'bg-zinc-200' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, attendancePercentage)}%` }}
              />
              <div
                className="absolute top-0 bottom-0 w-[1px] bg-zinc-500 z-10"
                style={{ left: '60%' }}
                title="60% Non-Collegiate Line"
              />
            </div>

            {isNonCollegiate && (
              <p className="text-xs text-amber-400 font-medium">
                Attendance is below 60% — Non-collegiate risk
              </p>
            )}

            {/* Tactile + Attended and + Missed Buttons */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAttended}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors cursor-pointer border border-white/[0.08]"
                >
                  + Attended
                </button>
                <button
                  type="button"
                  onClick={handleMissed}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer border border-white/[0.04]"
                >
                  + Missed
                </button>
              </div>

              <span className="text-xs text-zinc-400 tabular-nums">
                {attendedCount} / {conductedCount} classes
              </span>
            </div>
          </div>

          {/* B. Clean Class Test (CT) Section (20% Weight) */}
          <div className="bg-[#121316] border border-white/[0.06] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Class Tests</h3>
              <span className="text-xs text-zinc-400 tabular-nums">20% Weight</span>
            </div>

            <p className="text-xs text-zinc-400 tabular-nums">
              Best {bestCount} of {classTests.length} counted • {totalCTMarks.toFixed(1)} /{' '}
              {maxCTMarks.toFixed(0)} marks ({ctAverageScore.toFixed(2)} / 20)
            </p>

            {/* CT Row Design (Clean, single-line list) */}
            <div className="space-y-1.5">
              {classTests.length === 0 ? (
                <p className="text-xs text-zinc-400 py-3 text-center">
                  No class tests recorded yet.
                </p>
              ) : (
                classTests.map((test, idx) => (
                  <div
                    key={test.id || idx}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors group ${
                      test.isCounted
                        ? 'bg-white/[0.02] text-zinc-200'
                        : 'text-zinc-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs min-w-0">
                      <span
                        className={`font-medium truncate ${
                          test.isCounted ? 'text-zinc-100' : 'line-through decoration-zinc-600'
                        }`}
                      >
                        {test.name || `CT ${idx + 1}`}
                      </span>
                      {!test.isCounted && (
                        <span className="text-[10px] text-zinc-400 font-normal">
                          Dropped
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 text-xs tabular-nums">
                      <span
                        onClick={() => handleOpenEditCT(idx, test)}
                        className={`cursor-pointer hover:underline ${
                          test.isCounted ? 'text-white font-medium' : 'text-zinc-400'
                        }`}
                        title="Click to edit score"
                      >
                        {test.score} / {test.outOf}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCT(idx)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-300 p-0.5 transition-opacity cursor-pointer"
                        title="Delete CT"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* + Add CT Form / Button */}
            {isAddingCT ? (
              <form
                onSubmit={handleSaveCT}
                className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg space-y-2.5 text-xs animate-fade-in"
              >
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="CT Name"
                    value={ctName}
                    onChange={(e) => setCtName(e.target.value)}
                    className="bg-zinc-800 border border-white/[0.08] rounded-md px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-zinc-500"
                  />
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Score"
                    required
                    value={ctScore}
                    onChange={(e) => setCtScore(e.target.value)}
                    className="bg-zinc-800 border border-white/[0.08] rounded-md px-2.5 py-1.5 text-zinc-100 text-xs tabular-nums focus:outline-none focus:border-zinc-500"
                  />
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Out of (20)"
                    required
                    value={ctOutOf}
                    onChange={(e) => setCtOutOf(e.target.value)}
                    className="bg-zinc-800 border border-white/[0.08] rounded-md px-2.5 py-1.5 text-zinc-100 text-xs tabular-nums focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingCT(false)}
                    className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-white rounded-md font-medium cursor-pointer"
                  >
                    {editingCTIndex !== null ? 'Update CT' : 'Save CT'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={handleOpenAddCT}
                className="w-full py-2 border border-dashed border-white/[0.08] hover:border-white/20 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add CT</span>
              </button>
            )}
          </div>
        </div>

        {/* =============================================================== */}
        {/* Right Column: Term Final Target (70%) — Focused Hero Card       */}
        {/* =============================================================== */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-[#121316] border border-white/[0.06] rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-sm font-medium text-white">Term Final Target</h3>
              <span className="text-xs text-zinc-400 tabular-nums">
                70% ({maxTFMarks.toFixed(0)} Marks)
              </span>
            </div>

            {/* Target Grade Switcher (Simple chip row) */}
            <div className="space-y-2">
              <span className="text-xs text-zinc-400 block">Select Target Grade:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {TARGET_GRADES.slice(0, 4).map((t) => {
                  const isSelected = selectedTargetGrade === t.grade;
                  return (
                    <button
                      key={t.grade}
                      type="button"
                      onClick={() => setSelectedTargetGrade(t.grade)}
                      className={`px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer tabular-nums ${
                        isSelected
                          ? 'bg-zinc-800 text-white font-medium border border-white/10'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'
                      }`}
                    >
                      {t.grade} ({t.minPercentage}%)
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hero Verdict Card — Live Recalculating (e.g. 155.5 / 210) */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 space-y-3">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider block">
                Target: {activeTargetScale.grade} ({activeTargetScale.gradePoint.toFixed(2)} GP)
              </span>

              <div>
                <div className="text-3xl font-semibold tracking-tight text-white tabular-nums">
                  {requiredTFMarks.toFixed(1)} / {maxTFMarks.toFixed(0)}
                </div>
                <p className="text-xs text-zinc-400 mt-1 tabular-nums">
                  {requiredTFPercentage.toFixed(1)}% required in final exam
                </p>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400 tabular-nums">
                <span>Section Split</span>
                <span className="text-zinc-300 font-medium">
                  ~{targetSectionA.toFixed(1)} in Section A • ~{targetSectionB.toFixed(1)} in Section B
                </span>
              </div>
            </div>

            {/* Continuous Marks Snapshot */}
            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-white/[0.06] tabular-nums">
              <span>Continuous Secured:</span>
              <span className="text-zinc-200 font-medium">
                {totalContinuousMarks.toFixed(1)} / {maxContinuousMarks} ({((totalContinuousMarks / maxContinuousMarks) * 100).toFixed(1)}%)
              </span>
            </div>

            {/* Progressive Disclosure: Grade Thresholds Table */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAllThresholds(!showAllThresholds)}
                className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors cursor-pointer py-1"
              >
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    showAllThresholds ? 'rotate-90' : ''
                  }`}
                />
                <span>
                  {showAllThresholds ? 'Hide grade thresholds' : 'View all grade thresholds'}
                </span>
              </button>

              {showAllThresholds && (
                <div className="mt-3 border border-white/[0.06] rounded-lg overflow-hidden animate-fade-in">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-zinc-400 bg-white/[0.02]">
                        <th className="p-2.5 font-medium">Grade</th>
                        <th className="p-2.5 font-medium text-right">Required (300)</th>
                        <th className="p-2.5 font-medium text-right">Final Exam ({maxTFMarks.toFixed(0)})</th>
                        <th className="p-2.5 font-medium text-right">Target %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] text-zinc-300 tabular-nums">
                      {gradeThresholds.map((row) => (
                        <tr
                          key={row.grade}
                          className={`hover:bg-white/[0.02] ${
                            row.grade === selectedTargetGrade ? 'bg-white/[0.04] text-white font-medium' : ''
                          }`}
                        >
                          <td className="p-2.5 font-semibold text-white">{row.grade}</td>
                          <td className="p-2.5 text-right text-zinc-400">{row.reqTotal.toFixed(0)}</td>
                          <td className="p-2.5 text-right font-medium text-white">{row.needed.toFixed(1)}</td>
                          <td className="p-2.5 text-right text-zinc-400">{row.pct.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Slabs Modal */}
      {showSlabsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#14151a] border border-white/[0.08] rounded-2xl shadow-2xl p-5 space-y-4 animate-modal-in text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="font-semibold text-white text-sm">BUET Attendance Ordinance</h3>
                <p className="text-zinc-400 text-[11px] mt-0.5">Continuous Assessment (10% Weight)</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSlabsModal(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {BUET_ATTENDANCE_SLABS.map((slab) => (
                <div
                  key={slab.label}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                    slab.points === slabPoints
                      ? 'bg-zinc-800 text-white font-medium border border-white/10'
                      : 'text-zinc-400'
                  }`}
                >
                  <span>{slab.label}</span>
                  <span className="tabular-nums font-semibold text-zinc-200">
                    {(slab.points * (courseCredits / 3)).toFixed(1)} / {(10 * (courseCredits / 3)).toFixed(1)} marks
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/[0.06] flex justify-end">
              <button
                type="button"
                onClick={() => setShowSlabsModal(false)}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
