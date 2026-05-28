import { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { calculateBMI, getBMICategory, getToday } from '../utils/dateUtils';
import { User, Scale, Key, Trash2, Info, ChevronRight, Save, LogOut } from 'lucide-react';
import { signOut, getCurrentUser } from '../utils/firebase';
import './SettingsPage.css';

export default function SettingsPage() {
  const { user, dispatch: userDispatch } = useUser();
  const { dispatch: workoutDispatch } = useWorkout();
  const [editProfile, setEditProfile] = useState(false);
  const [editWeight, setEditWeight] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user.name,
    nickname: user.nickname,
    heightCm: user.heightCm,
    familyName: user.familyName,
    familyRelation: user.familyRelation,
  });

  const [weightForm, setWeightForm] = useState({ weight: user.weightKg });
  const [apiKey, setApiKey] = useState(user.geminiApiKey || '');

  const bmi = calculateBMI(user.heightCm, user.weightKg);
  const bmiCategory = getBMICategory(bmi);

  const saveProfile = () => {
    userDispatch({
      type: 'SET_PROFILE',
      payload: {
        name: profileForm.name,
        nickname: profileForm.nickname,
        heightCm: Number(profileForm.heightCm),
        familyName: profileForm.familyName,
        familyRelation: profileForm.familyRelation,
      },
    });
    setEditProfile(false);
  };

  const saveWeight = () => {
    if (!weightForm.weight) return;
    userDispatch({
      type: 'UPDATE_WEIGHT',
      payload: { date: getToday(), weight: Number(weightForm.weight) },
    });
    setEditWeight(false);
  };

  const saveApiKey = () => {
    userDispatch({ type: 'SET_API_KEY', payload: apiKey.trim() });
    setShowApiKey(false);
  };

  const resetAll = () => {
    userDispatch({ type: 'RESET' });
    workoutDispatch({ type: 'RESET' });
    window.location.reload();
  };

  return (
    <div className="page settings-page">
      <div className="container">
        <header className="settings-header">
          <h1>⚙️ 설정</h1>
        </header>

        {/* Profile Card */}
        <div className="settings-profile glass-card-static">
          <div className="profile-avatar">
            {getCurrentUser()?.photoURL ? (
              <img src={getCurrentUser().photoURL} alt="" className="profile-avatar-img" />
            ) : (
              <span>🏋️</span>
            )}
          </div>
          <div className="profile-info">
            <h2>{user.nickname || user.name}</h2>
            <p>{user.heightCm}cm · {user.weightKg}kg {bmi && `· BMI ${bmi} (${bmiCategory})`}</p>
            {getCurrentUser()?.email && (
              <p className="profile-email">📧 {getCurrentUser().email}</p>
            )}
            {user.familyName && (
              <p className="profile-family">👨‍👩‍👧 {user.familyName} ({user.familyRelation})</p>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <div className="settings-menu">
          {/* Edit Profile */}
          <button className="settings-item" onClick={() => setEditProfile(!editProfile)} id="edit-profile-btn">
            <div className="settings-item-icon accent">
              <User size={18} />
            </div>
            <span className="settings-item-label">프로필 수정</span>
            <ChevronRight size={18} className="settings-item-arrow" />
          </button>
          {editProfile && (
            <div className="settings-expand glass-card-static">
              <div className="form-group">
                <label className="input-label">이름</label>
                <input className="input-field" value={profileForm.name}
                  onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="input-label">닉네임</label>
                <input className="input-field" value={profileForm.nickname}
                  onChange={e => setProfileForm(p => ({ ...p, nickname: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="input-label">키 (cm)</label>
                <input className="input-field" type="number" value={profileForm.heightCm}
                  onChange={e => setProfileForm(p => ({ ...p, heightCm: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="input-label">가족 이름</label>
                <input className="input-field" value={profileForm.familyName}
                  onChange={e => setProfileForm(p => ({ ...p, familyName: e.target.value }))} />
              </div>
              <button className="btn btn-primary btn-full" onClick={saveProfile} id="save-profile">
                <Save size={16} /> 저장
              </button>
            </div>
          )}

          {/* Weight Update */}
          <button className="settings-item" onClick={() => setEditWeight(!editWeight)} id="edit-weight-btn">
            <div className="settings-item-icon green">
              <Scale size={18} />
            </div>
            <span className="settings-item-label">몸무게 기록</span>
            <span className="settings-item-sub">{user.weightKg}kg</span>
            <ChevronRight size={18} className="settings-item-arrow" />
          </button>
          {editWeight && (
            <div className="settings-expand glass-card-static">
              <div className="form-group">
                <label className="input-label">오늘의 몸무게 (kg)</label>
                <input className="input-field" type="number" step="0.1" value={weightForm.weight}
                  onChange={e => setWeightForm({ weight: e.target.value })}
                  placeholder="70.5" id="input-weight-update" />
              </div>
              {user.weightHistory.length > 0 && (
                <div className="weight-history">
                  <p className="weight-history-title">최근 기록</p>
                  {user.weightHistory.slice(-5).reverse().map((h, i) => (
                    <div key={i} className="weight-history-item">
                      <span>{h.date}</span>
                      <span>{h.weight}kg</span>
                    </div>
                  ))}
                </div>
              )}
              <button className="btn btn-primary btn-full" onClick={saveWeight} id="save-weight">
                <Save size={16} /> 기록하기
              </button>
            </div>
          )}

          {/* API Key */}
          <button className="settings-item" onClick={() => setShowApiKey(!showApiKey)} id="api-key-btn">
            <div className="settings-item-icon yellow">
              <Key size={18} />
            </div>
            <span className="settings-item-label">Gemini API 키</span>
            <span className="settings-item-sub">{user.geminiApiKey ? '설정됨 ✅' : '미설정'}</span>
            <ChevronRight size={18} className="settings-item-arrow" />
          </button>
          {showApiKey && (
            <div className="settings-expand glass-card-static">
              <div className="form-group">
                <label className="input-label">Google AI Studio API 키</label>
                <input className="input-field" type="password" value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="AI 총평 리포트에 사용됩니다" id="input-api-key" />
              </div>
              <p className="api-hint">
                💡 <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio</a>에서 무료 API 키를 발급받을 수 있습니다.
              </p>
              <button className="btn btn-accent btn-full" onClick={saveApiKey} id="save-api-key">
                <Save size={16} /> 저장
              </button>
            </div>
          )}

          {/* Reset */}
          <button className="settings-item danger" onClick={() => setShowReset(true)} id="reset-btn">
            <div className="settings-item-icon red">
              <Trash2 size={18} />
            </div>
            <span className="settings-item-label">데이터 초기화</span>
            <ChevronRight size={18} className="settings-item-arrow" />
          </button>

          {/* App Info - bottom */}
          <div className="settings-item" id="app-info">
            <div className="settings-item-icon">
              <Info size={18} />
            </div>
            <span className="settings-item-label">앱 정보</span>
            <span className="settings-item-sub">v1.0.0</span>
          </div>

          {/* Logout */}
          <button className="settings-item logout-item" onClick={() => signOut()} id="logout-btn">
            <div className="settings-item-icon danger">
              <LogOut size={18} />
            </div>
            <span className="settings-item-label">로그아웃</span>
            <ChevronRight size={16} className="settings-item-arrow" />
          </button>
        </div>

        {/* Reset Confirmation Modal */}
        {showReset && (
          <div className="modal-overlay" onClick={() => setShowReset(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 8 }}>⚠️ 데이터 초기화</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
                모든 프로필, 루틴, 운동 기록이 삭제됩니다.<br />이 작업은 되돌릴 수 없습니다.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowReset(false)}>취소</button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={resetAll} id="confirm-reset">초기화</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
