import React, { useState, useEffect, useRef } from 'react';
import {
  BUET_SEMESTERS,
  Course,
  RoutineMetadata,
  UserSettings,
} from './types';
import {
  db,
  initializeDatabase,
  exportDatabaseJSON,
  importDatabaseJSON,
  SEED_COURSES,
  SEED_ROUTINE,
  SEED_SETTINGS,
} from './db';
import { RoutineDesigner } from './components/RoutineDesigner';
import { AssessmentView } from './components/AssessmentView';
import { CourseManager } from './components/CourseManager';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { WelcomeTutorialModal } from './components/WelcomeTutorialModal';
import { SettingsModal } from './components/SettingsModal';
import { StudentSetupWizard } from './components/StudentSetupWizard';
import { calculateGPA } from './utils/buetOrdinance';
import {
  getIpeCoursesForSemester,
  getIpeRoutineForSemester,
  IPE_CURRICULUM_DATA,
} from './utils/ipeCurriculum';
import {
  Calendar,
  Calculator,
  BookOpen,
  BarChart3,
  Settings,
  Sparkles,
  ChevronDown,
  Download,
  FileDown,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export function App() {
  const [activeTab, setActiveTab] = useState<'routine' | 'assessment' | 'courses' | 'analytics'>('routine');
  const [courses, setCourses] = useState<Course[]>([]);
  const [routine, setRoutine] = useState<RoutineMetadata>(SEED_ROUTINE);
  const [settings, setSettings] = useState<UserSettings>({
    studentName: '',
    studentId: '',
    department: 'Industrial & Production Engineering (IPE)',
    totalDegreeCredits: 160,
    currentSemesterId: 'L1T1',
    theme: 'dark',
    isOnboarded: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Editable Title State (Left top bar)
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(routine.title || "Class Routine — IPE'23 Section A");

  // Export State (Right top bar)
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (routine.title) {
      setTitleText(routine.title);
    }
  }, [routine.title]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (titleText.trim() && titleText !== routine.title) {
      handleUpdateRoutine({
        ...routine,
        title: titleText.trim(),
      });
    }
  };

  const handleExportPNG = async () => {
    const el = document.getElementById('buet-timetable-grid');
    if (!el) return;
    setIsExportOpen(false);
    setIsExporting(true);
    try {
      const dataUrl = await toPng(el, {
        pixelRatio: 2,
        backgroundColor: '#0d0e11',
      });
      const link = document.createElement('a');
      link.download = `${(routine.title || 'Class_Routine').replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
      showToast('Exported routine as high-res PNG');
    } catch (err) {
      console.error(err);
      showToast('Failed to export PNG');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    const el = document.getElementById('buet-timetable-grid');
    if (!el) return;
    setIsExportOpen(false);
    setIsExporting(true);
    try {
      const dataUrl = await toPng(el, {
        pixelRatio: 2,
        backgroundColor: '#0d0e11',
      });
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      const imgWidth = 280;
      const imgHeight = (el.offsetHeight * imgWidth) / el.offsetWidth;
      pdf.addImage(dataUrl, 'PNG', 8, 12, imgWidth, Math.min(imgHeight, 185));
      pdf.save(`${(routine.title || 'Class_Routine').replace(/\s+/g, '_')}.pdf`);
      showToast('Exported routine as landscape PDF');
    } catch (err) {
      console.error(err);
      showToast('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Load from Dexie DB on Mount
  const loadData = async () => {
    try {
      await initializeDatabase();
      const allCourses = await db.courses.toArray();
      const allRoutines = await db.routines.toArray();
      const allSettings = await db.settings.toArray();

      if (allSettings.length > 0 && allSettings[0].isOnboarded) {
        const userSet = allSettings[0];
        const currentSemId = userSet.currentSemesterId || 'L2T1';
        let loadedCourses = allCourses;
        let loadedRoutine = allRoutines[0];

        // Ensure courses for current semester exist; if not, automatically populate from IPE curriculum
        const semCourses = loadedCourses.filter((c) => c.semesterId === currentSemId);
        if (semCourses.length === 0) {
          const ipeCourses = getIpeCoursesForSemester(currentSemId, true);
          loadedCourses = [...loadedCourses, ...ipeCourses];
          await db.courses.bulkPut(ipeCourses);
        }

        // Ensure routine has slots; if not, automatically populate from IPE curriculum
        if (!loadedRoutine || !loadedRoutine.slots || loadedRoutine.slots.length === 0) {
          loadedRoutine = getIpeRoutineForSemester(currentSemId);
          await db.routines.put(loadedRoutine);
        }

        setSettings(userSet);
        setCourses(loadedCourses);
        setRoutine(loadedRoutine);
        if (loadedRoutine.title) {
          setTitleText(loadedRoutine.title);
        }
      } else {
        // First run: Show onboarding wizard
        const initialSetupSettings: UserSettings = {
          studentName: '',
          studentId: '',
          department: 'Industrial & Production Engineering (IPE)',
          totalDegreeCredits: 160,
          currentSemesterId: 'L2T1',
          theme: 'dark',
          isOnboarded: false,
        };
        setSettings(initialSetupSettings);
        setCourses([]);
      }
    } catch (err) {
      console.error('Failed to load DB:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Semester Switcher Handler: switches active semester, ensures authentic IPE courses & routine exist
  const handleSwitchSemester = async (newSemId: string) => {
    try {
      const semCurriculum = IPE_CURRICULUM_DATA[newSemId] || IPE_CURRICULUM_DATA.L2T1;
      const newRoutine = getIpeRoutineForSemester(newSemId);

      const existingSemCourses = courses.filter((c) => c.semesterId === newSemId);
      let updatedCourses = [...courses];

      // Mark other semesters as not ongoing
      updatedCourses = updatedCourses.map((c) => {
        if (c.semesterId !== newSemId && c.isOngoing) {
          return { ...c, isOngoing: false };
        }
        return c;
      });

      if (existingSemCourses.length === 0) {
        // Automatically populate authentic IPE courses for this semester
        const newSemCourses = getIpeCoursesForSemester(newSemId, true);
        updatedCourses = [...updatedCourses, ...newSemCourses];
        await db.courses.bulkPut(newSemCourses);
      } else {
        // Mark existing courses of chosen semester as isOngoing: true
        updatedCourses = updatedCourses.map((c) => {
          if (c.semesterId === newSemId) {
            return { ...c, isOngoing: true };
          }
          return c;
        });
        await db.courses.bulkPut(updatedCourses.filter((c) => c.semesterId === newSemId));
      }

      const updatedSettings: UserSettings = {
        ...settings,
        currentSemesterId: newSemId,
      };

      await db.routines.put(newRoutine);
      await db.settings.put({ id: 'primary_settings', ...updatedSettings });

      setCourses(updatedCourses);
      setRoutine(newRoutine);
      setSettings(updatedSettings);
      if (newRoutine.title) {
        setTitleText(newRoutine.title);
      }

      showToast(`Switched to ${semCurriculum.label} (${semCurriculum.shortLabel}) with official IPE routine & courses`);
    } catch (err) {
      console.error('Error switching semester:', err);
      showToast('Failed to switch semester');
    }
  };

  // First-Run Wizard Completion Handler
  const handleCompleteSetup = async (
    newSettings: UserSettings,
    initialCourses: Course[],
    initialRoutine: RoutineMetadata
  ) => {
    try {
      await db.transaction('rw', db.courses, db.routines, db.settings, async () => {
        await db.courses.clear();
        await db.routines.clear();
        await db.settings.clear();

        if (initialCourses.length > 0) {
          await db.courses.bulkPut(initialCourses);
        }
        await db.routines.put(initialRoutine);
        await db.settings.put({ id: 'primary_settings', ...newSettings });
      });
    } catch (err) {
      console.error('Failed to commit setup to database:', err);
    } finally {
      setSettings(newSettings);
      setCourses(initialCourses);
      setRoutine(initialRoutine);
      if (initialRoutine.title) {
        setTitleText(initialRoutine.title);
      }

      // Always land on the Routine Timetable View
      setActiveTab('routine');

      const firstName = newSettings.studentName?.trim().split(' ')[0] || 'Student';
      showToast(`Welcome, ${firstName}! Your workspace is ready.`);
    }
  };

  // Explicit demo sample load: loads authentic BUET IPE curriculum for the active semester
  const handleLoadSampleRoutine = async () => {
    const targetSemId = settings.currentSemesterId || 'L2T1';
    const semRoutine = getIpeRoutineForSemester(targetSemId);
    const semCourses = getIpeCoursesForSemester(targetSemId, true);

    await db.transaction('rw', db.courses, db.routines, db.settings, async () => {
      // Keep completed prior courses, replace current semester courses
      const otherCourses = courses.filter((c) => c.semesterId !== targetSemId);
      await db.courses.clear();
      await db.courses.bulkAdd([...otherCourses, ...semCourses]);
      await db.routines.put(semRoutine);
    });

    setCourses((prev) => [...prev.filter((c) => c.semesterId !== targetSemId), ...semCourses]);
    setRoutine(semRoutine);
    if (semRoutine.title) setTitleText(semRoutine.title);
    showToast(`Loaded authentic BUET IPE ${IPE_CURRICULUM_DATA[targetSemId]?.shortLabel || targetSemId} routine & courses`);
  };

  // CRUD Handlers for Courses
  const handleAddCourse = async (course: Course) => {
    await db.courses.add(course);
    setCourses((prev) => [...prev, course]);
    showToast(`Added course ${course.code}`);
  };

  const handleUpdateCourse = async (course: Course) => {
    await db.courses.put(course);
    setCourses((prev) => prev.map((c) => (c.id === course.id ? course : c)));
  };

  const handleDeleteCourse = async (courseId: string) => {
    await db.courses.delete(courseId);
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    showToast('Course deleted');
  };

  const handleBulkAddCourses = async (newCourses: Course[]) => {
    await db.courses.bulkAdd(newCourses);
    setCourses((prev) => [...prev, ...newCourses]);
    showToast(`Imported ${newCourses.length} courses`);
  };

  // Routine Handler
  const handleUpdateRoutine = async (updated: RoutineMetadata) => {
    await db.routines.put(updated);
    setRoutine(updated);
  };

  // Settings Handler
  const handleUpdateSettings = async (updated: UserSettings) => {
    await db.settings.put({ id: 'primary_settings', ...updated });
    setSettings(updated);
    showToast('Student settings updated');
  };

  // Backup & Restore
  const handleExportBackup = async () => {
    try {
      const json = await exportDatabaseJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BUETracker_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('JSON Backup downloaded');
    } catch (err) {
      console.error(err);
      showToast('Failed to export backup');
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const success = await importDatabaseJSON(text);
      if (success) {
        await loadData();
        showToast('Backup restored successfully');
        setShowSettingsModal(false);
      } else {
        showToast('Invalid backup file format');
      }
    } catch (err) {
      console.error(err);
      showToast('Error reading backup file');
    }
  };

  // Summary Metrics for Header
  const completedCourses = courses.filter((c) => !c.isOngoing && c.gradePoint !== undefined);
  const overallCgpa = calculateGPA(
    completedCourses.map((c) => ({ credits: c.credits, gradePoint: c.gradePoint }))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-emerald-400 font-bold text-sm tracking-tight animate-pulse shadow-xl">
          BU
        </div>
        <p className="text-xs text-zinc-400 font-medium">Starting BUETracker...</p>
      </div>
    );
  }

  // FIRST RUN: If user is NOT onboarded, show the dedicated StudentSetupWizard!
  if (!settings.isOnboarded) {
    return (
      <StudentSetupWizard
        onCompleteSetup={handleCompleteSetup}
        onLoadSampleDemo={handleLoadSampleRoutine}
      />
    );
  }

  const deptShort = settings.department?.includes('(')
    ? settings.department.split('(')[1]?.replace(')', '')
    : settings.department || "IPE '23";
  const termShort = settings.currentSemesterId
    ? BUET_SEMESTERS.find((s) => s.id === settings.currentSemesterId)?.shortLabel || settings.currentSemesterId
    : 'L-2 T-1';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d0e11] text-zinc-100 select-none font-sans antialiased">
      {/* ----------------------------------------------------------------- */}
      {/* 1. Left Desktop Sidebar Navigation                                */}
      {/* ----------------------------------------------------------------- */}
      <aside className="w-56 shrink-0 h-full bg-[#111215] border-r border-white/[0.08] flex flex-col justify-between p-4 no-print select-none z-30">
        <div>
          {/* Top: App Title & Active Term */}
          <div className="px-2 pt-1 pb-4 border-b border-white/[0.06]">
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              BUETTracker
            </h1>
            <div className="mt-2.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block mb-1">
                Active Term
              </label>
              <div className="relative">
                <select
                  value={settings.currentSemesterId}
                  onChange={(e) => handleSwitchSemester(e.target.value)}
                  className="w-full bg-[#18191e] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-medium focus:outline-none focus:border-emerald-500/60 cursor-pointer appearance-none pr-6 transition-colors"
                >
                  {BUET_SEMESTERS.map((sem) => (
                    <option key={sem.id} value={sem.id} className="bg-[#14151a] text-zinc-200">
                      {sem.shortLabel} — {sem.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 tabular-nums">
              {deptShort} • {IPE_CURRICULUM_DATA[settings.currentSemesterId]?.totalCredits || 20} credits
            </p>
          </div>

          {/* Navigation List (vertical) */}
          <nav className="mt-4 space-y-1">
            {[
              { id: 'routine', label: 'Routine', icon: Calendar },
              { id: 'assessment', label: 'Assessment', icon: Calculator },
              { id: 'courses', label: 'Courses', icon: BookOpen },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-white/[0.1] text-white font-medium shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: User profile preview + Settings cog */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
              {settings.studentName?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-medium text-zinc-200 block truncate">
                {settings.studentName?.split(' ')[0] || 'Ashfaque'}
              </span>
              <span className="text-[10px] text-zinc-500 block truncate tabular-nums">
                {overallCgpa.gpa.toFixed(2)} CGPA
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Settings & Data"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ----------------------------------------------------------------- */}
      {/* 2. Main Canvas (Right)                                            */}
      {/* ----------------------------------------------------------------- */}
      <main className="flex-1 h-full flex flex-col overflow-y-auto">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-zinc-900 border border-white/12 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium animate-slide-up no-print">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab 1: Routine Designer with Centered Timetable Canvas */}
        {activeTab === 'routine' && (
          <div className="flex-1 flex flex-col justify-center items-center px-8 py-6 w-full min-h-full">
            <div className="w-full max-w-[1380px] mx-auto flex flex-col justify-center space-y-3.5">
              {/* Routine Header (Directly above centered table) */}
              <div className="flex items-center justify-between gap-4 w-full">
                {/* Left: Editable routine title & active term badge */}
                <div className="flex items-center gap-3">
                  {isEditingTitle ? (
                    <input
                      type="text"
                      autoFocus
                      value={titleText}
                      onChange={(e) => setTitleText(e.target.value)}
                      onBlur={handleTitleBlur}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleTitleBlur();
                      }}
                      className="bg-transparent text-lg font-bold tracking-tight text-white border-b border-emerald-500/60 focus:outline-none pb-0.5"
                    />
                  ) : (
                    <h2
                      onClick={() => setIsEditingTitle(true)}
                      className="text-lg font-bold tracking-tight text-white hover:text-zinc-200 cursor-pointer group flex items-center gap-2"
                      title="Click to rename routine"
                    >
                      <span>{titleText}</span>
                      <span className="opacity-0 group-hover:opacity-40 text-xs font-normal text-zinc-400">
                        ✎
                      </span>
                    </h2>
                  )}
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-[11px] font-medium text-emerald-400">
                    {IPE_CURRICULUM_DATA[settings.currentSemesterId]?.shortLabel || termShort}
                  </span>
                </div>

                {/* Right: Action Buttons with cursor-pointer */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleLoadSampleRoutine}
                    className="text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    title="Reset to BUET sample template"
                  >
                    Load Sample
                  </button>

                  <div className="relative" ref={exportDropdownRef}>
                    <button
                      onClick={() => setIsExportOpen(!isExportOpen)}
                      disabled={isExporting}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium border border-white/[0.08] transition-colors shadow-xs cursor-pointer"
                    >
                      <span>{isExporting ? 'Exporting...' : 'Export'}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    </button>

                    {isExportOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl bg-[#14151a] border border-white/[0.08] shadow-2xl p-1 z-50 text-xs">
                        <button
                          onClick={handleExportPNG}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-200 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Save as PNG</span>
                        </button>
                        <button
                          onClick={handleExportPDF}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-200 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <FileDown className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Save as PDF</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* The Timetable Grid */}
              <RoutineDesigner
                routine={routine}
                courses={courses}
                currentSemesterId={settings.currentSemesterId}
                onUpdateRoutine={handleUpdateRoutine}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Minimalist Assessment Tab (Connected to useSemesterStore) */}
        {activeTab === 'assessment' && (
          <div className="p-8 w-full max-w-[1380px] mx-auto animate-fade-in">
            <AssessmentView />
          </div>
        )}

        {/* Tab 3: Courses Manager */}
        {activeTab === 'courses' && (
          <div className="p-8 w-full max-w-[1380px] mx-auto animate-fade-in">
            <CourseManager
              courses={courses}
              activeSemesterId={settings.currentSemesterId}
              onSelectSemester={handleSwitchSemester}
              onAddCourse={handleAddCourse}
              onUpdateCourse={handleUpdateCourse}
              onDeleteCourse={handleDeleteCourse}
              onBulkAddCourses={handleBulkAddCourses}
            />
          </div>
        )}

        {/* Tab 4: Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <div className="p-8 w-full max-w-[1380px] mx-auto animate-fade-in">
            <AnalyticsDashboard
              courses={courses}
              settings={settings}
            />
          </div>
        )}
      </main>

      {/* Welcome Stepwise Tutorial Modal */}
      <WelcomeTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      {/* Settings & Preferences Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onExportBackup={handleExportBackup}
        onRestoreBackup={handleRestoreBackup}
        onResetSeeds={handleLoadSampleRoutine}
        onOpenTutorial={() => {
          setShowSettingsModal(false);
          setShowTutorial(true);
        }}
        onRerunWizard={() => {
          setSettings({ ...settings, isOnboarded: false });
        }}
      />
    </div>
  );
}

export default App;
