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
  video_links: string;
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
          video_links: cluster.video_links,
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

      // 비디오 링크를 파싱하여 video_cluster_assignments 테이블에 저장
      const videoIds = cluster.video_links.split(',').map(link => link.trim());
      const assignments = videoIds.map(videoId => ({
        cluster_id: clusterData.id,
        video_id: videoId,
        label: cluster.main_keyword,
        distance: cluster.strength
      }));

      const { error: assignmentError } = await supabase
        .from('video_cluster_assignments')
        .insert(assignments);

      if (assignmentError) {
        console.error('❌ 비디오 클러스터 매핑 저장 실패:', assignmentError);
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
      video_links,
      created_at,
      desired_self,
      main_image_url,
      metadata,
      video_cluster_assignments (
        video_id,
        label,
        distance
      )
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
    video_links: cluster.video_links,
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
    related_videos: cluster.video_cluster_assignments.map((v: any) => ({
      videoId: v.video_id,
      label: v.label,
      distance: v.distance,
    })),
  }));
};
