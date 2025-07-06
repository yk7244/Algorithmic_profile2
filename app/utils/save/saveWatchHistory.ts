export function saveWatchHistory(watchHistory: any[], localStorageObj: Storage = localStorage) {
    // 기존 기록 불러오기
    const prev = JSON.parse(localStorageObj.getItem('watchHistory') || '[]');
    const today = new Date().toISOString().slice(0, 10);
    // 새 기록에 timestamp가 없으면 오늘 날짜로 추가
    const withDate = watchHistory.map(item => ({
        ...item,
        timestamp: item.timestamp || today
    }));
    // 누적 저장
    const merged = [...prev, ...withDate];
    localStorageObj.setItem('watchHistory', JSON.stringify(merged));
}