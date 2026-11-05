import React, { useState, useMemo } from 'react';
import {
  SemesterStore,
  SemesterGradeInput,
  CompleteSemesterResult,
  BUET_GRADE_POINTS,
  getNextTermId,
} from '../types/semester';
import { parseBIISText } from '../utils/biisParser';
import {
  CheckCircle2,
  X,
  Sparkles,
  ClipboardPaste,
  SlidersHorizontal,
  ArrowRight,
  Archive,
  GraduationCap,
  AlertCircle,
} from 'lucide-react';

export interface CompleteSemesterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  store: SemesterStore;
  onCompleted?: (result: CompleteSemesterResult) => void;
}

const GRADE_OPTIONS = [
  { grade: 'A+', point: 4.0 },
  { grade: 'A', point: 3.75 },
  { grade: 'A-', point: 3.5 },
  { grade: 'B+', point: 3.25 },
  { grade: 'B', point: 3.0 },
  { grade: 'B-', point: 2.75 },
  { grade: 'C+', point: 2.5 },
  { grade: 'C', point: 2.25 },
  { grade: 'D', point: 2.0 },
  { grade: 'F', point: 0.0 },
];

export const CompleteSemesterDialog: React.FC<CompleteSemesterDialogProps> = ({
  isOpen,
  onClose,
  store,
  onCompleted,
}) => {
  const { currentTermId, currentCourses, completedCourses, completedCredits } = store;
  const nextTermId = getNextTermId(currentTermId);

  // Tab mode: 'form' (interactive list) or 'paste' (BIIS sheet raw text)
  const [activeMode, setActiveMode] = useState<'form' | 'paste'>('form');

  // Interactive grade states for each course in currentTermId
  const [grades, setGrades] = useState<Record<string, { finalGrade: string; gradePoint: number }>>(() => {
    const initial: Record<string, { finalGrade: string; gradePoint: number }> = {};
    currentCourses.forEach((c) => {
      // Default to projected grade or A+
      initial[c.code] = {
        finalGrade: c.finalGrade || 'A+',
        gradePoint: c.gradePoint ?? 4.0,
      };
    });
    return initial;
  });

  // Raw BIIS sheet text
  const [biisRawText, setBiisRawText] = useState<string>('');
  const [parseMessage, setParseMessage] = useState<string | null>(null);

  // Re-sync grades if currentCourses changes
  React.useEffect(() => {
    if (isOpen) {
      const initial: Record<string, { finalGrade: string; gradePoint: number }> = {};
      currentCourses.forEach((c) => {
        initial[c.code] = {
          finalGrade: c.finalGrade || 'A+',
          gradePoint: c.gradePoint ?? 4.0,
        };
      });
      setGrades(initial);
      setParseMessage(null);
    }
  }, [isOpen, currentCourses]);

  // Compute live term stats
  const { liveTermGPA, liveTermCredits, projectedCumulativeCGPA } = useMemo(() => {
    let termPts = 0;
    let termCreds = 0;

    currentCourses.forEach((c) => {
      const g = grades[c.code] || { finalGrade: 'A+', gradePoint: 4.0 };
      termPts += c.credits * g.gradePoint;
      termCreds += c.credits;
    });

    const gpa = termCreds > 0 ? Math.round((termPts / termCreds) * 100) / 100 : 0;

    // Cumulative calculation
    const prevPoints = completedCourses.reduce(
      (acc, c) => acc + c.credits * (c.gradePoint ?? 0),
      0
    );
    const totalCredits = completedCredits + termCreds;
    const totalPoints = prevPoints + termPts;
    const cgpa = totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;

    return {
      liveTermGPA: gpa,
      liveTermCredits: Math.round(termCreds * 100) / 100,
      projectedCumulativeCGPA: cgpa,
    };
  }, [currentCourses, grades, completedCourses, completedCredits]);

  if (!isOpen) return null;

  const handleGradeChange = (code: string, finalGrade: string) => {
    const gradePoint = BUET_GRADE_POINTS[finalGrade] ?? 4.0;
    setGrades((prev) => ({
      ...prev,
      [code]: { finalGrade, gradePoint },
    }));
  };

  /**
   * Projects final grades automatically from continuous assessment
   * (Attendance + Class Tests) + anticipated final performance
   */
  const handleAutoProjectGrades = () => {
    const projected: Record<string, { finalGrade: string; gradePoint: number }> = {};

    currentCourses.forEach((c) => {
      if (c.type === 'SESSIONAL') {
        // Lab courses usually average A or A+ in BUET IPE
        projected[c.code] = { finalGrade: 'A+', gradePoint: 4.0 };
        return;
      }

      // Theory course continuous marks
      const attended = c.attendance?.attended ?? 0;
      const conducted = c.attendance?.conducted ?? 0;
      const attPct = conducted > 0 ? (attended / conducted) * 100 : 100;
      const attPoints = attPct >= 90 ? 10 : attPct >= 85 ? 9 : attPct >= 80 ? 8 : attPct >= 75 ? 7 : attPct >= 70 ? 6 : attPct >= 65 ? 5 : attPct >= 60 ? 4 : 0;
      const attMarks = (attPoints / 10) * (c.credits * 10);

      // CT marks
      const cts = c.classTests || [];
      const countedCTs = cts.filter((t) => t.isCounted);
      const ctSum = countedCTs.reduce((sum, t) => sum + (t.outOf > 0 ? (t.score / t.outOf) * 20 : t.score), 0);

      const continuousObtained = attMarks + ctSum;
      const maxContinuous = c.credits * 30;
      const continuousRatio = maxContinuous > 0 ? continuousObtained / maxContinuous : 0.85;

      let grade = 'A';
      if (continuousRatio >= 0.85) grade = 'A+';
      else if (continuousRatio >= 0.76) grade = 'A';
      else if (continuousRatio >= 0.70) grade = 'A-';
      else if (continuousRatio >= 0.62) grade = 'B+';
      else if (continuousRatio >= 0.55) grade = 'B';
      else grade = 'B-';

      projected[c.code] = {
        finalGrade: grade,
        gradePoint: BUET_GRADE_POINTS[grade] ?? 3.75,
      };
    });

    setGrades(projected);
    setParseMessage('Auto-projected grades applied from continuous marks');
  };

  /**
   * Robust parser for BIIS sheet raw text
   * Handles various BIIS export formats:
   * "ME 243 Mechanics of Solids 3.00 A+ 4.00"
   * "ME 243 \t 3.00 \t A+ \t 4.00"
   */
  const handleParseBIIS = () => {
    if (!biisRawText.trim()) {
      setParseMessage('Please paste text copied from your BIIS grade sheet.');
      return;
    }

    const parseResult = parseBIISText(biisRawText);
    const updated = { ...grades };
    let matchedCount = 0;

    if (parseResult.success && parseResult.courses.length > 0) {
      parseResult.courses.forEach((pc) => {
        const normParsedCode = pc.code.replace(/\s+/g, '').toUpperCase();
        const match = currentCourses.find((c) => c.code.replace(/\s+/g, '').toUpperCase() === normParsedCode);
        if (match) {
          updated[match.code] = { finalGrade: pc.grade, gradePoint: pc.gradePoint };
          matchedCount++;
        }
      });
    }

    setGrades(updated);
    if (matchedCount > 0) {
      setParseMessage(`Successfully ingested grades for ${matchedCount} course(s)!`);
      setActiveMode('form');
    } else {
      setParseMessage(
        'Could not match courses automatically. Please verify text contains course codes (e.g. ME 243) and letter grades (e.g. A+).'
      );
    }
  };

  /**
   * Commits completion to store: archives continuous marks, advances currentTermId
   */
  const handleConfirmCompletion = () => {
    const gradeInputs: SemesterGradeInput[] = currentCourses.map((c) => {
      const g = grades[c.code] || { finalGrade: 'A+', gradePoint: 4.0 };
      return {
        code: c.code,
        finalGrade: g.finalGrade,
        gradePoint: g.gradePoint,
      };
    });

    const result = store.completeSemester(gradeInputs);

    if (onCompleted) {
      onCompleted(result);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans select-none">
      <div className="w-full max-w-2xl bg-[#14151a] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] bg-[#111215]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Complete Semester — Ingest BIIS Sheet</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                <span>Active Term:</span>
                <span className="font-semibold text-emerald-400">{currentTermId}</span>
                {nextTermId && (
                  <>
                    <ArrowRight className="w-3 h-3 text-zinc-500" />
                    <span>Advances to</span>
                    <span className="font-semibold text-white">{nextTermId}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-white/[0.06] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher & Quick Action */}
        <div className="px-5 pt-4 pb-2 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveMode('form')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeMode === 'form'
                  ? 'bg-zinc-800 text-white border border-white/10 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Interactive Grades</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('paste')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeMode === 'paste'
                  ? 'bg-zinc-800 text-white border border-white/10 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Paste BIIS Sheet</span>
            </button>
          </div>

          {activeMode === 'form' && (
            <button
              type="button"
              onClick={handleAutoProjectGrades}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              title="Automatically calculate projected grades using continuous assessment"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-fill Projected</span>
            </button>
          )}
        </div>

        {/* Message Banner */}
        {parseMessage && (
          <div className="mx-5 mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{parseMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeMode === 'form' ? (
            /* Interactive Grade Form */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400 px-2 font-medium">
                <span>Course & Credits</span>
                <span className="w-36 text-right">Final BUET Grade</span>
              </div>

              <div className="space-y-2">
                {currentCourses.map((c) => {
                  const currentGrade = grades[c.code]?.finalGrade || 'A+';
                  const isTheory = c.type === 'THEORY';

                  return (
                    <div
                      key={c.code}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-colors"
                    >
                      <div className="min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-xs tabular-nums">
                            {c.code}
                          </span>
                          <span className="text-[11px] text-zinc-400 truncate font-normal">
                            {c.nickname || c.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-500 tabular-nums">
                          <span>{c.credits.toFixed(c.type === 'THEORY' ? 1 : 2)} Credits</span>
                          <span>•</span>
                          <span className={isTheory ? 'text-zinc-400' : 'text-violet-400'}>
                            {c.type === 'THEORY' ? 'Theory' : 'Sessional'}
                          </span>
                          {isTheory && c.attendance && (
                            <>
                              <span>•</span>
                              <span className="text-zinc-400">
                                Att: {c.attendance.attended}/{c.attendance.conducted}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Grade Selector */}
                      <div className="w-36 shrink-0 flex items-center justify-end">
                        <select
                          value={currentGrade}
                          onChange={(e) => handleGradeChange(c.code, e.target.value)}
                          className="bg-[#1b1d24] border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500/60 cursor-pointer text-right"
                        >
                          {GRADE_OPTIONS.map((g) => (
                            <option key={g.grade} value={g.grade} className="bg-[#14151a] text-zinc-200">
                              {g.grade} ({g.point.toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Paste BIIS Sheet Text Mode */
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Copy your published grade sheet from BUET BIIS (biis.buet.ac.bd) and paste below:
                </span>
              </div>

              <textarea
                rows={9}
                value={biisRawText}
                onChange={(e) => setBiisRawText(e.target.value)}
                placeholder={`Example BIIS text:\nME 243 Mechanics of Solids 3.00 A+ 4.00\nME 265 Thermal Engineering and Heat Transfer 4.00 A 3.75\nIPE 205 Manufacturing Processes I 3.00 A+ 4.00\nIPE 207 Engineering Metallurgy 3.00 A- 3.50\nIPE 209 Engineering Economy 2.00 A 3.75\nME 244 Mechanics of Solids Sessional 0.75 A+ 4.00\nIPE 206 Manufacturing Processes I Sessional 0.75 A 3.75\n...`}
                className="w-full bg-[#18191e] border border-white/[0.08] rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/60 leading-relaxed font-sans placeholder:text-zinc-600"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParseBIIS}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer border border-white/10"
                >
                  Parse & Apply Grades
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Summary & Confirmation */}
        <div className="p-5 border-t border-white/[0.06] bg-[#111215] space-y-3">
          {/* Metrics summary banner */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-center tabular-nums">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Term Credits</span>
              <span className="text-sm font-bold text-white mt-0.5 block">{liveTermCredits} cr</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Term GPA</span>
              <span className="text-sm font-bold text-emerald-400 mt-0.5 block">{liveTermGPA.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">New Cumulative CGPA</span>
              <span className="text-sm font-bold text-white mt-0.5 block">{projectedCumulativeCGPA.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
            <span className="flex items-center gap-1.5">
              <Archive className="w-3.5 h-3.5 text-zinc-500" />
              <span>Continuous marks (CT & attendance) will be safely archived to course records</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-white/[0.08] text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmCompletion}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>Complete Semester & Advance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
