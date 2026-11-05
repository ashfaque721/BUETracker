import React, { useState } from 'react';
import {
  BUET_SEMESTERS,
  Course,
  RoutineMetadata,
  UserSettings,
} from '../types';
import { convertParsedCourseToAppCourse, ParsedBIISCourse } from '../utils/biisParser';
import { BIISScreenshotScanner } from './BIISScreenshotScanner';
import { SEED_COURSES, SEED_ROUTINE } from '../db';
import {
  getIpeCoursesForSemester,
  getIpeRoutineForSemester,
  IPE_CURRICULUM_DATA,
} from '../utils/ipeCurriculum';
import {
  GraduationCap,
  Calendar,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Check,
  UploadCloud,
  Clipboard,
  Sparkles,
  School,
  FileText,
  User,
  ShieldCheck,
  Camera,
  Calculator,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudentSetupWizardProps {
  onCompleteSetup: (
    settings: UserSettings,
    initialCourses: Course[],
    initialRoutine: RoutineMetadata
  ) => void;
  onLoadSampleDemo: () => void;
}

export const StudentSetupWizard: React.FC<StudentSetupWizardProps> = ({
  onCompleteSetup,
  onLoadSampleDemo,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Student Information
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('Industrial & Production Engineering (IPE)');
  const [customDept, setCustomDept] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState('L1T1');

  // Step 2 (For L1T1): Routine Setup
  const [routineTitle, setRoutineTitle] = useState('Class Routine of Section A');
  const [routineSection, setRoutineSection] = useState('Section A');
  const [l1t1Template, setL1t1Template] = useState<'standard' | 'blank'>('standard');

  // Step 2 (For Not L1T1): Previous Grade Sheet Ingestion via Screenshot OCR
  const [ingestMethod, setIngestMethod] = useState<'screenshot' | 'quick_gpa' | 'skip'>('screenshot');
  const [confirmedCourses, setConfirmedCourses] = useState<ParsedBIISCourse[]>([]);
  const [scanSummary, setScanSummary] = useState<{ termGpa?: number; totalCredits?: number }>({});
  const [quickCgpa, setQuickCgpa] = useState('3.75');
  const [quickCredits, setQuickCredits] = useState('38.0');

  const selectedSemester = BUET_SEMESTERS.find((s) => s.id === selectedSemesterId) || BUET_SEMESTERS[0];
  const isFreshmanL1T1 = selectedSemesterId === 'L1T1';

  // Compute previous semesters list
  const selectedSemesterIndex = BUET_SEMESTERS.findIndex((s) => s.id === selectedSemesterId);
  const previousSemesters = BUET_SEMESTERS.slice(0, selectedSemesterIndex);
  const previousSemestersLabel = previousSemesters.map((s) => s.shortLabel).join(', ');

  const BUET_DEPARTMENTS = [
    'Industrial & Production Engineering (IPE)',
    'Computer Science & Engineering (CSE)',
    'Electrical & Electronic Engineering (EEE)',
    'Mechanical Engineering (ME)',
    'Civil Engineering (CE)',
    'Chemical Engineering (ChE)',
    'Biomedical Engineering (BME)',
    'Naval Architecture & Marine Engineering (NAME)',
    'Materials & Metallurgical Engineering (MME)',
    'Urban & Regional Planning (URP)',
    'Water Resources Engineering (WRE)',
    'Architecture',
    'Other (Custom)',
  ];

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !studentId.trim()) return;

    // Default routine title customized to user's dept and section
    const deptShort = department === 'Other (Custom)' ? (customDept || 'Engineering') : department.split('(')[1]?.replace(')', '') || 'Dept';
    setRoutineTitle(`Class Routine of ${deptShort} ${selectedSemester.shortLabel} Section A`);
    setStep(2);
  };

  const handleFinalizeSetup = () => {
    const resolvedDept = department === 'Other (Custom)' ? customDept.trim() || 'Engineering' : department;

    const userSettings: UserSettings = {
      studentName: name.trim(),
      studentId: studentId.trim(),
      department: resolvedDept,
      totalDegreeCredits: 160,
      currentSemesterId: selectedSemesterId,
      theme: 'dark',
      isOnboarded: true,
    };

    let initialCourses: Course[] = [];

    // Auto-populate authentic ongoing IPE courses for the chosen semester
    const currentOngoingCourses = getIpeCoursesForSemester(selectedSemesterId, true);

    let prevCourses: Course[] = [];
    if (confirmedCourses.length > 0) {
      const targetPrevSemId = previousSemesters[previousSemesters.length - 1]?.id || 'L1T1';
      prevCourses = confirmedCourses.map((parsed) =>
        convertParsedCourseToAppCourse(parsed, targetPrevSemId, false)
      );
    } else if (ingestMethod === 'quick_gpa') {
      const targetPrevSemId = previousSemesters[previousSemesters.length - 1]?.id || 'L1T1';
      const parsedGpa = parseFloat(quickCgpa) || 3.75;
      const parsedCredits = parseFloat(quickCredits) || 38.0;
      prevCourses = [
        {
          id: `course_prev_summary_${Date.now()}`,
          code: 'PREV 001',
          title: 'Previous Academic Completed Credits',
          nickname: 'Prior Terms',
          credits: parsedCredits,
          type: 'theory',
          semesterId: targetPrevSemId,
          color: '#10b981',
          isOngoing: false,
          grade: 'A',
          gradePoint: parsedGpa,
        },
      ];
    } else if (previousSemesters.length > 0) {
      // Auto-fill previous IPE terms with completed curriculum courses
      for (const pSem of previousSemesters) {
        const pCourses = getIpeCoursesForSemester(pSem.id, false);
        prevCourses.push(...pCourses);
      }
    }

    initialCourses = [...prevCourses, ...currentOngoingCourses];

    // Auto-populate authentic BUET IPE Routine for the chosen semester
    const initialRoutine = getIpeRoutineForSemester(selectedSemesterId, routineSection);
    if (routineTitle.trim()) {
      initialRoutine.title = routineTitle.trim();
    }

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}

    onCompleteSetup(userSettings, initialCourses, initialRoutine);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] text-zinc-200 overflow-y-auto flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in font-sans selection:bg-emerald-950 selection:text-emerald-200">
      <div className="w-full max-w-2xl bg-[#18181b] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-modal-in">
        {/* Header Monogram & Steps Indicator */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center text-emerald-400 font-bold text-sm tracking-tight shadow-md">
              BU
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
                <span>Welcome to BUETracker</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-bold uppercase tracking-wider">
                  Setup
                </span>
              </h1>
              <p className="text-xs text-zinc-400 font-medium">
                {step === 1 ? 'Step 1 of 2: Student Identity & Academic Term' : `Step 2 of 2: ${isFreshmanL1T1 ? 'Freshman Routine Setup' : 'Previous Grade Sheet Ingestion'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className={`w-2.5 h-2.5 rounded-full ${step === 1 ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
            <span className={`w-2.5 h-2.5 rounded-full ${step === 2 ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
          </div>
        </div>

        {/* STEP 1: Student Information & Semester */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-5 animate-fade-in text-xs">
            <div className="p-4 rounded-2xl bg-zinc-900 border border-white/[0.06] space-y-1">
              <span className="text-xs font-semibold text-zinc-200">Personalize Your Workspace</span>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Enter your official student information. No dummy data will be loaded — your tracker will be strictly tailored to your actual courses and routine.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 font-medium mb-1.5 text-xs">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Hasan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition font-medium"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1.5 text-xs">
                  Student ID Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2308001 or 2405015"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 tabular-nums focus:outline-none focus:border-emerald-500 transition font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1.5 text-xs">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
              >
                {BUET_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              {department === 'Other (Custom)' && (
                <input
                  type="text"
                  placeholder="Enter custom department name"
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                  className="w-full mt-2 bg-zinc-900 border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-zinc-300 font-medium text-xs">
                  Select Your Current Semester (Level & Term) *
                </label>
                <span className="text-[11px] text-zinc-500">
                  Dictates whether previous grade sheets are required
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BUET_SEMESTERS.map((sem) => {
                  const isSelected = sem.id === selectedSemesterId;
                  const isL1T1 = sem.id === 'L1T1';
                  return (
                    <button
                      key={sem.id}
                      type="button"
                      onClick={() => setSelectedSemesterId(sem.id)}
                      className={`p-3 rounded-2xl border text-left transition btn-tactile flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md scale-[1.02]'
                          : 'bg-zinc-900 text-zinc-300 border-white/[0.08] hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{sem.shortLabel}</span>
                        {isL1T1 && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                            Freshman
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] mt-1 ${isSelected ? 'text-emerald-100' : 'text-zinc-400'}`}>
                        {sem.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={onLoadSampleDemo}
                className="text-xs text-zinc-400 hover:text-zinc-200 transition font-medium"
              >
                Or load pre-filled sample demo
              </button>

              <button
                type="submit"
                disabled={!name.trim() || !studentId.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs shadow-md transition btn-tactile"
              >
                <span>Continue to Step 2</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2 - BRANCH A: FRESHMAN IN LEVEL-1 TERM-1 (ONLY ASKS FOR ROUTINE) */}
        {step === 2 && isFreshmanL1T1 && (
          <div className="space-y-5 animate-fade-in text-xs">
            <div className="p-4 rounded-2xl bg-zinc-900 border border-emerald-500/30 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Level-1 Term-1 Routine Setup</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Welcome to BUET! Since you are in <strong>Level-1 Term-1</strong>, you do not have any previous semester results. We only need your class routine to get started.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-zinc-300 font-medium mb-1.5 text-xs">
                  Timetable Title
                </label>
                <input
                  type="text"
                  value={routineTitle}
                  onChange={(e) => setRoutineTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition font-medium"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1.5 text-xs">
                  Starter Template for 1-1 Courses
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setL1t1Template('standard')}
                    className={`p-3.5 rounded-2xl border text-left transition btn-tactile space-y-1 ${
                      l1t1Template === 'standard'
                        ? 'bg-zinc-800 border-emerald-500 shadow-xs'
                        : 'bg-zinc-900 border-white/[0.08] hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-100 text-xs">
                        Common 1-1 Courses Template
                      </span>
                      {l1t1Template === 'standard' && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Pre-populates MATH 191, PHY 109, CHEM 109, HUM 101, and ME 160 Drawing Lab. You can edit or add more anytime.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setL1t1Template('blank')}
                    className={`p-3.5 rounded-2xl border text-left transition btn-tactile space-y-1 ${
                      l1t1Template === 'blank'
                        ? 'bg-zinc-800 border-emerald-500 shadow-xs'
                        : 'bg-zinc-900 border-white/[0.08] hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-100 text-xs">
                        Completely Blank Timetable
                      </span>
                      {l1t1Template === 'blank' && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Start with an empty schedule and enter your classes slot-by-slot in the Routine Designer.
                    </p>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition btn-tactile"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleFinalizeSetup}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition btn-tactile"
              >
                <span>Finish Setup & Open Timetable Studio</span>
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 - BRANCH B: NOT 1-1 (ASKS FOR PREVIOUS SEMESTERS GRADESHEET) */}
        {step === 2 && !isFreshmanL1T1 && (
          <div className="space-y-5 animate-fade-in text-xs">
            <div className="p-4 rounded-2xl bg-zinc-900 border border-blue-500/30 space-y-1.5">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
                <FileText className="w-4 h-4" />
                <span>Previous Semesters Result Sheet Ingestion</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                You are in <strong>{selectedSemester.label}</strong>. To calculate your cumulative CGPA and academic standing accurately, let's ingest your grades from completed terms (<strong>{previousSemestersLabel}</strong>).
              </p>
            </div>

            {/* Ingestion Tabs */}
            <div className="flex border-b border-white/[0.08]">
              <button
                type="button"
                onClick={() => setIngestMethod('screenshot')}
                className={`flex items-center gap-1.5 py-2 px-3 text-xs font-semibold border-b-2 transition btn-tactile ${
                  ingestMethod === 'screenshot'
                    ? 'border-emerald-500 text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>Scan Screenshot (OCR)</span>
              </button>
              <button
                type="button"
                onClick={() => setIngestMethod('quick_gpa')}
                className={`flex items-center gap-1.5 py-2 px-3 text-xs font-semibold border-b-2 transition btn-tactile ${
                  ingestMethod === 'quick_gpa'
                    ? 'border-emerald-500 text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-blue-400" />
                <span>Quick CGPA Entry</span>
              </button>
              <button
                type="button"
                onClick={() => setIngestMethod('skip')}
                className={`flex items-center gap-1.5 py-2 px-3 text-xs font-semibold border-b-2 transition btn-tactile ${
                  ingestMethod === 'skip'
                    ? 'border-emerald-500 text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Enter Later</span>
              </button>
            </div>

            {/* Tab 1: Screenshot OCR Scanner */}
            {ingestMethod === 'screenshot' && (
              <BIISScreenshotScanner
                targetSemesterLabel={previousSemestersLabel}
                onConfirmCourses={(courses, summary) => {
                  setConfirmedCourses(courses);
                  setScanSummary(summary);
                }}
                onAutoSubmit={handleFinalizeSetup}
              />
            )}

            {/* Tab 2: Quick GPA Entry */}
            {ingestMethod === 'quick_gpa' && (
              <div className="p-4 rounded-2xl bg-zinc-900 border border-white/[0.08] space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  If you don't have your individual course sheets handy right now, you can enter your aggregate CGPA and credits so far:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">
                      Current Cumulative CGPA
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="2.00"
                      max="4.00"
                      value={quickCgpa}
                      onChange={(e) => setQuickCgpa(e.target.value)}
                      className="w-full bg-zinc-800 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 tabular-nums focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">
                      Total Completed Credits
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={quickCredits}
                      onChange={(e) => setQuickCredits(e.target.value)}
                      className="w-full bg-zinc-800 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 tabular-nums focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Skip */}
            {ingestMethod === 'skip' && (
              <div className="p-4 rounded-2xl bg-zinc-900 border border-white/[0.08] space-y-2 text-xs">
                <span className="font-semibold text-zinc-200">Enter Grades Later</span>
                <p className="text-zinc-400 leading-relaxed">
                  You can jump straight into setting up your {selectedSemester.label} classes now. You can upload your previous grade sheets anytime inside the <strong>Courses</strong> tab.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition btn-tactile"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleFinalizeSetup}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition btn-tactile"
              >
                <span>
                  {confirmedCourses.length > 0
                    ? `Complete Setup & Import (${confirmedCourses.length} Courses)`
                    : 'Complete Setup & Enter Tracker'}
                </span>
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
