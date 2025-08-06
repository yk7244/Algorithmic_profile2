import { supabase } from '@/lib/supabase-clean'
import type { Database } from '@/lib/supabase-clean'

type ParseHistoryRow = Database['public']['Tables']['parse_history']['Row']
type ParseHistoryInsert = Database['public']['Tables']['parse_history']['Insert']
type ParseHistoryUpdate = Database['public']['Tables']['parse_history']['Update']

/**
 * 사용자의 파싱 히스토리 조회
 */
export async function getParseHistory(userId: string): Promise<ParseHistoryRow[]> {
  try {
    const { data, error } = await supabase
      .from('parse_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching parse history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getParseHistory:', error)
    return []
  }
}

/**
 * 파싱 히스토리 생성
 */
export async function createParseHistory(parseData: ParseHistoryInsert): Promise<ParseHistoryRow | null> {
  try {
    const { data, error } = await supabase
      .from('parse_history')
      .insert(parseData)
      .select()
      .single()

    if (error) {
      console.error('Error creating parse history:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createParseHistory:', error)
    return null
  }
}

/**
 * 여러 파싱 히스토리 일괄 생성
 */
export async function createParseHistories(parseData: ParseHistoryInsert[]): Promise<ParseHistoryRow[]> {
  try {
    const { data, error } = await supabase
      .from('parse_history')
      .insert(parseData)
      .select()

    if (error) {
      console.error('Error creating parse histories:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in createParseHistories:', error)
    return []
  }
}

/**
 * 파싱 히스토리 저장 (localStorage 대체)
 */
export async function saveParseHistory(userId: string, parseHistoryArray: any[]): Promise<boolean> {
  try {
    if (!parseHistoryArray || parseHistoryArray.length === 0) {
      return true
    }

    const parseInserts: ParseHistoryInsert[] = parseHistoryArray.map(item => ({
      user_id: userId,
      channel: item.channel || null,
      date: item.date || null,
      keyword: item.keyword || item.keywords || [],
      tags: item.tags || [],
      title: item.title || null,
      video_id: item.video_id || item.videoId || null
    }))

    const result = await createParseHistories(parseInserts)
    return result.length > 0
  } catch (error) {
    console.error('Error in saveParseHistory:', error)
    return false
  }
}

/**
 * 특정 비디오 ID로 파싱 히스토리 조회
 */
export async function getParseHistoryByVideoId(
  userId: string, 
  videoId: string
): Promise<ParseHistoryRow[]> {
  try {
    const { data, error } = await supabase
      .from('parse_history')
      .select('*')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching parse history by video id:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getParseHistoryByVideoId:', error)
    return []
  }
}

/**
 * 채널별 파싱 히스토리 조회
 */
export async function getParseHistoryByChannel(
  userId: string, 
  channel: string
): Promise<ParseHistoryRow[]> {
  try {
    const { data, error } = await supabase
      .from('parse_history')
      .select('*')
      .eq('user_id', userId)
      .eq('channel', channel)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching parse history by channel:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getParseHistoryByChannel:', error)
    return []
  }
}

/**
 * 키워드로 파싱 히스토리 검색
 */
export async function searchParseHistoryByKeyword(
  userId: string, 
  keyword: string, 
  limit: number = 20
): Promise<ParseHistoryRow[]> {
  try {
    const { data, error } = await supabase
      .from('parse_history')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${keyword}%,keyword.cs.{${keyword}}`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error searching parse history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in searchParseHistoryByKeyword:', error)
    return []
  }
}

/**
 * 파싱 히스토리 업데이트
 */
export async function updateParseHistory(
  parseId: string, 
  updates: ParseHistoryUpdate
): Promise<ParseHistoryRow | null> {
  try {
    const { data, error } = await supabase
      .from('parse_history')
      .update(updates)
      .eq('id', parseId)
      .select()
      .single()

    if (error) {
      console.error('Error updating parse history:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in updateParseHistory:', error)
    return null
  }
}

/**
 * 파싱 히스토리 삭제
 */
export async function deleteParseHistory(parseId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('parse_history')
      .delete()
      .eq('id', parseId)

    if (error) {
      console.error('Error deleting parse history:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteParseHistory:', error)
    return false
  }
}

/**
 * 사용자의 모든 파싱 히스토리 삭제
 */
export async function deleteAllParseHistory(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('parse_history')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting all parse history:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteAllParseHistory:', error)
    return false
  }
}

/**
 * localStorage의 parseHistory를 DB 형식으로 변환
 */
export function convertLocalStorageParseHistoryToDB(localHistory: any[]): ParseHistoryInsert[] {
  return localHistory.map(item => ({
    user_id: '', // 호출할 때 설정
    channel: item.channel || null,
    date: item.date || null,
    keyword: item.keyword || item.keywords || [],
    tags: item.tags || [],
    title: item.title || null,
    video_id: item.video_id || item.videoId || null
  }))
}