import { supabase } from '@/lib/supabase-clean'
import type { Database } from '@/lib/supabase-clean'

type ClusterHistoryRow = Database['public']['Tables']['cluster_history']['Row']
type ClusterHistoryInsert = Database['public']['Tables']['cluster_history']['Insert']
type ClusterHistoryUpdate = Database['public']['Tables']['cluster_history']['Update']

/**
 * 사용자의 클러스터 히스토리 조회
 */
export async function getClusterHistory(userId: string): Promise<ClusterHistoryRow[]> {
  try {
    const { data, error } = await supabase
      .from('cluster_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching cluster history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getClusterHistory:', error)
    return []
  }
}

/**
 * 최신 클러스터 히스토리 조회
 */
export async function getLatestClusterHistory(userId: string): Promise<ClusterHistoryRow | null> {
  try {
    const { data, error } = await supabase
      .from('cluster_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching latest cluster history:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getLatestClusterHistory:', error)
    return null
  }
}

/**
 * 클러스터 히스토리 생성
 */
export async function createClusterHistory(clusterData: ClusterHistoryInsert): Promise<ClusterHistoryRow | null> {
  try {
    const { data, error } = await supabase
      .from('cluster_history')
      .insert(clusterData)
      .select()
      .single()

    if (error) {
      console.error('Error creating cluster history:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createClusterHistory:', error)
    return null
  }
}

/**
 * 클러스터 히스토리 저장 (localStorage 대체)
 */
export async function saveClusterHistory(
  userId: string,
  nickname: string,
  description: string,
  imagesData: any[],
  profileId?: string
): Promise<ClusterHistoryRow | null> {
  try {
    const clusterData: ClusterHistoryInsert = {
      user_id: userId,
      profile_id: profileId || null,
      nickname,
      description,
      images_data: imagesData,
      analysis_data: null
    }

    return await createClusterHistory(clusterData)
  } catch (error) {
    console.error('Error in saveClusterHistory:', error)
    return null
  }
}

/**
 * 특정 클러스터 히스토리 조회
 */
export async function getClusterHistoryById(clusterId: string): Promise<ClusterHistoryRow | null> {
  try {
    const { data, error } = await supabase
      .from('cluster_history')
      .select('*')
      .eq('id', clusterId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching cluster history by id:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getClusterHistoryById:', error)
    return null
  }
}

/**
 * 클러스터 히스토리 업데이트
 */
export async function updateClusterHistory(
  clusterId: string, 
  updates: ClusterHistoryUpdate
): Promise<ClusterHistoryRow | null> {
  try {
    const { data, error } = await supabase
      .from('cluster_history')
      .update(updates)
      .eq('id', clusterId)
      .select()
      .single()

    if (error) {
      console.error('Error updating cluster history:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in updateClusterHistory:', error)
    return null
  }
}

/**
 * 클러스터 히스토리 삭제
 */
export async function deleteClusterHistory(clusterId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('cluster_history')
      .delete()
      .eq('id', clusterId)

    if (error) {
      console.error('Error deleting cluster history:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteClusterHistory:', error)
    return false
  }
}

/**
 * localStorage의 ClusterHistory를 DB 형식으로 변환
 */
export function convertLocalStorageClustersToDB(localClusters: any[]): ClusterHistoryInsert[] {
  return localClusters.map(cluster => ({
    user_id: '', // 호출할 때 설정
    profile_id: cluster.profile_id || null,
    nickname: cluster.nickname || '',
    description: cluster.description || cluster.main_description || '',
    images_data: cluster.images || cluster.images_data || [],
    analysis_data: cluster.analysis_data || null
  }))
}

/**
 * 공개된 클러스터 히스토리 조희 (탐색 기능용)
 */
export async function getPublicClusterHistory(limit: number = 20): Promise<ClusterHistoryRow[]> {
  try {
    const { data, error } = await supabase
      .from('cluster_history')
      .select(`
        *,
        users!inner(open_to_connect)
      `)
      .eq('users.open_to_connect', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching public cluster history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getPublicClusterHistory:', error)
    return []
  }
}