'use client';

import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const syncUserProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (!session) return;

      const uid = session.user.id;

      // 시청 기록 존재 여부 확인
      const { data: watchHistory, error: historyError } = await supabase
        .from('WatchHistoryItem')
        .select('id')
        .eq('user_id', uid)
        .limit(1);

      if (!historyError && watchHistory && watchHistory.length > 0) {
        router.push('/my_profile');
      } else {
        alert('시청기록이 없습니다. 먼저 업로드해주세요.');
        router.push('/watch-history');
      }
    };

    syncUserProfile();
  }, [router]);

  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'http://localhost:3000',
      },
    });

    if (error) {
      console.error(`OAuth login error: ${error.message}`);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">시작하기</h1>
          <p className="text-gray-500">소셜 계정으로 간편하게 시작하세요</p>
        </div>
        <div className="space-y-3">
          <Button variant="outline" size="lg" className="w-full" onClick={() => handleOAuthLogin('github')}>
            <Github className="mr-2 h-5 w-5" />
            GitHub로 계속하기
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={() => handleOAuthLogin('google')}>
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.23-1.4 3.6-5.27 3.6-3.17 0-5.76-2.62-5.76-5.82s2.59-5.82 5.76-5.82c1.81 0 3.03.77 3.73 1.43l2.55-2.48C16.13 3.54 14.3 2.7 12.17 2.7 6.98 2.7 2.7 6.98 2.7 12.17s4.28 9.47 9.47 9.47c5.47 0 9.09-3.85 9.09-9.27 0-.62-.07-1.09-.16-1.57z"/>
              <path fill="#34A853" d="M3.88 7.41l2.4 1.76c.65-1.23 1.97-2.7 5.02-2.7 1.45 0 2.77.56 3.8 1.65l2.85-2.77C15.97 3.54 14.3 2.7 12.17 2.7c-3.17 0-5.76 2.62-5.76 5.82 0 1.01.27 1.97.77 2.79z"/>
              <path fill="#FBBC05" d="M12.17 21.64c2.13 0 3.96-.7 5.28-1.91l-2.43-1.99c-.67.47-1.56.8-2.85.8-2.19 0-4.05-1.48-4.72-3.47l-2.41 1.86c1.36 2.7 4.18 4.71 7.13 4.71z"/>
              <path fill="#EA4335" d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.23-1.4 3.6-5.27 3.6-3.17 0-5.76-2.62-5.76-5.82s2.59-5.82 5.76-5.82c1.81 0 3.03.77 3.73 1.43l2.55-2.48C16.13 3.54 14.3 2.7 12.17 2.7 6.98 2.7 2.7 6.98 2.7 12.17s4.28 9.47 9.47 9.47c5.47 0 9.09-3.85 9.09-9.27 0-.62-.07-1.09-.16-1.57z"/>
            </svg>
            Google로 계속하기
          </Button>
        </div>
        <div className="text-center text-sm text-gray-500">
          계속 진행하면 이용약관과 개인정보 처리방침에 동의하게 됩니다.
        </div>
      </div>
    </main>
  );
}
