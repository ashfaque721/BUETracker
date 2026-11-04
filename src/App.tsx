import React, { useState, useEffect } from 'react';
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
import { OrdinanceEngine } from './components/OrdinanceEngine';
import { CourseManager } from './components/CourseManager';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { WelcomeTutorialModal } from './components/WelcomeTutorialModal';
import { SettingsModal } from './components/SettingsModal';
import { StudentSetupWizard } from './components/StudentSetupWizard';
import { calculateGPA } from './utils/buetOrdinance';
import {
  Calendar,
  Calculator,
  BookOpen,
  BarChart3,
  Settings,
  Sparkles,
  GraduationCap,
  Play,
  ArrowRight,
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'routine' | 'assessment' | 'courses' | 'analytics'>('routine');
  const [courses, setCourses] = useState<Course[]>([]);
  const [routine, setRoutine] = useState<RoutineMetadata>({
    id: 'initial_routine',
    title: 'Class Routine of Section A',
    subTitle: 'Level-1 Term-1 | BUET',
    effectiveDate: 'November 2026',
    slots: [],
  });
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
        setSettings(allSettings[0]);
        if (allCourses.length > 0) setCourses(allCourses);
        if (allRoutines.length > 0) setRoutine(allRoutines[0]);
      } else {
        // Not onboarded yet: do not inject dummy data!
        setSettings({
          studentName: '',
          studentId: '',
          department: 'Industrial & Production Engineering (IPE)',
          totalDegreeCredits: 160,
          currentSemesterId: 'L1T1',
          theme: 'dark',
          isOnboarded: false,
        });
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

  // Keyboard Shortcuts Listener (Ctrl+S, Ctrl+E, Ctrl+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        showToast('Database changes saved locally');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setActiveTab('routine');
        showToast('Switched to Routine Designer');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.print();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    if ((window as any).electronAPI) {
      const api = (window as any).electronAPI;
      api.onTriggerExportRoutine(() => {
        setActiveTab('routine');
        showToast('Switched to Routine Designer for export');
      });
      api.onTriggerPrintRoutine(() => window.print());
      api.onTriggerSaveDb(() => showToast('Database saved locally'));
      api.onTriggerBackupJson(handleExportBackup);
      api.onTriggerRestoreJson(() => {
        setShowSettingsModal(true);
      });
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [routine, courses]);

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

      // Smart navigation: If user imported only previous completed courses, take them to courses tab
      const hasOngoing = initialCourses.some((c) => c.isOngoing);
      if (!hasOngoing && initialCourses.length > 0) {
        setActiveTab('courses');
      } else {
        setActiveTab('routine');
      }

      const firstName = newSettings.studentName?.trim().split(' ')[0] || 'Student';
      showToast(`Welcome, ${firstName}! Your workspace is ready.`);
    }
  };

  // Explicit demo sample load (only if user asks for it)
  const handleLoadSampleRoutine = async () => {
    await db.transaction('rw', db.courses, db.routines, db.settings, async () => {
      await db.courses.clear();
      await db.routines.clear();
      await db.settings.clear();
      await db.courses.bulkAdd(SEED_COURSES);
      await db.routines.add(SEED_ROUTINE);
      await db.settings.add({ id: 'primary_settings', ...SEED_SETTINGS });
    });
    setCourses(SEED_COURSES);
    setRoutine(SEED_ROUTINE);
    setSettings(SEED_SETTINGS);
    showToast('Loaded BUET Level-2 Term-1 Sample Routine & Courses');
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

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 flex flex-col font-sans selection:bg-emerald-950 selection:text-emerald-200">
      {/* Sleek, Single-Row 56px Executive Header */}
      <header className="sticky top-0 z-40 bg-[#09090b]/95 backdrop-blur-md border-b border-white/[0.08] no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: Brand Monogram + Title */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setShowTutorial(true)}
              className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 flex items-center justify-center text-emerald-400 font-bold text-xs tracking-tight cursor-pointer transition shadow-sm btn-tactile"
              title="Open Guided Interactive Tour"
            >
              BU
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-zinc-100">
                BUE<span className="text-emerald-500">Tracker</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-zinc-900 text-[10px] text-zinc-400 font-mono tabular-nums border border-white/[0.08]">
                {settings.currentSemesterId}
              </span>
            </div>
          </div>

          {/* Center: Tactile Segmented Navigation Bar */}
          <nav className="flex items-center p-1 rounded-xl bg-zinc-900/90 border border-white/[0.08] relative">
            <button
              onClick={() => setActiveTab('routine')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs transition duration-150 btn-tactile ${
                activeTab === 'routine'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-red-400" />
              <span>Routine</span>
            </button>

            <button
              onClick={() => setActiveTab('assessment')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs transition duration-150 btn-tactile ${
                activeTab === 'assessment'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-blue-400" />
              <span>Assessment</span>
            </button>

            <button
              onClick={() => setActiveTab('courses')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs transition duration-150 btn-tactile ${
                activeTab === 'courses'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>Courses</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs transition duration-150 btn-tactile ${
                activeTab === 'analytics'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Analytics</span>
            </button>
          </nav>

          {/* Right: Student Profile & Settings */}
          <div className="flex items-center gap-2.5">
            {/* Student & CGPA pill */}
            <div
              onClick={() => setShowSettingsModal(true)}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-xs cursor-pointer transition btn-tactile"
              title="Click to view Student Profile & Settings"
            >
              <div className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-200 font-bold text-[10px] flex items-center justify-center border border-white/10">
                {settings.studentName ? settings.studentName.charAt(0) : 'U'}
              </div>
              <span className="text-zinc-300 font-medium">
                {settings.studentName ? settings.studentName.split(' ')[0] : 'Student'}
              </span>
              <span className="text-zinc-600">•</span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono tabular-nums font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{overallCgpa.gpa.toFixed(2)} CGPA</span>
              </div>
            </div>

            {/* Guided Tour Pill */}
            <button
              onClick={() => setShowTutorial(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/10 text-xs font-medium shadow-xs transition btn-tactile"
              title="Launch Guided App Tour"
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Tour</span>
            </button>

            {/* Unified Settings Gear */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-white/10 transition btn-tactile"
              title="Settings, Backups, and Shortcuts"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-zinc-900 border border-white/12 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium animate-slide-up no-print">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 animate-fade-in">
        {/* Tab 1: Routine Designer */}
        {activeTab === 'routine' && (
          <RoutineDesigner
            routine={routine}
            courses={courses}
            onUpdateRoutine={handleUpdateRoutine}
            onLoadSampleRoutine={handleLoadSampleRoutine}
          />
        )}

        {/* Tab 2: Assessment Engine */}
        {activeTab === 'assessment' && (
          <OrdinanceEngine
            courses={courses}
            onUpdateCourse={handleUpdateCourse}
            onLoadSampleRoutine={handleLoadSampleRoutine}
          />
        )}

        {/* Tab 3: Courses Manager */}
        {activeTab === 'courses' && (
          <CourseManager
            courses={courses}
            activeSemesterId={settings.currentSemesterId}
            onSelectSemester={(semId) => setSettings({ ...settings, currentSemesterId: semId })}
            onAddCourse={handleAddCourse}
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={handleDeleteCourse}
            onBulkAddCourses={handleBulkAddCourses}
          />
        )}

        {/* Tab 4: Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            courses={courses}
            settings={settings}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-white/[0.06] py-3.5 px-6 text-center text-xs text-zinc-400 no-print">
        <div className="flex flex-wrap items-center justify-between max-w-7xl mx-auto gap-4">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-zinc-400">Offline SQLite/IndexedDB Active • Fully Private</span>
          </div>
          <div className="text-[11px] text-zinc-400">
            BUETracker • Bangladesh University of Engineering and Technology
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <button
              onClick={() => setShowTutorial(true)}
              className="text-zinc-400 hover:text-zinc-200 transition font-medium"
            >
              App Tour
            </button>
            <span>•</span>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="text-zinc-400 hover:text-zinc-200 transition font-medium"
            >
              Settings & Data
            </button>
          </div>
        </div>
      </footer>

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
