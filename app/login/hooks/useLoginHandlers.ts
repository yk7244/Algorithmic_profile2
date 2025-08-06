import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function useLoginHandlers() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { signInWithOAuth } = useAuth();

    const handleLogin = async (provider: "google" | "github") => {
        if (isLoading) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            await signInWithOAuth(provider);
            // 성공적으로 로그인하면 auth state change 리스너가 자동으로 처리
        } catch (err) {
            console.error(`${provider} login failed:`, err);
            setError(`${provider} 로그인에 실패했습니다. 다시 시도해주세요.`);
        } finally {
            setIsLoading(false);
        }
    };

    // Apple 로그인은 아직 구현하지 않음 (Supabase에서 별도 설정 필요)
    const handleAppleLogin = () => {
        setError("Apple 로그인은 준비 중입니다.");
    };

    return {
        isLoading,
        error,
        handleGoogleLogin: () => handleLogin("google"),
        handleAppleLogin,
        handleGithubLogin: () => handleLogin("github"),
    };
} 