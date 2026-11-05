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
  onRerunWizard?: () => void;
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
  onRerunWizard,
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
      <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-zinc-300 animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-100">
              <Settings className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-zinc-100">Settings & Preferences</h2>
              <p className="text-xs text-zinc-400 font-medium">Configure profile, backups, and desktop controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition btn-tactile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/[0.08] px-6 bg-zinc-900/40">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 btn-tactile ${
              activeTab === 'profile'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Degree</span>
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 btn-tactile ${
              activeTab === 'data'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup & Sync</span>
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 btn-tactile ${
              activeTab === 'shortcuts'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
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
                  <label className="text-zinc-400 font-medium">Student Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 font-medium focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium">Student ID Number</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 tabular-nums focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium">Department</label>
                  <input
                    type="text"
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium">Graduation Credit Requirement</label>
                  <input
                    type="number"
                    step="0.5"
                    value={degreeCredits}
                    onChange={(e) => setDegreeCredits(parseFloat(e.target.value) || 160)}
                    className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 tabular-nums focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onOpenTutorial}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium btn-tactile"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>App Tour</span>
                  </button>
                  {onRerunWizard && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onRerunWizard();
                      }}
                      className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium btn-tactile"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Re-run Setup Wizard</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md transition btn-tactile"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-200" />
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
              <div className="p-4 rounded-xl bg-zinc-900 border border-white/[0.08] space-y-3">
                <div>
                  <h4 className="font-semibold text-zinc-100 text-sm">Local Database Backup</h4>
                  <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">
                    Export your complete database (all semesters, courses, routines, and CT records) to an encrypted offline JSON file.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={onExportBackup}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium border border-white/10 transition btn-tactile"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Download JSON Backup</span>
                  </button>

                  <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium border border-white/10 transition cursor-pointer btn-tactile">
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

              <div className="p-4 rounded-xl bg-zinc-900 border border-white/[0.08] space-y-2">
                <div>
                  <h4 className="font-semibold text-zinc-100 text-sm">Reset to BUET L2T1 Seed Data</h4>
                  <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">
                    Restores official BUET Level-2 Term-1 seed courses (ME 243, ME 265, IPE 205, etc.), Section A routine, and test data.
                  </p>
                </div>

                <button
                  onClick={onResetSeeds}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 text-xs font-medium transition btn-tactile"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Sample BUET Dataset</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-white/[0.06]">
                <span className="text-zinc-300 font-medium">Save & Local Sync</span>
                <kbd className="px-2 py-1 rounded bg-zinc-800 text-blue-400 tabular-nums text-xs border border-white/10">
                  Ctrl + S
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-white/[0.06]">
                <span className="text-zinc-300 font-medium">Routine Designer & Exporter</span>
                <kbd className="px-2 py-1 rounded bg-zinc-800 text-blue-400 tabular-nums text-xs border border-white/10">
                  Ctrl + E
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-white/[0.06]">
                <span className="text-zinc-300 font-medium">Print Routine (Document View)</span>
                <kbd className="px-2 py-1 rounded bg-zinc-800 text-blue-400 tabular-nums text-xs border border-white/10">
                  Ctrl + P
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-white/[0.06]">
                <span className="text-zinc-300 font-medium">Toggle Fullscreen</span>
                <kbd className="px-2 py-1 rounded bg-zinc-800 text-blue-400 tabular-nums text-xs border border-white/10">
                  F11
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-white/[0.06]">
                <span className="text-zinc-300 font-medium">Close Modal / Esc</span>
                <kbd className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 tabular-nums text-xs border border-white/10">
                  Escape
                </kbd>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/[0.08] bg-zinc-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition btn-tactile"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
