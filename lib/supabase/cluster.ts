import supabase from '@/lib/supabase';

export const saveClustersToSupabase = async (userId: string, clusters: any[]) => {
  try {
    for (const cluster of clusters) {
      const { data: clusterData, error: clusterError } = await supabase
        .from('clusters')
        .insert({
          user_id: userId,
          main_keyword: cluster.main_keyword,
          category: cluster.category,
          description: cluster.description,
          mood_keyword: cluster.mood_keyword,
          keyword_list: cluster.keywords?.join(',') || '',
        })
        .select()
        .single();

      if (clusterError) {
        console.error('❌ 클러스터 저장 실패:', clusterError);
        continue;
      }

      const assignments = cluster.related_videos.map((video: any) => ({
        cluster_id: clusterData.id,
        video_id: video.videoId,
        label: video.label ?? null,
        distance: video.distance ?? null,
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

export const fetchClusterHistoryFromSupabase = async (userId: string) => {
  const { data, error } = await supabase
    .from('clusters')
    .select(`
      id,
      user_id,
      main_keyword,
      category,
      description,
      mood_keyword,
      keyword_list,
      created_at,
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

  return data;
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
