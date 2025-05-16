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

      // 프로필 생성 여부 확인
      const { data: existingProfile, error: fetchError } = await supabase
        .from('ProfileData')
        .select('*')
        .eq('id', uid)
        .single();

      if (!existingProfile && !fetchError) {
        await supabase.from('ProfileData').insert({
          id: uid,
          nickname: session.user.user_metadata?.full_name || '익명',
          description: '',
          avatar_url: session.user.user_metadata?.avatar_url || '',
        });
      }

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
              {/* Google 아이콘 생략 */}
              <path fill="#4285F4" d="..." />
              <path fill="#34A853" d="..." />
              <path fill="#FBBC05" d="..." />
              <path fill="#EA4335" d="..." />
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
