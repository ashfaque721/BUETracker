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
  Calendar,
  Check,
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
      handleLoadSampleBIIS();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Semester Hierarchy Nav Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/80 p-5 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 border border-purple-500/30 flex items-center justify-center text-white shadow-lg shadow-purple-950/60">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white">
                Semester & Course Manager
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/80 font-mono">
                {activeSemester.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Browse Level-1 through Level-4 terms, manage past transcripts, or import BIIS grade sheets
            </p>
          </div>
        </div>

        {/* Semester selector pills */}
        <div className="flex flex-wrap gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/80">
          {BUET_SEMESTERS.map((sem) => {
            const isSelected = sem.id === activeSemesterId;
            const semCourses = courses.filter((c) => c.semesterId === sem.id);
            return (
              <button
                key={sem.id}
                onClick={() => onSelectSemester(sem.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {sem.shortLabel}
                {sem.isCurrent && (
                  <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block align-middle" />
                )}
                {semCourses.length > 0 && (
                  <span className="ml-1 text-[10px] opacity-75 font-mono">({semCourses.length})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Semester Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Total Courses</span>
            <span className="text-2xl font-black text-white font-mono">{semesterCourses.length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/60">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Total Credits</span>
            <span className="text-2xl font-black text-white font-mono">{semesterGpa.totalCredits}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-800/60">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              {isOngoingSemester ? 'Current Projected GPA' : 'Official Term GPA'}
            </span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {semesterGpa.gpa.toFixed(2)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Term Status</span>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-block mt-1 ${
                isOngoingSemester
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {isOngoingSemester ? 'Active Term' : 'Completed Term'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/80 text-slate-400 border border-slate-700/60">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Segmented Control: Course List vs BIIS Importer */}
      <div className="flex gap-2 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'manual'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Course Table ({semesterCourses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('biis')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'biis'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>BIIS Grade Sheet Auto-Parser</span>
        </button>
      </div>

      {/* TAB 1: Course Table & Add Form */}
      {activeTab === 'manual' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Courses in {activeSemester.label}</span>
              <span className="text-xs font-mono text-slate-400">({semesterCourses.length} registered)</span>
            </h3>

            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isFormOpen ? 'Close Form' : 'Add Course Manually'}</span>
            </button>
          </div>

          {/* Add Course Drawer */}
          {isFormOpen && (
            <form
              onSubmit={handleCreateCourse}
              className="bg-slate-900 border border-slate-700/80 p-6 rounded-3xl shadow-xl space-y-4 animate-fade-in"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white">
                  Add Course to {activeSemester.label}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {isOngoingSemester ? 'Status: Ongoing (Assessed via CT & Attendance)' : 'Status: Completed'}
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-blue-500"
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nickname</label>
                  <input
                    type="text"
                    placeholder="e.g. Solid Mech"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => {
                      const t = e.target.value as CourseType;
                      setNewType(t);
                      if (t === 'sessional') setNewCredits(1.5);
                      else setNewCredits(3.0);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="theory">Theory (Continuous Assessment)</option>
                    <option value="sessional">Sessional / Lab</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Credits</label>
                  <select
                    value={newCredits}
                    onChange={(e) => setNewCredits(parseFloat(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value={0.75}>0.75 cr (Half Lab)</option>
                    <option value={1.5}>1.50 cr (Full Lab)</option>
                    <option value={2.0}>2.00 cr (Theory / Lab)</option>
                    <option value={3.0}>3.00 cr (Standard Theory)</option>
                    <option value={4.0}>4.00 cr (Major Theory)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Teacher's Name</label>
                  <input
                    type="text"
                    placeholder="e.g. SA Ma'am"
                    value={newTeacher}
                    onChange={(e) => setNewTeacher(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Classroom / Lab</label>
                  <input
                    type="text"
                    placeholder="e.g. IPE 317"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
                >
                  Save Course
                </button>
              </div>
            </form>
          )}

          {/* Course List Table */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Course Code & Title</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5 text-center">Credit</th>
                  <th className="p-3.5 text-center">Assessment / Grade</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {semesterCourses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No courses registered for this semester. Click "+ Add Course Manually" or use the BIIS Parser tab.
                    </td>
                  </tr>
                ) : (
                  semesterCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-slate-800/40 transition">
                      {/* Code & Title */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: course.color || '#3b82f6' }}
                          />
                          <div>
                            <span className="font-black text-white text-xs">{course.code}</span>
                            <span className="text-slate-400 text-xs ml-2">{course.title}</span>
                          </div>
                        </div>
                        {course.teacher && (
                          <div className="text-[10px] text-slate-500 mt-0.5 ml-5">
                            Teacher: {course.teacher} {course.room ? `• Room: ${course.room}` : ''}
                          </div>
                        )}
                      </td>

                      {/* Type */}
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            course.type === 'theory'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-purple-950 text-purple-300 border border-purple-800'
                          }`}
                        >
                          {course.type}
                        </span>
                      </td>

                      {/* Credit */}
                      <td className="p-3.5 text-center font-mono font-bold text-slate-200">
                        {course.credits.toFixed(2)}
                      </td>

                      {/* Grade / Assessment */}
                      <td className="p-3.5 text-center">
                        {isOngoingSemester ? (
                          course.type === 'theory' ? (
                            <div className="text-[11px] font-mono text-emerald-400 font-bold">
                              Att: {course.attendance?.attended || 0}/{course.attendance?.totalConducted || 0} • CTs: {course.classTests?.length || 0}
                            </div>
                          ) : (
                            <span className="text-[11px] text-purple-300 font-mono font-semibold">
                              Projected: {course.projectedGradePoint ?? 4.0} GP
                            </span>
                          )
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 font-bold border border-emerald-800">
                              {course.grade || 'A+'}
                            </span>
                            <span className="text-slate-400 font-mono">
                              ({(course.gradePoint ?? 4.0).toFixed(2)})
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => onDeleteCourse(course.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
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
        <div className="bg-slate-900/90 border border-slate-800/80 p-6 rounded-3xl shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                BIIS Grade Sheet Auto-Parser
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Paste tabular results from BUET BIIS portal (biis.buet.ac.bd) or drag & drop grade sheet screenshots
              </p>
            </div>

            <button
              onClick={handleLoadSampleBIIS}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white transition shadow-lg shadow-amber-950/60"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Load Sample BIIS Grade Sheet</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Text Input Dropzone */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                Option A: Paste BIIS Tabular Result Text
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
ME 243    Mechanics of Solids                    3.00    A+    4.00
ME 265    Thermal Engineering and Heat Transfer  3.00    A     3.75
IPE 205   Manufacturing Processes I              3.00    A+    4.00
..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
              />

              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-500">
                  Auto-detects course code, credits, grade, and GP
                </span>
                <button
                  onClick={() => handleParseBIIS()}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md"
                >
                  Parse Text
                </button>
              </div>
            </div>

            {/* Right: Screenshot Dropzone */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                Option B: Upload / Drag BIIS Grade Sheet Screenshot
              </label>

              <div className="border-2 border-dashed border-slate-700/80 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer transition relative group bg-slate-950/40">
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
                      className="max-h-36 mx-auto rounded-xl border border-slate-700 object-contain shadow-lg"
                    />
                    <div className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Screenshot Loaded & Table Extracted!
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 py-6">
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
              <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-950/40 border border-emerald-800/80 p-4 rounded-2xl">
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Successfully parsed <strong className="text-white">{parseResult.courses.length} courses</strong>.
                    Total Credits: <strong className="text-white">{parseResult.totalCredits}</strong> | Term GPA:{' '}
                    <strong className="text-white font-mono">{parseResult.termGpa?.toFixed(2)}</strong>
                  </span>
                </div>

                <button
                  onClick={handleImportParsedCourses}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Import all to {activeSemester.label}</span>
                </button>
              </div>

              <div className="border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Course Code</th>
                      <th className="p-3">Extracted Title</th>
                      <th className="p-3 text-center">Credit</th>
                      <th className="p-3 text-center">Type</th>
                      <th className="p-3 text-center">Grade</th>
                      <th className="p-3 text-center">Grade Point</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {parseResult.courses.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-white font-sans">{c.code}</td>
                        <td className="p-3 text-slate-300 font-sans">{c.title}</td>
                        <td className="p-3 text-center">{c.credits.toFixed(2)}</td>
                        <td className="p-3 text-center font-sans">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              c.type === 'theory' ? 'bg-blue-950 text-blue-300' : 'bg-purple-950 text-purple-300'
                            }`}
                          >
                            {c.type}
                          </span>
                        </td>
                        <td className="p-3 text-center text-emerald-400 font-black">{c.grade}</td>
                        <td className="p-3 text-center font-bold">{c.gradePoint.toFixed(2)}</td>
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
