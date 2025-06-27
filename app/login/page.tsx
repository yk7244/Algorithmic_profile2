"use client";


import Image from 'next/image';
import { useLoginHandlers } from "./hooks/useLoginHandlers";

export default function LoginPage() {
  const { isLoading, handleGoogleLogin, handleAppleLogin, handleGithubLogin } = useLoginHandlers();

  

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#181818]">
      <div className="w-full max-w-sm flex flex-col items-center">
        <h1 className="text-3xl font-bold text-white mb-2">로그인 하기</h1>
        <p className="text-gray-400 mb-10 text-sm">소셜 계정으로 가볍게 연결하고 시작해보세요</p>
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