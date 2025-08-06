// Database helper functions index
// 모든 데이터베이스 관련 함수들을 한 곳에서 export

// User functions
export {
  getUser,
  createUser,
  updateUser,
  updateUserBackgroundColor,
  toggleUserOpenToConnect,
  updateLastAnalysisTime,
  getPublicUsers,
  searchUsers
} from './users'

// Profile functions
export {
  getActiveProfile,
  getUserProfiles,
  createProfile,
  createActiveProfile,
  updateProfile,
  updateActiveProfile,
  activateProfile,
  getPublicProfiles,
  getPublicUserProfile,
  searchProfiles
} from './profiles'

// Image functions
export {
  getUserImages,
  getClusterImages,
  getActiveUserImages,
  createImage,
  createImages,
  updateImage,
  updateImagePosition,
  updateImageFrameStyle,
  deleteImage,
  deleteAllUserImages,
  getPublicUserImages,
  searchImagesByKeyword,
  getSimilarImages,
  getImageStats
} from './images'

// Database types
export type { Database } from '@/lib/supabase'