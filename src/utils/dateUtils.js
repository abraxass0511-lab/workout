// Date utility functions

const DAY_NAMES_KR = ['일', '월', '화', '수', '목', '금', '토'];
const DAY_NAMES_FULL = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

export function getDayName(dayIndex) {
  return DAY_NAMES_KR[dayIndex];
}

export function getDayFullName(dayIndex) {
  return DAY_NAMES_FULL[dayIndex];
}

export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getToday() {
  return formatDate(new Date());
}

export function getTodayDayIndex() {
  return new Date().getDay();
}

export function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const days = [];

  // Previous month padding
  for (let i = 0; i < startDayOfWeek; i++) {
    const prevDate = new Date(year, month, -startDayOfWeek + i + 1);
    days.push({
      date: formatDate(prevDate),
      day: prevDate.getDate(),
      isCurrentMonth: false,
      dayOfWeek: prevDate.getDay(),
    });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    days.push({
      date: formatDate(date),
      day: d,
      isCurrentMonth: true,
      dayOfWeek: date.getDay(),
    });
  }

  // Next month padding (fill to 42 = 6 rows)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const nextDate = new Date(year, month + 1, i);
    days.push({
      date: formatDate(nextDate),
      day: nextDate.getDate(),
      isCurrentMonth: false,
      dayOfWeek: nextDate.getDay(),
    });
  }

  return days;
}

export function getMonthName(month) {
  const names = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  return names[month];
}

export function isToday(dateStr) {
  return dateStr === getToday();
}

export function isPast(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseDate(dateStr);
  return target < today;
}

export function isFuture(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseDate(dateStr);
  return target > today;
}

export function getMonthRange(year, month) {
  const start = formatDate(new Date(year, month, 1));
  const end = formatDate(new Date(year, month + 1, 0));
  return { start, end };
}

export function calculateBMI(heightCm, weightKg) {
  if (!heightCm || !weightKg) return null;
  const heightM = heightCm / 100;
  return (weightKg / (heightM * heightM)).toFixed(1);
}

export function getBMICategory(bmi) {
  if (!bmi) return '';
  const val = parseFloat(bmi);
  if (val < 18.5) return '저체중';
  if (val < 23) return '정상';
  if (val < 25) return '비만 전단계(과체중)';
  if (val < 30) return '1단계 비만';
  if (val < 35) return '2단계 비만';
  return '3단계 비만';
}

export function getBMIDetail(bmi) {
  if (!bmi) return null;
  const val = parseFloat(bmi);
  if (val < 18.5) return { label: '저체중', color: '#3B82F6', range: '18.5 미만', advice: '영양 섭취에 신경 써주세요', emoji: '🔵' };
  if (val < 23) return { label: '정상', color: '#22C55E', range: '18.5 ~ 22.9', advice: '건강한 체중입니다! 유지해주세요', emoji: '🟢' };
  if (val < 25) return { label: '비만 전단계', color: '#F59E0B', range: '23.0 ~ 24.9', advice: '가벼운 운동과 식단 조절을 추천합니다', emoji: '🟡' };
  if (val < 30) return { label: '1단계 비만', color: '#EF4444', range: '25.0 ~ 29.9', advice: '꾸준한 유산소 운동이 도움됩니다', emoji: '🟠' };
  if (val < 35) return { label: '2단계 비만', color: '#DC2626', range: '30.0 ~ 34.9', advice: '전문가 상담과 체계적인 운동 계획이 필요합니다', emoji: '🔴' };
  return { label: '3단계 비만', color: '#991B1B', range: '35.0 이상', advice: '의사와 상담 후 운동 계획을 세워주세요', emoji: '🔴' };
}
