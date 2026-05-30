// AI Report Generator (mock + Gemini API ready)
import { getDayFullName } from './dateUtils';

// Generate a mock report based on workout data
export function generateMockReport({ userName, greenDays, redDays, totalDays, routines, familyName, heightCm, weightKg, prevWeightKg }) {
  const rate = totalDays > 0 ? Math.round((greenDays / totalDays) * 100) : 0;
  const isSuccess = rate >= 80;
  const bmi = heightCm ? (weightKg / ((heightCm / 100) ** 2)).toFixed(1) : null;
  const prevBmi = (heightCm && prevWeightKg) ? (prevWeightKg / ((heightCm / 100) ** 2)).toFixed(1) : null;

  const weightChange = prevWeightKg ? (weightKg - prevWeightKg).toFixed(1) : null;

  let report = `# 🏋️ ${userName}님의 이번 달 운동 총평 리포트\n\n`;
  report += `---\n\n`;

  // 달성률 섹션
  report += `## 📊 이번 달 달성 현황\n\n`;
  report += `| 항목 | 수치 |\n|------|------|\n`;
  report += `| 🟢 초록불 (성공) | **${greenDays}일** |\n`;
  report += `| 🔴 빨간불 (미완) | **${redDays}일** |\n`;
  report += `| 📅 전체 일수 | **${totalDays}일** |\n`;
  report += `| 🎯 달성률 | **${rate}%** |\n\n`;

  if (bmi) {
    report += `## 🏃 신체 변화\n\n`;
    report += `- 현재 체중: **${weightKg}kg**\n`;
    if (weightChange) {
      const emoji = parseFloat(weightChange) <= 0 ? '📉' : '📈';
      report += `- 체중 변화: ${emoji} **${weightChange > 0 ? '+' : ''}${weightChange}kg**\n`;
    }
    report += `- BMI: **${bmi}**`;
    if (prevBmi) report += ` (이전: ${prevBmi})`;
    report += `\n\n`;
  }

  // 극찬 또는 격려
  if (isSuccess) {
    report += `## 🎉 축하합니다!\n\n`;
    report += `> ${userName}님, 정말 대단합니다! 이번 달 **${rate}%** 달성률로 목표를 훌륭히 달성하셨어요.\n\n`;
    report += `바쁜 일상 속에서도 꾸준히 운동 루틴을 지켜낸 ${userName}님의 의지력은 정말 놀랍습니다. `;
    report += `${familyName ? `${familyName}님도 분명 ${userName}님의 노력에 감동받고 계실 거예요. ` : ''}`;
    report += `건강한 몸은 가족 모두의 행복입니다. 💪\n\n`;
    report += `이번 달 특히 잘하신 점:\n`;
    report += `- ✅ 주중 루틴을 꾸준히 소화하셨습니다\n`;
    report += `- ✅ 초록불 ${greenDays}개는 대단한 성과입니다\n`;
    if (weightChange && parseFloat(weightChange) < 0) {
      report += `- ✅ 체중이 ${Math.abs(weightChange)}kg 감소하며 건강해지고 계십니다\n`;
    }
  } else {
    report += `## 💪 아쉽지만, 괜찮아요!\n\n`;
    report += `> ${userName}님, 이번 달 달성률이 ${rate}%로 80% 목표에는 조금 못 미쳤어요. 하지만 ${greenDays}일이나 운동을 해냈다는 건 충분히 자랑스러운 일이에요!\n\n`;
    report += `바쁜 직장 생활과 가정을 동시에 꾸려나가면서 운동까지 한다는 것 자체가 쉽지 않은 일입니다. `;
    report += `스스로를 너무 몰아세우지 마세요. 🤗\n\n`;
  }

  // 처방
  report += `## 📋 다음 달 추천 루틴 조정\n\n`;
  if (!isSuccess) {
    report += `목표 달성률을 높이기 위해, 루틴을 조금 가볍게 조정해보는 건 어떨까요?\n\n`;
    report += `- 💡 세트 수를 1~2세트 줄여보세요 (예: 3세트 → 2세트)\n`;
    report += `- 💡 운동 시간이 길다면 10~15분 단축해보세요\n`;
    report += `- 💡 주말 루틴을 가벼운 산책으로 대체해보세요\n`;
    report += `- 💡 "완벽"보다 "꾸준함"이 더 중요합니다\n\n`;
  } else {
    report += `현재 루틴이 잘 맞는 것 같아요! 다음 달에는:\n\n`;
    report += `- 🔥 세트 수나 시간을 조금 늘려보세요\n`;
    report += `- 🔥 새로운 운동 종목에 도전해보세요\n`;
    report += `- 🔥 가족과 함께하는 운동 시간을 늘려보세요\n\n`;
  }

  report += `---\n\n`;
  report += `> 🌟 *"꾸준함이 재능을 이긴다."* — 매일 초록불을 켜는 ${userName}님을 응원합니다!\n`;

  return report;
}


