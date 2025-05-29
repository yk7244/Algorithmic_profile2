import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: '이미지 URL이 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('📥 이미지 다운로드 요청:', imageUrl);

    // Pinterest 이미지 다운로드
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.pinterest.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error('❌ 이미지 다운로드 실패:', response.status, response.statusText);
      return NextResponse.json(
        { error: `이미지 다운로드 실패: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    console.log('✅ 이미지 다운로드 성공:', {
      size: buffer.byteLength,
      contentType: contentType
    });

    // 이미지 데이터를 응답으로 반환
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('❌ 이미지 다운로드 API 오류:', error);
    return NextResponse.json(
      { error: '이미지 다운로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 