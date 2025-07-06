export const getProfileData = () => {
    const profileData = localStorage.getItem('profileData');
    return profileData ? JSON.parse(profileData) : null;
};

// profileData가 배열일 경우 마지막(가장 최신) 값을 반환
export const getLatestProfileData = () => {
    const profileData = localStorage.getItem('profileData');
    console.log('로컬 스토리지에서 profileData 가져옴', profileData);
    if (!profileData) return null;
    try {
        const parsed = JSON.parse(profileData);
        if (Array.isArray(parsed) && parsed.length >= 1) {
            console.log('마지막 profileData 가져옴', parsed[parsed.length - 1]);
            return parsed[parsed.length - 1];

        }
        return parsed;
    } catch {
        return null;
    }
};
