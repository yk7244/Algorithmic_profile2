// Database helper functions index (Clean PostgreSQL Version)
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
  getPublicProfiles,
  getPublicUserProfile,
  searchProfiles
} from './profiles'

// Image functions
export {
  getActiveUserImages,
  getUserImages,
  getClusterImages,
  createImage,
  createImages,
  saveActiveUserImages,
  updateImage,
  updateImagePosition,
  updateImageFrameStyle,
  deleteImage,
  deleteAllUserImages,
  getPublicUserImages,
  getAllPublicImages,
  searchImagesByKeyword,
  convertLocalStorageImagesToDB,
  convertDBImagesToLocalStorage
} from './images'

// Cluster History functions
export {
  getClusterHistory,
  getLatestClusterHistory,
  createClusterHistory,
  saveClusterHistory,
  getClusterHistoryById,
  updateClusterHistory,
  deleteClusterHistory,
  convertLocalStorageClustersToDB,
  getPublicClusterHistory
} from './cluster-history'

// Watch History functions
export {
  getWatchHistory,
  createWatchHistory,
  createWatchHistories,
  saveWatchHistory,
  saveWatchHistoryArray,
  getWatchHistoryArrays,
  getLatestWatchHistoryArray,
  deleteWatchHistory,
  deleteAllWatchHistory,
  convertLocalStorageWatchHistoryToDB,
  searchWatchHistoryByKeyword
} from './watch-history'

// Reflection functions
export {
  getReflectionData,
  createReflectionData,
  updateReflectionData,
  setReflection1Completed,
  setReflection2Completed,
  setSearchCompleted,
  setTutorialCompleted,
  saveReflectionAnswers,
  getReflectionAnswers,
  getLatestReflectionAnswers,
  deleteReflectionData,
  convertLocalStorageReflectionToDB,
  convertDBReflectionToLocalStorage
} from './reflections'

// Parse History functions
export {
  getParseHistory,
  createParseHistory,
  createParseHistories,
  saveParseHistory,
  getParseHistoryByVideoId,
  getParseHistoryByChannel,
  searchParseHistoryByKeyword,
  updateParseHistory,
  deleteParseHistory,
  deleteAllParseHistory,
  convertLocalStorageParseHistoryToDB
} from './parse-history'

// Thumbnail Cache functions
export {
  getThumbnailByKeyword,
  getThumbnailByQuery,
  createThumbnailCache,
  createThumbnailCaches,
  saveThumbnail,
  updateThumbnailCache,
  deleteThumbnailCache,
  cleanupOldThumbnails,
  getAllThumbnailCaches,
  getThumbnailsBySource,
  convertLocalStorageThumbnailToDB,
  getThumbnailCacheStats
} from './thumbnail-cache'

// Slider History functions
export {
  getSliderHistory,
  getSliderHistoryByType,
  getLatestSliderHistory,
  createSliderHistory,
  saveSliderHistory,
  saveMoodboardHistory,
  updateSliderHistory,
  deleteSliderHistory,
  deleteAllSliderHistory,
  getSliderHistoryByDateRange,
  getSliderHistoryStats,
  convertLocalStorageSliderHistoryToDB,
  convertDBSliderHistoryToLocalStorage
} from './slider-history'

// Video Cache functions (YouTube API 캐싱)
export {
  getVideoById,
  createVideo,
  updateVideo,
  upsertVideo,
  createVideos,
  getCachedVideoInfo,
  convertYouTubeResponseToVideoData,
  updateVideoKeywords,
  getVideosByChannel,
  searchVideosByKeyword,
  cleanupOldVideoCache,
  getVideoCacheStats,
  getUncachedVideoIds,
  getBulkCachedVideoInfo,
  getVideosByIds
} from './videos'

// Database types
export type { Database } from '@/lib/supabase-clean'

// Supabase client
export { supabase } from '@/lib/supabase-clean'