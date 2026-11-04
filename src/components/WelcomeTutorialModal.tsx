import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Calculator,
  BookOpen,
  BarChart3,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  ShieldCheck,
  Award,
  Layers,
  ArrowRight,
  Download,
  GraduationCap,
  Keyboard,
  Clock,
  Check,
} from 'lucide-react';

interface WelcomeTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: 'routine' | 'assessment' | 'courses' | 'analytics') => void;
}

export const WelcomeTutorialModal: React.FC<WelcomeTutorialModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentStep < steps.length - 1) {
        setCurrentStep((s) => s + 1);
      }
      if (e.key === 'ArrowLeft' && currentStep > 0) {
        setCurrentStep((s) => s - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const handleFinish = () => {
    if (dontShowAgain) {
      localStorage.setItem('buetracker_hide_welcome', 'true');
    }
    onClose();
  };

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to BUETracker',
      subtitle: 'The Premier Desktop Academic Suite for BUET Students',
      badge: 'Official BUET Ordinance Compliant',
      icon: GraduationCap,
      color: 'from-red-600 to-amber-600',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            <strong className="text-white font-semibold">BUETracker</strong> is a purpose-built, high-performance native desktop application designed specifically around BUET’s academic ordinance, class period structure, and continuous grading systems.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition">
              <div className="flex items-center gap-2.5 text-xs font-bold text-red-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span>1. Timetable Studio</span>
              </div>
              <p className="text-xs text-slate-400">
                Official BUET period slots, multi-hour lab spans, crisp 2.5× PNG & vector PDF exporter.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition">
              <div className="flex items-center gap-2.5 text-xs font-bold text-blue-400 mb-1">
                <Calculator className="w-4 h-4" />
                <span>2. Ordinance Engine</span>
              </div>
              <p className="text-xs text-slate-400">
                Attendance slabs (10%), Best n of n+1 CTs (20%), and Term Final Section A/B split (70%).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition">
              <div className="flex items-center gap-2.5 text-xs font-bold text-purple-400 mb-1">
                <BookOpen className="w-4 h-4" />
                <span>3. Course & BIIS Manager</span>
              </div>
              <p className="text-xs text-slate-400">
                Level-1 to Level-4 tracking with instant copy-paste and screenshot BIIS grade sheet parser.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition">
              <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-400 mb-1">
                <BarChart3 className="w-4 h-4" />
                <span>4. Analytics & CGPA</span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-term CGPA trajectory, attendance danger alerts, and interactive projected GPA simulator.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-red-950/30 border border-red-900/40 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              100% Offline Local Database • No internet or server login required.
            </span>
            <span className="font-mono text-red-300 font-bold text-[11px]">v1.0 Native</span>
          </div>
        </div>
      ),
    },
    {
      id: 'routine',
      title: 'Module A: Class Routine Designer',
      subtitle: 'Official BUET Timetable Schedule & High-Res Exporter',
      badge: 'Periods 1–6 • Recess • Period 7 Lab',
      icon: Calendar,
      color: 'from-red-600 to-rose-700',
      targetTab: 'routine',
      content: (
        <div className="space-y-4 text-sm text-slate-300">
          <p className="leading-relaxed">
            The Routine Designer strictly matches BUET's official departmental timetable structure from <strong className="text-white">Saturday to Wednesday</strong>:
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <Clock className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white">Official Period Timing:</strong> Periods 1–6 run continuously from <code className="text-red-300 font-mono">8:00 AM to 1:30 PM</code> (50 min lectures), followed by a mandatory <code className="text-amber-300 font-mono">1:30 – 2:30 PM RECESS</code> break.
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <Layers className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white">Period 7 Afternoon Labs & Multi-Period Spans:</strong> Dedicated slot from <code className="text-blue-300 font-mono">2:30 – 5:00 PM</code>. Any cell can also span 2 or 3 periods for multi-period morning labs.
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <Download className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white">Studio Exporting (PNG & Vector PDF):</strong> Export at <strong className="text-emerald-400">2.5× DPI resolution</strong> for razor-sharp printing, or generate an A4 Landscape PDF with one click or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-white">Ctrl + E</kbd>.
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">💡 Tip: Click on any cell in the table to assign a course, edit teacher, room, color, or change span.</span>
          </div>
        </div>
      ),
    },
    {
      id: 'ordinance',
      title: 'Module B: Assessment Engine',
      subtitle: 'Strict BUET Ordinance Assessment Calculations',
      badge: 'Continuous (30%) + Term Final (70%)',
      icon: Calculator,
      color: 'from-blue-600 to-indigo-700',
      targetTab: 'assessment',
      content: (
        <div className="space-y-4 text-sm text-slate-300">
          <p className="leading-relaxed">
            Never guess your target grades again. BUETracker implements the complete BUET Academic Ordinance:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Attendance (10%)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Official slab system (≥90% → 10/10, down to &lt;60% → 0/10 Non-Collegiate). Displays <strong className="text-white">Safe Bunks Remaining</strong>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="font-bold text-blue-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Class Tests (20%)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                For an $n$-credit course, counts <strong className="text-white">Best $n$ of $(n+1)$</strong> tests. Marks are normalized to 20 with lowest CT dropped.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Term Final (70%)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Calculates exact marks required in Term Final for $A+, A, A-, B+$, automatically split 50/50 for <strong className="text-white">Section A & Section B</strong>!
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 text-xs text-slate-300">
            <strong className="text-blue-300 font-semibold">Interactive Counter:</strong> Use the <code className="text-emerald-400 font-mono">+1 Attended</code> and <code className="text-red-400 font-mono">+1 Absent</code> buttons to instantly see how today's class moves your slab and safe bunks!
          </div>
        </div>
      ),
    },
    {
      id: 'courses',
      title: 'Module C: Course & BIIS Manager',
      subtitle: 'Complete Academic Record & Automated BIIS Ingestion',
      badge: 'Level-1 Term-1 to Level-4 Term-2',
      icon: BookOpen,
      color: 'from-purple-600 to-violet-700',
      targetTab: 'courses',
      content: (
        <div className="space-y-4 text-sm text-slate-300">
          <p className="leading-relaxed">
            Manage your past and present terms seamlessly across the 8 BUET academic semesters:
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-purple-950 text-purple-400 border border-purple-800/60 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white text-xs">Automated BIIS Result Sheet Parser:</strong>
                <p className="text-slate-400 mt-0.5">
                  Simply copy and paste your raw BIIS grade sheet text or upload a screenshot. The parser automatically extracts Course Codes, Titles, Credits, Grades, and Grade Points with 100% precision!
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-blue-950 text-blue-400 border border-blue-800/60 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white text-xs">Theory vs. Sessional/Lab Classification:</strong>
                <p className="text-slate-400 mt-0.5">
                  Distinguishes between theory courses (with CT and attendance engines) and sessional labs (0.75, 1.5, or 2.0 credits with projected grades).
                </p>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">💡 Try clicking "Load Sample BIIS" in the Course Manager to see the parser in action in 1 click!</span>
          </div>
        </div>
      ),
    },
    {
      id: 'analytics',
      title: 'Module D: Analytics & CGPA Trends',
      subtitle: 'Visual Progression, Radar Charts & CGPA Simulator',
      badge: 'Real-Time Academic Forecasting',
      icon: BarChart3,
      color: 'from-emerald-600 to-teal-700',
      targetTab: 'analytics',
      content: (
        <div className="space-y-4 text-sm text-slate-300">
          <p className="leading-relaxed">
            Stay on top of your academic trajectory and plan your graduation requirements with rich visual analytics:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <strong className="text-white flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                CGPA Progression Curve
              </strong>
              <p className="text-slate-400 text-[11px]">
                Tracks Term GPA and Cumulative CGPA progression across all completed terms.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <strong className="text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                Attendance Safety Radar
              </strong>
              <p className="text-slate-400 text-[11px]">
                Monitors courses nearing the 60% non-collegiate red warning line so you never get debarred.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <strong className="text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Graduation Credit Donut
              </strong>
              <p className="text-slate-400 text-[11px]">
                Visualizes completed credits vs. remaining credits out of your 160-credit degree requirement.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <strong className="text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Projected CGPA Slider
              </strong>
              <p className="text-slate-400 text-[11px]">
                Drag the slider to test "What if I get 3.85 this term?" and see the exact impact on your final CGPA!
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const activeStep = steps[currentStep];
  const StepIcon = activeStep.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in no-print">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Glow ambient background */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${activeStep.color} flex items-center justify-center text-white shadow-lg shadow-red-950/60`}
            >
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">{activeStep.title}</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {activeStep.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">{activeStep.subtitle}</p>
            </div>
          </div>

          <button
            onClick={handleFinish}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Close Tutorial (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Stepper Bar */}
        <div className="px-6 pt-3 pb-2 flex items-center justify-between gap-1 border-b border-slate-800/40 bg-slate-950/40">
          <div className="flex items-center gap-1.5 flex-1 mr-4">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all flex-1 ${
                  idx === currentStep
                    ? 'bg-gradient-to-r from-red-500 to-amber-500 shadow-sm shadow-red-500/50'
                    : idx < currentStep
                    ? 'bg-emerald-500/80'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
                title={`Step ${idx + 1}: ${s.title}`}
              />
            ))}
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-400 whitespace-nowrap">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>

        {/* Step Content */}
        <div className="p-6 overflow-y-auto max-h-[58vh]">{activeStep.content}</div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
          {/* Don't show again toggle */}
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-red-600 focus:ring-0"
            />
            <span>Don't show automatically on launch</span>
          </label>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {activeStep.targetTab && (
              <button
                onClick={() => {
                  onSelectTab(activeStep.targetTab as any);
                  handleFinish();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                <span>Jump to this Tab</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
              </button>
            )}

            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep((s) => s - 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep((s) => s + 1)}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-950/60 transition"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/60 transition"
              >
                <Check className="w-4 h-4" />
                <span>Get Started</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

