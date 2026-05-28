import { useState, useRef } from 'react';
import { useWorkout, getMonthKeyFromDate } from '../contexts/WorkoutContext';
import { useUser } from '../contexts/UserContext';
import { getMonthDays, getMonthName, getDayName, getDayFullName, getToday, isToday, isFuture, formatDate } from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, Check, X, Send } from 'lucide-react';
import SendSavingsModal from '../components/SendSavingsModal';
import NotificationToast from '../components/NotificationToast';
import './CalendarPage.css';

export default function CalendarPage() {
  const { workout, dispatch, getDayStatus, getMonthStats, getTodayData } = useWorkout();
  const { user } = useUser();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [tempChecks, setTempChecks] = useState(null); // temporary check state before applying
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const days = getMonthDays(viewYear, viewMonth);
  const todayData = getTodayData();
  const stats = getMonthStats(viewYear, viewMonth);
  const rate = stats.totalActiveDays > 0 ? Math.round((stats.greenDays / stats.totalActiveDays) * 100) : 0;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  // Get routines for a specific date
  const getRoutinesForDate = (dateStr) => {
    const dateObj = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    const mk = getMonthKeyFromDate(dateStr);
    const monthRoutines = workout.monthlyRoutines[mk] || {};
    return monthRoutines[dayOfWeek] || [];
  };

  const handleCellClick = (day) => {
    if (!day.isCurrentMonth) return;
    if (isFuture(day.date) && !isToday(day.date)) return;

    const dateObj = new Date(day.date + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    const mk = getMonthKeyFromDate(day.date);
    const monthRoutines = workout.monthlyRoutines[mk] || {};
    const routines = monthRoutines[dayOfWeek] || [];
    const dayData = workout.dailyChecks[day.date] || { checks: Array(routines.length).fill(false) };
    const checks = routines.map((_, i) => dayData.checks[i] || false);

    setSelectedDate(day.date);
    setTempChecks([...checks]);
  };

  const handleTempCheck = (index) => {
    if (!selectedDate) return;
    setTempChecks(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const handleApply = () => {
    if (!selectedDate || !tempChecks) return;

    const dateObj = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    const mk = getMonthKeyFromDate(selectedDate);
    const monthRoutines = workout.monthlyRoutines[mk] || {};
    const routines = monthRoutines[dayOfWeek] || [];

    // Apply each check
    const currentDayData = workout.dailyChecks[selectedDate] || { checks: Array(routines.length).fill(false) };
    const currentChecks = routines.map((_, i) => currentDayData.checks[i] || false);

    tempChecks.forEach((checked, index) => {
      if (checked !== currentChecks[index]) {
        dispatch({ type: 'TOGGLE_CHECK', payload: { date: selectedDate, index } });
      }
    });

    // Check if all done
    const allDone = routines.length > 0 && tempChecks.every(Boolean);
    if (allDone) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      // Keep modal open to show savings button!
    } else {
      setSelectedDate(null);
      setTempChecks(null);
    }
  };

  const handleClose = () => {
    setSelectedDate(null);
    setTempChecks(null);
  };

  const handleCheerReceived = (cheerText) => {
    setToast({ message: `"${cheerText}"라고 응원을 보냈습니다!`, familyName: user.familyName });
  };

  const getSelectedDateData = () => {
    if (!selectedDate) return null;
    const dateObj = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    const mk = getMonthKeyFromDate(selectedDate);
    const monthRoutines = workout.monthlyRoutines[mk] || {};
    const routines = monthRoutines[dayOfWeek] || [];
    const dayData = workout.dailyChecks[selectedDate] || { checks: Array(routines.length).fill(false), sent: false };
    const completed = (routines.length > 0 && tempChecks && tempChecks.every(Boolean)) || dayData.completed;
    return { dateObj, dayOfWeek, routines, sent: dayData.sent || false, completed };
  };

  const selectedData = getSelectedDateData();

  // Check if tempChecks differ from saved
  const hasChanges = () => {
    if (!selectedDate || !tempChecks) return false;
    const dateObj = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    const mk = getMonthKeyFromDate(selectedDate);
    const monthRoutines = workout.monthlyRoutines[mk] || {};
    const routines = monthRoutines[dayOfWeek] || [];
    const dayData = workout.dailyChecks[selectedDate] || { checks: Array(routines.length).fill(false) };
    const currentChecks = routines.map((_, i) => dayData.checks[i] || false);
    return tempChecks.some((c, i) => c !== currentChecks[i]);
  };

  return (
    <div className="page calendar-page">
      <div className="container">
        <header className="page-title-header">
          <h1>📅 운동 캘린더</h1>
        </header>
        <div className="calendar-card glass-card-static">
          <div className="month-nav">
            <button className="month-nav-btn" onClick={prevMonth} id="prev-month">
              <ChevronLeft size={20} />
            </button>
            <span className="month-title">
              {viewYear}년 {getMonthName(viewMonth)}
            </span>
            <button className="month-nav-btn" onClick={nextMonth} id="next-month">
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Mini Stats Bar */}
          <div className="mini-stats-bar">
            <span className="mini-stats-label">달성률</span>
            <div className="mini-progress">
              <div className="mini-progress-fill" style={{ width: `${rate}%` }} />
            </div>
            <span className="mini-stats-rate">{rate}%</span>
          </div>

          <div className="calendar-grid">
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <div key={d} className={`calendar-day-header ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`}>
                {d}
              </div>
            ))}
            {days.map((day, idx) => {
              const status = day.isCurrentMonth ? getDayStatus(day.date) : 'other';
              const isTodayDate = isToday(day.date);
              const isClickable = day.isCurrentMonth && (!isFuture(day.date) || isTodayDate);
              const routines = day.isCurrentMonth ? getRoutinesForDate(day.date) : [];
              return (
                <button
                  key={idx}
                  className={`calendar-cell ${status} ${!day.isCurrentMonth ? 'other-month' : ''} ${isTodayDate ? 'is-today' : ''} ${isClickable ? 'clickable' : ''}`}
                  onClick={() => handleCellClick(day)}
                  id={`cell-${day.date}`}
                  disabled={!isClickable}
                >
                  <span className="cell-day">{day.day}</span>
                  {day.isCurrentMonth && routines.length > 0 && (
                    <div className="cell-exercises">
                      {routines.slice(0, 2).map((r, i) => (
                        <span key={i} className={`cell-exercise-name ${status === 'green' ? 'done' : ''}`}>
                          {r.name}
                        </span>
                      ))}
                      {routines.length > 2 && (
                        <span className={`cell-exercise-more ${status === 'green' ? 'done' : ''}`}>
                          +{routines.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {showConfetti && (
          <div className="confetti-container">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="confetti-piece"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  backgroundColor: ['#22C55E', '#6366F1', '#F59E0B', '#EF4444', '#EC4899'][i % 5],
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Center Modal */}
      {selectedDate && selectedData && (
        <div className="modal-overlay center-modal-overlay" onClick={handleClose}>
          <div className="center-modal" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="day-modal-header">
              <div>
                <h3 className="day-modal-date">{selectedDate.replace(/-/g, '.')}</h3>
                <p className="day-modal-day">{getDayFullName(selectedData.dayOfWeek)}</p>
              </div>
              <button className="day-modal-close" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            {selectedData.routines.length === 0 ? (
              <div className="day-modal-empty">
                <span>🌴</span>
                <p>이 날은 설정된 목표운동이 없어요</p>
              </div>
            ) : (
              <div className="day-modal-list">
                <p className="day-modal-list-title">
                  목표운동 ({tempChecks ? tempChecks.filter(Boolean).length : 0}/{selectedData.routines.length})
                </p>
                {selectedData.routines.map((routine, index) => {
                  const isChecked = tempChecks ? tempChecks[index] : false;
                  return (
                    <div
                      key={routine.id}
                      className={`day-check-item ${isChecked ? 'checked' : ''} can-check`}
                      onClick={() => handleTempCheck(index)}
                    >
                      <div className={`day-checkbox ${isChecked ? 'checked' : ''}`}>
                        {isChecked && <Check size={14} strokeWidth={3} />}
                      </div>
                      <div className="day-check-info">
                        <h4>{routine.name}</h4>
                        <p>
                          {routine.unit === 'reps'
                            ? `${routine.reps}개 × ${routine.sets}세트`
                            : routine.duration
                          }
                        </p>
                      </div>
                      {isChecked && <span className="day-done-text">완료!</span>}
                    </div>
                  );
                })}

              </div>
            )}

            {/* Bottom Action */}
            <div className="day-modal-actions">
              {selectedData.routines.length > 0 && (
                <button
                  className={`btn btn-full btn-lg ${hasChanges() ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={hasChanges() ? handleApply : handleClose}
                  id="apply-checks"
                >
                  {hasChanges() ? (
                    <><Check size={18} /> 적용하기</>
                  ) : (
                    '닫기'
                  )}
                </button>
              )}
              {selectedData.routines.length === 0 && (
                <button className="btn btn-ghost btn-full btn-lg" onClick={handleClose}>
                  닫기
                </button>
              )}

              {selectedData.completed && !selectedData.sent && !hasChanges() && (
                <button
                  className="btn btn-accent btn-full btn-lg"
                  onClick={() => { handleClose(); setShowSavingsModal(true); }}
                  id="open-savings-modal"
                  style={{ marginTop: 8 }}
                >
                  <Send size={18} /> 🎉 완료 전송하기
                </button>
              )}

              {selectedData.sent && (
                <div className="savings-sent-badge" style={{ marginTop: 8 }}>
                  ✅ 이미 완료 전송됨!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSavingsModal && (
        <SendSavingsModal
          onClose={() => setShowSavingsModal(false)}
          onCheerReceived={handleCheerReceived}
        />
      )}

      {toast && (
        <NotificationToast
          message={toast.message}
          familyName={toast.familyName}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
