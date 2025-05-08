'use client';

import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();

  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'http://localhost:3000/my_profile', // Vercel 배포 시 주소 바꿔야 함
      },
    });

    if (error) {
      console.error(`OAuth login error: ${error.message}`);
      // 에러 메시지를 사용자에게 띄우고 싶다면 상태로 관리 가능
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
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => handleOAuthLogin('github')}
          >
            <Github className="mr-2 h-5 w-5" />
            GitHub로 계속하기
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => handleOAuthLogin('google')}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
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
