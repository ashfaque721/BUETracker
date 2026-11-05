import React, { useState } from 'react';
import { Course } from '../types';
import { evaluateCourseAssessment } from '../utils/buetOrdinance';
import {
  Plus,
  Trash2,
  RotateCcw,
  ChevronRight,
  BookOpen,
  Play,
  Info,
} from 'lucide-react';

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
  const [showAllThresholds, setShowAllThresholds] = useState<boolean>(false);
  const [showSlabsModal, setShowSlabsModal] = useState<boolean>(false);

  // New Class Test Form State
  const [isAddingCT, setIsAddingCT] = useState(false);
  const [newCTName, setNewCTName] = useState('');
  const [newCTObtained, setNewCTObtained] = useState('');
  const [newCTMax, setNewCTMax] = useState('20');

  // Resolve selected course
  const selectedCourse =
    courses.find((c) => c.id === selectedCourseId) || ongoingTheoryCourses[0];

  // Quick Attendance Stepper Handlers
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

  // Add / Delete Class Tests
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

  // Empty State: No theory courses
  if (ongoingTheoryCourses.length === 0) {
    return (
      <div className="bg-[#121316] border border-white/[0.06] rounded-2xl p-12 text-center text-zinc-400 space-y-4 max-w-lg mx-auto mt-12 shadow-xl animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center mx-auto text-zinc-300">
          <BookOpen className="w-6 h-6 text-zinc-300" />
        </div>
        <div>
          <h3 className="text-base font-semibold tracking-tight text-zinc-100">
            No Ongoing Theory Courses
          </h3>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Register current semester theory courses in the Course Manager or populate the official Level-2 Term-1 sample.
          </p>
        </div>
        {onLoadSampleRoutine && (
          <button
            onClick={onLoadSampleRoutine}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium border border-white/10 transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Load Sample Courses</span>
          </button>
        )}
      </div>
    );
  }

  const assessment = selectedCourse ? evaluateCourseAssessment(selectedCourse) : null;
  const activeTargetRow =
    assessment?.tfTargets.find((t) => t.grade === selectedTargetGrade) ||
    assessment?.tfTargets[0];

  const BUET_SLABS = [
    { range: '≥ 90%', points: 10, marks: '100% of Attendance Marks' },
    { range: '85% – 89%', points: 9, marks: '90%' },
    { range: '80% – 84%', points: 8, marks: '80%' },
    { range: '75% – 79%', points: 7, marks: '70%' },
    { range: '70% – 74%', points: 6, marks: '60%' },
    { range: '65% – 69%', points: 5, marks: '50%' },
    { range: '60% – 64%', points: 4, marks: '40%' },
    { range: '< 60%', points: 0, marks: '0 (Non-Collegiate)' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. Clean Course Switcher Tabs (Top Row)                        */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {ongoingTheoryCourses.map((c) => {
            const isSelected = c.id === (selectedCourse?.id || selectedCourseId);
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCourseId(c.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-800 text-white font-medium border border-white/10'
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
          title="View official BUET attendance slabs"
        >
          <Info className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ordinance Slabs</span>
        </button>
      </div>

      {selectedCourse && assessment && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ------------------------------------------------------------- */}
          {/* Left Column: Streamlined Continuous Marks (30%)               */}
          {/* ------------------------------------------------------------- */}
          <div className="lg:col-span-6 space-y-6">
            {/* A. Minimalist Attendance Section (10% Weight) */}
            <div className="bg-[#121316] border border-white/[0.06] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">Attendance</h3>
                <span className="text-xs text-zinc-400">10% Weight</span>
              </div>

              <div>
                <div className="text-3xl font-semibold tracking-tight text-white tabular-nums">
                  {assessment.attendance.percentage}%
                </div>
                <p className="text-xs text-zinc-400 mt-1 tabular-nums">
                  {assessment.attendance.slabPoints} / 10 marks • {assessment.attendance.safeBunksTo60} safe bunks available
                </p>
              </div>

              {/* Clean Horizontal Bar with 60% Tick Mark */}
              <div className="relative w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    assessment.attendance.percentage >= 60 ? 'bg-zinc-300' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, assessment.attendance.percentage)}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 w-[1px] bg-zinc-500 z-10"
                  style={{ left: '60%' }}
                  title="60% Non-Collegiate Line"
                />
              </div>

              {assessment.attendance.isNonCollegiate && (
                <p className="text-xs text-amber-400/90 font-medium">
                  Attendance is below 60% — Non-collegiate risk
                </p>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAttendanceIncrement(1, 1)}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
                  >
                    + Attended
                  </button>
                  <button
                    onClick={() => handleAttendanceIncrement(1, 0)}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    + Missed
                  </button>
                </div>

                <button
                  onClick={handleResetAttendance}
                  className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-md hover:bg-white/[0.04] transition-colors cursor-pointer"
                  title="Reset attendance records"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* B. Clean Class Test (CT) Section (20% Weight) */}
            <div className="bg-[#121316] border border-white/[0.06] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">Class Tests</h3>
                <span className="text-xs text-zinc-400">20% Weight</span>
              </div>

              <p className="text-xs text-zinc-400 tabular-nums">
                Best {assessment.classTests.bestCount} of {assessment.classTests.tests.length} counted • {assessment.classTests.totalCTMarks.toFixed(1)} / {assessment.classTests.maxCTMarks.toFixed(0)} marks
              </p>

              {/* CT Row Design (Clean, single-line list) */}
              <div className="space-y-1.5">
                {assessment.classTests.tests.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-3 text-center">
                    No class tests recorded yet.
                  </p>
                ) : (
                  assessment.classTests.tests.map((test) => (
                    <div
                      key={test.id}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors group ${
                        test.isCounted
                          ? 'bg-white/[0.02] text-zinc-200'
                          : 'text-zinc-500 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs min-w-0">
                        <span
                          className={`font-medium truncate ${
                            test.isCounted ? 'text-zinc-100' : 'line-through decoration-zinc-600'
                          }`}
                        >
                          {test.name}
                        </span>
                        {!test.isCounted && (
                          <span className="text-[10px] text-zinc-400 font-normal">
                            Dropped
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 text-xs tabular-nums">
                        <span
                          className={
                            test.isCounted ? 'text-white font-medium' : 'text-zinc-500'
                          }
                        >
                          {test.normalizedScore.toFixed(1)} / 20
                        </span>
                        <button
                          onClick={() => handleDeleteCT(test.id)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300 p-0.5 transition-opacity cursor-pointer"
                          title="Delete CT"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Ghost + Add CT Button & Drawer */}
              {isAddingCT ? (
                <form
                  onSubmit={handleAddClassTest}
                  className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg space-y-2.5 text-xs animate-fade-in"
                >
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="CT 1"
                      value={newCTName}
                      onChange={(e) => setNewCTName(e.target.value)}
                      className="bg-zinc-800 border border-white/[0.08] rounded-md px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-zinc-500"
                    />
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Obtained"
                      value={newCTObtained}
                      onChange={(e) => setNewCTObtained(e.target.value)}
                      required
                      className="bg-zinc-800 border border-white/[0.08] rounded-md px-2.5 py-1.5 text-zinc-100 text-xs tabular-nums focus:outline-none focus:border-zinc-500"
                    />
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Max (20)"
                      value={newCTMax}
                      onChange={(e) => setNewCTMax(e.target.value)}
                      required
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
                      Save CT
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingCT(true)}
                  className="w-full py-2 border border-dashed border-white/[0.08] hover:border-white/20 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add CT</span>
                </button>
              )}
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* Right Column: Term Final Target (70%) — Focused Hero Card      */}
          {/* ------------------------------------------------------------- */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-[#121316] border border-white/[0.06] rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <h3 className="text-sm font-medium text-white">Term Final Target</h3>
                <span className="text-xs text-zinc-400 tabular-nums">
                  70% ({assessment.maxTFMarks.toFixed(0)} Marks)
                </span>
              </div>

              {/* 1. Target Grade Switcher (Simple chip row) */}
              <div className="space-y-2">
                <span className="text-xs text-zinc-400 block">Select Target Grade:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {assessment.tfTargets.slice(0, 4).map((t) => {
                    const isSelected = selectedTargetGrade === t.grade;
                    return (
                      <button
                        key={t.grade}
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

              {/* 2. Hero Verdict (Spacious and Focused) */}
              {activeTargetRow && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 space-y-3">
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider block">
                    Target: {activeTargetRow.grade} ({activeTargetRow.gradePoint.toFixed(2)} GP)
                  </span>

                  <div>
                    <div className="text-3xl font-semibold tracking-tight text-white tabular-nums">
                      {activeTargetRow.requiredTFMarks.toFixed(1)} / {activeTargetRow.maxTFMarks.toFixed(0)}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 tabular-nums">
                      {activeTargetRow.requiredTFPercentage.toFixed(1)}% required in final exam
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400 tabular-nums">
                    <span>Section Split</span>
                    <span className="text-zinc-300 font-medium">
                      ~{activeTargetRow.targetSectionA.toFixed(1)} in Section A • ~{activeTargetRow.targetSectionB.toFixed(1)} in Section B
                    </span>
                  </div>
                </div>
              )}

              {/* 3. Hide the 9-Row Grade Table (Progressive Disclosure) */}
              <div className="pt-1">
                <button
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
                  <div className="mt-3 overflow-x-auto rounded-lg border border-white/[0.06] bg-white/[0.01] animate-fade-in">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-white/[0.06] text-zinc-400 font-medium">
                          <th className="py-2.5 px-3">Grade</th>
                          <th className="py-2.5 px-3 text-center">Needed in Exam</th>
                          <th className="py-2.5 px-3 text-center">Exam %</th>
                          <th className="py-2.5 px-3 text-right">Section A + B</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] tabular-nums">
                        {assessment.tfTargets.map((target) => {
                          const isSelected = selectedTargetGrade === target.grade;
                          return (
                            <tr
                              key={target.grade}
                              onClick={() => setSelectedTargetGrade(target.grade)}
                              className={`hover:bg-white/[0.04] transition-colors cursor-pointer ${
                                isSelected ? 'bg-white/[0.06] text-white font-medium' : 'text-zinc-300'
                              }`}
                            >
                              <td className="py-2 px-3">
                                <span className="font-semibold text-white">{target.grade}</span>
                                <span className="text-zinc-400 ml-1.5">
                                  ({target.gradePoint.toFixed(2)})
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center font-medium">
                                {target.requiredTFMarks.toFixed(1)} / {target.maxTFMarks.toFixed(0)}
                              </td>
                              <td className="py-2 px-3 text-center text-zinc-400">
                                {target.requiredTFPercentage.toFixed(1)}%
                              </td>
                              <td className="py-2 px-3 text-right text-zinc-400">
                                ~{target.targetSectionA.toFixed(1)} + ~{target.targetSectionB.toFixed(1)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Slabs Reference Modal (Clean Minimalist)                      */}
      {/* ------------------------------------------------------------- */}
      {showSlabsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in no-print">
          <div className="bg-[#141518] border border-white/10 rounded-2xl p-5 max-w-sm w-full shadow-2xl text-zinc-200 space-y-4 animate-modal-in">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-semibold tracking-tight text-zinc-100">
                BUET Attendance Slabs
              </h3>
              <button
                onClick={() => setShowSlabsModal(false)}
                className="text-zinc-400 hover:text-white text-xs p-1 cursor-pointer"
              >
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
                    <td className="py-2 text-zinc-200 font-medium">{s.range}</td>
                    <td className="py-2 text-center font-bold text-white">
                      {s.points} / 10
                    </td>
                    <td className="py-2 text-right text-zinc-400">{s.marks}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-1 flex justify-end">
              <button
                onClick={() => setShowSlabsModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition cursor-pointer"
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
