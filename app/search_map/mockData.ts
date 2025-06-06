//user의 ProfileData를 유사도 검사후 이렇게 변형 시켜야할것 같음 -> 프론트 쪽에서 

export interface MapPoint {
    id: number;
    x: number;
    y: number;
    nickname: string;
    isMe?: boolean;
    profileImage: string;
}

// 고정된 포인트들 (랜덤하지 않음)
export const mapPoints: MapPoint[] = [
  // 나 (가운데)
{
    id: 0,
    x: 50,
    y: 50,
    nickname: '나',
    isMe: true,
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
},
// 다른 유저들
{
    id: 1,
    x: 30,
    y: 25,
    nickname: '여행가 감자',
    profileImage: 'https://images.unsplash.com/photo-1494790108755-2616c39e1f76?w=150&h=150&fit=crop&crop=face'
},
{
    id: 2,
    x: 25,
    y: 60,
    nickname: '고양이 집사',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
},
{
    id: 3,
    x: 70,
    y: 30,
    nickname: '커피 러버',
    profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
},
{
    id: 4,
    x: 75,
    y: 70,
    nickname: '책벌레',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
},
{
    id: 5,
    x: 50,
    y: 80,
    nickname: '운동광',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face'
}
]; 