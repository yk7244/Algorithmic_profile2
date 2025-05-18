'use client'; // 클라이언트 사이드 인터랙션이 필요하면 사용합니다.

import { Button } from '@/components/ui/button';
import React from 'react';
import { useAuth } from '@/context/AuthContext'; // useAuth Hook import 추가
import Link from 'next/link';

// 페이지 컴포넌트에 전달될 props가 있다면 여기에 타입을 정의할 수 있습니다.
// interface PageProps {
//   // 예: params: { slug: string };
//   // 예: searchParams: { [key: string]: string | string[] | undefined };
// }

// 실제 페이지 이름으로 함수 이름을 변경하세요. (예: UpdatePage, SearchMapPage)
export default function MyPage() {
  const { logout } = useAuth(); // AuthContext에서 logout 함수 가져오기
  // 페이지 로직 (상태, 효과, 핸들러 등)을 여기에 추가합니다.

  return (
    <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">마이 페이지</h1> {/* 페이지의 실제 제목으로 변경하세요 */}
        
        {/* 페이지 내용을 여기에 구성합니다. */}
        <p>이곳은 마이 페이지입니다. 로그인된 사용자만 접근 가능해야 합니다.</p>
        
        {/* 예시: 다른 컴포넌트나 UI 요소들을 추가할 수 있습니다. */}
        {/* <SomeOtherComponent /> */}
        <Button variant="ghost" size="sm" className="text-base font-medium hover:text-primary mt-4" onClick={logout}>
            
            <Link href="/" className="flex items-center gap-3">로그아웃</Link>
        </Button>
        
    </div>
  );
} 