"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGithubLogin = async () => {
    setIsLoading(true);
    setTimeout(() => {
      login();
      router.push('/');
      setIsLoading(false);
    }, 1000);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setTimeout(() => {
      login();
      router.push('/');
      setIsLoading(false);
    }, 1000);
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    setTimeout(() => {
      login();
      router.push('/');
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#181818]">
      <div className="w-full max-w-sm flex flex-col items-center">
        <h1 className="text-3xl font-bold text-white mb-2">로그인</h1>
        <p className="text-gray-400 mb-10 text-sm">소셜 계정으로 간편하게 시작하세요</p>
        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="flex items-center justify-center w-full h-12 rounded-lg bg-white text-gray-900 font-medium text-base shadow transition hover:bg-gray-100 disabled:opacity-60"
          >
            <Image src="/images/google.png" alt="Google" width={22} height={22} className="mr-2" />
            Google 로 시작하기
          </button>
          <button
            onClick={handleAppleLogin}
            disabled={isLoading}
            className="flex items-center justify-center w-full h-12 rounded-lg bg-black text-white font-medium text-base shadow transition hover:bg-gray-900 disabled:opacity-60"
          >
            <Image src="/images/apple.png" alt="Apple" width={22} height={22} className="mr-2" />
            Apple 로 시작하기
          </button>
          <button
            onClick={handleGithubLogin}
            disabled={isLoading}
            className="flex items-center justify-center w-full h-12 rounded-lg bg-white text-gray-900 font-medium text-base shadow transition hover:bg-gray-100 disabled:opacity-60"
          >
            <Image src="/images/github.png" alt="GitHub" width={22} height={22} className="mr-2" />
            GitHub로 시작하기
          </button>
        </div>
      </div>
    </div>
  );
} 