import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useWorkout, getMonthKey } from '../contexts/WorkoutContext';
import { getToday, getMonthName } from '../utils/dateUtils';
import { Scale, Target, X, Save, ChevronRight } from 'lucide-react';
import './MonthlyWeightModal.css';

export default function MonthlyWeightModal() {
  const { user, dispatch } = useUser();
  const { workout } = useWorkout();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0); // 0: weight, 1: routine prompt
  const [weight, setWeight] = useState(user.weightKg || '');

  const today = new Date();
  // Next month info (for routine setup)
  const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextMonthName = getMonthName(nextMonthDate.getMonth());
  const nextMonthYear = nextMonthDate.getFullYear();

  // Check if today is the last day of the month
  const isLastDayOfMonth = () => {
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    return tomorrow.getMonth() !== today.getMonth();
  };

  useEffect(() => {
    if (!isLastDayOfMonth()) return;

    const currentMonth = getToday().substring(0, 7);
    const dismissKey = `monthlySetup_${currentMonth}`;

    if (localStorage.getItem(dismissKey)) return;

    const todayStr = getToday();
    const alreadyRecorded = user.weightHistory.some(h => h.date === todayStr);
    if (alreadyRecorded) {
      // Weight already done, check if next month routines need setup
      const nextMk = getMonthKey(nextMonthDate.getFullYear(), nextMonthDate.getMonth());
      const hasRoutines = workout.monthlyRoutines[nextMk] && Object.values(workout.monthlyRoutines[nextMk]).some(arr => arr.length > 0);
      if (!hasRoutines) {
        setStep(1);
        const timer = setTimeout(() => setShow(true), 800);
        return () => clearTimeout(timer);
      }
      return;
    }

    const timer = setTimeout(() => setShow(true), 800);
    return () => clearTimeout(timer);
  }, [user.weightHistory]);

  const handleSaveWeight = () => {
    if (!weight || weight < 30 || weight > 200) return;

    const todayStr = getToday();

    dispatch({
      type: 'UPDATE_WEIGHT',
      payload: { date: todayStr, weight: Number(weight) },
    });

    setStep(1);
  };

  const handleGoRoutine = () => {
    const currentMonth = getToday().substring(0, 7);
    localStorage.setItem(`monthlySetup_${currentMonth}`, 'true');
    setShow(false);
    navigate('/routine');
  };

  const handleDismiss = () => {
    const currentMonth = getToday().substring(0, 7);
    localStorage.setItem(`monthlySetup_${currentMonth}`, 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="modal-overlay weight-modal-overlay" onClick={handleDismiss}>
      <div className="weight-modal" onClick={e => e.stopPropagation()}>
        <button className="weight-modal-close" onClick={handleDismiss}>
          <X size={20} />
        </button>

        {/* Step indicator */}
        <div className="weight-modal-steps">
          <div className={`wm-step-dot ${step >= 0 ? 'active' : ''}`} />
          <div className={`wm-step-dot ${step >= 1 ? 'active' : ''}`} />
        </div>

        {/* Step 0: Weight */}
        {step === 0 && (
          <>
            <div className="weight-modal-header">
              <div className="weight-modal-icon">
                <Scale size={28} />
              </div>
              <h2>이번 달 마지막 날! ⚖️</h2>
              <p>한 달간 수고했어요!<br/>오늘의 몸무게를 기록해주세요</p>
            </div>

            {user.weightKg && (
              <div className="weight-modal-prev">
                <span>지난 기록</span>
                <span className="weight-modal-prev-val">{user.weightKg}kg</span>
              </div>
            )}

            <div className="weight-modal-input">
              <label className="input-label">오늘의 몸무게 (kg)</label>
              <input
                className="input-field"
                type="number"
                step="0.1"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder={user.weightKg ? String(user.weightKg) : '70.0'}
                autoFocus
                id="monthly-weight-input"
              />
            </div>

            <div className="weight-modal-actions">
              <button className="btn btn-primary btn-full btn-lg" onClick={handleSaveWeight} id="save-monthly-weight">
                <Save size={18} /> 기록하고 다음으로
              </button>
              <button className="btn btn-ghost btn-full" onClick={handleDismiss}>
                다음에 할게요
              </button>
            </div>
          </>
        )}

        {/* Step 1: Next Month Routine Setup */}
        {step === 1 && (
          <>
            <div className="weight-modal-header">
              <div className="weight-modal-icon routine-icon">
                <Target size={28} />
              </div>
              <h2>{nextMonthYear}년 {nextMonthName} 운동 목표 🎯</h2>
              <p>다음 달 요일별 운동 목표를<br/>미리 세팅해볼까요?</p>
            </div>

            <div className="routine-prompt-tips">
              <div className="routine-tip">
                <span>📋</span>
                <p>이번 달 목표를 그대로 복사할 수 있어요</p>
              </div>
              <div className="routine-tip">
                <span>📅</span>
                <p>요일별로 다른 운동을 설정하세요</p>
              </div>
              <div className="routine-tip">
                <span>✏️</span>
                <p>다음 달에도 언제든 수정 가능해요</p>
              </div>
            </div>

            <div className="weight-modal-actions">
              <button className="btn btn-primary btn-full btn-lg" onClick={handleGoRoutine} id="go-routine-setup">
                <Target size={18} /> {nextMonthName} 목표 세팅하기
                <ChevronRight size={18} />
              </button>
              <button className="btn btn-ghost btn-full" onClick={handleDismiss}>
                나중에 할게요
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
