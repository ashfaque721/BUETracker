import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Calculator,
  BookOpen,
  BarChart3,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  GraduationCap,
  ShieldCheck,
  Award,
  Sparkles,
  Download,
  ArrowRight,
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
      subtitle: 'Native Academic Suite for BUET Students',
      icon: GraduationCap,
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p className="text-slate-200">
            <strong>BUETracker</strong> is a dedicated native desktop application engineered specifically for the BUET departmental timetable, academic grading ordinances, and continuous assessment workflow.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1 group hover:border-red-500/30 transition">
              <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5 text-red-400" /> Routine Studio
              </span>
              <p className="text-[11px] text-slate-400">
                Periods 1–7 schedule with 2.5× DPI PNG and vector PDF exports.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1 group hover:border-blue-500/30 transition">
              <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                <Calculator className="w-3.5 h-3.5 text-blue-400" /> Ordinance Engine
              </span>
              <p className="text-[11px] text-slate-400">
                Attendance slabs (10%), Best n of n+1 CTs (20%), and Term Final matrix (70%).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1 group hover:border-purple-500/30 transition">
              <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" /> BIIS Parser
              </span>
              <p className="text-[11px] text-slate-400">
                Ingest grade sheets directly via copy-paste or screenshot drop.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1 group hover:border-emerald-500/30 transition">
              <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> CGPA Analytics
              </span>
              <p className="text-[11px] text-slate-400">
                CGPA progression curves, attendance safety buffers, and simulator.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Full offline local SQLite / IndexedDB persistence.</span>
            </span>
            <span className="text-emerald-400 font-semibold font-mono">100% Offline</span>
          </div>
        </div>
      ),
    },
    {
      id: 'routine',
      title: 'Module 1: Routine Designer & Exporter',
      subtitle: 'Official Timetable Schedule & High-Res Prints',
      icon: Calendar,
      targetTab: 'routine',
      content: (
        <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
          <p>
            The timetable maker replicates BUET’s exact departmental weekly schedule from <strong>Saturday to Wednesday</strong>:
          </p>

          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <strong className="text-white block mb-0.5">Periods 1–6 (8:00 AM – 1:30 PM)</strong>
              <span className="text-slate-400 text-[11px]">50-minute lecture slots with support for 2 or 3-period multi-hour morning labs.</span>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <strong className="text-white block mb-0.5">Recess Break (1:30 – 2:30 PM)</strong>
              <span className="text-slate-400 text-[11px]">Fixed prayer and lunch break column between periods 6 and 7.</span>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <strong className="text-white block mb-0.5">Period 7 (2:30 – 5:00 PM Dedicated Lab Slot)</strong>
              <span className="text-slate-400 text-[11px]">Dedicated afternoon slot for department sessionals and workshops.</span>
            </div>
          </div>

          <p className="text-slate-400 text-[11px]">
            💡 Toggle between <strong>Studio Grid</strong> and <strong>Print Preview</strong> at the top right, and export to PNG or A4 PDF with one click.
          </p>
        </div>
      ),
    },
    {
      id: 'ordinance',
      title: 'Module 2: BUET Assessment Engine',
      subtitle: 'Continuous Assessment (30%) + Term Final (70%)',
      icon: Calculator,
      targetTab: 'assessment',
      content: (
        <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
          <p>
            Automates the complete continuous grading ordinance across your registered theory courses:
          </p>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white">Attendance (10% Course Weight):</strong> Official slabs (≥90% → 10/10 down to &lt;60% → 0/10 Non-Collegiate). Automatically computes <strong>Safe Bunks remaining</strong> before dropping below 60%.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
              <Award className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white">Class Tests (20% Course Weight):</strong> Takes <strong>Best $n$ of $(n+1)$</strong> tests for an $n$-credit course, normalizes scores out of 20, and drops the lowest test.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white">Term Final Target Matrix (70% Weight):</strong> Shows exact marks needed in the exam for $A+, A, A-$, automatically split 50/50 for <strong>Section A and Section B</strong>.
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'courses',
      title: 'Module 3: Course & BIIS Manager',
      subtitle: '8 Semesters & Automated Grade Sheet Ingestion',
      icon: BookOpen,
      targetTab: 'courses',
      content: (
        <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
          <p>
            Track completed and ongoing courses from Level-1 Term-1 through Level-4 Term-2:
          </p>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <strong className="text-white block mb-0.5">BIIS Result Sheet Auto-Parser</strong>
              <span className="text-slate-400 text-[11px]">
                Copy and paste your tabular result from <code className="text-blue-300 font-mono">biis.buet.ac.bd</code> or drop a screenshot. Course codes, credits, and grades are parsed instantly!
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <strong className="text-white block mb-0.5">Theory vs Sessional Classification</strong>
              <span className="text-slate-400 text-[11px]">
                Theory courses link to the assessment engine, while sessionals accept projected grades for GPA calculation.
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'analytics',
      title: 'Module 4: Analytics & Forecasting',
      subtitle: 'Visual Progression & Interactive CGPA Simulator',
      icon: BarChart3,
      targetTab: 'analytics',
      content: (
        <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
          <p>
            Visualize your historical performance and plan your graduating CGPA goals:
          </p>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <strong className="text-white block mb-0.5">CGPA Progression Curve</strong>
              <span className="text-slate-400 text-[11px]">Term GPA versus cumulative CGPA with Dean's List (3.75) and First Class (3.00) reference lines.</span>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <strong className="text-white block mb-0.5">Interactive Term GPA Simulator</strong>
              <span className="text-slate-400 text-[11px]">Drag the slider to test "What if I get 3.85 this semester?" and see the exact post-term CGPA impact in real time.</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const activeStep = steps[currentStep];
  const StepIcon = activeStep.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in no-print">
      <div className="w-full max-w-lg bg-[#101422] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-300 shadow-sm">
              <StepIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">{activeStep.title}</h2>
              <p className="text-[11px] text-slate-400">{activeStep.subtitle}</p>
            </div>
          </div>

          <button
            onClick={handleFinish}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Dots */}
        <div className="px-6 py-2.5 flex items-center justify-between border-b border-white/[0.04] bg-white/[0.01]">
          <div className="flex items-center gap-1.5 flex-1 mr-4">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all flex-1 ${
                  idx === currentStep ? 'bg-red-500' : idx < currentStep ? 'bg-white/25' : 'bg-white/[0.08]'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] font-mono text-slate-400 font-semibold">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>

        {/* Content */}
        <div className="p-6">{activeStep.content}</div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] bg-black/30 flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-white/10 border-white/20 text-red-600 focus:ring-0"
            />
            <span>Don't show on launch</span>
          </label>

          <div className="flex items-center gap-2">
            {activeStep.targetTab && (
              <button
                onClick={() => {
                  onSelectTab(activeStep.targetTab as any);
                  handleFinish();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-blue-300 hover:text-white hover:bg-blue-950/40 border border-blue-900/50 transition font-medium"
              >
                <span>Jump to Tab</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep((s) => s - 1)}
                className="px-3 py-1.5 rounded-xl text-slate-300 hover:bg-white/[0.06] transition font-medium"
              >
                Back
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep((s) => s + 1)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold shadow-md transition"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
