export const getProfileData = () => {
    const profileData = localStorage.getItem('profileData');
    return profileData ? JSON.parse(profileData) : null;
};

// profileData가 배열일 경우 마지막(가장 최신) 값을 반환
export const getLatestProfileData = () => {
    const profileData = localStorage.getItem('profileData');
    if (!profileData) return null;
    try {
        const parsed = JSON.parse(profileData);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed[parsed.length - 1];
        }
        return parsed;
    } catch {
        return null;
    }
};