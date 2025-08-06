/**
 * localStorage 데이터를 Supabase DB로 마이그레이션하는 도구
 * 사용자가 기존 localStorage 데이터를 DB로 이전할 때 사용
 */

import { 
  createActiveProfile, 
  saveActiveUserImages,
  convertLocalStorageImagesToDB 
} from '@/lib/database-clean';
import { supabase } from '@/lib/supabase-clean';

export interface MigrationResult {
  success: boolean;
  message: string;
  details?: {
    profileMigrated: boolean;
    imagesMigrated: boolean;
    imagesCount: number;
  };
}

/**
 * localStorage의 모든 데이터를 DB로 마이그레이션
 */
export async function migrateAllDataToDB(): Promise<MigrationResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        message: '로그인이 필요합니다.'
      };
    }

    let profileMigrated = false;
    let imagesMigrated = false;
    let imagesCount = 0;

    // 1. 프로필 데이터 마이그레이션
    try {
      const profileData = localStorage.getItem('profileData');
      if (profileData) {
        const parsed = JSON.parse(profileData);
        const latestProfile = Array.isArray(parsed) ? parsed[parsed.length - 1] : parsed;
        
        if (latestProfile && latestProfile.nickname) {
          const result = await createActiveProfile({
            user_id: user.id,
            nickname: latestProfile.nickname,
            main_description: latestProfile.description || latestProfile.main_description || '',
            background_color: '#ffffff'
          });
          
          profileMigrated = result !== null;
        }
      }
    } catch (error) {
      console.error('Profile migration error:', error);
    }

    // 2. 이미지 데이터 마이그레이션
    try {
      const profileImages = localStorage.getItem('profileImages');
      if (profileImages) {
        const parsed = JSON.parse(profileImages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const success = await saveActiveUserImages(user.id, parsed);
          imagesMigrated = success;
          imagesCount = parsed.length;
        }
      }
    } catch (error) {
      console.error('Images migration error:', error);
    }

    const totalSuccess = profileMigrated || imagesMigrated;

    return {
      success: totalSuccess,
      message: totalSuccess 
        ? '데이터 마이그레이션이 완료되었습니다!' 
        : '마이그레이션할 데이터가 없거나 오류가 발생했습니다.',
      details: {
        profileMigrated,
        imagesMigrated,
        imagesCount
      }
    };

  } catch (error) {
    console.error('Migration error:', error);
    return {
      success: false,
      message: '마이그레이션 중 오류가 발생했습니다: ' + (error as Error).message
    };
  }
}

/**
 * localStorage에 마이그레이션 가능한 데이터가 있는지 확인
 */
export function checkMigrationData(): {
  hasData: boolean;
  profileData: boolean;
  imageData: boolean;
  profileCount: number;
  imageCount: number;
} {
  let hasData = false;
  let profileData = false;
  let imageData = false;
  let profileCount = 0;
  let imageCount = 0;

  try {
    // 프로필 데이터 확인
    const profiles = localStorage.getItem('profileData');
    if (profiles) {
      const parsed = JSON.parse(profiles);
      profileData = true;
      profileCount = Array.isArray(parsed) ? parsed.length : 1;
      hasData = true;
    }

    // 이미지 데이터 확인
    const images = localStorage.getItem('profileImages');
    if (images) {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed) && parsed.length > 0) {
        imageData = true;
        imageCount = parsed.length;
        hasData = true;
      }
    }
  } catch (error) {
    console.error('Error checking migration data:', error);
  }

  return {
    hasData,
    profileData,
    imageData,
    profileCount,
    imageCount
  };
}

/**
 * 마이그레이션 후 localStorage 정리
 */
export function cleanupLocalStorageData(): void {
  const keysToRemove = [
    'profileData',
    'profileImages',
    'UserData',
    'ClusterHistory',
    'watchHistory',
    'analysisHistory',
    'clusterImages',
    'reflectionData',
    'parseHistory',
    'thumbnailData'
  ];

  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`Removed localStorage key: ${key}`);
    } catch (error) {
      console.error(`Error removing localStorage key ${key}:`, error);
    }
  });
}

/**
 * localStorage 백업 생성
 */
export function createLocalStorageBackup(): string {
  const backup: Record<string, any> = {};
  
  const keysToBackup = [
    'profileData',
    'profileImages', 
    'UserData',
    'ClusterHistory',
    'watchHistory',
    'analysisHistory',
    'clusterImages',
    'reflectionData',
    'parseHistory',
    'thumbnailData'
  ];

  keysToBackup.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        backup[key] = JSON.parse(value);
      }
    } catch (error) {
      console.error(`Error backing up localStorage key ${key}:`, error);
    }
  });

  return JSON.stringify(backup, null, 2);
}

/**
 * localStorage 백업에서 복원
 */
export function restoreFromBackup(backupData: string): boolean {
  try {
    const backup = JSON.parse(backupData);
    
    Object.entries(backup).forEach(([key, value]) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        console.log(`Restored localStorage key: ${key}`);
      } catch (error) {
        console.error(`Error restoring localStorage key ${key}:`, error);
      }
    });

    return true;
  } catch (error) {
    console.error('Error restoring from backup:', error);
    return false;
  }
}