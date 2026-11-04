import React, { useState } from 'react';
import { BUET_SEMESTERS, Course, UserSettings } from '../types';
import {
  calculateAttendance,
  calculateClassTests,
  calculateGPA,
} from '../utils/buetOrdinance';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Award,
  AlertTriangle,
  PieChart as PieIcon,
  ShieldCheck,
  Sliders,
  Sparkles,
  BarChart3,
  Layers,
  GraduationCap,
  CheckCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AnalyticsDashboardProps {
  courses: Course[];
  settings: UserSettings;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  courses,
  settings,
}) => {
  const [simulatedTermGpa, setSimulatedTermGpa] = useState<number>(3.85);

  // 1. Calculate Historical CGPA Progression per semester
  let cumulativePoints = 0;
  let cumulativeCredits = 0;

  const progressionData = BUET_SEMESTERS.map((sem) => {
    const semCourses = courses.filter((c) => c.semesterId === sem.id);
    const completedCourses = semCourses.filter((c) => !c.isOngoing && c.gradePoint !== undefined);

    let termGpa: number | null = null;
    let termCredits = 0;
    let termPoints = 0;

    if (completedCourses.length > 0) {
      completedCourses.forEach((c) => {
        termCredits += c.credits;
        termPoints += c.credits * (c.gradePoint || 0);
      });

      termGpa = termCredits > 0 ? Number((termPoints / termCredits).toFixed(2)) : null;

      cumulativeCredits += termCredits;
      cumulativePoints += termPoints;
    }

    const currentCumulativeCGPA =
      cumulativeCredits > 0 ? Number((cumulativePoints / cumulativeCredits).toFixed(2)) : null;

    return {
      semester: sem.shortLabel,
      semesterName: sem.label,
      isCurrent: sem.isCurrent,
      termGpa,
      cumulativeCGPA: currentCumulativeCGPA,
      credits: termCredits,
    };
  }).filter((item) => item.termGpa !== null || item.isCurrent);

  // 2. Current Term CT Performance Data
  const ongoingTheoryCourses = courses.filter((c) => c.isOngoing && c.type === 'theory');
  const ctPerformanceData = ongoingTheoryCourses.map((c) => {
    const ctAnalysis = calculateClassTests(c.credits, c.classTests || [], c.useCustomBestCount, c.customBestCount);
    return {
      courseCode: c.code,
      courseName: c.nickname || c.title,
      meanPercentage: Number(ctAnalysis.ctPercentage.toFixed(1)),
      totalObtained: ctAnalysis.totalCTMarks,
      maxMarks: ctAnalysis.maxCTMarks,
      color: c.color || '#3b82f6',
    };
  });

  // Overall CT mean
  const overallCtMean = ctPerformanceData.length > 0
    ? Number((ctPerformanceData.reduce((acc, c) => acc + c.meanPercentage, 0) / ctPerformanceData.length).toFixed(1))
    : 0;

  // 3. Attendance Safety Analysis Data
  const attendanceData = ongoingTheoryCourses.map((c) => {
    const att = calculateAttendance(
      c.credits,
      c.attendance?.totalConducted || 0,
      c.attendance?.attended || 0
    );
    return {
      courseCode: c.code,
      title: c.nickname || c.title,
      percentage: att.percentage,
      status: att.status,
      slabPoints: att.slabPoints,
      safeBunksTo60: att.safeBunksTo60,
      isNonCollegiate: att.isNonCollegiate,
      color: c.color || '#3b82f6',
    };
  });

  // 4. Credit Distribution & Graduation Requirements
  let completedCreditsTotal = 0;
  let ongoingCreditsTotal = 0;

  courses.forEach((c) => {
    if (c.isOngoing) {
      ongoingCreditsTotal += c.credits;
    } else {
      completedCreditsTotal += c.credits;
    }
  });

  const totalRequired = settings.totalDegreeCredits || 160;
  const remainingCredits = Math.max(0, totalRequired - (completedCreditsTotal + ongoingCreditsTotal));

  // 5. Projected Cumulative CGPA Calculation
  const currentCGPA = cumulativeCredits > 0 ? (cumulativePoints / cumulativeCredits).toFixed(2) : '0.00';
  const simulatedTotalPoints = cumulativePoints + ongoingCreditsTotal * simulatedTermGpa;
  const simulatedTotalCredits = cumulativeCredits + ongoingCreditsTotal;
  const simulatedCGPA =
    simulatedTotalCredits > 0 ? (simulatedTotalPoints / simulatedTotalCredits).toFixed(2) : currentCGPA;

  const handleSliderChange = (val: number) => {
    setSimulatedTermGpa(val);
    if (val >= 4.0) {
      try {
        confetti({
          particleCount: 35,
          spread: 50,
          origin: { y: 0.7 },
        });
      } catch {}
    }
  };

  return (
    <div className="space-y-5">
      {/* 4 Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Cumulative CGPA */}
        <div className="surface-card p-5 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Cumulative CGPA</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {currentCGPA}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 4.00</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            {Number(currentCGPA) >= 3.75 ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Dean's List / Honours
              </span>
            ) : (
              <span className="text-blue-400 font-medium">BUET Good Standing</span>
            )}
          </div>
        </div>

        {/* Card 2: Degree Progress */}
        <div className="surface-card p-5 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Degree Progress</span>
            <div className="w-8 h-8 rounded-xl bg-blue-950/80 border border-blue-800/80 flex items-center justify-center text-blue-400">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {completedCreditsTotal.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ {totalRequired} cr</span>
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (completedCreditsTotal / totalRequired) * 100)}%` }}
            />
          </div>
        </div>

        {/* Card 3: Current Term CT Mean */}
        <div className="surface-card p-5 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Current Term CT Mean</span>
            <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-800/80 flex items-center justify-center text-purple-400">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {overallCtMean}%
            </span>
            <span className="text-xs text-slate-400 font-mono">across theory</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {ongoingTheoryCourses.length} registered theory courses
          </div>
        </div>

        {/* Card 4: Attendance Safety Index */}
        <div className="surface-card p-5 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Attendance Health</span>
            <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-800/80 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {attendanceData.filter((a) => !a.isNonCollegiate).length} / {attendanceData.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">Collegiate</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">
            0 Debarred / Non-Collegiate
          </div>
        </div>
      </div>

      {/* Row 2: CGPA Progression Chart + Projected CGPA Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: CGPA Progression Line Chart (7 Cols) */}
        <div className="lg:col-span-7 surface-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white tracking-tight">
                CGPA Progression Curve
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-300">Cumulative CGPA</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span className="text-slate-400">Term GPA</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis
                  dataKey="semester"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  domain={[2.5, 4.0]}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  ticks={[2.5, 3.0, 3.5, 3.75, 4.0]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121624',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <ReferenceLine y={3.75} stroke="#d97706" strokeDasharray="4 4" label={{ value: 'Honours (3.75)', fill: '#d97706', fontSize: 10, position: 'right' }} />
                <Line
                  type="monotone"
                  dataKey="cumulativeCGPA"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="termGpa"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={{ fill: '#3b82f6', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Interactive Projected CGPA Simulator (5 Cols) */}
        <div className="lg:col-span-5 surface-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white tracking-tight">
                Projected CGPA Simulator
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {settings.currentSemesterId}
            </span>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Drag the slider to test hypothetical grade outcomes for your ongoing {ongoingCreditsTotal} registered credits.
            </p>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-300 font-medium">Target Term GPA</span>
                <span className="text-2xl font-bold font-mono text-purple-400">
                  {simulatedTermGpa.toFixed(2)}
                </span>
              </div>

              <input
                type="range"
                min="2.00"
                max="4.00"
                step="0.05"
                value={simulatedTermGpa}
                onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/[0.08] rounded-lg appearance-none cursor-pointer accent-purple-500"
              />

              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>2.00</span>
                <span>3.00</span>
                <span>3.75 (Honours)</span>
                <span>4.00 (Perfect)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-950/30 to-blue-950/20 border border-purple-900/40 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-purple-300 font-medium block">
                  Projected Graduation CGPA
                </span>
                <span className="text-xs text-slate-400">
                  After current {ongoingCreditsTotal} cr completed
                </span>
              </div>
              <div className="text-3xl font-extrabold font-mono text-white">
                {simulatedCGPA}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: CT Performance Comparison & Attendance Safety Meters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Current Term CT Performance (6 Cols) */}
        <div className="lg:col-span-6 surface-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold text-white tracking-tight">
                Theory Course CT Mean Percentage
              </h3>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ctPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="courseCode" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121624',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="meanPercentage" radius={[6, 6, 0, 0]}>
                  {ctPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Attendance Safety Meters (6 Cols) */}
        <div className="lg:col-span-6 surface-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white tracking-tight">
                Attendance Safety Buffers
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Red line marks 60% Debarment limit
            </span>
          </div>

          <div className="space-y-3.5 pt-1">
            {attendanceData.map((att) => (
              <div key={att.courseCode} className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{att.courseCode}</span>
                    <span className="text-slate-400 text-[11px] truncate max-w-[160px]">{att.title}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-white">{att.percentage}%</span>
                    <span className="text-slate-400 text-[10px]">
                      ({att.safeBunksTo60} safe bunks)
                    </span>
                  </div>
                </div>

                <div className="relative w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      att.percentage >= 90
                        ? 'bg-emerald-500'
                        : att.percentage >= 75
                        ? 'bg-blue-500'
                        : att.percentage >= 60
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, att.percentage)}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-400"
                    style={{ left: '60%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
