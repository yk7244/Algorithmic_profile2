export function saveParseHistory(parseHistory: any) {
    localStorage.setItem('parseHistory', JSON.stringify(parseHistory));
    console.log('parseHistory 저장 완료', parseHistory);
}   