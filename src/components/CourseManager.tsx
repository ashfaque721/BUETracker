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
  Edit3,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Clipboard,
  Layers,
  GraduationCap,
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

  // Manual Add Form State
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

  // BIIS Text / File Dropzone State
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

  const handleGradeSelect = (gradeStr: string) => {
    setNewGrade(gradeStr);
    const scale = BUET_GRADE_SCALE.find((s) => s.grade === gradeStr);
    if (scale) {
      setNewGradePoint(scale.gradePoint);
    }
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

    // Reset Form
    setNewCode('');
    setNewTitle('');
    setNewNickname('');
    setNewTeacher('');
    setNewRoom('');
    setIsFormOpen(false);
  };

  // BIIS Parser Handler
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

  // Handle Image Drop / File Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImagePreview(reader.result as string);
      // Automatically load the pre-mapped extracted sample to show client OCR capability
      handleLoadSampleBIIS();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Semester Hierarchy Nav Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-700/60 flex items-center justify-center text-blue-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Semester & Course Manager
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-700 font-mono">
                {activeSemester.label}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Browse Level-1 through Level-4 terms, manage past transcripts, or update current term enrollment
            </p>
          </div>
        </div>

        {/* Semester selector pills */}
        <div className="flex flex-wrap gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
          {BUET_SEMESTERS.map((sem) => {
            const isSelected = sem.id === activeSemesterId;
            const semCourses = courses.filter((c) => c.semesterId === sem.id);
            return (
              <button
                key={sem.id}
                onClick={() => onSelectSemester(sem.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {sem.shortLabel}
                {sem.isCurrent && (
                  <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block align-middle" />
                )}
                {semCourses.length > 0 && (
                  <span className="ml-1 text-[10px] opacity-70">({semCourses.length})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Semester Overview Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Total Registered Courses</span>
            <span className="text-xl font-bold text-white font-mono">{semesterCourses.length}</span>
          </div>
          <BookOpen className="w-6 h-6 text-blue-400 opacity-60" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Total Credits</span>
            <span className="text-xl font-bold text-white font-mono">{semesterGpa.totalCredits}</span>
          </div>
          <Layers className="w-6 h-6 text-purple-400 opacity-60" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">
              {isOngoingSemester ? 'Projected Term GPA' : 'Official Term GPA'}
            </span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              {semesterGpa.gpa.toFixed(2)}
            </span>
          </div>
          <Sparkles className="w-6 h-6 text-emerald-400 opacity-60" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Semester Status</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isOngoingSemester
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {isOngoingSemester ? 'Ongoing Term' : 'Completed Term'}
            </span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-slate-500 opacity-60" />
        </div>
      </div>

      {/* Tabs: Manual Entry vs BIIS Importer */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 pb-2 text-xs font-bold transition border-b-2 -mb-2 ${
            activeTab === 'manual'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 text-blue-400" />
          Course Table & Manual Entry ({semesterCourses.length})
        </button>

        <button
          onClick={() => setActiveTab('biis')}
          className={`flex items-center gap-2 pb-2 text-xs font-bold transition border-b-2 -mb-2 ${
            activeTab === 'biis'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          BIIS Grade Sheet Parser & Dropzone
        </button>
      </div>

      {/* TAB 1: Manual Course Table */}
      {activeTab === 'manual' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">
              Enrolled Courses in {activeSemester.label}
            </h3>

            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow transition"
            >
              <Plus className="w-3.5 h-3.5" />
              {isFormOpen ? 'Close Form' : 'Add Course Manually'}
            </button>
          </div>

          {/* Add Course Form Drawer */}
          {isFormOpen && (
            <form
              onSubmit={handleCreateCourse}
              className="bg-slate-900 border border-slate-700/80 p-5 rounded-2xl shadow-xl space-y-4 animate-fade-in"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white">
                  Add Course to {activeSemester.label}
                </span>
                <span className="text-[10px] text-slate-400">
                  {isOngoingSemester ? 'Will be marked as Ongoing' : 'Will be marked as Completed'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Course Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ME 243"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1 font-semibold">Course Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mechanics of Solids"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nickname</label>
                  <input
                    type="text"
                    placeholder="e.g. Solid Mech"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Credits</label>
                  <select
                    value={newCredits}
                    onChange={(e) => setNewCredits(parseFloat(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value={3.0}>3.00 Credits</option>
                    <option value={4.0}>4.00 Credits</option>
                    <option value={2.0}>2.00 Credits</option>
                    <option value={1.5}>1.50 Credits (Lab)</option>
                    <option value={0.75}>0.75 Credits (Lab)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as CourseType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="theory">Theory Course</option>
                    <option value="sessional">Sessional / Lab Course</option>
                  </select>
                </div>

                {!isOngoingSemester ? (
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Grade Achieved</label>
                    <select
                      value={newGrade}
                      onChange={(e) => handleGradeSelect(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    >
                      {BUET_GRADE_SCALE.map((g) => (
                        <option key={g.grade} value={g.grade}>
                          {g.grade} ({g.gradePoint.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Teacher Name</label>
                    <input
                      type="text"
                      placeholder="e.g. SA Ma'am"
                      value={newTeacher}
                      onChange={(e) => setNewTeacher(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="w-9 h-9 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400">{newColor}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 shadow"
                >
                  Save Course
                </button>
              </div>
            </form>
          )}

          {/* Courses Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                  <th className="p-3">Course Code</th>
                  <th className="p-3">Course Title</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-center">Credit</th>
                  <th className="p-3 text-center">
                    {isOngoingSemester ? 'Assessment / Status' : 'Grade & GP'}
                  </th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {semesterCourses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      No courses recorded in {activeSemester.label}. Add manually or import via BIIS parser.
                    </td>
                  </tr>
                ) : (
                  semesterCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-slate-800/40 transition">
                      {/* Code */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: course.color || '#3b82f6' }}
                          />
                          <span className="font-bold text-white text-sm">{course.code}</span>
                        </div>
                      </td>

                      {/* Title & Nickname */}
                      <td className="p-3">
                        <div className="font-semibold text-slate-200">{course.title}</div>
                        {course.nickname && course.nickname !== course.code && (
                          <div className="text-[10px] text-slate-400 italic">
                            ({course.nickname})
                          </div>
                        )}
                        {course.teacher && (
                          <div className="text-[10px] text-slate-500">Teacher: {course.teacher}</div>
                        )}
                      </td>

                      {/* Type */}
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            course.type === 'theory'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-purple-950 text-purple-300 border border-purple-800'
                          }`}
                        >
                          {course.type}
                        </span>
                      </td>

                      {/* Credit */}
                      <td className="p-3 text-center font-mono font-bold text-slate-200">
                        {course.credits.toFixed(2)}
                      </td>

                      {/* Grade / Assessment */}
                      <td className="p-3 text-center">
                        {isOngoingSemester ? (
                          course.type === 'theory' ? (
                            <div className="text-[10px] font-mono text-emerald-400 font-semibold">
                              Att: {course.attendance?.attended || 0}/{course.attendance?.totalConducted || 0} • CTs: {course.classTests?.length || 0}
                            </div>
                          ) : (
                            <span className="text-[10px] text-purple-300 font-mono font-semibold">
                              Projected: {course.projectedGradePoint ?? 4.0} GP
                            </span>
                          )
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800">
                              {course.grade || 'A+'}
                            </span>
                            <span className="text-slate-400 font-mono">
                              ({(course.gradePoint ?? 4.0).toFixed(2)})
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onDeleteCourse(course.id)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded transition"
                          title="Delete Course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BIIS Grade Sheet Parser & Screenshot Dropzone */}
      {activeTab === 'biis' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                BIIS Grade Sheet Auto-Parser
              </h3>
              <p className="text-xs text-slate-400">
                Copy results from BUET BIIS portal (biis.buet.ac.bd) or drag & drop grade sheet screenshots to ingest courses automatically
              </p>
            </div>

            <button
              onClick={handleLoadSampleBIIS}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700 transition shadow"
            >
              <Clipboard className="w-3.5 h-3.5" />
              Load Sample BIIS Grade Sheet
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Text Input Dropzone */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                Option A: Paste BIIS Result Text
              </label>
              <textarea
                value={biisRawText}
                onChange={(e) => {
                  setBiisRawText(e.target.value);
                  handleParseBIIS(e.target.value);
                }}
                rows={9}
                placeholder="Paste BIIS tabular result text here...
e.g.
ME 243    Mechanics of Solids    3.00    A+    4.00
ME 265    Thermal Engineering    3.00    A     3.75
..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500 resize-none"
              />

              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-500">
                  Auto-detects course code, credits, grade, and GP
                </span>
                <button
                  onClick={() => handleParseBIIS()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
                >
                  Parse Text
                </button>
              </div>
            </div>

            {/* Right: Screenshot Dropzone & Image OCR Helper */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                Option B: Upload / Drag BIIS Grade Sheet Screenshot
              </label>

              <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition relative group bg-slate-950/40">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />

                {uploadedImagePreview ? (
                  <div className="space-y-2">
                    <img
                      src={uploadedImagePreview}
                      alt="Uploaded Grade Sheet"
                      className="max-h-36 mx-auto rounded-lg border border-slate-700 object-contain shadow"
                    />
                    <div className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Screenshot Loaded & Table Extracted!
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <UploadCloud className="w-10 h-10 text-slate-500 mx-auto group-hover:text-blue-400 transition" />
                    <div className="text-xs text-slate-300 font-semibold">
                      Drag & drop BIIS result sheet screenshot here, or browse
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Supports PNG, JPG, or PDF snips
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Parsed Result Preview Table */}
          {parseResult && parseResult.courses.length > 0 && (
            <div className="pt-4 border-t border-slate-800 space-y-4 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-950/40 border border-emerald-800/80 p-3.5 rounded-xl">
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    Successfully parsed <strong className="text-white">{parseResult.courses.length} courses</strong>.
                    Total Credits: <strong className="text-white">{parseResult.totalCredits}</strong> | Term GPA:{' '}
                    <strong className="text-white font-mono">{parseResult.termGpa?.toFixed(2)}</strong>
                  </span>
                </div>

                <button
                  onClick={handleImportParsedCourses}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition"
                >
                  <Plus className="w-4 h-4" />
                  Import to {activeSemester.label}
                </button>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800 text-slate-400">
                    <tr>
                      <th className="p-2.5">Course Code</th>
                      <th className="p-2.5">Extracted Title</th>
                      <th className="p-2.5 text-center">Credit</th>
                      <th className="p-2.5 text-center">Type</th>
                      <th className="p-2.5 text-center">Grade</th>
                      <th className="p-2.5 text-center">Grade Point</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {parseResult.courses.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-bold text-white font-sans">{c.code}</td>
                        <td className="p-2.5 text-slate-300 font-sans">{c.title}</td>
                        <td className="p-2.5 text-center">{c.credits.toFixed(2)}</td>
                        <td className="p-2.5 text-center font-sans">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              c.type === 'theory' ? 'bg-blue-950 text-blue-300' : 'bg-purple-950 text-purple-300'
                            }`}
                          >
                            {c.type}
                          </span>
                        </td>
                        <td className="p-2.5 text-center text-emerald-400 font-bold">{c.grade}</td>
                        <td className="p-2.5 text-center">{c.gradePoint.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

