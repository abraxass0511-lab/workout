import { useState, useEffect } from 'react';
import { useWorkout } from '../contexts/WorkoutContext';
import { useUser } from '../contexts/UserContext';
import { getToday, getMonthName } from '../utils/dateUtils';
import { Gift, X, Edit3, Check } from 'lucide-react';
import './MonthlyRewardModal.css';

const REWARD_PRESETS = [
  { id: 'food', emoji: '🍕', label: '맛있는 거 먹기' },
  { id: 'shopping', emoji: '🛍️', label: '쇼핑하기' },
  { id: 'travel', emoji: '🏖️', label: '나들이 가기' },
];

export default function MonthlyRewardModal() {
  const { getMonthStats } = useWorkout();
  const { user } = useUser();
  const [show, setShow] = useState(false);
  const [selectedReward, setSelectedReward] = useState('food');
  const [customReward, setCustomReward] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [stage, setStage] = useState('select'); // select, sent
  const [prevMonthInfo, setPrevMonthInfo] = useState(null);

  const userName = user.nickname || user.name;

  useEffect(() => {
    const today = new Date();
    const day = today.getDate();

    // Only show on the 1st of the month
    if (day !== 1) return;

    // Previous month
    const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth();
    const prevStats = getMonthStats(prevYear, prevMonth);
    const rate = prevStats.totalActiveDays > 0
      ? Math.round((prevStats.greenDays / prevStats.totalActiveDays) * 100)
      : 0;

    // Only show if >= 80%
    if (rate < 80) return;

    // Check if already shown
    const key = `rewardShown_${prevYear}-${prevMonth}`;
    if (localStorage.getItem(key)) return;

    setPrevMonthInfo({
      year: prevYear,
      month: prevMonth,
      monthName: getMonthName(prevMonth),
      rate,
      greenDays: prevStats.greenDays,
      totalDays: prevStats.totalActiveDays,
    });

    // Show after weight modal (delay)
    const timer = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const getRewardText = () => {
    if (isCustom && customReward.trim()) return customReward;
    const preset = REWARD_PRESETS.find(r => r.id === selectedReward);
    return `${preset.emoji} ${preset.label}`;
  };

  const getMessage = () => {
    if (!prevMonthInfo) return '';
    const reward = getRewardText();
    return `🏆 [안티그래비티] ${userName}의 ${prevMonthInfo.monthName} 운동 목표 달성!\n\n달성률 ${prevMonthInfo.rate}% (${prevMonthInfo.greenDays}/${prevMonthInfo.totalDays}일)\n\n🎁 보상을 요청합니다:\n👉 ${reward}\n\n열심히 했으니 보상 부탁드립니다! 😊`;
  };

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const handleShare = () => {
    const msg = getMessage();

    if (isMobile && navigator.share) {
      navigator.share({ title: '안티그래비티 - 보상 요청', text: msg })
        .then(() => markDone())
        .catch(() => {});
      return;
    }

    // PC: copy
    navigator.clipboard?.writeText(msg).then(() => {
      alert('📋 메시지가 복사되었습니다!\n카카오톡 PC에서 붙여넣기(Ctrl+V) 해주세요.');
    });
    markDone();
  };

  const markDone = () => {
    if (prevMonthInfo) {
      const key = `rewardShown_${prevMonthInfo.year}-${prevMonthInfo.month}`;
      localStorage.setItem(key, 'true');
    }
    setStage('sent');
    setTimeout(() => setShow(false), 2500);
  };

  const handleDismiss = () => {
    if (prevMonthInfo) {
      const key = `rewardShown_${prevMonthInfo.year}-${prevMonthInfo.month}`;
      localStorage.setItem(key, 'true');
    }
    setShow(false);
  };

  if (!show || !prevMonthInfo) return null;

  return (
    <div className="modal-overlay reward-modal-overlay" onClick={handleDismiss}>
      <div className="reward-modal" onClick={e => e.stopPropagation()}>
        <button className="reward-close" onClick={handleDismiss}>
          <X size={20} />
        </button>

        {stage === 'select' && (
          <>
            {/* Header */}
            <div className="reward-header">
              <div className="reward-icon-wrap">
                <Gift size={28} />
              </div>
              <h2>🎉 목표 달성! 보상 요청</h2>
              <p>
                {prevMonthInfo.monthName} 달성률 <strong>{prevMonthInfo.rate}%</strong>
                <br />열심히 한 나에게 보상을 요청하세요!
              </p>
            </div>

            {/* Achievement Badge */}
            <div className="reward-badge">
              <span className="reward-badge-emoji">🏆</span>
              <div>
                <strong>{prevMonthInfo.rate}% 달성</strong>
                <p>{prevMonthInfo.greenDays}/{prevMonthInfo.totalDays}일 완료</p>
              </div>
            </div>

            {/* Reward Selection */}
            <div className="reward-section">
              <p className="reward-section-title">보상 선택</p>
              <div className="reward-options">
                {REWARD_PRESETS.map(r => (
                  <button
                    key={r.id}
                    className={`reward-option ${!isCustom && selectedReward === r.id ? 'active' : ''}`}
                    onClick={() => { setSelectedReward(r.id); setIsCustom(false); }}
                  >
                    <span className="reward-option-emoji">{r.emoji}</span>
                    <span>{r.label}</span>
                  </button>
                ))}
                <button
                  className={`reward-option ${isCustom ? 'active' : ''}`}
                  onClick={() => setIsCustom(true)}
                >
                  <Edit3 size={14} />
                  <span>직접 입력</span>
                </button>
              </div>
            </div>

            {/* Custom Input */}
            {isCustom && (
              <div className="reward-custom">
                <input
                  className="input-field"
                  value={customReward}
                  onChange={e => setCustomReward(e.target.value)}
                  placeholder="원하는 보상을 입력하세요..."
                  autoFocus
                  id="custom-reward-input"
                />
              </div>
            )}

            {/* Preview */}
            <div className="reward-preview">
              <p className="reward-section-title">미리보기</p>
              <div className="reward-preview-bubble">
                <p>{getMessage()}</p>
              </div>
            </div>

            {/* Share */}
            <div className="reward-actions">
              {isMobile ? (
                <button className="share-btn kakao-share" onClick={handleShare} id="share-reward">
                  <svg viewBox="0 0 24 24" width="22" height="22">
                    <path d="M12 3C6.48 3 2 6.36 2 10.5c0 2.66 1.74 4.99 4.38 6.34l-1.12 4.13c-.1.37.32.66.64.44l4.93-3.26c.38.04.77.06 1.17.06 5.52 0 10-3.36 10-7.5S17.52 3 12 3z" fill="#181600"/>
                  </svg>
                  보상 요청 보내기
                </button>
              ) : (
                <button className="share-btn copy-share" onClick={handleShare} id="copy-reward">
                  📋 메시지 복사하기
                </button>
              )}
            </div>
          </>
        )}

        {stage === 'sent' && (
          <div className="reward-sent">
            <div className="reward-sent-check">
              <Check size={28} />
            </div>
            <p>보상 요청 완료! 🎁</p>
            <p className="reward-sent-sub">잘 받으실 거예요~ 😄</p>
          </div>
        )}
      </div>
    </div>
  );
}
