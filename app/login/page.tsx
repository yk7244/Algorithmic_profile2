"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { signInWithProvider, isLoading } = useAuth();
  const [currentProvider, setCurrentProvider] = useState<string | null>(null);

  const handleProviderLogin = async (provider: 'google' | 'github' | 'apple') => {
    try {
      setCurrentProvider(provider);
      await signInWithProvider(provider);
      toast.success(`${provider} 로그인 중...`);
      // 리다이렉션은 AuthContext에서 처리됨
    } catch (error) {
      console.error(`${provider} login error:`, error);
      toast.error('로그인에 실패했습니다. 다시 시도해주세요.');
      setCurrentProvider(null);
    }
  };

  const isProviderLoading = (provider: string) => {
    return isLoading && currentProvider === provider;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#181818]">
      <div className="w-full max-w-sm flex flex-col items-center">
        <h1 className="text-3xl font-bold text-white mb-2">로그인</h1>
        <p className="text-gray-400 mb-10 text-sm">소셜 계정으로 간편하게 시작하세요</p>
        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={() => handleProviderLogin('google')}
            disabled={isLoading}
            className="flex items-center justify-center w-full h-12 rounded-lg bg-white text-gray-900 font-medium text-base shadow transition hover:bg-gray-100 disabled:opacity-60"
          >
            <Image src="/images/google.png" alt="Google" width={22} height={22} className="mr-2" />
            {isProviderLoading('google') ? '로그인 중...' : 'Google로 시작하기'}
          </button>
          <button
            onClick={() => handleProviderLogin('apple')}
            disabled={isLoading}
            className="flex items-center justify-center w-full h-12 rounded-lg bg-black text-white font-medium text-base shadow transition hover:bg-gray-900 disabled:opacity-60"
          >
            <Image src="/images/apple.png" alt="Apple" width={22} height={22} className="mr-2" />
            {isProviderLoading('apple') ? '로그인 중...' : 'Apple로 시작하기'}
          </button>
          <button
            onClick={() => handleProviderLogin('github')}
            disabled={isLoading}
            className="flex items-center justify-center w-full h-12 rounded-lg bg-gray-900 text-white font-medium text-base shadow transition hover:bg-gray-800 disabled:opacity-60"
          >
            <Github className="w-5 h-5 mr-2" />
            {isProviderLoading('github') ? '로그인 중...' : 'GitHub로 시작하기'}
          </button>
        </div>
      </div>
    </div>
  );
} 