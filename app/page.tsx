'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        router.replace('/upload'); // 로그인 되어 있으면 업로드 페이지로
      } else {
        router.replace('/login');  // 아니면 로그인 페이지로
      }
    };

    checkSession();
  }, [router]);

  return null;
}
