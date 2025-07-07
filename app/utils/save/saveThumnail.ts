import { ThumbnailData } from "../../types/profile";

export function saveThumbnail(main_keyword: string, thumbnailData: ThumbnailData, localStorageObj: Storage = localStorage) {
    // 기존 데이터 불러오기 (배열)
    const prev = localStorageObj.getItem('thumbnailData');
    const arr: ThumbnailData[] = prev ? JSON.parse(prev) : [];

    // main_keyword가 같은 데이터가 있으면 교체, 없으면 추가
    const idx = arr.findIndex(item => item.main_keyword === main_keyword);
    if (idx !== -1) {
        arr[idx] = thumbnailData;
    } else {
        arr.push(thumbnailData);
    }

    localStorageObj.setItem('thumbnailData', JSON.stringify(arr));
}