import { useState } from 'react';
import { MessageCircle, X, Check, Edit3 } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { getDayFullName, getToday, getTodayDayIndex } from '../utils/dateUtils';
import './SendSavingsModal.css';

const MESSAGE_TEMPLATES = [
  {
    id: 'default',
    label: '기본 메시지',
    emoji: '💪',
    getText: (name, dayName) =>
      `🏃‍♂️ [안티그래비티] ${name}의 운동 완료!\n\n"오늘 [${dayName} 목표운동]을 완수하여 달력에 초록불을 켰습니다! 응원해 주세요!" 💪`,
  },
  {
    id: 'fun',
    label: '재미있게',
    emoji: '🔥',
    getText: (name, dayName) =>
      `🔥 ${name} 오늘도 운동 완료!\n\n${dayName}에도 쉬지 않고 달렸습니다 🏃‍♂️\n칭찬 한마디 부탁드립니다~ 😄`,
  },
  {
    id: 'simple',
    label: '간단하게',
    emoji: '✅',
    getText: (name, dayName) =>
      `✅ ${name} ${dayName} 운동 완료! 오늘도 건강해졌습니다 💚`,
  },
];

export default function SendSavingsModal({ onClose, onCheerReceived }) {
  const { user } = useUser();
  const { dispatch } = useWorkout();
  const [stage, setStage] = useState('compose'); // compose, sent
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [customMessage, setCustomMessage] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const today = getToday();
  const dayName = getDayFullName(getTodayDayIndex());
  const userName = user.nickname || user.name;

  const getMessage = () => {
    if (isCustom && customMessage.trim()) return customMessage;
    const template = MESSAGE_TEMPLATES.find(t => t.id === selectedTemplate);
    return template.getText(userName, dayName);
  };

  const cheerButtons = [
    { text: '수고했어! 💖', emoji: '💖' },
    { text: '최고야 👍', emoji: '👍' },
    { text: '오늘 저녁 맛있는 거 해줄게 🍳', emoji: '🍳' },
  ];

  const markSent = () => {
    setStage('sent');
    dispatch({ type: 'MARK_SENT', payload: { date: today } });
    setTimeout(() => {
      const randomCheer = cheerButtons[Math.floor(Math.random() * cheerButtons.length)];
      onCheerReceived?.(randomCheer.text);
      onClose();
    }, 2500);
  };

  // Detect mobile device
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const handleShare = async () => {
    const msg = getMessage();

    // 1. Try native share API (works on most mobile browsers)
    if (navigator.share) {
      try {
        await navigator.share({ title: '안티그래비티', text: msg });
        markSent();
        return;
      } catch (e) {
        // User cancelled or error, fall through
        if (e.name === 'AbortError') return;
      }
    }

    // 2. Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(msg);
      if (isMobile) {
        alert('📋 메시지가 복사되었습니다!\n카카오톡에서 붙여넣기 해주세요.');
      } else {
        alert('📋 메시지가 복사되었습니다!\n카카오톡 PC에서 붙여넣기(Ctrl+V) 해주세요.');
      }
    } catch {
      // clipboard API not available
    }
    markSent();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content savings-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="savings-header">
          <div className="savings-header-icon">
            <MessageCircle size={24} />
          </div>
          <h3>운동 완료 알리기</h3>
          <button className="savings-close" onClick={onClose} id="close-savings-modal">
            <X size={20} />
          </button>
        </div>

        <div className="savings-body">
          {stage === 'compose' && (
            <>
              {/* Message Template Selection */}
              <div className="msg-template-section">
                <p className="msg-section-title">메시지 선택</p>
                <div className="msg-templates">
                  {MESSAGE_TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      className={`msg-template-btn ${!isCustom && selectedTemplate === t.id ? 'active' : ''}`}
                      onClick={() => { setSelectedTemplate(t.id); setIsCustom(false); }}
                    >
                      <span>{t.emoji}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                  <button
                    className={`msg-template-btn ${isCustom ? 'active' : ''}`}
                    onClick={() => setIsCustom(true)}
                  >
                    <Edit3 size={14} />
                    <span>직접 입력</span>
                  </button>
                </div>
              </div>

              {/* Custom Input */}
              {isCustom && (
                <div className="msg-custom-input">
                  <textarea
                    className="input-field"
                    value={customMessage}
                    onChange={e => setCustomMessage(e.target.value)}
                    placeholder="보낼 메시지를 입력하세요..."
                    rows={3}
                    autoFocus
                    id="custom-message-input"
                  />
                </div>
              )}

              {/* Preview */}
              <div className="msg-preview">
                <p className="msg-section-title">미리보기</p>
                <div className="msg-preview-bubble">
                  <p>{getMessage()}</p>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="share-buttons">
                {isMobile ? (
                  <button className="share-btn kakao-share" onClick={handleShare} id="share-kakao">
                    <svg viewBox="0 0 24 24" width="22" height="22">
                      <path d="M12 3C6.48 3 2 6.36 2 10.5c0 2.66 1.74 4.99 4.38 6.34l-1.12 4.13c-.1.37.32.66.64.44l4.93-3.26c.38.04.77.06 1.17.06 5.52 0 10-3.36 10-7.5S17.52 3 12 3z" fill="#181600"/>
                    </svg>
                    공유하기 (카카오톡 등)
                  </button>
                ) : (
                  <button className="share-btn copy-share" onClick={handleShare} id="share-copy">
                    📋 메시지 복사하기
                  </button>
                )}
              </div>
            </>
          )}

          {stage === 'sent' && (
            <div className="sent-success">
              <div className="sent-check">
                <Check size={28} />
              </div>
              <p>전송 완료! 🎉</p>
              <p className="sent-sub">응원을 기다리는 중...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
