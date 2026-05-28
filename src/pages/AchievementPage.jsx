import { useState } from 'react';
import { useWorkout } from '../contexts/WorkoutContext';
import { useUser } from '../contexts/UserContext';
import { getMonthName, calculateBMI, getBMICategory, getBMIDetail } from '../utils/dateUtils';
import { generateMockReport, generateGeminiReport } from '../utils/reportGenerator';
import { Trophy, ChevronLeft, ChevronRight, Sparkles, FileText } from 'lucide-react';
import './AchievementPage.css';

export default function AchievementPage() {
  const { getMonthStats } = useWorkout();
  const { user } = useUser();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportYear, setReportYear] = useState(today.getFullYear());
  const [reportMonth, setReportMonth] = useState(today.getMonth());

  const stats = getMonthStats(viewYear, viewMonth);
  const rate = stats.totalActiveDays > 0 ? Math.round((stats.greenDays / stats.totalActiveDays) * 100) : 0;
  const isSuccess = rate >= 80;
  const bmi = calculateBMI(user.heightCm, user.weightKg);
  const bmiDetail = getBMIDetail(bmi);

  // Is this the current month? (not finished yet)
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  // Is this a past month?
  const isPastMonth = viewYear < today.getFullYear() || (viewYear === today.getFullYear() && viewMonth < today.getMonth());

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  // Ring color: green if >=80%, yellow if <80% but >0%, gray if 0%
  const getRingStroke = () => {
    if (rate === 0) return 'var(--text-muted)';
    if (isSuccess) return 'url(#greenGrad)';
    return 'url(#yellowGrad)';
  };

  // Motivation based on whether month is finished
  const getMotivation = () => {
    if (stats.totalActiveDays === 0 && isCurrentMonth) {
      return { emoji: '🌱', text: '이번 달 아직 시작 전이에요. 오늘부터 시작해볼까요?' };
    }
    if (stats.totalActiveDays === 0) {
      return { emoji: '📭', text: '이 달에는 기록이 없어요.' };
    }
    // Current month - still ongoing, encourage!
    if (isCurrentMonth) {
      if (rate >= 80) return { emoji: '🔥', text: `현재 ${rate}% 달성 중! 이 페이스 유지하면 목표 달성이에요! 화이팅! 💪` };
      if (rate >= 50) return { emoji: '💪', text: `이번 달 아직 끝나지 않았어요! 남은 날도 화이팅! 충분히 할 수 있어요!` };
      if (rate >= 20) return { emoji: '🚀', text: `아직 기회가 있어요! 밀린 운동도 몰아서 해보세요! 화이팅!` };
      return { emoji: '😤', text: `이번 달 아직 끝나지 않았어요! 지금이라도 시작해봐요! 화이팅!` };
    }
    // Past month - final result
    if (rate === 100) return { emoji: '🏆', text: '완벽한 한 달! 모든 운동을 해냈어요!' };
    if (rate >= 80) return { emoji: '🎉', text: '목표 달성! 꾸준함이 만들어낸 결과예요!' };
    if (rate >= 60) return { emoji: '💪', text: '절반 이상 해냈어요! 다음 달은 더 잘할 수 있어요!' };
    if (rate >= 40) return { emoji: '🌿', text: '좋은 시작이었어요! 조금씩 더 늘려봐요!' };
    return { emoji: '😤', text: '다음 달은 다르게! 작은 목표부터 시작해봐요!' };
  };

  const motivation = getMotivation();

  const handleGenerateReport = async () => {
    setLoadingReport(true);
    setShowReport(true);

    const reportStats = getMonthStats(reportYear, reportMonth);

    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (geminiApiKey) {
      const geminiReport = await generateGeminiReport({
        apiKey: geminiApiKey,
        workoutData: {
          userName: user.nickname || user.name,
          greenDays: reportStats.greenDays,
          redDays: reportStats.redDays,
          totalDays: reportStats.totalActiveDays,
          heightCm: user.heightCm,
          weightKg: user.weightKg,
          month: `${reportYear}년 ${getMonthName(reportMonth)}`,
        },
      });
      if (geminiReport) {
        setReport(geminiReport);
        setLoadingReport(false);
        return;
      }
    }

    const prevWeight = user.weightHistory.length > 1
      ? user.weightHistory[user.weightHistory.length - 2]?.weight
      : null;

    setTimeout(() => {
      const mockReport = generateMockReport({
        userName: user.nickname || user.name,
        greenDays: reportStats.greenDays,
        redDays: reportStats.redDays,
        totalDays: reportStats.totalActiveDays,
        familyName: user.familyName,
        heightCm: user.heightCm,
        weightKg: user.weightKg,
        prevWeightKg: prevWeight,
      });
      setReport(mockReport);
      setLoadingReport(false);
    }, 1200);
  };

  const renderMarkdown = (md) => {
    if (!md) return '';
    return md
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^\\> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^\- (.+)$/gm, '<li>$1</li>')
      .replace(/^---$/gm, '<hr/>')
      .replace(/\n/g, '<br/>');
  };

  const bmiBarPercent = bmi ? Math.min(Math.max(((parseFloat(bmi) - 15) / 25) * 100, 0), 100) : 0;

  // Month options for report selector
  const getMonthOptions = () => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      let y = today.getFullYear();
      let m = today.getMonth() - i;
      if (m < 0) { m += 12; y -= 1; }
      options.push({ year: y, month: m, label: `${y}년 ${getMonthName(m)}` });
    }
    return options;
  };

  return (
    <div className="page achievement-page">
      <div className="container">
        <header className="achievement-header">
          <h1>🏆 월간 성과</h1>
        </header>

        {/* Month Nav */}
        <div className="achieve-month-nav">
          <button onClick={prevMonth} className="month-nav-btn" id="achieve-prev-month">
            <ChevronLeft size={20} />
          </button>
          <span className="achieve-month-title">
            {viewYear}년 {getMonthName(viewMonth)}
            {isCurrentMonth && <span className="current-badge">진행 중</span>}
          </span>
          <button onClick={nextMonth} className="month-nav-btn" id="achieve-next-month">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Circular Progress */}
        <div className={`progress-ring-section glass-card-static ${isSuccess ? 'ring-success' : ''}`}>
          <div className="progress-ring-wrap">
            <svg className="progress-ring" viewBox="0 0 160 160">
              <circle className="progress-ring-bg" cx="80" cy="80" r={radius} fill="none" strokeWidth="10" />
              <circle className="progress-ring-fill" cx="80" cy="80" r={radius} fill="none" strokeWidth="10"
                strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                style={{
                  stroke: getRingStroke(),
                  transition: 'stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
              <defs>
                <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#4ADE80" />
                </linearGradient>
                <linearGradient id="yellowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" /><stop offset="100%" stopColor="#FBBF24" />
                </linearGradient>
              </defs>
            </svg>
            <div className="progress-ring-label">
              <span className={`ring-percent ${isSuccess ? 'success' : ''}`}>{rate}%</span>
              <span className="ring-sub">달성률</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="achieve-stats-row">
            <div className="achieve-stat">
              <span className="achieve-stat-num green-text">{stats.greenDays}</span>
              <span className="achieve-stat-label">🟢 성공</span>
            </div>
            <div className="achieve-stat">
              <span className="achieve-stat-num red-text">{stats.redDays}</span>
              <span className="achieve-stat-label">🔴 미완</span>
            </div>
            <div className="achieve-stat">
              <span className="achieve-stat-num">{stats.totalActiveDays}</span>
              <span className="achieve-stat-label">📅 전체</span>
            </div>
          </div>

          {/* Motivation */}
          <div className="motivation-msg">
            <span className="motivation-emoji">{motivation.emoji}</span>
            <p>{motivation.text}</p>
          </div>
        </div>

        {/* Family Avatar Section - 80% Threshold */}
        {isPastMonth && stats.totalActiveDays > 0 && (
          <div className={`avatar-section glass-card-static ${isSuccess ? 'happy' : 'sad'}`}>
            <div className="avatar-scene">
              {isSuccess ? (
                <div className="avatar-happy">
                  <div className="avatar-emoji">🎊👨‍👩‍👧‍👦🎊</div>
                  <p className="avatar-text">가족이 함께 축제를 벌이고 있어요!</p>
                  <p className="avatar-sub">이번 달 미션 최종 달성! 🏆</p>
                  <div className="avatar-particles">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <span key={i} className="particle" style={{ animationDelay: `${i * 0.15}s` }}>
                        {['🎉', '✨', '💪', '🌟', '🎊', '💖', '🔥', '⭐'][i]}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="avatar-sad">
                  <div className="avatar-emoji">😢👨‍👩‍👧‍👦💪</div>
                  <p className="avatar-text">아쉬워요... 다음 달에는 꼭 함께 웃어요!</p>
                  <p className="avatar-sub">80% 목표까지 {80 - rate}% 부족했어요</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Month Avatar */}
        {isCurrentMonth && stats.totalActiveDays > 0 && (
          <div className={`avatar-section glass-card-static ${isSuccess ? 'happy' : 'progress'}`}>
            <div className="avatar-scene">
              {isSuccess ? (
                <div className="avatar-happy">
                  <div className="avatar-emoji">🏃‍♂️🔥💪</div>
                  <p className="avatar-text">이대로만 유지하면 목표 달성!</p>
                  <p className="avatar-sub">현재 {rate}% 달성 중 · 80% 목표 초과!</p>
                </div>
              ) : (
                <div className="avatar-progress">
                  <div className="avatar-emoji">🏃‍♂️</div>
                  <p className="avatar-text">열심히 달리고 있어요! 화이팅!</p>
                  <p className="avatar-sub">80% 목표까지 {80 - rate > 0 ? `${80 - rate}% 남았어요` : '달성!'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BMI Section */}
        {bmi && bmiDetail && (
          <div className="bmi-section glass-card-static">
            <h3>📊 신체질량지수 (BMI)</h3>

            {/* Body Avatar */}
            <div className="bmi-avatar-section">
              <img
                src={
                  `${import.meta.env.BASE_URL}avatars/${
                    parseFloat(bmi) < 18.5 ? 'underweight' :
                    parseFloat(bmi) < 23 ? 'fit' :
                    parseFloat(bmi) < 25 ? 'normal' :
                    'overweight'
                  }.png`
                }
                alt={bmiDetail.label}
                className="bmi-avatar-img"
              />
              <div className="bmi-avatar-info">
                <span className="bmi-avatar-num" style={{ color: bmiDetail.color }}>{bmi}</span>
                <span className="bmi-avatar-label" style={{ color: bmiDetail.color }}>
                  {bmiDetail.emoji} {bmiDetail.label}
                </span>
                <p className="bmi-avatar-msg">
                  {parseFloat(bmi) < 18.5 ? '조금 더 먹고 근육을 키워봐요!' :
                   parseFloat(bmi) < 23 ? '멋진 몸이에요! 이대로 유지!' :
                   parseFloat(bmi) < 25 ? '괜찮아요! 조금만 더 관리하면 몸짱!' :
                   '운동 시작이 반이에요! 함께 해봐요!'}
                </p>
              </div>
            </div>
            <div className="bmi-bar-wrap">
              <div className="bmi-bar">
                <div className="bmi-bar-zone bmi-under" />
                <div className="bmi-bar-zone bmi-normal" />
                <div className="bmi-bar-zone bmi-over" />
                <div className="bmi-bar-zone bmi-obese" />
                <div className="bmi-bar-zone bmi-obese2" />
                <div className="bmi-indicator" style={{ left: `${bmiBarPercent}%` }} />
              </div>
              <div className="bmi-bar-labels">
                <span>15</span><span>18.5</span><span>23</span><span>25</span><span>30</span><span>40</span>
              </div>
              <div className="bmi-bar-cats">
                <span style={{ color: '#3B82F6' }}>저체중</span>
                <span style={{ color: '#22C55E' }}>정상</span>
                <span style={{ color: '#F59E0B' }}>과체중</span>
                <span style={{ color: '#EF4444' }}>비만</span>
                <span style={{ color: '#DC2626' }}>고도</span>
              </div>
            </div>
            <div className="bmi-advice" style={{ borderLeftColor: bmiDetail.color }}>
              <p>{bmiDetail.advice}</p>
            </div>
            <div className="bmi-stats">
              <div className="bmi-stat-item">
                <span className="bmi-stat-val">{user.heightCm}<small>cm</small></span>
                <span className="bmi-stat-lbl">키</span>
              </div>
              <div className="bmi-stat-divider" />
              <div className="bmi-stat-item">
                <span className="bmi-stat-val">{user.weightKg}<small>kg</small></span>
                <span className="bmi-stat-lbl">몸무게</span>
              </div>
              <div className="bmi-stat-divider" />
              <div className="bmi-stat-item">
                <span className="bmi-stat-val">{bmiDetail.range}</span>
                <span className="bmi-stat-lbl">{bmiDetail.label} 범위</span>
              </div>
            </div>
          </div>
        )}

        {/* Weight History Graph */}
        {user.weightHistory.length > 1 && (
          <div className="weight-graph-section glass-card-static">
            <h3>📈 체중 변화</h3>
            <WeightGraph history={user.weightHistory} />
          </div>
        )}

        {/* AI Report with Month Selector */}
        <div className="report-section">
          <h3 className="report-section-title">🤖 AI 월간 총평 리포트</h3>

          {/* Month Selector */}
          <div className="report-month-selector glass-card-static">
            <label className="input-label">리포트 생성할 달 선택</label>
            <select
              className="input-field"
              value={`${reportYear}-${reportMonth}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-').map(Number);
                setReportYear(y);
                setReportMonth(m);
                setShowReport(false);
                setReport(null);
              }}
              id="report-month-select"
            >
              {getMonthOptions().map(opt => (
                <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {!showReport ? (
            <button className="btn btn-accent btn-full btn-lg" onClick={handleGenerateReport} id="generate-report">
              <Sparkles size={18} />
              {reportYear}년 {getMonthName(reportMonth)} 리포트 생성
            </button>
          ) : (
            <div className="report-card glass-card-static">
              <div className="report-header">
                <FileText size={20} />
                <h3>{reportYear}년 {getMonthName(reportMonth)} 총평</h3>
                {!import.meta.env.VITE_GEMINI_API_KEY && <span className="badge badge-accent">Mock</span>}
              </div>
              {loadingReport ? (
                <div className="report-loading">
                  <div className="loading-dots"><span /><span /><span /></div>
                  <p>리포트 생성 중...</p>
                </div>
              ) : (
                <>
                  <div className="report-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(report) }} />
                  <button
                    className="btn btn-ghost btn-full"
                    onClick={() => { setShowReport(false); setReport(null); }}
                    style={{ marginTop: 12 }}
                  >
                    다른 달 리포트 생성
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WeightGraph({ history }) {
  const data = history.slice(-10); // last 10 entries
  if (data.length < 2) return null;

  const weights = data.map(d => d.weight);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const range = maxW - minW || 1;

  const W = 320;
  const H = 160;
  const padX = 40;
  const padY = 20;
  const graphW = W - padX * 2;
  const graphH = H - padY * 2;

  const points = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * graphW,
    y: padY + graphH - ((d.weight - minW) / range) * graphH,
    weight: d.weight,
    date: d.date,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padY + graphH} L ${points[0].x} ${padY + graphH} Z`;

  // Y-axis labels
  const yLabels = [];
  const step = range <= 5 ? 1 : range <= 15 ? 2 : 5;
  for (let v = Math.ceil(minW); v <= Math.floor(maxW); v += step) {
    yLabels.push(v);
  }

  const weightDiff = weights[weights.length - 1] - weights[0];
  const diffText = weightDiff > 0 ? `+${weightDiff.toFixed(1)}` : weightDiff.toFixed(1);
  const diffColor = weightDiff > 0 ? 'var(--red)' : weightDiff < 0 ? 'var(--green)' : 'var(--text-muted)';

  return (
    <div className="weight-graph">
      <div className="weight-graph-summary">
        <span>최근 {data.length}회 기록</span>
        <span style={{ color: diffColor, fontWeight: 700 }}>{diffText}kg</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="weight-svg">
        {/* Grid lines */}
        {yLabels.map(v => {
          const y = padY + graphH - ((v - minW) / range) * graphH;
          return (
            <g key={v}>
              <line x1={padX} y1={y} x2={W - padX} y2={y} stroke="var(--border)" strokeWidth="0.5" />
              <text x={padX - 6} y={y + 3} textAnchor="end" fill="var(--text-muted)" fontSize="9">{v}</text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#weightGrad)" opacity="0.3" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="var(--bg-primary)" stroke="var(--green)" strokeWidth="2" />
            {(i === 0 || i === points.length - 1) && (
              <text x={p.x} y={p.y - 10} textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="700">
                {p.weight}
              </text>
            )}
          </g>
        ))}

        {/* X-axis date labels */}
        {points.filter((_, i) => i === 0 || i === points.length - 1 || (data.length <= 5)).map((p, i) => (
          <text key={i} x={p.x} y={H - 2} textAnchor="middle" fill="var(--text-muted)" fontSize="8">
            {p.date.substring(5)}
          </text>
        ))}

        <defs>
          <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--green)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--green)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
