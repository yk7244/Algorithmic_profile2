import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const { imageUrl, clusterName, userId } = await req.json();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  // 1. 이미지 다운로드
  const response = await fetch(imageUrl);
  if (!response.ok) return NextResponse.json({ error: '이미지 다운로드 실패' }, { status: 500 });
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 2. Supabase Storage에 업로드
  const fileName = `${userId}_${encodeURIComponent(clusterName)}_${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from('profile-images')
    .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 3. public URL 얻기
  const { data: publicUrlData } = supabase.storage
    .from('profile-images')
    .getPublicUrl(fileName);

  return NextResponse.json({ publicUrl: publicUrlData.publicUrl });
} 