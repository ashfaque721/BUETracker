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
  Flame,
} from 'lucide-react';

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
      meanPercentage: ctAnalysis.ctPercentage,
      totalObtained: ctAnalysis.totalCTMarks,
      maxMarks: ctAnalysis.maxCTMarks,
      color: c.color || '#3b82f6',
    };
  });

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
  let theoryCreditsTotal = 0;
  let sessionalCreditsTotal = 0;

  courses.forEach((c) => {
    if (c.isOngoing) {
      ongoingCreditsTotal += c.credits;
    } else {
      completedCreditsTotal += c.credits;
    }

    if (c.type === 'theory') {
      theoryCreditsTotal += c.credits;
    } else {
      sessionalCreditsTotal += c.credits;
    }
  });

  const totalRequired = settings.totalDegreeCredits || 160;
  const remainingCredits = Math.max(0, totalRequired - (completedCreditsTotal + ongoingCreditsTotal));

  const creditDistributionData = [
    { name: 'Completed Credits', value: completedCreditsTotal, color: '#10b981' },
    { name: 'Ongoing Credits', value: ongoingCreditsTotal, color: '#3b82f6' },
    { name: 'Remaining to Graduate', value: remainingCredits, color: '#475569' },
  ];

  const typeDistributionData = [
    { name: 'Theory Credits', value: theoryCreditsTotal, color: '#2563eb' },
    { name: 'Sessional/Lab Credits', value: sessionalCreditsTotal, color: '#7c3aed' },
  ];

  // 5. Projected CGPA Simulation
  const simulatedTotalPoints = cumulativePoints + ongoingCreditsTotal * simulatedTermGpa;
  const simulatedTotalCredits = cumulativeCredits + ongoingCreditsTotal;
  const simulatedCGPA =
    simulatedTotalCredits > 0 ? (simulatedTotalPoints / simulatedTotalCredits).toFixed(2) : '0.00';

  const currentCGPA =
    cumulativeCredits > 0 ? (cumulativePoints / cumulativeCredits).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Cumulative CGPA Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/40 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Current CGPA</span>
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{currentCGPA}</span>
            <span className="text-xs text-slate-400">/ 4.00</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <span>Dean's List Eligible</span>
            <span className="text-[10px] text-slate-500">(≥ 3.75)</span>
          </div>
        </div>

        {/* Completed Credits Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Credits Completed</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400 font-mono">
              {completedCreditsTotal.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">/ {totalRequired} cr</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {((completedCreditsTotal / totalRequired) * 100).toFixed(1)}% Degree Progress
          </div>
        </div>

        {/* Current Term Enrolled Credits */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Ongoing Term Load</span>
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-400 font-mono">
              {ongoingCreditsTotal.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">Credits</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {ongoingTheoryCourses.length} Theory • {ongoingCreditsTotal - ongoingTheoryCourses.length * 3 > 0 ? 'Labs Included' : ''}
          </div>
        </div>

        {/* Forecast Simulator Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Forecasted CGPA</span>
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-400 font-mono">{simulatedCGPA}</span>
            <span className="text-xs text-slate-400">if Term GPA = {simulatedTermGpa.toFixed(2)}</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Δ {Number(simulatedCGPA) >= Number(currentCGPA) ? '+' : ''}
            {(Number(simulatedCGPA) - Number(currentCGPA)).toFixed(2)} progression
          </div>
        </div>
      </div>

      {/* Row 1: CGPA Progression Line Chart */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              CGPA & Term GPA Progression Trajectory
            </h3>
            <p className="text-xs text-slate-400">
              Semester-by-semester GPA performance versus cumulative CGPA line with BUET Honors / Dean's List benchmarks
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
              <span className="text-slate-300">Term GPA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
              <span className="text-slate-300 font-bold">Cumulative CGPA</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressionData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="semester" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis
                domain={[2.5, 4.0]}
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                ticks={[2.5, 3.0, 3.25, 3.5, 3.75, 4.0]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              {/* Dean's List Reference line at 3.75 */}
              <ReferenceLine
                y={3.75}
                stroke="#eab308"
                strokeDasharray="4 4"
                label={{
                  value: "Dean's List (3.75)",
                  fill: '#eab308',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
              {/* First Class Reference line at 3.00 */}
              <ReferenceLine
                y={3.0}
                stroke="#64748b"
                strokeDasharray="3 3"
                label={{
                  value: 'First Class (3.00)',
                  fill: '#94a3b8',
                  fontSize: 10,
                  position: 'insideBottomRight',
                }}
              />
              <Line
                type="monotone"
                dataKey="termGpa"
                name="Term GPA"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 5, fill: '#3b82f6' }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="cumulativeCGPA"
                name="Cumulative CGPA"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 6, fill: '#10b981' }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: CT Performance Bar Chart & Attendance Safety Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Current Term CT Performance Bar Chart */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                Current Term Class Test (CT) Normalized Score %
              </h3>
              <p className="text-xs text-slate-400">
                Mean percentage achieved across best n counted tests per registered theory course
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ctPerformanceData}
                margin={{ top: 10, right: 20, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="courseCode" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Normalized CT %']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'A+ (80%)', fill: '#10b981', fontSize: 10 }} />
                <Bar dataKey="meanPercentage" radius={[6, 6, 0, 0]}>
                  {ctPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Attendance Safety Gauge & Buffer Line */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Attendance Safety Buffers
              </h3>
              <p className="text-xs text-slate-400">
                Course attendance status with 60% Non-collegiate red alert
              </p>
            </div>
          </div>

          <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
            {attendanceData.map((item) => (
              <div key={item.courseCode} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.courseCode}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({item.title})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Safe Bunks: <strong className="text-amber-400">{item.safeBunksTo60}</strong>
                    </span>
                    <span
                      className={`font-mono font-bold text-xs ${
                        item.percentage >= 90
                          ? 'text-emerald-400'
                          : item.percentage >= 75
                          ? 'text-blue-400'
                          : item.percentage >= 60
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                {/* Gauge Bar */}
                <div className="relative w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/80">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.percentage >= 90
                        ? 'bg-emerald-500'
                        : item.percentage >= 75
                        ? 'bg-blue-500'
                        : item.percentage >= 60
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                  {/* 60% Non-Collegiate Danger Marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                    style={{ left: '60%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Credit Distribution Donut Chart & Live Projected CGPA Slider */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Degree Credit Distribution */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-purple-400" />
                Degree Credit Distribution ({totalRequired} Credits Total)
              </h3>
              <p className="text-xs text-slate-400">
                Completed vs Ongoing vs Remaining Credits required for BUET graduation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={creditDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {creditDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2.5 text-xs">
              {creditDistributionData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    {item.value.toFixed(1)} cr
                  </span>
                </div>
              ))}

              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  Type Breakdown
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Theory Credits:</span>
                  <span className="font-mono font-bold text-blue-400">{theoryCreditsTotal} cr</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Sessional / Labs:</span>
                  <span className="font-mono font-bold text-purple-400">{sessionalCreditsTotal} cr</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive Projected CGPA Simulator Slider */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Live Graduation CGPA Simulator
              </h3>
              <p className="text-xs text-slate-400">
                Slide expected Term GPA to simulate your resulting cumulative CGPA
              </p>
            </div>
          </div>

          <div className="space-y-6 pt-2">
            <div>
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-semibold text-slate-300">
                  Projected Current Term GPA:
                </span>
                <span className="text-xl font-black text-blue-400 font-mono">
                  {simulatedTermGpa.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="2.00"
                max="4.00"
                step="0.05"
                value={simulatedTermGpa}
                onChange={(e) => setSimulatedTermGpa(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>2.00 (D)</span>
                <span>3.00 (B)</span>
                <span>3.50 (A-)</span>
                <span>3.75 (A)</span>
                <span>4.00 (A+)</span>
              </div>
            </div>

            {/* Simulation Comparison Matrix */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">
                  Current Cumulative CGPA
                </span>
                <span className="text-2xl font-black text-white font-mono">{currentCGPA}</span>
                <span className="text-[10px] text-slate-500 block">
                  Based on {completedCreditsTotal.toFixed(1)} earned credits
                </span>
              </div>

              <div className="space-y-1 border-l border-slate-800 pl-4">
                <span className="text-[11px] text-slate-400 block font-medium">
                  Resulting Cumulative CGPA
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {simulatedCGPA}
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    ({Number(simulatedCGPA) >= Number(currentCGPA) ? '+' : ''}
                    {(Number(simulatedCGPA) - Number(currentCGPA)).toFixed(2)})
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  After completing {ongoingCreditsTotal.toFixed(1)} ongoing credits
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

