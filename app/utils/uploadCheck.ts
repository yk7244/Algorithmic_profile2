export function isOneWeekPassed(): number {
  try {
    // 유상님✅localStorage에서 ClusterHistory 가져오기
    const clusterHistory = localStorage.getItem('ClusterHistory');
    console.log('clusterHistory', !clusterHistory);
    if (!clusterHistory) return 1; // 초기 유저

    // 가장 최근 항목의 date 가져오기
    const latestEntry = JSON.parse(clusterHistory)[0];
    console.log('latestEntry', latestEntry);

    const updated = new Date(latestEntry.date);
    const now = new Date();

    // 시/분/초/밀리초를 0으로 맞춰 날짜만 비교
    updated.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffDays = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
    console.log('diffDays', diffDays);
    return diffDays >= 7 ? 2 : diffDays; // 일주일 지났으면 2(두번째 유저), 안 지났으면 diffDays(거짓)
  } catch (error) {
    console.error('ClusterHistory 확인 중 오류:', error);
    return 0; // 오류 시 거짓
  }
} 