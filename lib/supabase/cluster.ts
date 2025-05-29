import supabase from '@/lib/supabase';

export interface LocalCluster {
  id?: number;
  main_keyword: string;
  sub_keyword: string;
  mood_keyword: string;
  description: string;
  category: string;
  rotation?: string;
  keyword_list: string;
  strength: number;
  related_videos: any[];
  created_at: string;
  desired_self: boolean;
  main_image_url?: string;
  metadata: any;
}

export const saveClustersToSupabase = async (userId: string, clusters: LocalCluster[]) => {
  try {
    for (const cluster of clusters) {
      const { data: clusterData, error: clusterError } = await supabase
        .from('clusters')
        .insert({
          user_id: userId,
          main_keyword: cluster.main_keyword,
          sub_keyword: cluster.sub_keyword,
          category: cluster.category,
          description: cluster.description,
          mood_keyword: cluster.mood_keyword,
          keywords: cluster.keyword_list,
          strength: cluster.strength,
          related_videos: cluster.related_videos,
          desired_self: cluster.desired_self,
          main_image_url: cluster.main_image_url,
          metadata: cluster.metadata
        })
        .select()
        .single();

      if (clusterError) {
        console.error('❌ 클러스터 저장 실패:', clusterError);
        continue;
      }
    }

    console.log('✅ 클러스터 및 비디오 매핑 저장 완료');
  } catch (e) {
    console.error('💥 클러스터 저장 중 오류:', e);
  }
};

export const fetchClusterHistoryFromSupabase = async (userId: string): Promise<LocalCluster[]> => {
  const { data, error } = await supabase
    .from('clusters')
    .select(`
      id,
      user_id,
      main_keyword,
      sub_keyword,
      category,
      description,
      mood_keyword,
      keywords,
      strength,
      related_videos,
      created_at,
      desired_self,
      main_image_url,
      metadata
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ 클러스터 히스토리 불러오기 실패:', error);
    return [];
  }

  return data.map(cluster => ({
    id: cluster.id,
    main_keyword: cluster.main_keyword,
    sub_keyword: cluster.sub_keyword,
    category: cluster.category,
    description: cluster.description,
    mood_keyword: cluster.mood_keyword,
    keyword_list: cluster.keywords,
    strength: cluster.strength,
    related_videos: cluster.related_videos || [],
    created_at: cluster.created_at,
    desired_self: cluster.desired_self,
    main_image_url: cluster.main_image_url,
    metadata: cluster.metadata
  }));
};

export const fetchSingleClusterSetWithVideos = async (clusterRecord: any) => {
  const clusters = Array.isArray(clusterRecord)
    ? clusterRecord
    : [clusterRecord];

  return clusters.map((cluster: any) => ({
    main_keyword: cluster.main_keyword,
    category: cluster.category,
    description: cluster.description,
    mood_keyword: cluster.mood_keyword,
    keywords: cluster.keyword_list
      ? cluster.keyword_list.split(',').filter((k: string) => k.trim() !== '')
      : [],
  }));
};
