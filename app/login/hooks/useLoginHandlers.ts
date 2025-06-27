import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function useLoginHandlers() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuth();

    const handleLogin = (provider: "google" | "apple" | "github") => {
        setIsLoading(true);
        setTimeout(() => {
        login();
        router.push("/");
        setIsLoading(false);
        }, 1000);
    };

    return {
        isLoading,
        handleGoogleLogin: () => handleLogin("google"),
        handleAppleLogin: () => handleLogin("apple"),
        handleGithubLogin: () => handleLogin("github"),
    };
} 