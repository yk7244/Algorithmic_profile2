import { ClusterHistory } from "@/app/types/profile";

export function getClusterHistory(): ClusterHistory[] {
    if (typeof window === "undefined") return [];
    try {
        const clusterHistory = JSON.parse(localStorage.getItem("ClusterHistory") || "[]");
        //console.log('clusterHistory', clusterHistory);
        return clusterHistory;
    } catch {
        return [];
    }
}

