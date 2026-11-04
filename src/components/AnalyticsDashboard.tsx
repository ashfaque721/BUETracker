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
  Layers,
  GraduationCap,
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
    { name: 'Remaining for Degree', value: remainingCredits, color: '#334155' },
  ];

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
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } catch {}
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cumulative CGPA Card */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-5 rounded-3xl shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Cumulative CGPA</span>
            <div className="p-2 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/60">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
              {currentCGPA}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 4.00</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Across {completedCreditsTotal.toFixed(1)} earned credits
          </p>
        </div>

        {/* Degree Progress Card */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-5 rounded-3xl shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Graduation Progress</span>
            <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono tracking-tight">
              {((completedCreditsTotal / totalRequired) * 100).toFixed(0)}%
            </span>
            <span className="text-xs text-slate-400 font-mono">{completedCreditsTotal} / {totalRequired} cr</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {remainingCredits.toFixed(1)} credits remaining to graduate
          </p>
        </div>

        {/* Ongoing Term Load Card */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-5 rounded-3xl shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Current Term Load</span>
            <div className="p-2 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/60">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-400 font-mono tracking-tight">
              {ongoingCreditsTotal.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-mono">Credits</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {ongoingTheoryCourses.length} Theory courses + Sessionals
          </p>
        </div>

        {/* Forecasted CGPA Card */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-5 rounded-3xl shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Projected CGPA</span>
            <div className="p-2 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-800/60">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-400 font-mono tracking-tight">
              {simulatedCGPA}
            </span>
            <span className="text-xs text-slate-400 font-mono">if Term GPA = {simulatedTermGpa.toFixed(2)}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Δ {Number(simulatedCGPA) >= Number(currentCGPA) ? '+' : ''}
            {(Number(simulatedCGPA) - Number(currentCGPA)).toFixed(2)} overall change
          </p>
        </div>
      </div>

      {/* Row 1: CGPA Progression Line Chart */}
      <div className="bg-slate-900/90 border border-slate-800/80 p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              CGPA & Term GPA Progression Trajectory
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Semester-by-semester GPA performance versus cumulative CGPA with BUET Dean's List benchmarks
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
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
                  borderRadius: '16px',
                  color: '#fff',
                  fontSize: '12px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
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
                strokeWidth={2.5}
                dot={{ r: 5, fill: '#3b82f6' }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="cumulativeCGPA"
                name="Cumulative CGPA"
                stroke="#10b981"
                strokeWidth={3.5}
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
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800/80 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                Current Term Class Test (CT) Normalized Score %
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Mean percentage achieved across best n counted tests per ongoing theory course
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
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'A+ (80%)', fill: '#10b981', fontSize: 10 }} />
                <Bar dataKey="meanPercentage" radius={[8, 8, 0, 0]}>
                  {ctPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Attendance Safety Gauge & Buffer Line */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800/80 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Attendance Safety Buffers
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Course attendance status with 60% Non-collegiate red alert
              </p>
            </div>
          </div>

          <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
            {attendanceData.map((item) => (
              <div key={item.courseCode} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.courseCode}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({item.title})</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Safe Bunks: <strong className="text-amber-400 font-bold">{item.safeBunksTo60}</strong>
                    </span>
                    <span
                      className={`font-mono font-black text-xs ${
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
                <div className="relative w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.percentage >= 90
                        ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                        : item.percentage >= 75
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                        : item.percentage >= 60
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                        : 'bg-gradient-to-r from-red-600 to-rose-500'
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

      {/* Row 3: Degree Credit Donut Chart & Live Projected CGPA Slider */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Degree Credit Distribution */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800/80 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-purple-400" />
                Degree Credit Breakdown ({totalRequired} Credits Total)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Completed, ongoing, and remaining graduation requirements
              </p>
            </div>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={creditDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {creditDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} Credits`, '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {creditDistributionData.map((item) => (
              <div key={item.name} className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                <span className="w-2.5 h-2.5 rounded-full inline-block mb-1" style={{ backgroundColor: item.color }} />
                <div className="font-mono font-black text-white text-sm">{item.value.toFixed(1)} cr</div>
                <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{item.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Interactive Forecast Simulator */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800/80 p-6 rounded-3xl shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Interactive Target GPA Simulator
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate your expected GPA this semester to see the exact graduating CGPA impact
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-bold text-slate-400">Target Term GPA</span>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {simulatedTermGpa.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Slider Control */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>2.50</span>
              <span>3.00</span>
              <span>3.50</span>
              <span className="text-amber-400 font-bold">3.75 (Dean's List)</span>
              <span className="text-emerald-400 font-bold">4.00 (Max)</span>
            </div>

            <input
              type="range"
              min={2.5}
              max={4.0}
              step={0.05}
              value={simulatedTermGpa}
              onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
              className="w-full h-3 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500 border border-slate-800"
            />
          </div>

          {/* Impact Projection Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-blue-950/40 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                Post-Term Cumulative CGPA:
              </span>
              <span className="text-2xl font-black text-purple-400 font-mono">
                {simulatedCGPA}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
              <span>Current: {currentCGPA}</span>
              <span className="text-emerald-400 font-bold">
                Change: {Number(simulatedCGPA) >= Number(currentCGPA) ? '+' : ''}
                {(Number(simulatedCGPA) - Number(currentCGPA)).toFixed(2)}
              </span>
              <span>Total Credits: {simulatedTotalCredits.toFixed(1)}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Drag the slider up to 4.00 to celebrate your academic goals! 🎓</span>
          </div>
        </div>
      </div>
    </div>
  );
};
