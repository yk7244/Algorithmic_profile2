import { getClusterHistory } from "./get/getClusterHistory";

export function isOneWeekPassed(): number {
  try {
    //const clusterHistory = localStorage.getItem('ClusterHistory');
    const clusterHistory = getClusterHistory();
    //console.log('clusterHistory', !clusterHistory);
    if (!clusterHistory){
      console.log('클러스터가 없습니다 -> 초기유저 한달치 데이터 범위 설정')
      return -1; // 초기 유저
    } 

    const parsedHistory = clusterHistory; 
    if (!parsedHistory || !Array.isArray(parsedHistory) || parsedHistory.length === 0) return -1; // 초기 유저

    // 가장 최근 항목의 date 가져오기
    const latestEntry = parsedHistory[parsedHistory.length - 1];
    if (!latestEntry || !latestEntry.created_at) return -1; // 초기 유저

    const updated = new Date(latestEntry.created_at);
    const now = new Date();

    // 시/분/초/밀리초를 0으로 맞춰 날짜만 비교
    updated.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffDays = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
    
    return diffDays >= 7 ? -2 : diffDays; // 일주일 지났으면 -2(두번째 없데이트 유저), 안 지났으면 diffDays
  } catch (error) {
    console.error('ClusterHistory 확인 중 오류:', error);
    return -3; // 오류 시 거짓
  }
} 

//diffDays  = 오늘 날짜 - 마지막 업데이트 날짜
//diffDays 가
  //-2: 두번째 이상 업데이트
  //-1: 첫번째 업데이트
  //0 : 당일 업데이트 한거
  //1 : 하루 지남
  //2 : 이틀 지남
  //...
  //7 : 일주일 지남 -> -2값 부여함 

  //몇일 남았는지 계산하는 방법
  //7-diffDays 