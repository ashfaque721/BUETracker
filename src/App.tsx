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
import { calculateGPA } from './utils/buetOrdinance';
import {
  Calendar,
  Calculator,
  BookOpen,
  BarChart3,
  Settings,
  Sparkles,
  GraduationCap,
  CheckCircle2,
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'routine' | 'assessment' | 'courses' | 'analytics'>('routine');
  const [courses, setCourses] = useState<Course[]>([]);
  const [routine, setRoutine] = useState<RoutineMetadata>(SEED_ROUTINE);
  const [settings, setSettings] = useState<UserSettings>(SEED_SETTINGS);
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

      if (allCourses.length > 0) setCourses(allCourses);
      if (allRoutines.length > 0) setRoutine(allRoutines[0]);
      if (allSettings.length > 0) setSettings(allSettings[0]);

      // Check if welcome tutorial should be shown on launch
      const hideWelcome = localStorage.getItem('buetracker_hide_welcome');
      if (!hideWelcome) {
        setShowTutorial(true);
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
        showToast('Switched to Timetable Studio');
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
        showToast('Switched to Timetable Studio for export');
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

  const handleResetToSeeds = async () => {
    if (window.confirm('Reset all courses, routines, and assessments to default BUET Level-2 Term-1 seed data?')) {
      await db.courses.clear();
      await db.routines.clear();
      await db.settings.clear();
      await db.courses.bulkAdd(SEED_COURSES);
      await db.routines.add(SEED_ROUTINE);
      await db.settings.add({ id: 'primary_settings', ...SEED_SETTINGS });
      await loadData();
      showToast('Reset to default BUET L2T1 seed data');
      setShowSettingsModal(false);
    }
  };

  // Summary Metrics for Header
  const completedCourses = courses.filter((c) => !c.isOngoing && c.gradePoint !== undefined);
  const overallCgpa = calculateGPA(
    completedCourses.map((c) => ({ credits: c.credits, gradePoint: c.gradePoint }))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080b11] flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 rounded-2xl bg-red-900/60 border border-red-700/60 flex items-center justify-center text-white font-bold text-sm tracking-tight animate-pulse shadow-lg">
          BU
        </div>
        <p className="text-xs text-slate-400 font-medium">Initializing BUETracker...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-200 flex flex-col font-sans selection:bg-red-900/60 selection:text-white">
      {/* Sleek, Single-Row Header */}
      <header className="sticky top-0 z-40 bg-[#080b11]/90 backdrop-blur-xl border-b border-white/[0.08] no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: Brand Monogram + Title */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setShowTutorial(true)}
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-900 to-red-950 border border-red-700/70 flex items-center justify-center text-red-200 font-bold text-xs tracking-tight cursor-pointer hover:border-red-500 transition shadow-sm"
              title="Open Interactive App Tour"
            >
              BU
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white">
                BUE<span className="text-red-500">Tracker</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/[0.04] text-[10px] text-slate-400 font-mono border border-white/[0.06]">
                {settings.currentSemesterId}
              </span>
            </div>
          </div>

          {/* Center: Tactile Segmented Navigation Bar */}
          <nav className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.07]">
            <button
              onClick={() => setActiveTab('routine')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition duration-150 ${
                activeTab === 'routine'
                  ? 'bg-white/10 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-red-400" />
              <span>Routine</span>
            </button>

            <button
              onClick={() => setActiveTab('assessment')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition duration-150 ${
                activeTab === 'assessment'
                  ? 'bg-white/10 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-blue-400" />
              <span>Assessment</span>
            </button>

            <button
              onClick={() => setActiveTab('courses')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition duration-150 ${
                activeTab === 'courses'
                  ? 'bg-white/10 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>Courses</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition duration-150 ${
                activeTab === 'analytics'
                  ? 'bg-white/10 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
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
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs cursor-pointer transition"
              title="Click to view Student Profile & Settings"
            >
              <div className="w-5 h-5 rounded-full bg-red-950 text-red-300 font-bold text-[10px] flex items-center justify-center border border-red-800">
                {settings.studentName.charAt(0)}
              </div>
              <span className="text-slate-300 font-medium">{settings.studentName.split(' ')[0]}</span>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{overallCgpa.gpa.toFixed(2)} CGPA</span>
              </div>
            </div>

            {/* Guided Tour Pill */}
            <button
              onClick={() => setShowTutorial(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-950/60 to-red-900/40 hover:from-red-950 hover:to-red-900/60 text-red-200 border border-red-800/60 text-xs font-medium shadow-xs transition"
              title="Launch Guided App Tour"
            >
              <GraduationCap className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Tour</span>
            </button>

            {/* Unified Settings Gear */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition"
              title="Open Settings, Backups, and Shortcuts"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#121624] border border-white/12 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium animate-slide-up no-print">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 animate-fade-in">
        {activeTab === 'routine' && (
          <RoutineDesigner
            routine={routine}
            courses={courses}
            onUpdateRoutine={handleUpdateRoutine}
          />
        )}

        {activeTab === 'assessment' && (
          <OrdinanceEngine
            courses={courses}
            onUpdateCourse={handleUpdateCourse}
          />
        )}

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

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            courses={courses}
            settings={settings}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-white/[0.04] py-3.5 px-6 text-center text-xs text-slate-500 no-print">
        <div className="flex flex-wrap items-center justify-between max-w-7xl mx-auto gap-4">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Local SQLite/IndexedDB Active • Fully Offline</span>
          </div>
          <div className="text-[11px] text-slate-500">
            BUETracker • Bangladesh University of Engineering and Technology
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <button
              onClick={() => setShowTutorial(true)}
              className="text-slate-400 hover:text-slate-200 transition font-medium"
            >
              App Tour
            </button>
            <span>•</span>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="text-slate-400 hover:text-slate-200 transition font-medium"
            >
              Preferences & Data
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
        onResetSeeds={handleResetToSeeds}
        onOpenTutorial={() => {
          setShowSettingsModal(false);
          setShowTutorial(true);
        }}
      />
    </div>
  );
}

export default App;
