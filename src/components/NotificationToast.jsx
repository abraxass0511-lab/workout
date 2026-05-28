import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import './NotificationToast.css';

export default function NotificationToast({ message, familyName, onClose, duration = 4000 }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="toast-container">
      <div className={`toast notification-toast ${isExiting ? 'toast-exit' : ''}`}>
        <div className="toast-icon-wrap">
          <Heart size={20} fill="var(--red)" color="var(--red)" />
        </div>
        <div className="toast-body">
          <p className="toast-title">{familyName || '가족'}님의 응원</p>
          <p className="toast-message">{message}</p>
        </div>
      </div>
    </div>
  );
}
