import { useState, useMemo, useCallback } from 'react';
import {
  TermId,
  Course,
  RoutineSlot,
  RoutineSlotDetails,
  DayOfWeek,
  ClassTest,
  SemesterStore,
  SemesterGradeInput,
  CompleteSemesterResult,
  getNextTermId,
} from '../types/semester';
import {
  INITIAL_BUET_COURSES,
  INITIAL_ROUTINE_SLOTS,
} from '../data/initialSemesterData';
import { IPE_CURRICULUM_DATA } from '../utils/ipeCurriculum';

/**
 * BUET Ordinance Best-n Class Test Recalculation Engine
 * For N conducted CTs, counts the best n = max(1, N - 1) based on normalized percentage score.
 */
export function recalculateBestNClassTests(tests: ClassTest[]): ClassTest[] {
  if (tests.length <= 1) {
    return tests.map((t) => ({ ...t, isCounted: true }));
  }

  const bestCount = Math.max(1, tests.length - 1);

  // Compute normalized score ratio for equitable ranking across varying maxMarks
  const indexedRatios = tests.map((t, idx) => ({
    idx,
    ratio: t.outOf > 0 ? t.score / t.outOf : 0,
    score: t.score,
  }));

  // Sort descending by ratio; tie-break by absolute score
  indexedRatios.sort((a, b) => (b.ratio !== a.ratio ? b.ratio - a.ratio : b.score - a.score));

  const countedIndices = new Set(indexedRatios.slice(0, bestCount).map((r) => r.idx));

  return tests.map((t, idx) => ({
    ...t,
    isCounted: countedIndices.has(idx),
  }));
}

/**
 * Custom React State Hook & Data Layer for BUET Semester Isolation
 *
 * Eliminates the 39-course UI bug by strictly isolating semester data:
 * - currentTermId defaults to 'L-2 T-1'
 * - currentTheoryCourses: filtered strictly for (termId === currentTermId && type === 'THEORY')
 * - currentTermCredits: isolated strictly to currentTermId (~18-20 cr, NOT 160 cr)
 * - completedCredits & cumulativeCGPA: calculated strictly from completed terms (gradePoint !== undefined)
 * - mutation handlers: addAttendance, addOrUpdateCT (best-n recalc), assignRoutineSlot
 */
