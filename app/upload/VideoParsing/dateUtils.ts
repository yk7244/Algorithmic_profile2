// my_account.updated_at가 일주일(7일) 이상 지났는지 판별하는 함수
export function isOneWeekPassed(updatedAt: string | null): boolean {
  if (!updatedAt) return false;

  const updated = new Date(updatedAt);
  const now = new Date();

  // 시/분/초/밀리초를 0으로 맞춰 날짜만 비교
  updated.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffDays = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 7;
} 