import React, { useEffect, useState } from "react";
import { WatchHistory } from "@/app/types/profile";

function getWatchHistory(): WatchHistory[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem("watchHistory") || "[]");
    } catch {
        return [];
    }
}

interface AnalysisCardProps {
  history?: any; // history prop은 필요시 사용, 기본은 전체 시청기록
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ history }) => {
    const [watchHistory, setWatchHistory] = useState<WatchHistory[]>([]);

    
    return (
        <>
        </>
    );
};