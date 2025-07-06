import { ClusterHistory } from "@/app/types/profile";

export function getClusterHistory(): ClusterHistory[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem("ClusterHistory");
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

