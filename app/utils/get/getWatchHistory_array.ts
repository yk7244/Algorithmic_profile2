import { ClusterHistory, WatchHistory, WatchHistory_array } from "@/app/types/profile";

export function getWatchHistory_array(): WatchHistory_array[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem("watchHistory_array") || "[]");
    } catch {
        return [];
    }
}

export function getWatchHistory_by_clusterHistory_id(clusterHistory: ClusterHistory): WatchHistory[] {
    //console.log('clusterHistory.id', clusterHistory.id);

    const watchHistory_array = getWatchHistory_array();
   // console.log('watchHistory_array', watchHistory_array);

    const watchHistory = watchHistory_array.filter(item => {
        //console.log('item.clusterHistory_id', item.clusterHistory_id);
        //console.log('clusterHistory.id', clusterHistory.id);
        return item.clusterHistory_id === clusterHistory.id;
    });
    //console.log('watchHistory_array', watchHistory);

    return watchHistory.flatMap(item => item.watchHistory);
}