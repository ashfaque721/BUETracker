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
import { calculateGPA } from './utils/buetOrdinance';
import {
  Calendar,
  Calculator,
  BookOpen,
  BarChart3,
  Download,
  Upload,
  Keyboard,
  Sparkles,
  Award,
  RotateCcw,
  GraduationCap,
  HelpCircle,
  ShieldCheck,
  Check,
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'routine' | 'assessment' | 'courses' | 'analytics'>('routine');
  const [courses, setCourses] = useState<Course[]>([]);
  const [routine, setRoutine] = useState<RoutineMetadata>(SEED_ROUTINE);
  const [settings, setSettings] = useState<UserSettings>(SEED_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
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

      // Check if welcome tutorial should be shown
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
        showToast('All database changes saved & synced locally!');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setActiveTab('routine');
        showToast('Switched to Routine Designer for export!');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.print();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // If running in Electron, attach IPC listeners
    if ((window as any).electronAPI) {
      const api = (window as any).electronAPI;
      api.onTriggerExportRoutine(() => {
        setActiveTab('routine');
        showToast('Switched to Routine Designer for export!');
      });
      api.onTriggerPrintRoutine(() => window.print());
      api.onTriggerSaveDb(() => showToast('Database synced to offline storage.'));
      api.onTriggerBackupJson(handleExportBackup);
      api.onTriggerRestoreJson(() => {
        document.getElementById('restore-file-input')?.click();
      });
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [routine, courses]);

  // CRUD Handlers for Courses
  const handleAddCourse = async (course: Course) => {
    await db.courses.add(course);
    setCourses((prev) => [...prev, course]);
    showToast(`Added ${course.code} to course list.`);
  };

  const handleUpdateCourse = async (course: Course) => {
    await db.courses.put(course);
    setCourses((prev) => prev.map((c) => (c.id === course.id ? course : c)));
  };

  const handleDeleteCourse = async (courseId: string) => {
    await db.courses.delete(courseId);
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    showToast('Course removed.');
  };

  const handleBulkAddCourses = async (newCourses: Course[]) => {
    await db.courses.bulkAdd(newCourses);
    setCourses((prev) => [...prev, ...newCourses]);
    showToast(`Successfully imported ${newCourses.length} courses!`);
  };

  // Routine Handler
  const handleUpdateRoutine = async (updated: RoutineMetadata) => {
    await db.routines.put(updated);
    setRoutine(updated);
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
      showToast('JSON Backup downloaded successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to export backup.');
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
        showToast('Backup restored successfully!');
      } else {
        showToast('Invalid backup file format.');
      }
    } catch (err) {
      console.error(err);
      showToast('Error reading backup file.');
    }
  };

  const handleResetToSeeds = async () => {
    if (window.confirm('Reset all courses, routines, and assessments to default BUET seed data?')) {
      await db.courses.clear();
      await db.routines.clear();
      await db.settings.clear();
      await db.courses.bulkAdd(SEED_COURSES);
      await db.routines.add(SEED_ROUTINE);
      await db.settings.add({ id: 'primary_settings', ...SEED_SETTINGS });
      await loadData();
      showToast('Reset to default BUET Level-2 Term-1 seed dataset.');
    }
  };

  // Summary Metrics for Header
  const completedCourses = courses.filter((c) => !c.isOngoing && c.gradePoint !== undefined);
  const overallCgpa = calculateGPA(
    completedCourses.map((c) => ({ credits: c.credits, gradePoint: c.gradePoint }))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-amber-700 flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-red-950/80 animate-pulse">
            BU
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-red-500 animate-ping opacity-25" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-base font-bold text-white tracking-wide">Loading BUETracker Academic Suite...</h2>
          <p className="text-xs text-slate-400 font-mono">Initializing Local SQLite/IndexedDB & Ordinance Engine</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-red-900 selection:text-white">
      {/* Top Application Header / Navbar with Ultra-Smooth Glassmorphism */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 shadow-2xl no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Student Info Capsule */}
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => setShowTutorial(true)}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-700 via-red-800 to-amber-900 border border-red-500/40 flex items-center justify-center text-white shadow-lg shadow-red-950/80 font-black text-lg tracking-tighter transition group-hover:scale-105">
                BU
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center" title="Offline Database Active">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white flex items-center">
                  BUE<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-400">Tracker</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-950/90 text-red-300 border border-red-800/80 shadow-sm">
                  BUET Suite
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {settings.studentName} ({settings.studentId}) • {settings.department}
              </p>
            </div>
          </div>

          {/* Academic Highlights Live Pills */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs shadow-sm">
              <span className="text-slate-400 font-medium">Term:</span>
              <span className="font-bold text-blue-400 font-mono">
                {settings.currentSemesterId} (L2T1)
              </span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs shadow-sm">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400 font-medium">CGPA:</span>
              <span className="font-black text-emerald-400 font-mono text-sm">
                {overallCgpa.gpa.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">({overallCgpa.earnedCredits} cr)</span>
            </div>
          </div>

          {/* Action Center (App Tour, Backup, Shortcuts, Reset) */}
          <div className="flex items-center gap-2">
            {/* Interactive App Tour Button */}
            <button
              onClick={() => setShowTutorial(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-950/80 to-amber-950/80 hover:from-red-900/90 hover:to-amber-900/90 text-amber-300 border border-amber-700/50 transition shadow-sm text-xs font-bold"
              title="Launch Interactive Step-by-Step Tutorial"
            >
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">App Tour</span>
            </button>

            <button
              onClick={() => setShowShortcutsModal(true)}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 transition shadow-sm"
              title="Keyboard Shortcuts (Ctrl+S, Ctrl+E, Ctrl+P)"
            >
              <Keyboard className="w-4 h-4 text-blue-400" />
            </button>

            <button
              onClick={handleExportBackup}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 transition shadow-sm"
              title="Backup Data as JSON"
            >
              <Download className="w-4 h-4 text-emerald-400" />
            </button>

            <label
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 transition shadow-sm cursor-pointer"
              title="Restore Data from JSON"
            >
              <Upload className="w-4 h-4 text-purple-400" />
              <input
                id="restore-file-input"
                type="file"
                accept=".json"
                onChange={handleRestoreBackup}
                className="hidden"
              />
            </label>

            <button
              onClick={handleResetToSeeds}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 transition shadow-sm"
              title="Reset to BUET Seed Data"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>

        {/* Modern Segmented Tab Controller Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-1 pb-2">
          <div className="flex gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-white/5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('routine')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'routine'
                  ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-lg shadow-red-950/80 border border-red-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>1. Routine Designer</span>
              <span className="text-[10px] opacity-75 font-mono">Sat–Wed</span>
            </button>

            <button
              onClick={() => setActiveTab('assessment')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'assessment'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-950/80 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>2. BUET Assessment Engine</span>
              <span className="text-[10px] opacity-75 font-mono">30% + 70%</span>
            </button>

            <button
              onClick={() => setActiveTab('courses')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'courses'
                  ? 'bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-lg shadow-purple-950/80 border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>3. Course & BIIS Manager</span>
              <span className="text-[10px] opacity-75 font-mono">L1T1–L4T2</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-950/80 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>4. Analytics & CGPA</span>
              <span className="text-[10px] opacity-75 font-mono">Forecast</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 border border-slate-700/80 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-slide-up no-print backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
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

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950/90 py-3.5 px-6 text-center text-xs text-slate-500 no-print">
        <div className="flex flex-wrap items-center justify-between max-w-7xl mx-auto gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Local Database Synced • 100% Offline Compatible</span>
          </div>
          <div>
            BUETracker • Built for Bangladesh University of Engineering and Technology (BUET) Students
          </div>
          <div className="flex items-center gap-3">
            <span>BUET Ordinance Compliant</span>
            <span>•</span>
            <button
              onClick={() => setShowTutorial(true)}
              className="text-amber-400 hover:text-amber-300 font-semibold"
            >
              App Tour
            </button>
            <span>•</span>
            <button
              onClick={() => setShowShortcutsModal(true)}
              className="hover:text-slate-300 underline"
            >
              Shortcuts
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

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in no-print">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-blue-400" />
                Desktop Shortcuts & Controls
              </h3>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <span className="text-slate-300">Quick Save & Local Sync</span>
                <kbd className="px-2 py-1 rounded-lg bg-slate-900 text-blue-400 font-mono font-bold border border-slate-700">
                  Ctrl + S
                </kbd>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <span className="text-slate-300">Switch to Routine & Export</span>
                <kbd className="px-2 py-1 rounded-lg bg-slate-900 text-blue-400 font-mono font-bold border border-slate-700">
                  Ctrl + E
                </kbd>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <span className="text-slate-300">Print Routine (Landscape)</span>
                <kbd className="px-2 py-1 rounded-lg bg-slate-900 text-blue-400 font-mono font-bold border border-slate-700">
                  Ctrl + P
                </kbd>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <span className="text-slate-300">Toggle Full Screen</span>
                <kbd className="px-2 py-1 rounded-lg bg-slate-900 text-blue-400 font-mono font-bold border border-slate-700">
                  F11
                </kbd>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
