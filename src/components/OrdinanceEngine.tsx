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
  ArrowUpRight,
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
  const ongoingSessionalCourses = courses.filter((c) => c.isOngoing && c.type === 'sessional');

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    ongoingTheoryCourses[0]?.id || ''
  );

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // New CT Modal / Input State
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
    const filtered = (selectedCourse.classTests || []).filter((t) => t.id !== ctId);
    onUpdateCourse({
      ...selectedCourse,
      classTests: filtered,
    });
  };

  const handleUpdateCT = (ctId: string, obtained: number, max: number) => {
    if (!selectedCourse) return;
    const updated = (selectedCourse.classTests || []).map((t) =>
      t.id === ctId ? { ...t, obtainedMarks: Math.max(0, obtained), maxMarks: Math.max(1, max) } : t
    );
    onUpdateCourse({
      ...selectedCourse,
      classTests: updated,
    });
  };

  const handleToggleCustomBestCount = () => {
    if (!selectedCourse) return;
    const nextUseCustom = !selectedCourse.useCustomBestCount;
    onUpdateCourse({
      ...selectedCourse,
      useCustomBestCount: nextUseCustom,
      customBestCount: selectedCourse.customBestCount || Math.round(selectedCourse.credits),
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
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  if (!selectedCourse && ongoingTheoryCourses.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-4">
        <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-white">No Ongoing Theory Courses Found</h3>
        <p className="text-sm max-w-md mx-auto">
          Please add your current semester theory courses in the Course Manager or switch to Level-2 Term-1 to access continuous assessment calculations.
        </p>
      </div>
    );
  }

  const assessment = selectedCourse ? evaluateCourseAssessment(selectedCourse) : null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-amber-700 flex items-center justify-center text-white shadow-lg shadow-red-950/40">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              BUET Ordinance Assessment Engine
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-950/90 text-red-300 border border-red-700/60 font-semibold font-mono">
                Continuous 30% + Term Final 70%
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Strictly ordinance-compliant: Attendance Slabs (10%), Best n of n+1 CTs (20%), and Term Final Section A & B Targets
            </p>
          </div>
        </div>

        {/* Course Selector Tabs */}
        <div className="flex flex-wrap gap-2">
          {ongoingTheoryCourses.map((c) => {
            const isSelected = c.id === selectedCourseId;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCourseId(c.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 border border-blue-400'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: c.color || '#3b82f6' }}
                />
                <span>{c.code}</span>
                <span className="text-[10px] opacity-80">({c.nickname || c.title})</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedCourse && assessment && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Attendance & CT Engine (Continuous 30%) */}
          <div className="lg:col-span-6 space-y-6">
            {/* 1. Attendance Engine Card (10%) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-700/50 text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      1. Attendance Engine (10% Weight)
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Max Marks: {assessment.attendance.maxAttendanceMarks.toFixed(1)} (Credit × 10)
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-emerald-400">
                    {assessment.attendance.attendanceMarks.toFixed(1)} / {assessment.attendance.maxAttendanceMarks.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">
                    Points: {assessment.attendance.slabPoints}/10
                  </div>
                </div>
              </div>

              {/* Attendance Progress & Warning */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">
                    Attendance Percentage:
                  </span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      assessment.attendance.percentage >= 90
                        ? 'text-emerald-400'
                        : assessment.attendance.percentage >= 75
                        ? 'text-blue-400'
                        : assessment.attendance.percentage >= 60
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {assessment.attendance.percentage}%
                  </span>
                </div>

                {/* Progress Bar with 60% Danger Line and 90% Green Line */}
                <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      assessment.attendance.percentage >= 90
                        ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                        : assessment.attendance.percentage >= 75
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                        : assessment.attendance.percentage >= 60
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                        : 'bg-gradient-to-r from-red-600 to-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, assessment.attendance.percentage)}%` }}
                  />
                  {/* 60% Marker line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                    style={{ left: '60%' }}
                    title="60% Non-Collegiate Danger Limit"
                  />
                  {/* 90% Marker line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 z-10"
                    style={{ left: '90%' }}
                    title="90% Full Marks Slab"
                  />
                </div>

                <div className="flex justify-between text-[10px] font-mono text-slate-500 px-0.5">
                  <span>0%</span>
                  <span className="text-red-400 font-bold">60% Non-Collegiate Line</span>
                  <span className="text-emerald-400 font-bold">90% Full Slab</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Non-Collegiate Alert if < 60% */}
              {assessment.attendance.isNonCollegiate && (
                <div className="p-3 bg-red-950/80 border border-red-700 rounded-xl text-xs text-red-200 flex items-start gap-2.5 animate-pulse">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold uppercase tracking-wider">
                      Ordinance Warning: Non-Collegiate / Ineligible!
                    </span>
                    <p className="mt-0.5 text-red-300">
                      Attendance is strictly below 60%. Under BUET ordinance, term final examination admit card cannot be issued without dean's fine/condonation.
                    </p>
                  </div>
                </div>
              )}

              {/* Attendance Analytics Metrics: Safe Bunks & Classes Needed */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[11px] font-medium text-slate-400 block">
                    Safe Bunks Available
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black text-amber-400 font-mono">
                      {assessment.attendance.safeBunksTo60}
                    </span>
                    <span className="text-xs text-slate-400">classes</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Misses before falling below 60% Non-Collegiate
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[11px] font-medium text-slate-400 block">
                    Next Slab Target
                  </span>
                  {assessment.attendance.classesNeededForNextSlab !== null ? (
                    <div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-black text-emerald-400 font-mono">
                          {assessment.attendance.classesNeededForNextSlab}
                        </span>
                        <span className="text-xs text-slate-400">consecutive classes</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Needed to reach {assessment.attendance.nextSlabTargetPercent}% slab
                      </p>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <span className="text-xs font-bold text-emerald-400">
                        Top Slab Reached (10/10)
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Can miss {assessment.attendance.safeBunksCurrentSlab} class(es) & keep 10/10
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Log Attendance Controls */}
              <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="text-slate-300 font-medium">
                  Attended:{' '}
                  <span className="font-bold text-white font-mono">
                    {selectedCourse.attendance?.attended || 0}
                  </span>{' '}
                  / Conducted:{' '}
                  <span className="font-bold text-white font-mono">
                    {selectedCourse.attendance?.totalConducted || 0}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAttendanceIncrement(1, 1)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/60 font-semibold transition flex items-center gap-1"
                  >
                    +1 Present
                  </button>
                  <button
                    onClick={() => handleAttendanceIncrement(1, 0)}
                    className="px-2.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/60 font-semibold transition flex items-center gap-1"
                  >
                    +1 Absent
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Class Test (CT) Engine Card (20%) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-950/80 border border-blue-700/50 text-blue-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      2. Class Test Engine (20% Weight)
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Rule: Best {assessment.classTests.bestCount} of{' '}
                      {assessment.classTests.totalTests} tests (Credit: {selectedCourse.credits})
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-blue-400 font-mono">
                    {assessment.classTests.totalCTMarks.toFixed(1)} / {assessment.classTests.maxCTMarks.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">
                    Mean: {assessment.classTests.ctPercentage.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Best n override control */}
              <div className="flex items-center justify-between text-xs bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="overrideBestN"
                    checked={!!selectedCourse.useCustomBestCount}
                    onChange={handleToggleCustomBestCount}
                    className="rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-0"
                  />
                  <label htmlFor="overrideBestN" className="text-slate-300 cursor-pointer">
                    Manual Best Count Override
                  </label>
                </div>

                {selectedCourse.useCustomBestCount && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Take Best:</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={selectedCourse.customBestCount || Math.round(selectedCourse.credits)}
                      onChange={(e) => handleChangeCustomBestCount(parseInt(e.target.value, 10))}
                      className="w-14 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-white font-mono text-center focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Class Test List with Normalized scores and Best-k badges */}
              <div className="space-y-2">
                {assessment.classTests.tests.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    No Class Tests added yet. Click "+ Add Class Test" below.
                  </div>
                ) : (
                  assessment.classTests.tests.map((test) => (
                    <div
                      key={test.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition ${
                        test.isCounted
                          ? 'bg-blue-950/30 border-blue-800/80'
                          : 'bg-slate-800/30 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{test.name}</span>
                          {test.isCounted ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-semibold">
                              ✓ Counted in Best {assessment.classTests.bestCount}
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 line-through">
                              Dropped
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Raw: {test.obtainedMarks} / {test.maxMarks} ({test.percentage}%)
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-bold font-mono text-blue-300">
                            {test.normalizedScore.toFixed(1)} / 20.0
                          </div>
                          <span className="text-[9px] text-slate-500">Normalized</span>
                        </div>

                        <button
                          onClick={() => handleDeleteCT(test.id)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded transition"
                          title="Delete CT"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add CT Button / Form */}
              {isAddingCT ? (
                <form
                  onSubmit={handleAddClassTest}
                  className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700 space-y-3 animate-fade-in"
                >
                  <div className="text-xs font-bold text-white">Add New Class Test</div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="e.g. CT 5 (Makeup)"
                      value={newCTName}
                      onChange={(e) => setNewCTName(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Obtained (e.g. 17)"
                      value={newCTObtained}
                      onChange={(e) => setNewCTObtained(e.target.value)}
                      required
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Max Marks"
                      value={newCTMax}
                      onChange={(e) => setNewCTMax(e.target.value)}
                      required
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setIsAddingCT(false)}
                      className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500"
                    >
                      Save CT
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingCT(true)}
                  className="w-full py-2 border-2 border-dashed border-slate-800 hover:border-blue-600 rounded-xl text-xs font-semibold text-slate-400 hover:text-blue-400 transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Class Test (CT)
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Term Final (TF) Target Matrix (70% Weight) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-red-950/80 border border-red-700/50 text-red-400">
                    <Flame className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      3. Term Final Target Matrix (70% Weight)
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Max TF Marks: {assessment.maxTFMarks.toFixed(1)} | Total Course Marks: {assessment.totalCourseMarks.toFixed(1)}
                    </p>
                  </div>
                </div>

                {/* Total Continuous Marks Secured */}
                <div className="text-right">
                  <div className="text-xl font-black text-amber-400 font-mono">
                    {assessment.continuousMarksObtained.toFixed(1)} / {assessment.maxContinuousMarks.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">
                    Continuous Marks Secured (30%)
                  </div>
                </div>
              </div>

              {/* Explanatory note */}
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs text-slate-300 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p>
                  At BUET, Term Final exam consists of <strong className="text-white">Section A</strong> and <strong className="text-white">Section B</strong> (50% each). The required score below shows exactly what you need in total and per section out of <span className="font-mono text-amber-300 font-bold">{(assessment.maxTFMarks / 2).toFixed(1)}</span>.
                </p>
              </div>

              {/* Real-time Target Grade Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400">
                      <th className="pb-2">Target Grade</th>
                      <th className="pb-2 text-center">Needed in TF (70n)</th>
                      <th className="pb-2 text-center">Required % in Exam</th>
                      <th className="pb-2 text-center">Sec A & Sec B Targets</th>
                      <th className="pb-2 text-right">Feasibility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {assessment.tfTargets.map((target) => {
                      const isAPlus = target.grade === 'A+';
                      return (
                        <tr
                          key={target.grade}
                          className={`hover:bg-slate-800/40 transition ${
                            isAPlus ? 'bg-red-950/20' : ''
                          }`}
                        >
                          {/* Target Grade Badge */}
                          <td className="py-2.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                                  target.grade.startsWith('A')
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : target.grade.startsWith('B')
                                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                                }`}
                              >
                                {target.grade}
                              </span>
                              <span className="text-[10px] text-slate-400 font-sans">
                                ({target.gradePoint.toFixed(2)})
                              </span>
                            </div>
                          </td>

                          {/* TF Marks Needed */}
                          <td className="py-2.5 text-center font-bold">
                            <span
                              className={
                                target.status === 'secured'
                                  ? 'text-emerald-400'
                                  : target.status === 'impossible'
                                  ? 'text-red-500'
                                  : 'text-white'
                              }
                            >
                              {target.requiredTFMarks.toFixed(1)} / {target.maxTFMarks.toFixed(1)}
                            </span>
                          </td>

                          {/* Required % */}
                          <td className="py-2.5 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                target.requiredTFPercentage <= 65
                                  ? 'bg-emerald-950/80 text-emerald-300'
                                  : target.requiredTFPercentage <= 85
                                  ? 'bg-blue-950/80 text-blue-300'
                                  : target.requiredTFPercentage <= 100
                                  ? 'bg-amber-950/80 text-amber-300'
                                  : 'bg-red-950/80 text-red-400'
                              }`}
                            >
                              {target.requiredTFPercentage.toFixed(1)}%
                            </span>
                          </td>

                          {/* Section A & Section B Split */}
                          <td className="py-2.5 text-center">
                            <div className="text-[11px] text-slate-300">
                              <span className="text-blue-400 font-bold">A: {target.targetSectionA.toFixed(1)}</span>
                              <span className="mx-1 text-slate-600">|</span>
                              <span className="text-purple-400 font-bold">B: {target.targetSectionB.toFixed(1)}</span>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-2.5 text-right font-sans">
                            {target.status === 'secured' && (
                              <button
                                onClick={triggerCelebration}
                                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 hover:scale-105 transition"
                                title="Click to celebrate!"
                              >
                                <CheckCircle className="w-3 h-3 text-emerald-400" />
                                Secured! 🎉
                              </button>
                            )}
                            {target.status === 'comfortable' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/60">
                                Comfortable
                              </span>
                            )}
                            {target.status === 'achievable' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/60">
                                Achievable
                              </span>
                            )}
                            {target.status === 'demanding' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 border border-amber-700/60">
                                Demanding
                              </span>
                            )}
                            {target.status === 'impossible' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800">
                                Unreachable
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sessional / Lab Summary Overview */}
            {ongoingSessionalCourses.length > 0 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-purple-400" />
                    Sessional / Lab Courses (Projected Grades)
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Bypasses continuous attendance & CTs
                  </span>
                </div>

                <div className="space-y-2">
                  {ongoingSessionalCourses.map((s) => (
                    <div
                      key={s.id}
                      className="p-2.5 bg-slate-800/40 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: s.color || '#a855f7' }}
                          />
                          <span>{s.code}</span>
                          <span className="text-slate-400 font-normal">({s.title})</span>
                        </div>
                        {s.sessionalNotes && (
                          <p className="text-[10px] text-slate-400 mt-0.5">{s.sessionalNotes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Projected GP:</span>
                        <select
                          value={s.projectedGradePoint ?? 4.0}
                          onChange={(e) =>
                            onUpdateCourse({
                              ...s,
                              projectedGradePoint: parseFloat(e.target.value),
                            })
                          }
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-blue-500"
                        >
                          <option value={4.0}>A+ (4.00)</option>
                          <option value={3.75}>A (3.75)</option>
                          <option value={3.5}>A- (3.50)</option>
                          <option value={3.25}>B+ (3.25)</option>
                          <option value={3.0}>B (3.00)</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

