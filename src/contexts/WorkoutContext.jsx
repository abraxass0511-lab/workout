import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';
import { formatDate, getToday, isPast, getTodayDayIndex } from '../utils/dateUtils';

const WorkoutContext = createContext(null);

/*
  Data shape (monthly routines):
  monthlyRoutines: {
    "2026-05": {
      0: [...], // Sunday
      1: [...], // Monday
      ...
      6: [...], // Saturday
    },
    "2026-06": { ... }
  }

  dailyChecks: {
    '2026-05-28': { checks: [...], completed: false, sent: false }
  }
*/

const defaultWeekRoutines = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

function getMonthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function getMonthKeyFromDate(dateStr) {
  return dateStr.substring(0, 7); // "2026-05-28" -> "2026-05"
}

function getCurrentMonthKey() {
  const now = new Date();
  return getMonthKey(now.getFullYear(), now.getMonth());
}

// Migration: convert old flat routines to monthly format
function migrateState(saved) {
  if (saved.monthlyRoutines) return saved; // already migrated

  const currentKey = getCurrentMonthKey();
  const oldRoutines = saved.routines || defaultWeekRoutines;

  return {
    monthlyRoutines: { [currentKey]: oldRoutines },
    dailyChecks: saved.dailyChecks || {},
  };
}

const initialState = {
  monthlyRoutines: {},
  dailyChecks: {},
};

