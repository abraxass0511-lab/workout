import { useState } from 'react';
import { useWorkout, getMonthKey } from '../contexts/WorkoutContext';
import { getDayName, getMonthName } from '../utils/dateUtils';
import { Plus, Trash2, Copy, Dumbbell, Waves, Footprints, Heart, Flame, X, Check, ChevronLeft, ChevronRight, ClipboardCopy } from 'lucide-react';
import './RoutinePage.css';

const EXERCISE_ICONS = {
  '푸시업': Dumbbell, '팔굽혀펴기': Dumbbell, '스쿼트': Flame,
  '수영': Waves, '산책': Footprints, '러닝': Flame, '달리기': Flame,
  '요가': Heart, '필라테스': Heart, '스트레칭': Heart,
};

function getExerciseIcon(name) {
  for (const [key, Icon] of Object.entries(EXERCISE_ICONS)) {
    if (name.includes(key)) return Icon;
  }
  return Dumbbell;
}

const DAYS = [1, 2, 3, 4, 5, 6, 0]; // Mon to Sun

export default function RoutinePage() {
  const { workout, dispatch, getRoutinesForMonth } = useWorkout();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDay());
  const [showAdd, setShowAdd] = useState(false);
  const [showCopy, setShowCopy] = useState(false);
  const [showCopyMonth, setShowCopyMonth] = useState(false);
  const [newRoutine, setNewRoutine] = useState({ name: '', detail: '', sets: 3, reps: 20, duration: '', unit: 'reps' });

  const monthKey = getMonthKey(viewYear, viewMonth);
  const monthRoutines = getRoutinesForMonth(monthKey);
  const routines = monthRoutines[selectedDay] || [];

  // Previous month key
  const prevMonthDate = new Date(viewYear, viewMonth - 1, 1);
  const prevMonthKey = getMonthKey(prevMonthDate.getFullYear(), prevMonthDate.getMonth());
  const hasPrevMonth = !!workout.monthlyRoutines[prevMonthKey];

  // Check if current month has any routines
  const hasCurrentMonthRoutines = Object.values(monthRoutines).some(dayArr => dayArr && dayArr.length > 0);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const handleAdd = () => {
    if (!newRoutine.name.trim()) return;
    dispatch({
      type: 'ADD_ROUTINE',
      payload: {
        monthKey,
        dayOfWeek: selectedDay,
        routine: {
          name: newRoutine.name.trim(),
          detail: newRoutine.detail.trim(),
          sets: newRoutine.unit === 'reps' ? Number(newRoutine.sets) : 1,
          reps: newRoutine.unit === 'reps' ? Number(newRoutine.reps) : 0,
          duration: newRoutine.unit === 'time' ? newRoutine.duration : '',
          unit: newRoutine.unit,
        },
      },
    });
    setNewRoutine({ name: '', detail: '', sets: 3, reps: 20, duration: '', unit: 'reps' });
    setShowAdd(false);
  };

  const handleDelete = (routineId) => {
    dispatch({ type: 'DELETE_ROUTINE', payload: { monthKey, dayOfWeek: selectedDay, routineId } });
  };

  const handleCopyToOtherDays = (toDays) => {
    dispatch({ type: 'COPY_ROUTINES', payload: { monthKey, fromDay: selectedDay, toDays } });
    setShowCopy(false);
  };

  const handleCopyFromPrevMonth = () => {
    dispatch({ type: 'COPY_MONTH', payload: { fromMonthKey: prevMonthKey, toMonthKey: monthKey } });
    setShowCopyMonth(false);
  };

  return (
    <div className="page routine-page">
      <div className="container">
        <header className="routine-header">
          <h1>🎯 목표운동 설정</h1>
          <p>월별 · 요일별 목표운동을 자유롭게 구성하세요</p>
        </header>

        {/* Month Selector */}
        <div className="routine-month-nav">
          <button className="month-nav-btn" onClick={prevMonth} id="routine-prev-month">
            <ChevronLeft size={20} />
          </button>
          <span className="routine-month-title">
            {viewYear}년 {getMonthName(viewMonth)}
          </span>
          <button className="month-nav-btn" onClick={nextMonth} id="routine-next-month">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Copy from Previous Month Button */}
        {!hasCurrentMonthRoutines && hasPrevMonth && (
          <button
            className="copy-month-btn glass-card-static"
            onClick={() => setShowCopyMonth(true)}
            id="copy-prev-month"
          >
            <ClipboardCopy size={18} />
            <div>
              <span className="copy-month-title">전월 목표운동 복사</span>
              <span className="copy-month-desc">
                {prevMonthDate.getFullYear()}년 {getMonthName(prevMonthDate.getMonth())} 세팅을 그대로 가져옵니다
              </span>
            </div>
          </button>
        )}

        {/* Day Tabs */}
        <div className="day-tabs">
          {DAYS.map(day => (
            <button
              key={day}
              className={`day-tab ${selectedDay === day ? 'active' : ''} ${(monthRoutines[day] || []).length > 0 ? 'has-routine' : ''}`}
              onClick={() => setSelectedDay(day)}
              id={`day-tab-${day}`}
            >
              <span className="day-tab-label">{getDayName(day)}</span>
              {(monthRoutines[day] || []).length > 0 && (
                <span className="day-tab-count">{(monthRoutines[day] || []).length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Routine List */}
        <div className="routine-list stagger-children">
          {routines.length === 0 && !showAdd && (
            <div className="empty-routine">
              <span className="empty-emoji">🌴</span>
              <p className="empty-title">
                {selectedDay === 0 || selectedDay === 6 ? '쉬는 날이에요!' : '아직 목표운동이 없어요'}
              </p>
              <p className="empty-desc">목표운동을 추가해보세요</p>
            </div>
          )}

          {routines.map((routine, index) => {
            const Icon = getExerciseIcon(routine.name);
            return (
              <div key={routine.id} className="routine-card glass-card" style={{ animationDelay: `${index * 60}ms` }}>
                <div className="routine-card-icon">
                  <Icon size={20} />
                </div>
                <div className="routine-card-info">
                  <h3>{routine.name}</h3>
                  <p>
                    {routine.unit === 'reps'
                      ? `${routine.reps}개 × ${routine.sets}세트`
                      : routine.duration
                    }
                    {routine.detail && ` · ${routine.detail}`}
                  </p>
                </div>
                <button
                  className="routine-delete-btn"
                  onClick={() => handleDelete(routine.id)}
                  id={`delete-routine-${routine.id}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Add Routine Form */}
        {showAdd && (
          <div className="add-routine-form glass-card-static">
            <div className="add-form-header">
              <h3>운동 추가</h3>
              <button onClick={() => setShowAdd(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="form-group">
              <label className="input-label">운동 이름 *</label>
              <input
                className="input-field"
                type="text"
                placeholder="예: 팔굽혀펴기, 수영, 산책 등"
                value={newRoutine.name}
                onChange={e => setNewRoutine(p => ({ ...p, name: e.target.value }))}
                id="input-exercise-name"
              />
            </div>

            <div className="unit-toggle">
              <button
                className={`unit-btn ${newRoutine.unit === 'reps' ? 'active' : ''}`}
                onClick={() => setNewRoutine(p => ({ ...p, unit: 'reps' }))}
              >
                횟수 × 세트
              </button>
              <button
                className={`unit-btn ${newRoutine.unit === 'time' ? 'active' : ''}`}
                onClick={() => setNewRoutine(p => ({ ...p, unit: 'time' }))}
              >
                시간/자유 입력
              </button>
            </div>

            {newRoutine.unit === 'reps' ? (
              <div className="form-row">
                <div className="form-group">
                  <label className="input-label">횟수</label>
                  <input className="input-field" type="number" placeholder="20"
                    value={newRoutine.reps}
                    onChange={e => setNewRoutine(p => ({ ...p, reps: e.target.value }))}
                    id="input-reps" />
                </div>
                <div className="form-group">
                  <label className="input-label">세트</label>
                  <input className="input-field" type="number" placeholder="3"
                    value={newRoutine.sets}
                    onChange={e => setNewRoutine(p => ({ ...p, sets: e.target.value }))}
                    id="input-sets" />
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label className="input-label">시간/설명</label>
                <input className="input-field" type="text"
                  placeholder="예: 50분 자유형, 30분 산책 등"
                  value={newRoutine.duration}
                  onChange={e => setNewRoutine(p => ({ ...p, duration: e.target.value }))}
                  id="input-duration" />
              </div>
            )}

            <div className="form-group">
              <label className="input-label">메모 (선택)</label>
              <input className="input-field" type="text" placeholder="추가 메모"
                value={newRoutine.detail}
                onChange={e => setNewRoutine(p => ({ ...p, detail: e.target.value }))}
                id="input-detail" />
            </div>

            <button className="btn btn-primary btn-full" onClick={handleAdd} id="confirm-add-routine">
              <Check size={18} /> 추가하기
            </button>
          </div>
        )}

        {/* Copy to Other Days Modal */}
        {showCopy && (
          <CopyModal
            fromDay={selectedDay}
            onCopy={handleCopyToOtherDays}
            onClose={() => setShowCopy(false)}
          />
        )}

        {/* Copy from Previous Month Modal */}
        {showCopyMonth && (
          <div className="modal-overlay" onClick={() => setShowCopyMonth(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 8 }}>📋 전월 목표운동 복사</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
                <strong>{prevMonthDate.getFullYear()}년 {getMonthName(prevMonthDate.getMonth())}</strong>의 모든 요일별 목표운동을
                <br/><strong>{viewYear}년 {getMonthName(viewMonth)}</strong>로 복사합니다.
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                ⚠️ 현재 달에 이미 설정된 운동이 있으면 덮어씁니다.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCopyMonth(false)}>취소</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCopyFromPrevMonth}>
                  복사하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAB Buttons */}
        <div className="routine-fabs">
          {routines.length > 0 && (
            <button className="fab fab-secondary" onClick={() => setShowCopy(true)} id="copy-routine-btn">
              <Copy size={18} />
            </button>
          )}
          <button className="fab fab-primary" onClick={() => setShowAdd(true)} id="add-routine-btn">
            <Plus size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CopyModal({ fromDay, onCopy, onClose }) {
  const [selected, setSelected] = useState([]);
  const DAYS = [1, 2, 3, 4, 5, 6, 0];

  const toggle = (day) => {
    setSelected(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 8 }}>목표운동 복사</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
          {getDayName(fromDay)}요일 목표운동을 다른 요일에 복사합니다
        </p>
        <div className="copy-days">
          {DAYS.filter(d => d !== fromDay).map(day => (
            <button
              key={day}
              className={`copy-day-btn ${selected.includes(day) ? 'active' : ''}`}
              onClick={() => toggle(day)}
            >
              {getDayName(day)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>취소</button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={() => onCopy(selected)}
            disabled={selected.length === 0}
          >
            복사하기
          </button>
        </div>
      </div>
    </div>
  );
}
