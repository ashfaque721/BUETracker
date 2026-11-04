import React, { useState } from 'react';
import { UserSettings } from '../types';
import {
  Settings,
  X,
  Download,
  Upload,
  RotateCcw,
  Keyboard,
  User,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onExportBackup: () => void;
  onRestoreBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetSeeds: () => void;
  onOpenTutorial: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onExportBackup,
  onRestoreBackup,
  onResetSeeds,
  onOpenTutorial,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'data' | 'shortcuts'>('profile');
  const [name, setName] = useState(settings.studentName);
  const [studentId, setStudentId] = useState(settings.studentId);
  const [dept, setDept] = useState(settings.department);
  const [degreeCredits, setDegreeCredits] = useState(settings.totalDegreeCredits);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      studentName: name.trim() || 'BUET Student',
      studentId: studentId.trim() || '2308000',
      department: dept.trim() || 'IPE',
      totalDegreeCredits: Number(degreeCredits) || 160,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in no-print">
      <div className="bg-[#0f131d] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">App Settings & Data</h2>
              <p className="text-[11px] text-slate-400">Configure profile, backups, and desktop controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/[0.06] px-6 bg-white/[0.01]">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-red-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Degree</span>
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === 'data'
                ? 'border-red-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup & Sync</span>
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === 'shortcuts'
                ? 'border-red-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Shortcuts</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Student Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-red-500 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Student ID Number</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-red-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Department</label>
                  <input
                    type="text"
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Graduation Credit Requirement</label>
                  <input
                    type="number"
                    step="0.5"
                    value={degreeCredits}
                    onChange={(e) => setDegreeCredits(parseFloat(e.target.value) || 160)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-red-500 transition"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={onOpenTutorial}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Launch Welcome Tour</span>
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium shadow-md transition"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div>
                  <h4 className="font-semibold text-white">Local Database Backup</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Export your complete database (all semesters, courses, routines, and CT records) to an encrypted offline JSON file.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={onExportBackup}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium border border-white/10 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Download JSON Backup</span>
                  </button>

                  <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium border border-white/10 transition cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Restore from JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={onRestoreBackup}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/30 space-y-2">
                <div>
                  <h4 className="font-semibold text-rose-300">Reset to BUET Seed Data</h4>
                  <p className="text-rose-400/80 text-[11px] mt-0.5">
                    Restores official BUET Level-2 Term-1 seed courses (ME 243, ME 265, IPE 205, etc.), Section A routine, and test data.
                  </p>
                </div>

                <button
                  onClick={onResetSeeds}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs font-medium transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Database to BUET L2T1 Seeds</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-300 font-medium">Save & Local Sync</span>
                <kbd className="px-2 py-1 rounded bg-white/[0.06] text-blue-300 font-mono text-[11px] border border-white/10">
                  Ctrl + S
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-300 font-medium">Timetable Studio & Exporter</span>
                <kbd className="px-2 py-1 rounded bg-white/[0.06] text-blue-300 font-mono text-[11px] border border-white/10">
                  Ctrl + E
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-300 font-medium">Print Routine (Document View)</span>
                <kbd className="px-2 py-1 rounded bg-white/[0.06] text-blue-300 font-mono text-[11px] border border-white/10">
                  Ctrl + P
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-300 font-medium">Toggle Fullscreen</span>
                <kbd className="px-2 py-1 rounded bg-white/[0.06] text-blue-300 font-mono text-[11px] border border-white/10">
                  F11
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-300 font-medium">Close Modal / Esc</span>
                <kbd className="px-2 py-1 rounded bg-white/[0.06] text-blue-300 font-mono text-[11px] border border-white/10">
                  Escape
                </kbd>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/[0.06] bg-white/[0.01] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

