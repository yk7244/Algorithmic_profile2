export interface ImageData { //Cluster
  id: string;
  user_id?: string; // 유저 아이디

  main_keyword: string;
  keywords: string[]; //sub_keyword
  mood_keyword: string;

  description: string;
  category: string;
  sizeWeight: number; //strength

  relatedVideos: {
    title: string;
    embedId: string;
  }[];
  created_at: string;
  desired_self: boolean;
  src: string; //main_image_url
  metadata: any;

  width: number;
  height: number;
  rotate: number;
  left: string;
  top: string;
  desired_self_profile: any;
} 

/*
Table videos { //캐싱 위한거
  id text [pk]
  title text
  description text
  channel_id text
  published_at timestamp
  thumbnail_url text
  view_count bigint
  like_count bigint
  comment_count bigint
  last_fetched_at timestamp
  channel_name text
  url text
  tags text[]
  keywords text[]
}
  
Table users {
  id uuid [pk]
  email text
  created_at timestamp
}

Table moodboard_profiles {
  user_id uuid [pk, ref: > users.id]
  nickname text
  images jsonb
  positions jsonb
  frame_styles jsonb
  updated_at timestamp
}

*/