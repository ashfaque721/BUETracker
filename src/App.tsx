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
import { OrdinanceEngine } from './components/OrdinanceEngine';
import { CourseManager } from './components/CourseManager';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { WelcomeTutorialModal } from './components/WelcomeTutorialModal';
import { SettingsModal } from './components/SettingsModal';
import { StudentSetupWizard } from './components/StudentSetupWizard';
import { calculateGPA } from './utils/buetOrdinance';
import {
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
  const [courses, setCourses] = useState<Course[]>(SEED_COURSES);
  const [routine, setRoutine] = useState<RoutineMetadata>(SEED_ROUTINE);
  const [settings, setSettings] = useState<UserSettings>({
    studentName: 'Ashfaque Amin Eshan',
    studentId: '2308001',
    department: "Industrial & Production Engineering (IPE '23)",
    totalDegreeCredits: 160,
    currentSemesterId: 'L2T1',
    theme: 'dark',
    isOnboarded: true,
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
        setSettings(allSettings[0]);
        if (allCourses.length > 0) {
          setCourses(allCourses);
        } else {
          setCourses(SEED_COURSES);
        }
        if (allRoutines.length > 0 && allRoutines[0].slots && allRoutines[0].slots.length > 0) {
          setRoutine(allRoutines[0]);
        } else {
          setRoutine(SEED_ROUTINE);
        }
      } else {
        // Preload authentic BUET IPE '23 Level-2 Term-1 mock data
        const defaultSettings: UserSettings = {
          studentName: 'Ashfaque Amin Eshan',
          studentId: '2308001',
          department: "Industrial & Production Engineering (IPE '23)",
          totalDegreeCredits: 160,
          currentSemesterId: 'L2T1',
          theme: 'dark',
          isOnboarded: true,
        };
        await db.settings.put({ id: 'primary_settings', ...defaultSettings });
        await db.courses.bulkPut(SEED_COURSES);
        await db.routines.put(SEED_ROUTINE);

        setSettings(defaultSettings);
        setCourses(SEED_COURSES);
        setRoutine(SEED_ROUTINE);
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

  const deptShort = settings.department?.includes('(')
    ? settings.department.split('(')[1]?.replace(')', '')
    : settings.department || "IPE '23";
  const termShort = settings.currentSemesterId
    ? BUET_SEMESTERS.find((s) => s.id === settings.currentSemesterId)?.shortLabel || settings.currentSemesterId
    : 'L-2 T-1';

  return (
    <div className="min-h-screen bg-[#0d0e11] text-zinc-300 flex flex-col font-sans selection:bg-emerald-950 selection:text-emerald-200 antialiased">
      {/* ----------------------------------------------------------------- */}
      {/* 1. Single Consolidated Top Bar (Native Desktop Standard)          */}
      {/* ----------------------------------------------------------------- */}
      <header className="h-12 border-b border-white/[0.06] bg-[#0d0e11] px-6 flex items-center justify-between select-none shrink-0 sticky top-0 z-40 no-print">
        {/* Left: Clean title "Class Routine — IPE'23 Section A" (editable inline) */}
        <div className="flex items-center gap-3 min-w-[280px]">
          {activeTab === 'routine' ? (
            isEditingTitle ? (
              <input
                type="text"
                autoFocus
                value={titleText}
                onChange={(e) => setTitleText(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleBlur();
                }}
                className="bg-transparent text-sm font-semibold tracking-tight text-white border-b border-white/30 focus:outline-none pb-0.5"
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-sm font-semibold tracking-tight text-zinc-100 hover:text-white cursor-pointer group flex items-center gap-2"
                title="Click to rename routine"
              >
                <span>{titleText}</span>
                <span className="opacity-0 group-hover:opacity-40 text-xs font-normal text-zinc-400">
                  ✎
                </span>
              </h1>
            )
          ) : (
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-semibold tracking-tight text-zinc-100">
                {activeTab === 'assessment' && 'Continuous Assessment'}
                {activeTab === 'courses' && 'Course Catalog & Semesters'}
                {activeTab === 'analytics' && 'CGPA Trajectory & Analytics'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] font-mono tabular-nums text-zinc-400">
                {deptShort} • {termShort}
              </span>
            </div>
          )}
        </div>

        {/* Center: Minimal Segmented View Switch */}
        <nav className="flex items-center p-0.5 rounded-lg bg-zinc-900/90 border border-white/[0.06]">
          {(['routine', 'assessment', 'courses', 'analytics'] as const).map((tab) => {
            const isActive = activeTab === tab;
            const label = tab.charAt(0).toUpperCase() + tab.slice(1);
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1 rounded-md text-xs transition-colors duration-100 capitalize ${
                  isActive
                    ? 'bg-white/[0.08] text-zinc-100 font-medium shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* Right: Subtle [ Export ▾ ] and small [ Load Sample ] ghost button */}
        <div className="flex items-center gap-3 min-w-[280px] justify-end">
          {activeTab === 'routine' && (
            <>
              {/* Load Sample Ghost Button */}
              <button
                onClick={handleLoadSampleRoutine}
                className="text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] px-2.5 py-1.5 rounded-lg transition-colors"
                title="Reset to BUET sample template"
              >
                Load Sample
              </button>

              {/* Subtle Export ▾ Dropdown Button */}
              <div className="relative" ref={exportDropdownRef}>
                <button
                  onClick={() => setIsExportOpen(!isExportOpen)}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium border border-white/[0.08] transition-colors shadow-xs"
                >
                  <span>{isExporting ? 'Exporting...' : 'Export'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </button>

                {isExportOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl bg-[#14151a] border border-white/[0.08] shadow-2xl p-1 z-50 text-xs">
                    <button
                      onClick={handleExportPNG}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/[0.04] text-zinc-200 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Save as PNG</span>
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/[0.04] text-zinc-200 transition-colors flex items-center gap-2"
                    >
                      <FileDown className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Save as PDF</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Settings & Profile Quick Toggle */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] transition-colors"
            title="Settings & Data"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-zinc-900 border border-white/12 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium animate-slide-up no-print">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Workspace: Expanded Hero Canvas */}
      <main className="flex-1 w-full px-6 py-4 flex flex-col animate-fade-in">
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
          <div className="max-w-7xl w-full mx-auto">
            <OrdinanceEngine
              courses={courses}
              onUpdateCourse={handleUpdateCourse}
              onLoadSampleRoutine={handleLoadSampleRoutine}
            />
          </div>
        )}

        {/* Tab 3: Courses Manager */}
        {activeTab === 'courses' && (
          <div className="max-w-7xl w-full mx-auto">
            <CourseManager
              courses={courses}
              activeSemesterId={settings.currentSemesterId}
              onSelectSemester={(semId) => setSettings({ ...settings, currentSemesterId: semId })}
              onAddCourse={handleAddCourse}
              onUpdateCourse={handleUpdateCourse}
              onDeleteCourse={handleDeleteCourse}
              onBulkAddCourses={handleBulkAddCourses}
            />
          </div>
        )}

        {/* Tab 4: Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <div className="max-w-7xl w-full mx-auto">
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
