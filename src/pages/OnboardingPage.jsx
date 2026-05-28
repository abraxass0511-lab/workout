import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { Rocket, User, ChevronRight, ChevronLeft } from 'lucide-react';
import './OnboardingPage.css';

export default function OnboardingPage() {
  const { dispatch } = useUser();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    nickname: '',
    heightCm: '',
    weightKg: '',
  });
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateProfile = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = '이름을 입력해주세요';
    if (!form.heightCm || form.heightCm < 100 || form.heightCm > 250) errs.heightCm = '키를 올바르게 입력해주세요';
    if (!form.weightKg || form.weightKg < 30 || form.weightKg > 200) errs.weightKg = '몸무게를 올바르게 입력해주세요';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    setStep(1);
  };

  const handleComplete = () => {
    if (!validateProfile()) return;
    dispatch({
      type: 'SET_PROFILE',
      payload: {
        name: form.name.trim(),
        nickname: form.nickname.trim() || form.name.trim(),
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        familyName: '',
        familyRelation: '',
        weightHistory: [{ date: new Date().toISOString().split('T')[0], weight: Number(form.weightKg) }],
      },
    });
    dispatch({ type: 'COMPLETE_ONBOARDING' });
    navigate('/');
  };

  return (
    <div className="onboarding">
      {/* Progress */}
      <div className="onboarding-progress">
        {[0, 1].map(i => (
          <div key={i} className={`progress-dot ${step >= i ? 'active' : ''}`} />
        ))}
      </div>

      <div className="onboarding-content">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="onboarding-step" key="step0">
            <div className="welcome-hero">
              <div className="hero-glow" />
              <div className="hero-icon">
                <Rocket size={48} />
              </div>
              <h1 className="hero-title">
                Anti<span className="hero-accent">gravity</span>
              </h1>
              <p className="hero-subtitle">중력을 거스르는 운동 습관</p>
            </div>
            <div className="welcome-features">
              <div className="feature-item">
                <span className="feature-emoji">🟢</span>
                <div>
                  <strong>신호등 캘린더</strong>
                  <p>매일 초록불을 켜세요</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-emoji">💌</span>
                <div>
                  <strong>가족 응원 시스템</strong>
                  <p>운동 완료를 가족에게 자랑하세요</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-emoji">🤖</span>
                <div>
                  <strong>AI 월간 리포트</strong>
                  <p>매달 맞춤형 운동 피드백</p>
                </div>
              </div>
            </div>

            <button className="onboarding-start-btn" onClick={handleNext} id="start-btn">
              🚀 시작하기
            </button>
          </div>
        )}

        {/* Step 1: Profile */}
        {step === 1 && (
          <div className="onboarding-step" key="step1">
            <div className="step-header">
              <div className="step-icon-wrap">
                <User size={28} />
              </div>
              <h2>프로필 설정</h2>
              <p className="step-desc">운동 관리를 위한 기본 정보를 입력해주세요</p>
            </div>
            <div className="form-group">
              <label className="input-label" htmlFor="input-name">이름 *</label>
              <input
                id="input-name"
                className={`input-field ${errors.name ? 'input-error' : ''}`}
                type="text"
                placeholder="홍길동"
                value={form.name}
                onChange={e => updateField('name', e.target.value)}
              />
              {errors.name && <p className="error-text">{errors.name}</p>}
            </div>
            <div className="form-group">
              <label className="input-label" htmlFor="input-nickname">닉네임 (선택)</label>
              <input
                id="input-nickname"
                className="input-field"
                type="text"
                placeholder="표시할 닉네임"
                value={form.nickname}
                onChange={e => updateField('nickname', e.target.value)}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="input-label" htmlFor="input-height">키 (cm) *</label>
                <input
                  id="input-height"
                  className={`input-field ${errors.heightCm ? 'input-error' : ''}`}
                  type="number"
                  placeholder="175"
                  value={form.heightCm}
                  onChange={e => updateField('heightCm', e.target.value)}
                />
                {errors.heightCm && <p className="error-text">{errors.heightCm}</p>}
              </div>
              <div className="form-group">
                <label className="input-label" htmlFor="input-weight">몸무게 (kg) *</label>
                <input
                  id="input-weight"
                  className={`input-field ${errors.weightKg ? 'input-error' : ''}`}
                  type="number"
                  placeholder="70"
                  value={form.weightKg}
                  onChange={e => updateField('weightKg', e.target.value)}
                />
                {errors.weightKg && <p className="error-text">{errors.weightKg}</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions - only show on step 1 */}
      {step > 0 && (
        <div className="onboarding-actions">
          <button className="btn btn-ghost" onClick={() => setStep(0)} id="onboarding-prev">
            <ChevronLeft size={18} />
            이전
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-primary btn-lg" onClick={handleComplete} id="onboarding-complete">
            완료! 🚀
          </button>
        </div>
      )}
    </div>
  );
}
