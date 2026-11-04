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
} from '../utils/biisParser';
import { calculateGPA } from '../utils/buetOrdinance';
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
  const [activeTab, setActiveTab] = useState<'manual' | 'biis'>('manual');

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

  const activeSemester = BUET_SEMESTERS.find((s) => s.id === activeSemesterId) || BUET_SEMESTERS[2];
  const semesterCourses = courses.filter((c) => c.semesterId === activeSemesterId);
  const isOngoingSemester = activeSemester.isCurrent;

  const semesterGpa = calculateGPA(
    semesterCourses.map((c) => ({
      credits: c.credits,
      gradePoint: c.isOngoing ? c.projectedGradePoint ?? 4.0 : c.gradePoint,
    }))
  );

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
      semesterId: activeSemesterId,
      teacher: newTeacher.trim() || undefined,
      room: newRoom.trim() || undefined,
      color: newColor,
      isOngoing: isOngoingSemester,
      grade: isOngoingSemester ? undefined : newGrade,
      gradePoint: isOngoingSemester ? undefined : newGradePoint,
      projectedGradePoint: isOngoingSemester && newType === 'sessional' ? 4.0 : undefined,
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

  const handleImportParsedCourses = () => {
    if (!parseResult || parseResult.courses.length === 0) return;

    const appCourses = parseResult.courses.map((parsed) =>
      convertParsedCourseToAppCourse(parsed, activeSemesterId, isOngoingSemester)
    );

    onBulkAddCourses(appCourses);
    setParseResult(null);
    setBiisRawText('');
    setUploadedImagePreview(null);
  };

  const handleLoadSampleBIIS = () => {
    const sample = `Bangladesh University of Engineering and Technology
Result Sheet - Term Examination
Student ID: 2308001   Name: Ashfaque Amin Eshan
Course No    Course Title                                      Credit    Grade    Grade Point
ME 243       Mechanics of Solids                               3.00      A+       4.00
ME 265       Thermal Engineering and Heat Transfer             3.00      A        3.75
IPE 205      Manufacturing Processes I                         3.00      A+       4.00
IPE 207      Engineering Metallurgy                            3.00      A-       3.50
IPE 209      Engineering Economy                               2.00      A+       4.00
ME 244       Mechanics of Solids Sessional                     0.75      A+       4.00
ME 266       Thermal Engineering Sessional                     0.75      A        3.75
IPE 206      Manufacturing Processes I Sessional               0.75      A+       4.00
IPE 208      Engineering Metallurgy Sessional                  0.75      A+       4.00`;

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
            const isSelected = sem.id === activeSemesterId;
            const semCourses = courses.filter((c) => c.semesterId === sem.id);
            return (
              <button
                key={sem.id}
                onClick={() => onSelectSemester(sem.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap btn-tactile ${
                  isSelected
                    ? 'bg-zinc-800 text-zinc-100 shadow-xs border border-white/10'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <span>{sem.shortLabel}</span>
                {sem.isCurrent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
                {semCourses.length > 0 && (
                  <span className="text-xs text-zinc-400 font-mono tabular-nums">({semCourses.length})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Term Metrics Capsule */}
        <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs font-mono tabular-nums">
          <span className="text-zinc-200 font-semibold font-sans">{activeSemester.label}</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400">{semesterGpa.totalCredits} Credits</span>
          <span className="text-zinc-600">•</span>
          <span className="text-emerald-400 font-bold">{semesterGpa.gpa.toFixed(2)} GPA</span>
        </div>
      </div>

      {/* Segmented Control: Registry vs BIIS Parser */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition btn-tactile ${
              activeTab === 'manual'
                ? 'bg-zinc-800 text-zinc-100 shadow-xs border border-white/10'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Course Registry ({semesterCourses.length})
          </button>
          <button
            onClick={() => setActiveTab('biis')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition btn-tactile ${
              activeTab === 'biis'
                ? 'bg-zinc-800 text-zinc-100 shadow-xs border border-white/10'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            BIIS Result Sheet Ingestion
          </button>
        </div>

        {activeTab === 'manual' && (
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition btn-tactile"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isFormOpen ? 'Close Drawer' : 'Add Course'}</span>
          </button>
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
                    className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 font-mono tabular-nums font-bold focus:outline-none focus:border-emerald-500"
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
                    className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 font-mono tabular-nums focus:outline-none focus:border-emerald-500"
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
                    className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 font-mono tabular-nums focus:outline-none focus:border-emerald-500"
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
                      className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 font-mono tabular-nums focus:outline-none focus:border-emerald-500"
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
                <h4 className="font-semibold text-zinc-200">No Courses Registered</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Click 'Add Course' to enter courses manually or use the 'BIIS Result Sheet Ingestion' tab to import an entire semester at once.
                </p>
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
                    <th className="p-3.5 text-center">Grade / Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {semesterCourses.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-800/40 transition">
                      <td className="p-3.5 font-bold text-zinc-100 font-mono tabular-nums flex items-center gap-2">
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

                      <td className="p-3.5 text-center font-mono tabular-nums text-zinc-300">
                        {c.credits.toFixed(2)}
                      </td>

                      <td className="p-3.5 text-zinc-400">
                        <div className="flex items-center gap-2">
                          <span>{c.teacher || '—'}</span>
                          {c.room && (
                            <span className="font-mono tabular-nums text-zinc-300 bg-zinc-800 px-1.5 py-0.2 rounded text-[10px] border border-white/10">
                              {c.room}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        {c.isOngoing ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold text-[10px]">
                            Ongoing Term
                          </span>
                        ) : (
                          <div className="font-mono tabular-nums">
                            <span className="font-bold text-zinc-100 text-xs">{c.grade || '—'}</span>
                            <span className="text-zinc-400 text-xs ml-1">
                              ({(c.gradePoint ?? 0).toFixed(2)})
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => onDeleteCourse(c.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition btn-tactile"
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

      {/* TAB 2: BIIS Grade Sheet Ingestion */}
      {activeTab === 'biis' && (
        <div className="surface-card p-6 space-y-5 animate-fade-in text-xs">
          <div>
            <h3 className="font-semibold tracking-tight text-zinc-100 text-sm">
              BIIS Grade Sheet Auto-Parser ({activeSemester.label})
            </h3>
            <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">
              Copy-paste the text directly from your official BUET BIIS Result Sheet or drop a screenshot to parse course codes, credits, and GPAs automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: Input Options */}
            <div className="space-y-3">
              {/* Dropzone */}
              <label className="border-2 border-dashed border-white/12 hover:border-emerald-500/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-zinc-900/50">
                <UploadCloud className="w-8 h-8 text-emerald-400" />
                <span className="font-semibold text-zinc-200 text-sm">Drop BIIS Screenshot / Result Slip</span>
                <span className="text-xs text-zinc-400 text-center leading-relaxed">
                  Supports PNG, JPG, or PDF snippets (Auto-extracts sample courses)
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {/* Text Paste Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-400 font-medium">Or Paste Raw BIIS Text</label>
                  <button
                    onClick={handleLoadSampleBIIS}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    Load BUET L2T1 Sample Sheet
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={biisRawText}
                  onChange={(e) => {
                    setBiisRawText(e.target.value);
                    handleParseBIIS(e.target.value);
                  }}
                  placeholder="Paste Course No, Course Title, Credit, Grade, Grade Point here..."
                  className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl p-3 text-zinc-100 font-mono tabular-nums text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Right: Parsed Preview */}
            <div className="space-y-3">
              <div className="font-semibold text-zinc-200 flex items-center justify-between text-xs">
                <span>Parsed Course Preview</span>
                {parseResult && (
                  <span className="text-emerald-400 font-mono tabular-nums text-xs">
                    {parseResult.courses.length} courses identified
                  </span>
                )}
              </div>

              {parseResult && parseResult.courses.length > 0 ? (
                <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-zinc-900">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-zinc-400 font-semibold text-[11px] bg-zinc-800/40">
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Title</th>
                        <th className="p-2.5 text-center">Credits</th>
                        <th className="p-2.5 text-center">Grade</th>
                        <th className="p-2.5 text-right">Point</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] font-mono tabular-nums">
                      {parseResult.courses.map((p, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-bold text-zinc-100">{p.code}</td>
                          <td className="p-2.5 text-zinc-300 font-sans truncate max-w-[140px]">{p.title}</td>
                          <td className="p-2.5 text-center">{p.credits.toFixed(2)}</td>
                          <td className="p-2.5 text-center font-bold text-emerald-400">{p.grade}</td>
                          <td className="p-2.5 text-right font-bold text-zinc-100">{p.gradePoint.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="p-3 bg-zinc-950 border-t border-white/[0.08] flex items-center justify-between">
                    <span className="text-xs text-zinc-400 font-medium">
                      Target: {activeSemester.label}
                    </span>
                    <button
                      onClick={handleImportParsedCourses}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition btn-tactile"
                    >
                      Commit {parseResult.courses.length} Courses to Database
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-56 rounded-2xl border border-dashed border-white/[0.08] flex flex-col items-center justify-center p-6 text-center text-zinc-500">
                  <Clipboard className="w-8 h-8 text-zinc-600 mb-2" />
                  <p>Paste text or click 'Load BUET L2T1 Sample Sheet' to preview parsed courses here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
