export function saveWatchHistory(watchHistory: any[], localStorageObj: Storage = localStorage) {
    localStorageObj.setItem('watchHistory', JSON.stringify(watchHistory));
}