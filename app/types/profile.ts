export interface ImageData {
  id: string;
  user_id?: string; // 유저 아이디
  src: string;
  main_keyword: string;
  mood_keyword: string;
  keywords: string[];
  description: string;
  category: string;

  width: number;
  height: number;
  rotate: number;
  left: string;
  top: string;
  sizeWeight: number;
  
  relatedVideos: {
    title: string;
    embedId: string;
  }[];
  created_at: string;
  desired_self: boolean;
  metadata: any;
  desired_self_profile: any;
} 