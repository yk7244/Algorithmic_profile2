export function saveProfileImages(images: any[], localStorageObj: Storage = localStorage) {
  localStorageObj.setItem('profileImages', JSON.stringify(images));
}
