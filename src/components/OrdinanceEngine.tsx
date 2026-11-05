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
  Sliders,
  Play,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OrdinanceEngineProps {
  courses: Course[];
  onUpdateCourse: (updated: Course) => void;
  onLoadSampleRoutine?: () => void;
}

export const OrdinanceEngine: React.FC<OrdinanceEngineProps> = ({
  courses,
  onUpdateCourse,
  onLoadSampleRoutine,
}) => {
  const ongoingTheoryCourses = courses.filter((c) => c.isOngoing && c.type === 'theory');

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    ongoingTheoryCourses[0]?.id || ''
  );
  const [selectedTargetGrade, setSelectedTargetGrade] = useState<string>('A+');
  const [showSlabsModal, setShowSlabsModal] = useState(false);
  const [showCTTooltip, setShowCTTooltip] = useState(false);
  const [showAttTooltip, setShowAttTooltip] = useState(false);

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
      <div className="surface-card p-12 text-center text-zinc-400 space-y-4 max-w-lg mx-auto mt-10 shadow-xl animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center mx-auto text-zinc-300">
          <BookOpen className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold tracking-tight text-zinc-100">No Ongoing Theory Courses</h3>
          <p className="text-sm text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
            Register your current semester theory courses in the Course Manager or click below to populate the official Level-2 Term-1 sample.
          </p>
        </div>
        {onLoadSampleRoutine && (
          <button
            onClick={onLoadSampleRoutine}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition btn-tactile"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Load Sample IPE Courses & Routine</span>
          </button>
        )}
      </div>
    );
  }

  const assessment = selectedCourse ? evaluateCourseAssessment(selectedCourse) : null;

  // Find active target row for large highlight card
  const activeTargetRow = assessment?.tfTargets.find((t) => t.grade === selectedTargetGrade) || assessment?.tfTargets[0];

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
    <div className="space-y-5">
      {/* Course Selector Ribbon */}
      <div className="flex items-center justify-between gap-3 p-2.5 surface-card">
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {ongoingTheoryCourses.map((c) => {
            const isSelected = c.id === selectedCourseId;
            const cAss = evaluateCourseAssessment(c);
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCourseId(c.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap btn-tactile ${
                  isSelected
                    ? 'bg-zinc-800 text-zinc-100 shadow-xs border border-white/10'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: c.color || '#3b82f6' }}
                />
                <span className="tabular-nums font-bold">{c.code}</span>
                <span className="text-xs text-zinc-400 tabular-nums font-normal">
                  {c.credits}cr • {cAss.attendance.percentage}%
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowSlabsModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-white/[0.08] transition whitespace-nowrap btn-tactile"
        >
          <Info className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline font-medium">Ordinance Slabs</span>
        </button>
      </div>

      {selectedCourse && assessment && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Continuous Assessment (30% Weight) */}
          <div className="lg:col-span-6 space-y-5">
            {/* 1. Attendance Engine (10% Weight) */}
            <div className="surface-card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-semibold tracking-tight text-zinc-100">
                        Attendance Engine
                      </h3>
                      <span className="text-xs text-zinc-400 font-medium">(10% Weight)</span>
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onMouseEnter={() => setShowAttTooltip(true)}
                          onMouseLeave={() => setShowAttTooltip(false)}
                          onClick={() => setShowAttTooltip(!showAttTooltip)}
                          className="text-zinc-500 hover:text-zinc-300 p-0.5"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                        {showAttTooltip && (
                          <div className="absolute left-0 bottom-full mb-1.5 w-64 p-2.5 bg-zinc-900 border border-white/12 rounded-xl text-[11px] text-zinc-300 shadow-xl z-30 animate-fade-in leading-relaxed">
                            BUET Attendance marks = Credit × 10. Awarded by slabs: ≥90% gets 10/10 points, down to &lt;60% which triggers Non-Collegiate debarment.
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 font-medium">
                      Total Marks: <span className="tabular-nums text-zinc-300">{assessment.attendance.maxAttendanceMarks.toFixed(1)}</span> ({selectedCourse.credits} cr × 10)
                    </p>
                  </div>
                </div>

                {/* Friendly Status Pill */}
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs tabular-nums">
                  <span className="text-emerald-400 font-bold">
                    {assessment.attendance.percentage}% ({assessment.attendance.slabPoints}/10)
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-400">
                    {assessment.attendance.safeBunksTo60} safe bunks
                  </span>
                </div>
              </div>

              {/* Attendance Progress & Metrics */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-zinc-300 font-medium">Class Attendance Ratio</span>
                  <div className="flex items-baseline gap-2 tabular-nums">
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {assessment.attendance.percentage}%
                    </span>
                    <span className="text-xs text-zinc-400">
                      ({selectedCourse.attendance?.attended || 0} attended / {selectedCourse.attendance?.totalConducted || 0} conducted)
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-white/[0.06]">
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

                <div className="flex justify-between text-[11px] text-zinc-400 tabular-nums pt-0.5">
                  <span>0%</span>
                  <span className="text-rose-400 font-medium">60% Danger Line</span>
                  <span className="text-emerald-400 font-medium">90% Full Marks</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Non-Collegiate Warning */}
              {assessment.attendance.isNonCollegiate && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-900/70 text-xs text-rose-300 flex items-start gap-2.5 shadow-md">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Non-Collegiate / Debarred:</strong> Current attendance is below 60%. Under BUET ordinance, term final examination admit card will be withheld.
                  </p>
                </div>
              )}

              {/* Safe Bunks & Next Slab Pill Boxes */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/[0.08]">
                  <span className="text-xs text-zinc-400 block font-medium">Safe Bunks Buffer</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className={`text-2xl font-bold tabular-nums ${
                      assessment.attendance.safeBunksTo60 > 5 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {assessment.attendance.safeBunksTo60}
                    </span>
                    <span className="text-xs text-zinc-400 font-normal">classes</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    Can skip before dropping below 60%
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/[0.08]">
                  <span className="text-xs text-zinc-400 block font-medium">Classes to Next Slab</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-bold tabular-nums text-blue-400">
                      {assessment.attendance.classesNeededForNextSlab}
                    </span>
                    <span className="text-xs text-zinc-400 font-normal">classes</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    Consecutive attendance required
                  </span>
                </div>
              </div>

              {/* Quick Stepper Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAttendanceIncrement(1, 1)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 text-xs font-semibold transition btn-tactile"
                  >
                    +1 Attended
                  </button>
                  <button
                    onClick={() => handleAttendanceIncrement(1, 0)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/60 text-xs font-semibold transition btn-tactile"
                  >
                    +1 Bunked
                  </button>
                </div>

                <button
                  onClick={handleResetAttendance}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 transition btn-tactile"
                  title="Reset attendance records"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Class Test (CT) Engine (20% Weight) */}
            <div className="surface-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-950/80 border border-blue-800/80 flex items-center justify-center text-blue-400 shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-semibold tracking-tight text-zinc-100">
                        Class Test (CT) Engine
                      </h3>
                      <span className="text-xs text-zinc-400 font-medium">(20% Weight)</span>
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onMouseEnter={() => setShowCTTooltip(true)}
                          onMouseLeave={() => setShowCTTooltip(false)}
                          onClick={() => setShowCTTooltip(!showCTTooltip)}
                          className="text-zinc-500 hover:text-zinc-300 p-0.5"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                        {showCTTooltip && (
                          <div className="absolute left-0 bottom-full mb-1.5 w-72 p-2.5 bg-zinc-900 border border-white/12 rounded-xl text-[11px] text-zinc-300 shadow-xl z-30 animate-fade-in leading-relaxed">
                            BUET Ordinance: For an n-credit course, we automatically take your best n scores out of (n+1) CTs, normalize each to 20 marks, and drop the lowest.
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 font-medium">
                      Best <span className="tabular-nums text-zinc-300">{assessment.classTests.bestCount}</span> of <span className="tabular-nums text-zinc-300">{assessment.classTests.tests.length}</span> tests counted ({selectedCourse.credits} cr × 20)
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold tabular-nums text-blue-400">
                    {assessment.classTests.totalCTMarks.toFixed(1)} / {assessment.classTests.maxCTMarks.toFixed(1)}
                  </div>
                  <div className="text-[11px] text-zinc-400 tabular-nums">
                    {assessment.classTests.ctPercentage.toFixed(1)}% Mean
                  </div>
                </div>
              </div>

              {/* Class Test List */}
              <div className="space-y-2">
                {assessment.classTests.tests.length === 0 ? (
                  <div className="text-center py-6 text-zinc-400 text-xs rounded-xl bg-zinc-900 border border-white/[0.06]">
                    No Class Tests added yet. Click below to add CT scores.
                  </div>
                ) : (
                  assessment.classTests.tests.map((test) => (
                    <div
                      key={test.id}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs transition ${
                        test.isCounted
                          ? 'bg-zinc-900 border-white/[0.08]'
                          : 'bg-transparent border-white/[0.04] opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="tabular-nums font-bold text-zinc-100">{test.name}</span>
                        {test.isCounted ? (
                          <span className="text-[9px] px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800/70 font-semibold">
                            ✓ Counted
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 line-through">
                            Dropped
                          </span>
                        )}
                        <span className="text-xs text-zinc-400 tabular-nums">
                          ({test.obtainedMarks}/{test.maxMarks})
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="tabular-nums text-blue-300 font-bold">
                          {test.normalizedScore.toFixed(1)}/20
                        </span>
                        <button
                          onClick={() => handleDeleteCT(test.id)}
                          className="text-zinc-500 hover:text-rose-400 p-1 transition btn-tactile"
                          title="Delete CT"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add CT Drawer */}
              {isAddingCT ? (
                <form
                  onSubmit={handleAddClassTest}
                  className="p-3.5 rounded-xl bg-zinc-900 border border-white/[0.08] space-y-3 animate-fade-in text-xs"
                >
                  <div className="grid grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      placeholder="CT Name (e.g. CT 1)"
                      value={newCTName}
                      onChange={(e) => setNewCTName(e.target.value)}
                      className="bg-zinc-800 border border-white/[0.08] rounded-xl px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Obtained (18)"
                      value={newCTObtained}
                      onChange={(e) => setNewCTObtained(e.target.value)}
                      required
                      className="bg-zinc-800 border border-white/[0.08] rounded-xl px-3 py-1.5 text-zinc-100 tabular-nums focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Max (20)"
                      value={newCTMax}
                      onChange={(e) => setNewCTMax(e.target.value)}
                      required
                      className="bg-zinc-800 border border-white/[0.08] rounded-xl px-3 py-1.5 text-zinc-100 tabular-nums focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingCT(false)}
                      className="px-3 py-1.5 rounded-xl text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xs btn-tactile"
                    >
                      Save CT
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingCT(true)}
                  className="w-full py-2.5 border border-dashed border-white/[0.1] hover:border-white/25 rounded-xl text-xs text-zinc-300 hover:text-white transition flex items-center justify-center gap-2 bg-zinc-900/60 btn-tactile"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-medium">Add Class Test</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Term Final Goal Calculator (70% Weight) */}
          <div className="lg:col-span-6 space-y-5">
            <div className="surface-card p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-800/80 flex items-center justify-center text-amber-400 shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight text-zinc-100">
                      Term Final Target Calculator
                    </h3>
                    <p className="text-xs text-zinc-400 font-medium">
                      Continuous secured: <span className="tabular-nums text-zinc-300">{assessment.continuousMarksObtained.toFixed(1)}</span> / {assessment.maxContinuousMarks.toFixed(1)} (30% weight)
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-zinc-400 font-medium">Exam Weight</div>
                  <div className="text-sm font-bold tabular-nums text-amber-400">
                    70% ({assessment.maxTFMarks.toFixed(0)} Marks)
                  </div>
                </div>
              </div>

              {/* Beginner-Friendly Interactive Grade Target Pill Group */}
              <div className="space-y-2">
                <span className="text-xs text-zinc-400 font-medium block">
                  Select your Target Grade to calculate exact needed scores:
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {assessment.tfTargets.slice(0, 5).map((t) => (
                    <button
                      key={t.grade}
                      onClick={() => {
                        setSelectedTargetGrade(t.grade);
                        if (t.status === 'achievable' || t.status === 'secured') {
                          triggerCelebration();
                        }
                      }}
                      className={`py-2 rounded-xl text-xs font-semibold transition btn-tactile flex flex-col items-center justify-center ${
                        selectedTargetGrade === t.grade
                          ? 'bg-emerald-600 text-white shadow-md border border-emerald-500 scale-[1.02]'
                          : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-white/[0.08]'
                      }`}
                    >
                      <span className="text-xs font-bold">{t.grade}</span>
                      <span className="text-[10px] tabular-nums opacity-80">
                        {t.minPercentage}%
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prominent Large Target Card */}
              {activeTargetRow && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/30 border border-emerald-500/30 space-y-3 shadow-lg animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                      Target: {activeTargetRow.grade} ({activeTargetRow.gradePoint.toFixed(2)} GP)
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums ${
                      activeTargetRow.status === 'secured'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : activeTargetRow.status === 'achievable'
                        ? 'bg-blue-950 text-blue-400 border border-blue-800'
                        : activeTargetRow.status === 'demanding'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {activeTargetRow.status.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs text-zinc-400 font-medium">You need in the Term Final Exam:</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums tracking-tight mt-1">
                      {activeTargetRow.requiredTFMarks.toFixed(1)} / {activeTargetRow.maxTFMarks.toFixed(0)}{' '}
                      <span className="text-lg font-semibold text-emerald-400">
                        ({activeTargetRow.requiredTFPercentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {/* 50/50 Section A and Section B Split */}
                  <div className="p-3 rounded-xl bg-zinc-950/70 border border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-medium">BUET 50/50 Section Split:</span>
                    <div className="flex items-center gap-2 tabular-nums font-bold text-amber-300">
                      <span>~{activeTargetRow.targetSectionA.toFixed(1)} in Sec A</span>
                      <span>+</span>
                      <span>~{activeTargetRow.targetSectionB.toFixed(1)} in Sec B</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Full Target Table Breakdown */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-xs font-semibold text-zinc-400">
                      <th className="pb-2.5">Grade</th>
                      <th className="pb-2.5 text-center">Needed in TF (70n)</th>
                      <th className="pb-2.5 text-center">Exam %</th>
                      <th className="pb-2.5 text-center">Sec A + B Split</th>
                      <th className="pb-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] tabular-nums">
                    {assessment.tfTargets.map((target) => (
                      <tr
                        key={target.grade}
                        onClick={() => setSelectedTargetGrade(target.grade)}
                        className={`hover:bg-zinc-800/40 transition cursor-pointer ${
                          selectedTargetGrade === target.grade ? 'bg-zinc-800/60 font-semibold' : ''
                        }`}
                      >
                        <td className="py-2.5 font-sans">
                          <span className="font-bold text-zinc-100 text-xs">{target.grade}</span>
                          <span className="text-xs text-zinc-400 ml-1.5 tabular-nums">({target.gradePoint.toFixed(2)})</span>
                        </td>

                        <td className="py-2.5 text-center font-bold text-zinc-100">
                          {target.requiredTFMarks.toFixed(1)} <span className="text-zinc-500 font-normal">/ {target.maxTFMarks.toFixed(0)}</span>
                        </td>

                        <td className="py-2.5 text-center text-zinc-300">
                          {target.requiredTFPercentage.toFixed(1)}%
                        </td>

                        <td className="py-2.5 text-center text-amber-300">
                          {target.targetSectionA.toFixed(1)} + {target.targetSectionB.toFixed(1)}
                        </td>

                        <td className="py-2.5 text-right font-sans">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            target.status === 'secured'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              : target.status === 'achievable'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800/60'
                              : target.status === 'demanding'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                              : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                          }`}>
                            {target.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slabs Reference Modal */}
      {showSlabsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in no-print">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-zinc-200 space-y-4 animate-modal-in">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-semibold tracking-tight text-zinc-100">BUET Official Attendance Slabs</h3>
              <button onClick={() => setShowSlabsModal(false)} className="text-zinc-400 hover:text-white text-xs p-1">
                ✕
              </button>
            </div>

            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/[0.08] text-zinc-400 text-xs font-semibold">
                  <th className="pb-2">Attendance Range</th>
                  <th className="pb-2 text-center">Points</th>
                  <th className="pb-2 text-right">Awarded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] tabular-nums text-xs">
                {BUET_SLABS.map((s) => (
                  <tr key={s.range}>
                    <td className="py-2 text-zinc-100 font-medium font-sans">{s.range}</td>
                    <td className="py-2 text-center font-bold text-emerald-400">{s.points}/10</td>
                    <td className="py-2 text-right text-zinc-400 font-sans">{s.marks}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSlabsModal(false)}
                className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition btn-tactile"
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