export function useSemesterStore(initialTermId: TermId = 'L-2 T-1'): SemesterStore {
  // 1. Core State
  const [currentTermId, setCurrentTermId] = useState<TermId>(initialTermId);
  const [courses, setCourses] = useState<Course[]>(INITIAL_BUET_COURSES);
  const [routineSlots, setRoutineSlots] = useState<RoutineSlot[]>(INITIAL_ROUTINE_SLOTS);

  // 2. Selectors / Filters (Strict Semester Isolation)

  // Current semester all courses
  const currentCourses = useMemo(() => {
    return courses.filter((c) => c.termId === currentTermId);
  }, [courses, currentTermId]);

  // Current semester theory courses (continuous assessment CTs + Attendance)
  const currentTheoryCourses = useMemo(() => {
    return courses.filter((c) => c.termId === currentTermId && c.type === 'THEORY');
  }, [courses, currentTermId]);

  // Current semester sessional / lab courses
  const currentSessionalCourses = useMemo(() => {
    return courses.filter((c) => c.termId === currentTermId && c.type === 'SESSIONAL');
  }, [courses, currentTermId]);

  // Current semester credits ONLY (~18-20 cr, NOT 160 cr)
  const currentTermCredits = useMemo(() => {
    const total = currentCourses.reduce((sum, c) => sum + c.credits, 0);
    return Math.round(total * 100) / 100;
  }, [currentCourses]);

  // Completed courses: strictly from completed terms (where gradePoint is recorded and term is not current)
  const completedCourses = useMemo(() => {
    return courses.filter((c) => c.termId !== currentTermId && typeof c.gradePoint === 'number' && !isNaN(c.gradePoint));
  }, [courses, currentTermId]);

  // All graded courses across the entire degree (prior completed terms + current term if graded)
  const allGradedCourses = useMemo(() => {
    return courses.filter((c) => typeof c.gradePoint === 'number' && !isNaN(c.gradePoint));
  }, [courses]);

  // Completed credits: strictly accumulated from completed terms
  const completedCredits = useMemo(() => {
    const total = completedCourses.reduce((sum, c) => sum + c.credits, 0);
    return Math.round(total * 100) / 100;
  }, [completedCourses]);

  // Cumulative CGPA: calculated from all graded courses across the degree (prior completed + any graded current courses)
  const cumulativeCGPA = useMemo(() => {
    const targetCourses = allGradedCourses.length > 0 ? allGradedCourses : completedCourses;
    if (targetCourses.length === 0) return 0;

    const totalCredits = targetCourses.reduce((sum, c) => sum + c.credits, 0);
    if (totalCredits === 0) return 0;

    const totalGradePoints = targetCourses.reduce((sum, c) => {
      return sum + c.credits * (c.gradePoint ?? 0);
    }, 0);

    const cgpa = totalGradePoints / totalCredits;
    return Math.round(cgpa * 100) / 100;
  }, [allGradedCourses, completedCourses]);

  // Breakdown of credits per term
  const termCreditsMap = useMemo(() => {
    const map = {} as Record<TermId, number>;
    for (const c of courses) {
      map[c.termId] = Math.round(((map[c.termId] || 0) + c.credits) * 100) / 100;
    }
    return map;
  }, [courses]);

  // Breakdown of GPA per term for all terms with assigned grades
  const termGpaMap = useMemo(() => {
    const pointsMap: Record<string, number> = {};
    const credsMap: Record<string, number> = {};

    for (const c of courses) {
      if (typeof c.gradePoint === 'number' && !isNaN(c.gradePoint)) {
        pointsMap[c.termId] = (pointsMap[c.termId] || 0) + c.credits * c.gradePoint;
        credsMap[c.termId] = (credsMap[c.termId] || 0) + c.credits;
      }
    }

    const gpaMap: Record<string, number> = {};
    for (const term in credsMap) {
      if (credsMap[term] > 0) {
        gpaMap[term] = Math.round((pointsMap[term] / credsMap[term]) * 100) / 100;
      }
    }
    return gpaMap;
  }, [courses]);

  // 3. Mutation Handlers

  /**
   * Updates attendance record for a course adhering strictly to BUET academic ordinance:
   * - Max 13 teaching weeks per semester
   * - An n-credit course conducts n classes per week -> maxSemesterClasses = Math.round(credits * 13)
   * - Increments conducted by 1 (capped at maxSemesterClasses)
   * - Increments attended by 1 if isAttended is true (capped at conducted)
   */
  const addAttendance = useCallback((courseCode: string, isAttended: boolean) => {
    setCourses((prevCourses) =>
      prevCourses.map((c) => {
        if (c.code === courseCode) {
          const credits = c.credits || 3.0;
          const maxClasses = Math.max(1, Math.round(credits * 13));
          const currentAtt = c.attendance || { attended: 0, conducted: 0 };

          // Strictly cap at BUET 13-week semester maximum
          if (currentAtt.conducted >= maxClasses) {
            return c;
          }

          const nextConducted = currentAtt.conducted + 1;
          const nextAttended = Math.min(nextConducted, currentAtt.attended + (isAttended ? 1 : 0));
          const nextHistory = [...(currentAtt.history || []), (isAttended ? 'attended' : 'missed') as 'attended' | 'missed'];

          return {
            ...c,
            attendance: {
              conducted: nextConducted,
              attended: nextAttended,
              history: nextHistory,
            },
          };
        }
        return c;
      })
    );
  }, []);

  /**
   * Reverts the most recent attendance increment for a course
   */
  const undoAttendance = useCallback((courseCode: string) => {
    setCourses((prevCourses) =>
      prevCourses.map((c) => {
        if (c.code === courseCode) {
          const currentAtt = c.attendance;
          if (!currentAtt || currentAtt.conducted <= 0) {
            return c;
          }

          if (currentAtt.history && currentAtt.history.length > 0) {
            const lastAction = currentAtt.history[currentAtt.history.length - 1];
            const nextHistory = currentAtt.history.slice(0, -1);
            const nextAttended = lastAction === 'attended' ? Math.max(0, currentAtt.attended - 1) : currentAtt.attended;
            const nextConducted = Math.max(0, currentAtt.conducted - 1);

            return {
              ...c,
              attendance: {
                conducted: nextConducted,
                attended: Math.min(nextConducted, nextAttended),
                history: nextHistory,
              },
            };
          }

          // Fallback if no history recorded yet
          const nextConducted = Math.max(0, currentAtt.conducted - 1);
          const nextAttended = Math.min(nextConducted, currentAtt.attended);
          return {
            ...c,
            attendance: {
              conducted: nextConducted,
              attended: nextAttended,
              history: [],
            },
          };
        }
        return c;
      })
    );
  }, []);

  /**
   * Directly sets attendance counts with BUET 13-week limit validation
   */
  const setAttendance = useCallback((courseCode: string, attended: number, conducted: number) => {
    setCourses((prevCourses) =>
      prevCourses.map((c) => {
        if (c.code === courseCode) {
          const credits = c.credits || 3.0;
          const maxClasses = Math.max(1, Math.round(credits * 13));
          const safeConducted = Math.min(maxClasses, Math.max(0, Math.round(conducted)));
          const safeAttended = Math.min(safeConducted, Math.max(0, Math.round(attended)));

          return {
            ...c,
            attendance: {
              conducted: safeConducted,
              attended: safeAttended,
              history: [],
            },
          };
        }
        return c;
      })
    );
  }, []);

  /**
   * Adds or updates a Class Test (CT) score and recalculates best-n scores
   */
  const addOrUpdateCT = useCallback(
    (courseCode: string, ctIndex: number, score: number, outOf: number) => {
      setCourses((prevCourses) =>
        prevCourses.map((c) => {
          if (c.code === courseCode) {
            const currentCTs = [...(c.classTests || [])];
            const clampedScore = Math.max(0, score);
            const clampedOutOf = Math.max(1, outOf);

            const updatedTest: ClassTest = {
              id: currentCTs[ctIndex]?.id || `ct_${ctIndex + 1}`,
              name: currentCTs[ctIndex]?.name || `CT ${ctIndex + 1}`,
              score: clampedScore,
              outOf: clampedOutOf,
            };

            if (ctIndex >= 0 && ctIndex < currentCTs.length) {
              currentCTs[ctIndex] = updatedTest;
            } else {
              currentCTs.push(updatedTest);
            }

            const recalculatedCTs = recalculateBestNClassTests(currentCTs);

            return {
              ...c,
              classTests: recalculatedCTs,
            };
          }
          return c;
        })
      );
    },
    []
  );

  /**
   * Assigns or updates a timetable slot for a day and periodIndex
   */
  const assignRoutineSlot = useCallback(
    (
      day: DayOfWeek | string,
      periodIndex: number,
      courseCode: string,
      details?: RoutineSlotDetails
    ) => {
      setRoutineSlots((prevSlots) => {
        const existingIndex = prevSlots.findIndex(
          (s) => s.day === day && s.periodIndex === periodIndex
        );

        const slotToAssign: RoutineSlot = {
          id: existingIndex >= 0 ? prevSlots[existingIndex].id : `slot_${day}_${periodIndex}`,
          day,
          periodIndex,
          courseCode,
          details,
        };

        if (existingIndex >= 0) {
          const updated = [...prevSlots];
          updated[existingIndex] = slotToAssign;
          return updated;
        } else {
          return [...prevSlots, slotToAssign];
        }
      });
    },
    []
  );

  /**
   * Removes a timetable slot for a day and periodIndex
   */
  const removeRoutineSlot = useCallback((day: DayOfWeek | string, periodIndex: number) => {
    setRoutineSlots((prevSlots) =>
      prevSlots.filter((s) => !(s.day === day && s.periodIndex === periodIndex))
    );
  }, []);

  /**
   * Completes the current active semester:
   * 1. Archives continuous assessment (CT and attendance)
   * 2. Ingests final letter grades and grade points into courses
   * 3. Calculates Term GPA and updated Cumulative CGPA
   * 4. Automatically advances currentTermId to next semester
   * 5. Populates next semester courses and routine slots if needed
   */
  const completeSemester = useCallback(
    (grades: SemesterGradeInput[]): CompleteSemesterResult => {
      const gradeMap = new Map<string, SemesterGradeInput>();
      grades.forEach((g) => gradeMap.set(g.code, g));

      let termGradePoints = 0;
      let termCredits = 0;

      // Find current term courses to compute term GPA
      const curCourses = courses.filter((c) => c.termId === currentTermId);
      curCourses.forEach((c) => {
        const g = gradeMap.get(c.code) || {
          code: c.code,
          finalGrade: 'A',
          gradePoint: 3.75,
        };
        termGradePoints += c.credits * g.gradePoint;
        termCredits += c.credits;
      });

      const termGPA =
        termCredits > 0 ? Math.round((termGradePoints / termCredits) * 100) / 100 : 0;

      const nextTerm = getNextTermId(currentTermId);

      // Determine updated courses array with archived continuous data
      let updatedCourses = courses.map((c) => {
        if (c.termId === currentTermId) {
          const g = gradeMap.get(c.code) || {
            code: c.code,
            finalGrade: 'A',
            gradePoint: 3.75,
          };
          return {
            ...c,
            finalGrade: g.finalGrade,
            gradePoint: g.gradePoint,
            archivedAttendance: c.attendance ? { ...c.attendance } : undefined,
            archivedClassTests: c.classTests ? [...c.classTests] : undefined,
            attendance: undefined,
            classTests: undefined,
          };
        }
        return c;
      });

      // If next term exists, ensure next term courses and routine are loaded
      if (nextTerm) {
        const nextKey = nextTerm.replace(/[-\s]/g, '');
        const hasNextTermCourses = updatedCourses.some((c) => c.termId === nextTerm);

        if (!hasNextTermCourses) {
          const nextCurriculum = (IPE_CURRICULUM_DATA as any)[nextKey];
          if (nextCurriculum) {
            const newCourses: Course[] = nextCurriculum.courses.map((cur: any) => ({
              code: cur.code,
              title: cur.title,
              nickname: cur.nickname || cur.title,
              credits: cur.credits,
              type: cur.type.toUpperCase() === 'SESSIONAL' ? 'SESSIONAL' : 'THEORY',
              termId: nextTerm,
              teacher: cur.teacher,
              room: cur.room,
              color: cur.color,
              attendance:
                cur.type.toUpperCase() === 'THEORY'
                  ? { attended: 0, conducted: 0 }
                  : undefined,
              classTests: cur.type.toUpperCase() === 'THEORY' ? [] : undefined,
            }));
            updatedCourses = [...updatedCourses, ...newCourses];
          }
        } else {
          // If already in list, make sure theory courses have active tracking
          updatedCourses = updatedCourses.map((c) => {
            if (c.termId === nextTerm && c.type === 'THEORY' && !c.attendance) {
              return {
                ...c,
                attendance: { attended: 0, conducted: 0 },
                classTests: [],
              };
            }
            return c;
          });
        }

        // Load official routine slots for next term
        const nextCurriculum = (IPE_CURRICULUM_DATA as any)[nextKey];
        if (nextCurriculum && nextCurriculum.routineSlots) {
          const newSlots: RoutineSlot[] = nextCurriculum.routineSlots.map((s: any) => ({
            id: s.id || `slot_${s.day}_${s.periodId}`,
            day: s.day,
            periodIndex: s.periodId,
            courseCode: s.customCode || '',
            details: {
              title: s.customNickname || s.customCode,
              nickname: s.customNickname,
              teacher: s.customTeacher,
              room: s.customRoom,
              span: s.span || 1,
              type: s.periodId === 7 || (s.span && s.span > 1) ? 'SESSIONAL' : 'THEORY',
            },
          }));
          setRoutineSlots(newSlots);
        }

        setCurrentTermId(nextTerm);
      }

      setCourses(updatedCourses);

      // Calculate cumulative stats including newly completed term
      const allCompleted = updatedCourses.filter(
        (c) => (nextTerm ? c.termId !== nextTerm : true) && c.gradePoint !== undefined
      );
      const totalCreds = allCompleted.reduce((sum, c) => sum + c.credits, 0);
      const totalPts = allCompleted.reduce((sum, c) => sum + c.credits * (c.gradePoint ?? 0), 0);
      const newCumulativeCGPA =
        totalCreds > 0 ? Math.round((totalPts / totalCreds) * 100) / 100 : 0;

      return {
        completedTermId: currentTermId,
        nextTermId: nextTerm,
        termGPA,
        termCredits: Math.round(termCredits * 100) / 100,
        newCumulativeCGPA,
        totalCompletedCredits: Math.round(totalCreds * 100) / 100,
      };
    },
    [courses, currentTermId]
  );

  /**
   * Switches active term, ensuring authentic IPE courses and routine exist
   */
  const switchTerm = useCallback((termId: TermId) => {
    setCurrentTermId(termId);
    const key = termId.replace(/[-\s]/g, '');
    const curriculum = (IPE_CURRICULUM_DATA as any)[key];

    // Ensure courses exist for this term and have active continuous marks if theory
    setCourses((prevCourses) => {
      const hasCourses = prevCourses.some((c) => c.termId === termId);
      if (!hasCourses && curriculum) {
        const newCourses: Course[] = curriculum.courses.map((cur: any) => ({
          code: cur.code,
          title: cur.title,
          nickname: cur.nickname || cur.title,
          credits: cur.credits,
          type: cur.type.toUpperCase() === 'SESSIONAL' ? 'SESSIONAL' : 'THEORY',
          termId: termId,
          teacher: cur.teacher,
          room: cur.room,
          color: cur.color,
          attendance:
            cur.type.toUpperCase() === 'THEORY'
              ? { attended: 22, conducted: 24 }
              : undefined,
          classTests:
            cur.type.toUpperCase() === 'THEORY'
              ? [
                  { id: 'ct_1', name: 'CT 1', score: 17.5, outOf: 20, isCounted: true },
                  { id: 'ct_2', name: 'CT 2', score: 18, outOf: 20, isCounted: true },
                  { id: 'ct_3', name: 'CT 3', score: 15, outOf: 20, isCounted: true },
                ]
              : undefined,
        }));
        return [...prevCourses, ...newCourses];
      } else {
        // If courses already exist, ensure active theory courses have attendance/classTests initialized
        return prevCourses.map((c) => {
          if (c.termId === termId && c.type === 'THEORY' && !c.attendance) {
            return {
              ...c,
              attendance: { attended: 22, conducted: 24 },
              classTests: [
                { id: 'ct_1', name: 'CT 1', score: 17.5, outOf: 20, isCounted: true },
                { id: 'ct_2', name: 'CT 2', score: 18, outOf: 20, isCounted: true },
                { id: 'ct_3', name: 'CT 3', score: 15, outOf: 20, isCounted: true },
              ],
            };
          }
          return c;
        });
      }
    });

    // Load routine slots for this term
    if (curriculum && curriculum.routineSlots) {
      const newSlots: RoutineSlot[] = curriculum.routineSlots.map((s: any) => ({
        id: s.id || `slot_${s.day}_${s.periodId}`,
        day: s.day,
        periodIndex: s.periodId,
        courseCode: s.customCode || '',
        details: {
          title: s.customNickname || s.customCode,
          nickname: s.customNickname,
          teacher: s.customTeacher,
          room: s.customRoom,
          span: s.span || 1,
          type: s.periodId === 7 || (s.span && s.span > 1) ? 'SESSIONAL' : 'THEORY',
        },
      }));
      setRoutineSlots(newSlots);
    }
  }, []);

  /**
   * Updates course final grade and grade point directly
   */
  const updateCourseGrade = useCallback(
    (termId: TermId, courseCode: string, finalGrade: string, gradePoint: number) => {
      const normCode = courseCode.replace(/\s+/g, ' ').trim().toUpperCase();
      const normTerm = termId.replace(/[-\s]/g, '');
      setCourses((prev) =>
        prev.map((c) => {
          if (
            c.termId.replace(/[-\s]/g, '') === normTerm &&
            c.code.replace(/\s+/g, ' ').trim().toUpperCase() === normCode
          ) {
            return {
              ...c,
              finalGrade,
              gradePoint,
            };
          }
          return c;
        })
      );
    },
    []
  );

  /**
   * Resets the entire store to clean initial BUET IPE curriculum data
   */
  const resetToInitialData = useCallback(() => {
    setCurrentTermId(initialTermId);
    setCourses(INITIAL_BUET_COURSES);
    setRoutineSlots(INITIAL_ROUTINE_SLOTS);
  }, [initialTermId]);

  return {
    // State
    currentTermId,
    courses,
    routineSlots,

    // Selectors
    currentCourses,
    currentTheoryCourses,
    currentSessionalCourses,
    currentTermCredits,
    completedCourses,
    completedCredits,
    cumulativeCGPA,
    termCreditsMap,
    termGpaMap,

    // Actions
    setCurrentTermId,
    setCourses,
    setRoutineSlots,
    addAttendance,
    undoAttendance,
    setAttendance,
    addOrUpdateCT,
    assignRoutineSlot,
    removeRoutineSlot,
    completeSemester,
    switchTerm,
    updateCourseGrade,
    resetToInitialData,
  };
}
