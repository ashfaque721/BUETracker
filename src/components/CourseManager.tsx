import React, { useState } from 'react';
import {
  BUET_GRADE_SCALE,
  BUET_SEMESTERS,
  Course,
  CourseType,
  SemesterInfo,
} from '../types';
import {
  parseBIISText,
  convertParsedCourseToAppCourse,
  BIISParseResult,
  ParsedBIISCourse,
} from '../utils/biisParser';
import { BIISScreenshotScanner } from './BIISScreenshotScanner';
import { calculateGPA } from '../utils/buetOrdinance';
import {
  getIpeCoursesForSemester,
  IPE_CURRICULUM_DATA,
} from '../utils/ipeCurriculum';
import {
  BookOpen,
  Plus,
  Trash2,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  Clipboard,
  Layers,
  GraduationCap,
  FileText,
  AlertCircle,
  Camera,
} from 'lucide-react';

interface CourseManagerProps {
  courses: Course[];
  activeSemesterId: string;
  onSelectSemester: (semesterId: string) => void;
  onAddCourse: (course: Course) => void;
  onUpdateCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onBulkAddCourses: (courses: Course[]) => void;
}

export const CourseManager: React.FC<CourseManagerProps> = ({
  courses,
  activeSemesterId,
  onSelectSemester,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onBulkAddCourses,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'paste' | 'scan'>('manual');

  // Manual Form State
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newCredits, setNewCredits] = useState<number>(3.0);
  const [newType, setNewType] = useState<CourseType>('theory');
  const [newTeacher, setNewTeacher] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [newGrade, setNewGrade] = useState('A+');
  const [newGradePoint, setNewGradePoint] = useState<number>(4.0);
  const [newColor, setNewColor] = useState('#2563eb');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // BIIS State
  const [biisRawText, setBiisRawText] = useState('');
  const [parseResult, setParseResult] = useState<BIISParseResult | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);

  // Independent Viewed Semester state for browsing past & future terms without disrupting active routine
  const [viewedSemesterId, setViewedSemesterId] = useState<string>(activeSemesterId);

  React.useEffect(() => {
    setViewedSemesterId(activeSemesterId);
  }, [activeSemesterId]);

  const activeSemester = BUET_SEMESTERS.find((s) => s.id === viewedSemesterId) || BUET_SEMESTERS[2];
  const semesterCourses = courses.filter((c) => c.semesterId === viewedSemesterId);
  const isOngoingSemester = viewedSemesterId === activeSemesterId;

  const semesterGpa = calculateGPA(
    semesterCourses.map((c) => ({
      credits: c.credits,
      gradePoint: c.isOngoing ? (c.gradePoint ?? c.projectedGradePoint ?? 4.0) : (c.gradePoint ?? 4.0),
    }))
  );

  const gradedCourses = courses.filter((c) => c.gradePoint !== undefined && c.gradePoint > 0);
  const cumulativeCgpa = calculateGPA(
    gradedCourses.map((c) => ({
      credits: c.credits,
      gradePoint: c.gradePoint ?? 4.0,
    }))
  );

  const handleSetAllSemesterGrades = (grade: string, gradePoint: number) => {
    semesterCourses.forEach((c) => {
      onUpdateCourse({
        ...c,
        grade,
        gradePoint,
        projectedGradePoint: gradePoint,
      });
    });
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newTitle.trim()) return;

    const course: Course = {
      id: `course_${Date.now()}`,
      code: newCode.trim().toUpperCase(),
      title: newTitle.trim(),
      nickname: newNickname.trim() || newCode.trim(),
      credits: Number(newCredits),
      type: newType,
      semesterId: viewedSemesterId,
      teacher: newTeacher.trim() || undefined,
      room: newRoom.trim() || undefined,
      color: newColor,
      isOngoing: isOngoingSemester,
      grade: newGrade,
      gradePoint: newGradePoint,
      projectedGradePoint: newGradePoint,
      attendance: isOngoingSemester && newType === 'theory' ? { totalConducted: 0, attended: 0 } : undefined,
      classTests: isOngoingSemester && newType === 'theory' ? [] : undefined,
    };

    onAddCourse(course);

    setNewCode('');
    setNewTitle('');
    setNewNickname('');
    setNewTeacher('');
    setNewRoom('');
    setIsFormOpen(false);
  };

  const handleParseBIIS = (textToParse?: string) => {
    const raw = textToParse !== undefined ? textToParse : biisRawText;
    if (!raw.trim()) return;
    const result = parseBIISText(raw);
    setParseResult(result);
  };

  const handleImportParsedCourses = (parsedList: ParsedBIISCourse[]) => {
    const norm = (str: string) => str.replace(/\s+/g, '').toUpperCase();
    const existingMap = new Map(semesterCourses.map((c) => [norm(c.code), c]));
    const toAdd: Course[] = [];

    parsedList.forEach((parsed) => {
      const codeKey = norm(parsed.code);
      const existing = existingMap.get(codeKey);

      if (existing) {
        onUpdateCourse({
          ...existing,
          title: parsed.title,
          credits: parsed.credits,
          grade: parsed.grade,
          gradePoint: parsed.gradePoint,
          projectedGradePoint: parsed.gradePoint,
        });
      } else {
        toAdd.push({
          id: `course_${viewedSemesterId}_${parsed.code.replace(/[^a-zA-Z0-9]/g, '_')}`,
          code: parsed.code,
          title: parsed.title,
          nickname: parsed.title,
          credits: parsed.credits,
          type: parsed.type,
          semesterId: viewedSemesterId,
          color: '#3b82f6',
          isOngoing: isOngoingSemester,
          grade: parsed.grade,
          gradePoint: parsed.gradePoint,
          projectedGradePoint: parsed.gradePoint,
        });
      }
    });

    if (toAdd.length > 0) {
      onBulkAddCourses(toAdd);
    }

    setActiveTab('manual');
  };

  const handleImportScannedCourses = (scannedCourses: ParsedBIISCourse[]) => {
    handleImportParsedCourses(scannedCourses);
  };

  const handlePopulateCurriculum = () => {
    const curriculumCourses = getIpeCoursesForSemester(viewedSemesterId, isOngoingSemester);
    const existingCodes = new Set(semesterCourses.map((c) => c.code));
    const toAdd = curriculumCourses.filter((c) => !existingCodes.has(c.code));
    if (toAdd.length > 0) {
      onBulkAddCourses(toAdd);
    }
  };

  const handleLoadSampleBIIS = () => {
    const sample = ` CHEM 114\t Inorganic Quantitative Analysis Sessional\t
1.50
    A\t
  3.75

 CHEM 119\t Chemistry - I\t
3.00
    B+\t
  3.25

 HUM 102\t English Language Practice\t
1.50
    A-\t
  3.50

 HUM 211\t Sociology\t
2.00
    A+\t
  4.00

 IPE 105\t Principles of Cost and Management Accounting\t
3.00
    A\t
  3.75

 MATH 191\t Differential and Integral Calculus\t
4.00
    A+\t
  4.00

 ME 160\t Mechanical Engineering Drawing - I\t
1.50
    A\t
  3.75

 PHY 117\t Structure of Matter, Electricity, Magnetism and Modern Physics\t
3.00
    B-\t
  2.75

 SHOP 170\t Machine Shop\t
0.75
    A+\t
  4.00`;

    setBiisRawText(sample);
    handleParseBIIS(sample);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImagePreview(reader.result as string);
      handleLoadSampleBIIS();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      {/* Top Semester Timeline Ribbon */}
      <div className="flex items-center justify-between gap-3 p-2.5 surface-card">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {BUET_SEMESTERS.map((sem) => {
            const isSelected = sem.id === viewedSemesterId;
            const isCurrentActive = sem.id === activeSemesterId;
            const semCourses = courses.filter((c) => c.semesterId === sem.id);
            return (
              <button
                key={sem.id}
                onClick={() => setViewedSemesterId(sem.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap btn-tactile cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-800 text-zinc-100 shadow-xs border border-white/10'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <span>{sem.shortLabel}</span>
                {isCurrentActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Current Active Routine Semester" />
                )}
                {semCourses.length > 0 && (
                  <span className="text-xs text-zinc-400 tabular-nums">({semCourses.length})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Term Metrics Capsule & Quick Grade Setter */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {viewedSemesterId !== activeSemesterId && (
            <button
              onClick={() => onSelectSemester(viewedSemesterId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition cursor-pointer"
              title={`Switch active routine and tracking to ${activeSemester.shortLabel}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Set as Active Term</span>
            </button>
          )}

          {/* Quick CGPA / Grade setter dropdown */}
          {semesterCourses.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#18191e] border border-white/[0.08] rounded-xl px-2.5 py-1 text-xs">
              <span className="text-zinc-400">Set All:</span>
              <select
                onChange={(e) => {
                  const match = BUET_GRADE_SCALE.find((g) => g.grade === e.target.value);
                  if (match) {
                    handleSetAllSemesterGrades(match.grade, match.gradePoint);
                  }
                  e.target.value = '';
                }}
                defaultValue=""
                className="bg-transparent text-emerald-400 font-semibold cursor-pointer focus:outline-none"
                title="Batch set all courses in this term to a specific grade"
              >
                <option value="" disabled className="bg-[#14151a] text-zinc-400">
                  Grade Dropdown ▾
                </option>
                {BUET_GRADE_SCALE.map((g) => (
                  <option key={g.grade} value={g.grade} className="bg-[#14151a] text-zinc-200">
                    All {g.grade} ({g.gradePoint.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs tabular-nums">
            <span className="text-zinc-200 font-semibold font-sans">{activeSemester.shortLabel}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">{semesterGpa.totalCredits} Cr</span>
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-400 font-bold">{semesterGpa.gpa.toFixed(2)} GPA</span>
            {cumulativeCgpa.totalCredits > 0 && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="text-white font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20" title="Overall Cumulative CGPA">
                  {cumulativeCgpa.gpa.toFixed(2)} CGPA
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Segmented Control: Registry vs Paste BIIS vs Screenshot Scanner */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 flex-wrap gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition btn-tactile cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-zinc-800 text-zinc-100 shadow-xs border border-white/10'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Course Registry ({semesterCourses.length})
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition btn-tactile cursor-pointer ${
              activeTab === 'paste'
                ? 'bg-zinc-800 text-zinc-100 shadow-xs border border-white/10'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5 text-blue-400" />
            <span>Paste BIIS Text</span>
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition btn-tactile cursor-pointer ${
              activeTab === 'scan'
                ? 'bg-zinc-800 text-zinc-100 shadow-xs border border-white/10'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>Scan Screenshot</span>
          </button>
        </div>

        {activeTab === 'manual' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePopulateCurriculum}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition cursor-pointer"
              title="Load standard BUET IPE curriculum courses for this term"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auto-Fill {activeSemester.shortLabel}</span>
            </button>
            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isFormOpen ? 'Close Drawer' : 'Add Course'}</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: Course Registry Table */}
      {activeTab === 'manual' && (
        <div className="space-y-4">
          {/* Add Course Drawer */}
          {isFormOpen && (
            <form
              onSubmit={handleCreateCourse}
              className="surface-card p-6 space-y-4 animate-modal-in text-xs"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <h3 className="font-semibold tracking-tight text-zinc-100 text-sm">
                  Register Course in {activeSemester.label}
                </h3>
                <span className="text-zinc-400 text-xs font-medium">
                  {isOngoingSemester ? 'Current Ongoing Term' : 'Previous Completed Term'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Course Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="ME 243"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 tabular-nums font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-zinc-400 mb-1 font-medium">Course Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mechanics of Solids"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Credit Units</label>
                  <select
                    value={newCredits}
                    onChange={(e) => setNewCredits(parseFloat(e.target.value))}
                    className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 tabular-nums focus:outline-none focus:border-emerald-500"
                  >
                    <option value={0.75}>0.75 cr (Lab Sessional)</option>
                    <option value={1.5}>1.50 cr (Lab Sessional)</option>
                    <option value={2.0}>2.00 cr (Theory)</option>
                    <option value={3.0}>3.00 cr (Standard Theory)</option>
                    <option value={4.0}>4.00 cr (Major Theory)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Classification</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as CourseType)}
                    className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="theory">Theory (Continuous Assessment)</option>
                    <option value="sessional">Sessional / Lab</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Teacher's Initials / Name</label>
                  <input
                    type="text"
                    placeholder="SA Ma'am"
                    value={newTeacher}
                    onChange={(e) => setNewTeacher(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Room / Lab Slot</label>
                  <input
                    type="text"
                    placeholder="IPE 317"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 tabular-nums focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {!isOngoingSemester && (
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Achieved Grade</label>
                    <select
                      value={newGrade}
                      onChange={(e) => {
                        setNewGrade(e.target.value);
                        const match = BUET_GRADE_SCALE.find((g) => g.grade === e.target.value);
                        if (match) setNewGradePoint(match.gradePoint);
                      }}
                      className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 tabular-nums focus:outline-none focus:border-emerald-500"
                    >
                      {BUET_GRADE_SCALE.map((g) => (
                        <option key={g.grade} value={g.grade}>
                          {g.grade} ({g.gradePoint.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white btn-tactile"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md transition btn-tactile"
                >
                  Save Course
                </button>
              </div>
            </form>
          )}

          {/* Courses Table */}
          <div className="surface-card overflow-hidden">
            {semesterCourses.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 space-y-3">
                <BookOpen className="w-8 h-8 text-zinc-500 mx-auto" />
                <h4 className="font-semibold text-zinc-200">No Courses Registered for {activeSemester.label}</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  You can automatically populate the official 6th edition BUET IPE curriculum courses for this term with a single click.
                </p>
                <button
                  onClick={handlePopulateCurriculum}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Populate {activeSemester.shortLabel} Curriculum ({IPE_CURRICULUM_DATA[activeSemesterId]?.courses.length || 0} Courses)
                  </span>
                </button>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-white/[0.08] text-zinc-400 font-semibold text-xs bg-zinc-900/60">
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Course Title</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5 text-center">Credits</th>
                    <th className="p-3.5">Instructor & Room</th>
                    <th className="p-3.5 text-center">Grade (CGPA Dropdown)</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {semesterCourses.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-800/40 transition">
                      <td className="p-3.5 font-bold text-zinc-100 tabular-nums flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: c.color || '#3b82f6' }}
                        />
                        <span>{c.code}</span>
                      </td>

                      <td className="p-3.5 text-zinc-200 font-medium">
                        {c.title}
                        {c.nickname && c.nickname !== c.code && (
                          <span className="text-xs text-zinc-400 ml-1.5 font-normal">
                            ({c.nickname})
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                          c.type === 'theory'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                            : 'bg-purple-950 text-purple-300 border border-purple-800/60'
                        }`}>
                          {c.type}
                        </span>
                      </td>

                      <td className="p-3.5 text-center tabular-nums text-zinc-300">
                        {c.credits.toFixed(2)}
                      </td>

                      <td className="p-3.5 text-zinc-400">
                        <div className="flex items-center gap-2">
                          <span>{c.teacher || '—'}</span>
                          {c.room && (
                            <span className="tabular-nums text-zinc-300 bg-zinc-800 px-1.5 py-0.2 rounded text-[10px] border border-white/10">
                              {c.room}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <select
                            value={c.grade || (c.projectedGradePoint ? BUET_GRADE_SCALE.find((g) => g.gradePoint === c.projectedGradePoint)?.grade : 'A+') || 'A+'}
                            onChange={(e) => {
                              const match = BUET_GRADE_SCALE.find((g) => g.grade === e.target.value);
                              if (match) {
                                onUpdateCourse({
                                  ...c,
                                  grade: match.grade,
                                  gradePoint: match.gradePoint,
                                  projectedGradePoint: match.gradePoint,
                                });
                              }
                            }}
                            className="bg-[#1b1d24] border border-white/[0.12] rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-100 cursor-pointer tabular-nums hover:border-emerald-500/60 focus:outline-none focus:border-emerald-500 transition-colors"
                            title="Click to select course grade and update CGPA live"
                          >
                            {BUET_GRADE_SCALE.map((g) => (
                              <option key={g.grade} value={g.grade} className="bg-[#14151a]">
                                {g.grade} ({g.gradePoint.toFixed(2)})
                              </option>
                            ))}
                          </select>
                          {c.isOngoing && (
                            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40" title="Active term course">
                              Active
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => onDeleteCourse(c.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition btn-tactile cursor-pointer"
                          title="Delete Course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Paste BIIS Text */}
      {activeTab === 'paste' && (
        <div className="surface-card p-6 space-y-5 animate-fade-in text-xs">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <h3 className="font-semibold tracking-tight text-zinc-100 text-sm flex items-center gap-2">
                <Clipboard className="w-4 h-4 text-blue-400" />
                <span>Paste BIIS Result Sheet Text ({activeSemester.label})</span>
              </h3>
              <p className="text-zinc-400 text-xs mt-0.5">
                Paste raw table text copied directly from your BIIS portal (handles multi-line credits, grades, and grade points accurately).
              </p>
            </div>
            <button
              onClick={handleLoadSampleBIIS}
              className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition cursor-pointer"
            >
              Load Sample BIIS Result
            </button>
          </div>

          <div className="space-y-3">
            <textarea
              rows={8}
              value={biisRawText}
              onChange={(e) => {
                setBiisRawText(e.target.value);
                handleParseBIIS(e.target.value);
              }}
              placeholder={`Paste copied text from biis.buet.ac.bd:\n\nExample:\n CHEM 114\t Inorganic Quantitative Analysis Sessional\n1.50\n    A\n  3.75\n\n CHEM 119\t Chemistry - I\n3.00\n    B+\n  3.25\n...`}
              className="w-full bg-[#18191e] border border-white/[0.08] rounded-xl p-3.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
            />

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => handleParseBIIS()}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold border border-white/[0.08] transition cursor-pointer"
              >
                Re-Parse Text
              </button>

              {parseResult && parseResult.success && parseResult.courses.length > 0 && (
                <button
                  onClick={() => handleImportParsedCourses(parseResult.courses)}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Ingest {parseResult.courses.length} Courses into {activeSemester.shortLabel} ({parseResult.termGpa?.toFixed(2)} GPA)
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Live Parsed Preview Table */}
          {parseResult && parseResult.success && parseResult.courses.length > 0 && (
            <div className="border border-white/[0.08] rounded-2xl bg-zinc-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-white/[0.06] tabular-nums">
                <span className="font-semibold text-white">
                  Parsed Output: {parseResult.courses.length} Courses Found • {parseResult.totalCredits} Credits
                </span>
                <span className="font-bold text-emerald-400 text-sm">
                  {parseResult.termGpa?.toFixed(2)} Term GPA
                </span>
              </div>

              <div className="overflow-x-auto max-h-60">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-zinc-500 font-medium border-b border-white/[0.04]">
                      <th className="pb-2">Code</th>
                      <th className="pb-2">Title</th>
                      <th className="pb-2 text-center">Credit</th>
                      <th className="pb-2 text-center">Grade</th>
                      <th className="pb-2 text-center">Point</th>
                      <th className="pb-2 text-center">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-zinc-300">
                    {parseResult.courses.map((pc, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="py-2 font-bold text-white">{pc.code}</td>
                        <td className="py-2">{pc.title}</td>
                        <td className="py-2 text-center tabular-nums">{pc.credits.toFixed(2)}</td>
                        <td className="py-2 text-center font-bold text-emerald-400">{pc.grade}</td>
                        <td className="py-2 text-center tabular-nums">{pc.gradePoint.toFixed(2)}</td>
                        <td className="py-2 text-center uppercase text-[10px] text-zinc-400">{pc.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BIIS Grade Sheet Screenshot Scanner */}
      {activeTab === 'scan' && (
        <div className="surface-card p-6 space-y-4 animate-fade-in text-xs">
          <div>
            <h3 className="font-semibold tracking-tight text-zinc-100 text-sm flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>BIIS Grade Sheet Screenshot Scanner ({activeSemester.label})</span>
            </h3>
            <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">
              No need to copy-paste boring text. Just take a screenshot of your result on{' '}
              <span className="text-emerald-400">biis.buet.ac.bd</span> (
              <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300">
                Win + Shift + S
              </kbd>
              ) and press{' '}
              <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-[10px] text-emerald-300 font-bold">
                Ctrl + V
              </kbd>{' '}
              right here!
            </p>
          </div>

          <BIISScreenshotScanner
            targetSemesterLabel={activeSemester.label}
            onConfirmCourses={(courses) => handleImportScannedCourses(courses)}
          />
        </div>
      )}
    </div>
  );
};