function workoutReducer(state, action) {
  switch (action.type) {
    case 'SET_ROUTINES': {
      const { monthKey, dayOfWeek, routines } = action.payload;
      const monthData = state.monthlyRoutines[monthKey] || { ...defaultWeekRoutines };
      return {
        ...state,
        monthlyRoutines: {
          ...state.monthlyRoutines,
          [monthKey]: { ...monthData, [dayOfWeek]: routines },
        },
      };
    }

    case 'ADD_ROUTINE': {
      const { monthKey, dayOfWeek, routine } = action.payload;
      const monthData = state.monthlyRoutines[monthKey] || { ...defaultWeekRoutines };
      const existing = monthData[dayOfWeek] || [];
      return {
        ...state,
        monthlyRoutines: {
          ...state.monthlyRoutines,
          [monthKey]: {
            ...monthData,
            [dayOfWeek]: [...existing, { ...routine, id: Date.now().toString() }],
          },
        },
      };
    }

    case 'UPDATE_ROUTINE': {
      const { monthKey, dayOfWeek, routineId, updates } = action.payload;
      const monthData = state.monthlyRoutines[monthKey] || { ...defaultWeekRoutines };
      return {
        ...state,
        monthlyRoutines: {
          ...state.monthlyRoutines,
          [monthKey]: {
            ...monthData,
            [dayOfWeek]: (monthData[dayOfWeek] || []).map(r =>
              r.id === routineId ? { ...r, ...updates } : r
            ),
          },
        },
      };
    }

    case 'DELETE_ROUTINE': {
      const { monthKey, dayOfWeek, routineId } = action.payload;
      const monthData = state.monthlyRoutines[monthKey] || { ...defaultWeekRoutines };
      return {
        ...state,
        monthlyRoutines: {
          ...state.monthlyRoutines,
          [monthKey]: {
            ...monthData,
            [dayOfWeek]: (monthData[dayOfWeek] || []).filter(r => r.id !== routineId),
          },
        },
      };
    }

    case 'COPY_ROUTINES': {
      const { monthKey, fromDay, toDays } = action.payload;
      const monthData = { ...(state.monthlyRoutines[monthKey] || { ...defaultWeekRoutines }) };
      const source = monthData[fromDay] || [];
      toDays.forEach(day => {
        monthData[day] = source.map(r => ({ ...r, id: Date.now().toString() + Math.random() }));
      });
      return {
        ...state,
        monthlyRoutines: { ...state.monthlyRoutines, [monthKey]: monthData },
      };
    }

    case 'COPY_MONTH': {
      const { fromMonthKey, toMonthKey } = action.payload;
      const sourceMonth = state.monthlyRoutines[fromMonthKey] || defaultWeekRoutines;
      // Deep copy with new IDs
      const copied = {};
      for (let day = 0; day < 7; day++) {
        copied[day] = (sourceMonth[day] || []).map(r => ({
          ...r,
          id: Date.now().toString() + Math.random(),
        }));
      }
      return {
        ...state,
        monthlyRoutines: { ...state.monthlyRoutines, [toMonthKey]: copied },
      };
    }

    case 'TOGGLE_CHECK': {
      const { date, index } = action.payload;
      const dayData = state.dailyChecks[date] || { checks: [], completed: false, sent: false };
      const dateObj = new Date(date + 'T00:00:00');
      const dayOfWeek = dateObj.getDay();
      const mk = getMonthKeyFromDate(date);
      const monthRoutines = state.monthlyRoutines[mk] || defaultWeekRoutines;
      const routineCount = (monthRoutines[dayOfWeek] || []).length;

      let checks = [...(dayData.checks.length >= routineCount ? dayData.checks : Array(routineCount).fill(false))];
      checks[index] = !checks[index];
      const completed = routineCount > 0 && checks.slice(0, routineCount).every(Boolean);

      return {
        ...state,
        dailyChecks: {
          ...state.dailyChecks,
          [date]: { ...dayData, checks, completed },
        },
      };
    }

    case 'MARK_SENT': {
      const { date } = action.payload;
      const dayData = state.dailyChecks[date] || { checks: [], completed: false, sent: false };
      return {
        ...state,
        dailyChecks: {
          ...state.dailyChecks,
          [date]: { ...dayData, sent: true },
        },
      };
    }

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

export function WorkoutProvider({ children }) {
  const raw = storage.get('workout', initialState);
  const migrated = migrateState(raw);
  const [state, dispatch] = useReducer(workoutReducer, migrated);

  useEffect(() => {
    storage.set('workout', state);
  }, [state]);

  // Helper: get routines for a specific month
  const getRoutinesForMonth = useCallback((monthKey) => {
    return state.monthlyRoutines[monthKey] || defaultWeekRoutines;
  }, [state.monthlyRoutines]);

  // Get status for a specific date
  const getDayStatus = useCallback((dateStr) => {
    const dateObj = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    const mk = getMonthKeyFromDate(dateStr);
    const monthRoutines = state.monthlyRoutines[mk] || defaultWeekRoutines;
    const routines = monthRoutines[dayOfWeek] || [];
    const dayData = state.dailyChecks[dateStr];

    if (routines.length === 0) return 'rest';
    if (dayData?.completed) return 'green';
    if (isPast(dateStr)) return 'red';
    if (dateStr === getToday()) return 'today';
    return 'future';
  }, [state.monthlyRoutines, state.dailyChecks]);

  // Get monthly stats
  const getMonthStats = useCallback((year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let greenDays = 0;
    let redDays = 0;
    let totalActiveDays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(new Date(year, month, d));
      const status = getDayStatus(dateStr);
      if (status === 'green') {
        greenDays++;
        totalActiveDays++;
      } else if (status === 'red') {
        redDays++;
        totalActiveDays++;
      }
    }

    return { greenDays, redDays, totalActiveDays, totalDays: daysInMonth };
  }, [getDayStatus]);

  // Get today's routines and checks
  const getTodayData = useCallback(() => {
    const today = getToday();
    const dayOfWeek = getTodayDayIndex();
    const mk = getMonthKeyFromDate(today);
    const monthRoutines = state.monthlyRoutines[mk] || defaultWeekRoutines;
    const routines = monthRoutines[dayOfWeek] || [];
    const dayData = state.dailyChecks[today] || { checks: Array(routines.length).fill(false), completed: false, sent: false };
    const checks = routines.map((_, i) => dayData.checks[i] || false);

    return {
      date: today,
      dayOfWeek,
      routines,
      checks,
      completed: routines.length > 0 && checks.every(Boolean),
      sent: dayData.sent || false,
    };
  }, [state.monthlyRoutines, state.dailyChecks]);

  return (
    <WorkoutContext.Provider value={{
      workout: state, dispatch, getDayStatus, getMonthStats, getTodayData,
      getRoutinesForMonth, getMonthKey, getMonthKeyFromDate, getCurrentMonthKey,
    }}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error('useWorkout must be used within WorkoutProvider');
  return context;
}

export { getMonthKey, getMonthKeyFromDate, getCurrentMonthKey };
