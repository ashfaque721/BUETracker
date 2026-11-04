import React, { useState } from 'react';
import { Course } from '../types';
import {
  calculateAttendance,
  calculateClassTests,
  evaluateCourseAssessment,
} from '../utils/buetOrdinance';
import {
  Award,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  TrendingUp,
  Percent,
  CheckSquare,
  ShieldCheck,
  Flame,
  HelpCircle,
  Calculator,
  ChevronRight,
  BookOpen,
  RotateCcw,
  Info,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OrdinanceEngineProps {
  courses: Course[];
  onUpdateCourse: (updated: Course) => void;
}

export const OrdinanceEngine: React.FC<OrdinanceEngineProps> = ({
  courses,
  onUpdateCourse,
}) => {
  const ongoingTheoryCourses = courses.filter((c) => c.isOngoing && c.type === 'theory');

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    ongoingTheoryCourses[0]?.id || ''
  );
  const [showSlabsModal, setShowSlabsModal] = useState(false);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // New CT Input State
  const [newCTName, setNewCTName] = useState('');
  const [newCTObtained, setNewCTObtained] = useState('');
  const [newCTMax, setNewCTMax] = useState('20');
  const [isAddingCT, setIsAddingCT] = useState(false);

  // Quick Attendance Updates
  const handleAttendanceIncrement = (conductedDelta: number, attendedDelta: number) => {
    if (!selectedCourse) return;

    const currentConducted = selectedCourse.attendance?.totalConducted || 0;
    const currentAttended = selectedCourse.attendance?.attended || 0;

    const nextConducted = Math.max(0, currentConducted + conductedDelta);
    const nextAttended = Math.max(0, Math.min(nextConducted, currentAttended + attendedDelta));

    onUpdateCourse({
      ...selectedCourse,
      attendance: {
        totalConducted: nextConducted,
        attended: nextAttended,
      },
    });
  };

  const handleResetAttendance = () => {
    if (!selectedCourse) return;
    if (window.confirm(`Reset attendance records for ${selectedCourse.code}?`)) {
      onUpdateCourse({
        ...selectedCourse,
        attendance: { totalConducted: 0, attended: 0 },
      });
    }
  };

  const handleAddClassTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    const obtained = parseFloat(newCTObtained);
    const max = parseFloat(newCTMax);

    if (isNaN(obtained) || isNaN(max) || max <= 0) return;

    const currentTests = selectedCourse.classTests || [];
    const newTest = {
      id: `ct_${Date.now()}`,
      name: newCTName.trim() || `CT ${currentTests.length + 1}`,
      obtainedMarks: obtained,
      maxMarks: max,
      date: new Date().toISOString().slice(0, 10),
    };

    onUpdateCourse({
      ...selectedCourse,
      classTests: [...currentTests, newTest],
    });

    setNewCTName('');
    setNewCTObtained('');
    setNewCTMax('20');
    setIsAddingCT(false);
  };

  const handleDeleteCT = (ctId: string) => {
    if (!selectedCourse) return;
    onUpdateCourse({
      ...selectedCourse,
      classTests: (selectedCourse.classTests || []).filter((ct) => ct.id !== ctId),
    });
  };

  const handleToggleCustomBestCount = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCourse) return;
    onUpdateCourse({
      ...selectedCourse,
      useCustomBestCount: e.target.checked,
      customBestCount: e.target.checked
        ? selectedCourse.customBestCount || Math.round(selectedCourse.credits)
        : undefined,
    });
  };

  const handleChangeCustomBestCount = (val: number) => {
    if (!selectedCourse) return;
    onUpdateCourse({
      ...selectedCourse,
      customBestCount: Math.max(1, val),
    });
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  if (ongoingTheoryCourses.length === 0) {
    return (
      <div className="surface-card p-12 text-center text-slate-400 space-y-4 max-w-md mx-auto mt-12 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-slate-400">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">No Ongoing Theory Courses</h3>
          <p className="text-xs text-slate-400 mt-1">
            Register your current semester theory courses in the Course Manager to calculate continuous assessment and term final mark targets.
          </p>
        </div>
      </div>
    );
  }

  const assessment = selectedCourse ? evaluateCourseAssessment(selectedCourse) : null;

  const BUET_SLABS = [
    { range: '≥ 90%', points: 10, marks: '100% of Attendance Marks' },
    { range: '85% – 89%', points: 9, marks: '90%' },
    { range: '80% – 84%', points: 8, marks: '80%' },
    { range: '75% – 79%', points: 7, marks: '70%' },
    { range: '70% – 74%', points: 6, marks: '60%' },
    { range: '65% – 69%', points: 5, marks: '50%' },
    { range: '60% – 64%', points: 4, marks: '40%' },
    { range: '< 60%', points: 0, marks: '0 (Non-Collegiate / Debarred)' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Course Selector Ribbon */}
      <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#0f131f]/80 backdrop-blur-md border border-white/[0.08] shadow-md">
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {ongoingTheoryCourses.map((c) => {
            const isSelected = c.id === selectedCourseId;
            const cAss = evaluateCourseAssessment(c);
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCourseId(c.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-white/12 text-white shadow-sm border border-white/12'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: c.color || '#3b82f6' }}
                />
                <span className="font-bold">{c.code}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {c.credits}cr • {cAss.attendance.percentage}%
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowSlabsModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] border border-white/[0.06] transition whitespace-nowrap"
        >
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline font-medium">Ordinance Slabs</span>
        </button>
      </div>

      {selectedCourse && assessment && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Continuous Assessment (30% Weight) */}
          <div className="lg:col-span-6 space-y-4">
            {/* 1. Attendance Engine (10%) */}
            <div className="surface-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-tight">
                      1. Attendance Engine (10% Weight)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Total Marks: {assessment.attendance.maxAttendanceMarks.toFixed(1)} ({selectedCourse.credits} cr × 10)
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-emerald-400">
                    {assessment.attendance.attendanceMarks.toFixed(1)} / {assessment.attendance.maxAttendanceMarks.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {assessment.attendance.slabPoints}/10 Slab Points
                  </div>
                </div>
              </div>

              {/* Attendance Progress & Metrics */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-300 font-medium">Class Attendance Ratio</span>
                  <div className="flex items-baseline gap-2 font-mono">
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {assessment.attendance.percentage}%
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({selectedCourse.attendance?.attended || 0} attended / {selectedCourse.attendance?.totalConducted || 0} total)
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      assessment.attendance.percentage >= 90
                        ? 'bg-emerald-500'
                        : assessment.attendance.percentage >= 75
                        ? 'bg-blue-500'
                        : assessment.attendance.percentage >= 60
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, assessment.attendance.percentage)}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-400 z-10"
                    style={{ left: '60%' }}
                    title="60% Non-Collegiate Line"
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                  <span>0%</span>
                  <span className="text-rose-400 font-semibold">60% Debarment Line</span>
                  <span className="text-emerald-400 font-semibold">90% Full Marks</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Non-Collegiate Warning */}
              {assessment.attendance.isNonCollegiate && (
                <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-900/60 text-xs text-rose-300 flex items-start gap-2.5 shadow-md">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Non-Collegiate / Debarred:</strong> Current attendance is below 60%. Under BUET ordinance, term final examination admit card will be withheld.
                  </p>
                </div>
              )}

              {/* Safe Bunks & Next Slab Pill Boxes */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[11px] text-slate-400 block font-medium">Safe Bunks Buffer</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className={`text-2xl font-bold font-mono ${
                      assessment.attendance.safeBunksTo60 > 5 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {assessment.attendance.safeBunksTo60}
                    </span>
                    <span className="text-[11px] text-slate-400">classes</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Can miss before hitting 60%
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[11px] text-slate-400 block font-medium">Classes to Next Slab</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-bold font-mono text-blue-400">
                      {assessment.attendance.classesNeededForNextSlab}
                    </span>
                    <span className="text-[11px] text-slate-400">classes</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Consecutive attendance needed
                  </span>
                </div>
              </div>

              {/* Quick Stepper Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAttendanceIncrement(1, 1)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 text-xs font-semibold transition"
                  >
                    +1 Attended
                  </button>
                  <button
                    onClick={() => handleAttendanceIncrement(1, 0)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/60 text-xs font-semibold transition"
                  >
                    +1 Bunked
                  </button>
                </div>

                <button
                  onClick={handleResetAttendance}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition"
                  title="Reset attendance records"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Class Test (CT) Engine (20%) */}
            <div className="surface-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-950/80 border border-blue-800/80 flex items-center justify-center text-blue-400">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-tight">
                      2. Class Test (CT) Engine (20% Weight)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Rule: Best {assessment.classTests.bestCount} of {assessment.classTests.tests.length} tests counted ({selectedCourse.credits} cr × 20)
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-blue-400">
                    {assessment.classTests.totalCTMarks.toFixed(1)} / {assessment.classTests.maxCTMarks.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {assessment.classTests.ctPercentage.toFixed(1)}% Mean
                  </div>
                </div>
              </div>

              {/* Class Test List */}
              <div className="space-y-2">
                {assessment.classTests.tests.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    No Class Tests added yet. Click below to add CT scores.
                  </div>
                ) : (
                  assessment.classTests.tests.map((test) => (
                    <div
                      key={test.id}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs transition ${
                        test.isCounted
                          ? 'bg-white/[0.03] border-white/[0.08]'
                          : 'bg-transparent border-white/[0.03] opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-white">{test.name}</span>
                        {test.isCounted ? (
                          <span className="text-[9px] px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800/70 font-semibold">
                            ✓ Counted
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/[0.04] text-slate-400 line-through">
                            Dropped
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-mono">
                          ({test.obtainedMarks}/{test.maxMarks})
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-blue-300 font-bold">
                          {test.normalizedScore.toFixed(1)}/20
                        </span>
                        <button
                          onClick={() => handleDeleteCT(test.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition"
                          title="Delete CT"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add CT Controls */}
              {isAddingCT ? (
                <form
                  onSubmit={handleAddClassTest}
                  className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3 animate-fade-in text-xs"
                >
                  <div className="grid grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      placeholder="CT Name (e.g. CT 1)"
                      value={newCTName}
                      onChange={(e) => setNewCTName(e.target.value)}
                      className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Obtained (18)"
                      value={newCTObtained}
                      onChange={(e) => setNewCTObtained(e.target.value)}
                      required
                      className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Max (20)"
                      value={newCTMax}
                      onChange={(e) => setNewCTMax(e.target.value)}
                      required
                      className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingCT(false)}
                      className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xs"
                    >
                      Save CT
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingCT(true)}
                  className="w-full py-2.5 border border-dashed border-white/[0.1] hover:border-white/25 rounded-xl text-xs text-slate-300 hover:text-white transition flex items-center justify-center gap-2 bg-white/[0.01]"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-medium">Add Class Test</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Term Final Target Matrix (70% Weight) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="surface-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-800/80 flex items-center justify-center text-amber-400">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-tight">
                      3. Term Final Target Calculator (70% Weight)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Total Course Marks: {assessment.totalCourseMarks.toFixed(0)} • Max TF Exam: {assessment.maxTFMarks.toFixed(0)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-amber-400">
                    {assessment.continuousMarksObtained.toFixed(1)} / {assessment.maxContinuousMarks.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Secured (30% Continuous)
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[11px] font-semibold text-slate-400">
                      <th className="pb-2.5">Target Grade</th>
                      <th className="pb-2.5 text-center">Needed in TF (70n)</th>
                      <th className="pb-2.5 text-center">Exam %</th>
                      <th className="pb-2.5 text-center">Sec A + Sec B Split</th>
                      <th className="pb-2.5 text-right">Feasibility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] font-mono">
                    {assessment.tfTargets.map((target) => {
                      const isAPlus = target.grade === 'A+';
                      return (
                        <tr
                          key={target.grade}
                          onClick={() => {
                            if (target.status === 'achievable' || target.status === 'secured') {
                              triggerCelebration();
                            }
                          }}
                          className={`hover:bg-white/[0.03] transition cursor-pointer ${
                            isAPlus ? 'bg-red-950/15' : ''
                          }`}
                        >
                          <td className="py-2.5 font-sans">
                            <span className="font-bold text-white text-xs">{target.grade}</span>
                            <span className="text-[10px] text-slate-400 ml-1.5">({target.gradePoint.toFixed(2)})</span>
                          </td>

                          <td className="py-2.5 text-center font-bold text-white">
                            {target.requiredTFMarks.toFixed(1)} <span className="text-slate-500 font-normal">/ {target.maxTFMarks.toFixed(0)}</span>
                          </td>

                          <td className="py-2.5 text-center font-semibold text-slate-300">
                            {target.requiredTFPercentage.toFixed(1)}%
                          </td>

                          <td className="py-2.5 text-center text-amber-300 font-medium">
                            {target.targetSectionA.toFixed(1)} + {target.targetSectionB.toFixed(1)}
                          </td>

                          <td className="py-2.5 text-right font-sans">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              target.status === 'secured'
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                                : target.status === 'achievable'
                                ? 'bg-blue-950/80 text-blue-400 border border-blue-800/60'
                                : target.status === 'demanding'
                                ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                                : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                            }`}>
                              {target.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[11px] text-slate-400 flex items-center justify-between">
                <span>* Section A & B are split 50/50 under BUET term final regulations.</span>
                <span className="text-amber-400 font-medium">Auto-Normalized</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slabs Reference Modal */}
      {showSlabsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in no-print">
          <div className="bg-[#101422] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-xs font-bold text-white">BUET Official Attendance Slabs</h3>
              <button onClick={() => setShowSlabsModal(false)} className="text-slate-400 hover:text-white text-xs p-1">
                ✕
              </button>
            </div>

            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-400 text-[10px] font-semibold">
                  <th className="pb-2">Attendance Range</th>
                  <th className="pb-2 text-center">Points</th>
                  <th className="pb-2 text-right">Awarded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] font-mono text-[11px]">
                {BUET_SLABS.map((s) => (
                  <tr key={s.range}>
                    <td className="py-2 text-white font-medium">{s.range}</td>
                    <td className="py-2 text-center font-bold text-emerald-400">{s.points}/10</td>
                    <td className="py-2 text-right text-slate-400 font-sans">{s.marks}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSlabsModal(false)}
                className="px-4 py-1.5 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/15 transition"
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
