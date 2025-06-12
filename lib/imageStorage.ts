import { supabase } from './supabase';

// 외부 이미지 URL을 Supabase Storage에 업로드
export const uploadImageFromUrl = async (imageUrl: string, fileName: string) => {
  try {
    // 외부 이미지 다운로드
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('이미지 다운로드 실패');
    }
    
    const blob = await response.blob();
    
    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('cluster-images')
      .upload(`${Date.now()}-${fileName}`, blob, {
        contentType: blob.type,
        upsert: false
      });

    if (error) {
      throw error;
    }

    // 공개 URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from('cluster-images')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    return imageUrl; // 실패 시 원본 URL 반환
  }
};

// 이미지 삭제
export const deleteImage = async (filePath: string) => {
  try {
    const { error } = await supabase.storage
      .from('cluster-images')
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('이미지 삭제 실패:', error);
    return false;
  }
}; 