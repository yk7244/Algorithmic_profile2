import { ProfileData, ImageData } from '@/app/types/profile';

interface DummyUserData {
profile: ProfileData;
images: ImageData[];
}

const addDefaultImageFields = (image: any): ImageData => {
    const defaults = {
        desired_self_profile: null,
        metadata: {},
        rotate: 0,
        width: 300,
        height: 200,
        cluster: 'default',
        color: 'default',
        // 'src'는 이미 image 객체에 있다고 가정
        // 'alt'는 이미 image 객체에 있다고 가정
        // ... MoodboardImageData가 요구하는 다른 모든 필수 필드들
    };
    return { ...defaults, ...image };
}

export const dummyUsers: Record<string, DummyUserData> = {
'user1': {
    profile: {
    id: 'user1',
    nickname: '여행가 감자',
    description: '아름다운 풍경을 찾아 떠나는 것을 좋아합니다. 저의 여정을 함께해요!',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    },
    images: [
        addDefaultImageFields({
            id: 'dummy1-1',
            user_id: 'user1',
            src: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?q=80&w=1974&auto=format&fit=crop',
            alt: 'A beautiful landscape with a river and mountains',
            main_keyword: '풍경',
            sub_keyword: '자연',
            mood_keyword: '#평화로운 #고요한',
            description: '산과 강이 어우러진 멋진 풍경 이미지입니다.',
            position: { x: 50, y: 100 },
            left: '50px',
            top: '100px',
            frameStyle: 'healing',
            sizeWeight: 0.03,
            category: "여행",
            desired_self: false,
            keywords: ["산", "강", "하늘", "자연"],
            relatedVideos: [{ title: "아름다운 스위스 풍경", embedId: "f3I0_z_b-F4" }],
        }),
        addDefaultImageFields({
            id: 'dummy1-2',
            user_id: 'user1',
            src: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?q=80&w=2070&auto=format&fit=crop',
            alt: 'A serene lake with a wooden dock',
            main_keyword: '호수',
            sub_keyword: '물',
            mood_keyword: '#차분한 #명상적인',
            description: '고요한 호숫가의 나무 데크입니다.',
            position: { x: 350, y: 250 },
            left: '350px',
            top: '250px',
            frameStyle: 'love',
            sizeWeight: 0.05,
            category: "휴식",
            desired_self: false,
            keywords: ["호수", "데크", "새벽", "안개"],
            relatedVideos: [{ title: "고요한 호수 소리", embedId: "m2-2B_2bL2E" }],
        }),
        addDefaultImageFields({
            id: 'dummy1-3',
            user_id: 'user1',
            src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2071&auto=format&fit=crop',
            alt: 'A dense forest with sunlight filtering through trees',
            main_keyword: '숲',
            sub_keyword: '나무',
            mood_keyword: '#신비로운 #생명력',
            description: '햇살이 스며드는 울창한 숲의 모습입니다.',
            position: { x: 150, y: 400 },
            left: '150px',
            top: '400px',
            frameStyle: 'normal',
            sizeWeight: 0.04,
            category: "자연",
            desired_self: false,
            keywords: ["숲", "나무", "햇살", "신비"],
            relatedVideos: [{ title: "숲 속의 새소리", embedId: "xNN7iTA57jM" }],
        }),
        addDefaultImageFields({
            id: 'dummy1-4',
            user_id: 'user1',
            src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074&auto=format&fit=crop',
            alt: 'A night sky filled with stars over a mountain',
            main_keyword: '별',
            sub_keyword: '밤하늘',
            mood_keyword: '#로맨틱한 #감동적인',
            description: '산 위로 펼쳐진 별이 가득한 밤하늘입니다.',
            position: { x: 500, y: 150 },
            left: '500px',
            top: '150px',
            frameStyle: 'people',
            sizeWeight: 0.045,
            category: "천체",
            desired_self: false,
            keywords: ["별", "밤하늘", "은하수", "산"],
            relatedVideos: [{ title: "밤하늘 타임랩스", embedId: "drGj8_tnq3A" }],
        }),
        addDefaultImageFields({
            id: 'dummy1-5',
            user_id: 'user1',
            src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop',
            alt: 'A beautiful sunset over the ocean with waves',
            main_keyword: '바다',
            sub_keyword: '일몰',
            mood_keyword: '#따뜻한 #평온한',
            description: '파도가 치는 바다 위로 지는 황금빛 일몰입니다.',
            position: { x: 300, y: 500 },
            left: '300px',
            top: '500px',
            frameStyle: 'pill',
            sizeWeight: 0.035,
            category: "바다",
            desired_self: false,
            keywords: ["바다", "일몰", "파도", "황금빛"],
            relatedVideos: [{ title: "바다 파도 소리", embedId: "V1bFr2SWP1I" }],
        })
    ],
    
},
'user2': {
    profile: {
    id: 'user2',
    nickname: '고양이 집사',
    description: '귀여운 고양이들과 함께하는 일상을 공유합니다.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    },
    images: [
        addDefaultImageFields({
            id: 'dummy2-1',
            user_id: 'user2',
            src: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=2043&auto=format&fit=crop',
            alt: 'A cute cat looking at the camera',
            main_keyword: '고양이',
            sub_keyword: '동물',
            mood_keyword: '#귀여운 #사랑스러운',
            description: '카메라를 응시하는 귀여운 고양이',
            position: { x: 100, y: 150 },
            left: '100px',
            top: '150px',
            frameStyle: 'star',
            sizeWeight: 0.05,
            category: "반려동물",
            desired_self: false,
            keywords: ["고양이", "집사", "반려묘", "귀여움"],
            relatedVideos: [{ title: "웃긴 고양이 영상", embedId: "hY7m5jjJ9e4" }],
        })
    ],
},
}; 