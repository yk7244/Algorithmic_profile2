import { UserData, ImageData } from '@/app/types/profile';
import { ProfileData } from '@/app/types/profile';



// UserData 테이블
export const users: UserData[] = [
    {
        id: 'user1',
        email: 'user1@example.com',
        background_color: '#B9DEFF',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'user2',
        email: 'user2@example.com',
        background_color: '#f0f0f0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'user3',
        email: 'user3@example.com',
        background_color: '#f0f0f0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'user4',
        email: 'user4@example.com',
        background_color: '#f0f0f0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'user5',
        email: 'user5@example.com',
        background_color: '#f0f0f0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'user6',
        email: 'user6@example.com',
        background_color: '#f0f0f0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'user7',
        email: 'user7@example.com',
        background_color: '#f0f0f0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'user8',
        email: 'user8@example.com',
        background_color: '#f0f0f0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'user9',
        email: 'user9@example.com',
        background_color: '#f0f0f0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'user10',
        email: 'user10@example.com',
        background_color: '#f0f0f0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

// ImageData 테이블
export const images: ImageData[] = [
  // user1 (ImageData 타입에 완벽히 맞춤)
    {
        id: "1",
        user_id: "user1",
        main_keyword: "유머의 향연",
        keywords: [
        "유머 (9회)", "코미디 (4회)", "피식대학 (5회)", "쇼츠 (4회)", "짧은영상 (4회)",
        "웃긴영상 (1회)", "웃음 (1회)", "개그팬 (1회)", "웃긴 순간 (1회)", "웃음챌린지 (1회)",
        "재미 (2회)", "재미있는"
        ],
        mood_keyword: "유쾌함, 긍정, 즐거움, 공감",
        description: "당신은 유머와 즐거움에 대한 깊은 애정을 가지고 있는 흐름이 보여요. 경쾌한 웃음과 기분 좋은 순간에 시선이 오래 머무는 성향을 가지고 있는 것 같아요. 짧고 강렬한 재미를 추구하며, 웃음의 소중함을 중요하게 여기는 모습이에요. 시청하신 영상들을 살펴보면서 당신의 긍정적인 에너지와 유머에 대한 갈증이 느껴졌어요.",
        category: "코미디",
        sizeWeight: 0.035,
        src: "https://img.youtube.com/vi/OG-BS05HWZw/maxresdefault.jpg",
        relatedVideos: [
        { title: "Music & memes – the perfect combo! 🎶 🤣#funnysituations #skill #agent007", embedId: "OG-BS05HWZw"     },
        { title: "😂🤣🤣🤣#shorts #ytshorts #trending #fypシ゚viral #popular #kdrama #funny #edit #foryou", embedId: "h9Agww4eA6Y" },
        { title: "Funny #Tatcha#funny#viralvideo#froyou", embedId: "h9Agww4eA6Y" },
        { title: "Gisele Bündchen Turns Jimmy Fallon Into a Supermodel 😂💪", embedId: "SKMxLj0UxaU" },
        { title: "유머 밈 모음집 16탄 #유머 #웃긴짤 #개그", embedId: "C5bdbPuUlLU" },
        { title: "Music & memes – the perfect combo! 🎶🤣#cutie #relations #love", embedId: "cHPAVkuOLUc" },
        { title: "그냥 우리가 집에서 부르는 골든이잖아요ㅋㅋㅋ#shorts #타블로 #golden #kpopdemonhunters #케이팝데몬헌터스", embedId: "OG-BS05HWZw" },
        { title: "Broke character", embedId: "uBDnzFkQsws" },
        { title: "'할래 말래' 탄생 비하인드 스토리", embedId: "ORPU5psMZgo" },
        { title: "다작 배우의 미친(Positive) 스케줄", embedId: "zuz2fJpnHcQ" },
        { title: "촬영장을 눈물바다로 만들어버린 배우", embedId: "euuKKJB-Ev4" },
        { title: "배우가 연기에 과몰입하면 생기는 일", embedId: "b5XT20HMeqM" },
        { title: "민수롭다에 찾아온 감사한 손님...❤️", embedId: "6wovvilFXrM" },
        { title: "뱌뱌뱌 엣츄는 인정이지", embedId: "Xp4gCeZcIRs" },
        { title: "0.1초 만에 바뀐 표정과 눈빛 #shorts", embedId: "nBpuQfda3UM" },
        { title: "뉴진스가 돌아왔습니다! #shorts", embedId: "R5z0H7yu6gQ" },
        { title: "5초만 늦었으면 큰일날뻔 했습니다", embedId: "PkuxcHRua50" },
        { title: "erratic #영어단어 #shorts", embedId: "HMUuXlCgbbU" },
        { title: "뭘 해도 안되는 날", embedId: "tNwzYW4lWD4" },
        { title: "올데프 멤버별 베일리 케이크 반응", embedId: "xp4wG0Obx7Q" }
        ],
        desired_self: false,
        desired_self_profile: null,
        metadata: {},
        rotate: 0,
        width: 800,
        height: 800,
        left: "430.2830667824887px",
        top: "100px",
        position: { x: 430.2830667824887, y: 100 },
        frameStyle: "normal",
        created_at: "2025-07-24T02:44:01.939Z",
        similarity: 0.7,
    },
    {
        id: "2",
        user_id: "user1",
        main_keyword: "K팝 열광자",
        keywords: [
            "팬덤 (3회)",   
            "K-팝 (1회)",
            "인기 아이돌 (1회)",
            "블랙핑크 (1회)",
            "세븐틴 (1회)",
            "프로미스나인 (1회)",
            "이달의 소녀 (1회)",
            "젊은층 (2회)",
            "2030세대",
        ],
        mood_keyword: "열정, 소속감, 트렌드, 젊음",
        description: "당신은 K팝과 인기 아이돌에 대한 열정이 넘치는 ‘아이돌 열광자’로 보이네요. 특히 젊은 층의 트렌드에 민감하게 반응하며, 아이돌의 매력에 빠져드는 성향을 가지고 있는 것 같아요. 시청하신 영상들을 통해 당신의 팬심과 열정이 느껴졌습니다.",
        category: "팬덤 콘텐츠",
        sizeWeight: 0.02833333333333333,
        src: "https://img.youtube.com/vi/U-8lGGFa6mQ/maxresdefault.jpg",
        relatedVideos: [
            {
                "title": "Music & memes – the perfect combo! 🎶 🤣#funnysituations #skill #agent007",
                "embedId": "OG-BS05HWZw"
              },
              {
                "title": "😂🤣🤣🤣#shorts #ytshorts #trending #fypシ゚viral #popular #kdrama #funny #edit #foryou",
                "embedId": "TcW5qHGsxCU"
              },
              {
                "title": "Funny #Tatcha#funny#viralvideo#froyou",
                "embedId": "h9Agww4eA6Y"
              },
              {
                "title": "\"Gisele Bündchen Turns Jimmy Fallon Into a Supermodel 😂💪\"",
                "embedId": "SKMxLj0UxaU"
              },
              {
                "title": "올데프 우찬 바지 주머니로 들어간 투어스 도훈 명찰",
                "embedId": "iM2QflQBnLA"
              },
              {
                "title": "유머 밈 모음집 16탄 #유머 #웃긴짤 #개그",
                "embedId": "C5bdbPuUlLU"
              },
              {
                "title": "Music & memes – the perfect combo! 🎶🤣#cutie #relations #love",
                "embedId": "cHPAVkuOLUc"
              },
              {
                "title": "Ranking The Worst Gender Reveal Fails😂❤️ #ranking #tiktok #funnymoments #moments #genderreveal",
                "embedId": "IgKbCBuCAKA"
              },
              {
                "title": "He was shocked after doing that😂 #seventeen #carat #the8 #dino #seungkwan #kpop #scoups #wonwoo",
                "embedId": "0xX0ADGY4JA"
              },
              {
                "title": "Try Not To Laugh Challenge Part 4😹🤣😂#ifyoulaughyoulose #dontlaughchallenge#ifyoulaughyourgoingtohell",
                "embedId": "s22PQHOklTA"
              },
              {
                "title": "뭘 해도 안되는 날",
                "embedId": "tNwzYW4lWD4"
              }
      
        ],
        desired_self: false,
        desired_self_profile: null,
        metadata: {},
        rotate: 0,
        width: 800,
        height: 800,
        left: "612.9529594099004px",
        top: "100px",
        position: { x: 612.9529594099004, y: 107.97193774932981 },
        frameStyle: "normal",
        created_at: "2025-07-30T15:18:39.119Z",
        similarity: 0.7,
    },
    {
        id: 'dummy2-2',
        user_id: 'user1',
        main_keyword: '호수',
        keywords: ['호수', '데크', '새벽', '안개'],
        mood_keyword: '#차분한 #명상적인',
        description: '고요한 호숫가의 나무 데크입니다.',
        category: '코미디',
        sizeWeight: 0.05,
        src: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?q=80&w=2070&auto=format&fit=crop',
        relatedVideos: [
        { title: '고요한 호수 소리', embedId: 'm2-2B_2bL2E' }
        ],
        desired_self: false,
        desired_self_profile: null,
        metadata: {},
        rotate: 0,
        width: 300,
        height: 200,
        left: '350px',
        top: '250px',
        position: { x: 350, y: 250 },
        frameStyle: 'love',
        created_at: new Date().toISOString(),
        similarity: 0.7,
    },
];

// ImageData 테이블
export const images2: ImageData[] = [    
// user1 (ImageData 타입에 완벽히 맞춤)
    {
        id: 'dummy2-1', 
        user_id: 'user2',
        main_keyword: '풍경',
        keywords: ['산', '강', '하늘', '자연'],
        mood_keyword: '#평화로운 #고요한',
        description: '산과 강이 어우러진 멋진 풍경 이미지입니다.',
        category: '여행',
        sizeWeight: 0.03,
        src: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?q=80&w=1974&auto=format&fit=crop',
        relatedVideos: [
        { title: '아름다운 스위스 풍경', embedId: 'f3I0_z_b-F4' }
        ],
        desired_self: false,
        desired_self_profile: null,
        metadata: {},
        rotate: 0,
        width: 300,
        height: 200,
        left: '50px',
        top: '100px',
        position: { x: 50, y: 100 },
        frameStyle: 'healing',
        created_at: new Date().toISOString(),
        similarity: 0.7,
    },
    {
        id: 'dummy2-2',
        user_id: 'user2',
        main_keyword: '호수',
        keywords: ['호수', '데크', '새벽', '안개'],
        mood_keyword: '#차분한 #명상적인',
        description: '고요한 호숫가의 나무 데크입니다.',
        category: '휴식',
        sizeWeight: 0.05,
        src: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?q=80&w=2070&auto=format&fit=crop',
        relatedVideos: [
        { title: '고요한 호수 소리', embedId: 'm2-2B_2bL2E' }
        ],
        desired_self: false,
        desired_self_profile: null,
        metadata: {},
        rotate: 0,
        width: 300,
        height: 200,
        left: '350px',
        top: '250px',
        position: { x: 350, y: 250 },
        frameStyle: 'love',
    created_at: new Date().toISOString(),
    similarity: 0.7,
    },
];

export const images3: ImageData[] = [    
// user1 (ImageData 타입에 완벽히 맞춤)
    {
        id: 'dummy3-1', 
        user_id: 'user3',
        main_keyword: '풍경',
        keywords: ['산', '강', '하늘', '자연'],
        mood_keyword: '#평화로운 #고요한',
        description: '산과 강이 어우러진 멋진 풍경 이미지입니다.',
        category: '여행',
        sizeWeight: 0.03,
        src: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?q=80&w=1974&auto=format&fit=crop',
        relatedVideos: [
        { title: '아름다운 스위스 풍경', embedId: 'f3I0_z_b-F4' }
        ],
        desired_self: false,
        desired_self_profile: null,
        metadata: {},
        rotate: 0,
        width: 300,
        height: 200,
        left: '50px',
        top: '100px',
        position: { x: 50, y: 100 },
        frameStyle: 'healing',
        created_at: new Date().toISOString(),
        similarity: 0.7,
    },
    {
        id: 'dummy3-2',
        user_id: 'user3',
        main_keyword: '호수',
        keywords: ['호수', '데크', '새벽', '안개'],
        mood_keyword: '#차분한 #명상적인',
        description: '고요한 호숫가의 나무 데크입니다.',
        category: '휴식',
        sizeWeight: 0.05,
        src: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?q=80&w=2070&auto=format&fit=crop',
        relatedVideos: [
        { title: '고요한 호수 소리', embedId: 'm2-2B_2bL2E' }
        ],
        desired_self: false,
        desired_self_profile: null,
        metadata: {},
        rotate: 0,
        width: 300,
        height: 200,
        left: '350px',
        top: '250px',
        position: { x: 350, y: 250 },
        frameStyle: 'love',
        created_at: new Date().toISOString(),
        similarity: 0.7,
    },
];

export const images4: ImageData[] = [    
// user1 (ImageData 타입에 완벽히 맞춤)
    {
        id: 'dummy2-1', 
        user_id: 'user2',
        main_keyword: '유머의 향연',
        keywords: ['산', '강', '하늘', '자연'],
        mood_keyword: '#평화로운 #고요한',
        description: '산과 강이 어우러진 멋진 풍경 이미지입니다.',
        category: '여행',
        sizeWeight: 0.03,
            src: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?q=80&w=1974&auto=format&fit=crop',
        relatedVideos: [
        { title: '아름다운 스위스 풍경', embedId: 'f3I0_z_b-F4' }
        ],
        desired_self: false,
        desired_self_profile: null,
        metadata: {},
        rotate: 0,
        width: 300,
        height: 200,
        left: '50px',
        top: '100px',
        position: { x: 50, y: 100 },
        frameStyle: 'healing',
        created_at: new Date().toISOString(),
        similarity: 0.7,
    },
    {
        id: 'dummy2-2',
        user_id: 'user2',
        main_keyword: '호수',
        keywords: ['호수', '데크', '새벽', '안개'],
        mood_keyword: '#차분한 #명상적인',
        description: '고요한 호숫가의 나무 데크입니다.',
        category: '휴식',
        sizeWeight: 0.05,
        src: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?q=80&w=2070&auto=format&fit=crop',
        relatedVideos: [
        { title: '고요한 호수 소리', embedId: 'm2-2B_2bL2E' }
        ],
        desired_self: false,
        desired_self_profile: null,
        metadata: {},
        rotate: 0,
        width: 300,
        height: 200,
        left: '350px',
        top: '250px',
        position: { x: 350, y: 250 },
        frameStyle: 'love',
        created_at: new Date().toISOString(),
        similarity: 0.7,
    },
];

export const images5: ImageData[] = [    
    // user1 (ImageData 타입에 완벽히 맞춤)
        {
            id: 'dummy5-1', 
            user_id: 'user5',
            main_keyword: '풍경',
            keywords: ['산', '강', '하늘', '자연'],
            mood_keyword: '#평화로운 #고요한',
            description: '산과 강이 어우러진 멋진 풍경 이미지입니다.',
            category: '여행',
            sizeWeight: 0.03,
            src: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?q=80&w=1974&auto=format&fit=crop',
            relatedVideos: [
            { title: '아름다운 스위스 풍경', embedId: 'f3I0_z_b-F4' }
            ],
            desired_self: false,
            desired_self_profile: null,
            metadata: {},
            rotate: 0,
            width: 300,
            height: 200,
            left: '50px',
            top: '100px',
            position: { x: 50, y: 100 },
            frameStyle: 'healing',
            created_at: new Date().toISOString(),
            similarity: 0.7,
        },
        {
            id: 'dummy2-2',
            user_id: 'user2',
            main_keyword: '호수',
            keywords: ['호수', '데크', '새벽', '안개'],
            mood_keyword: '#차분한 #명상적인',
            description: '고요한 호숫가의 나무 데크입니다.',
            category: '휴식',
            sizeWeight: 0.05,
            src: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?q=80&w=2070&auto=format&fit=crop',
            relatedVideos: [
            { title: '고요한 호수 소리', embedId: 'm2-2B_2bL2E' }
            ],
            desired_self: false,
            desired_self_profile: null,
            metadata: {},
            rotate: 0,
            width: 300,
            height: 200,
            left: '350px',
            top: '250px',
            position: { x: 350, y: 250 },
            frameStyle: 'love',
            created_at: new Date().toISOString(),
            similarity: 0.7,
        },
];

export const images6: ImageData[] = [
    // user1 (ImageData 타입에 완벽히 맞춤)
    {
        id: 'dummy6-1',
        user_id: 'user6',
        main_keyword: '풍경',
        keywords: ['산', '강', '하늘', '자연'],
        mood_keyword: '#평화로운 #고요한',
        description: '산과 강이 어우러진 멋진 풍경 이미지입니다.',
        category: '여행',
        sizeWeight: 0.03,
        src: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?q=80&w=1974&auto=format&fit=crop',
        relatedVideos: [
        { title: '아름다운 스위스 풍경', embedId: 'f3I0_z_b-F4' }
        ],
        desired_self: false,
        desired_self_profile: null,
        metadata: {},
        rotate: 0,
        width: 300,
        height: 200,
        left: '50px',
        top: '100px',
        position: { x: 50, y: 100 },
        frameStyle: 'healing',
        created_at: new Date().toISOString(),
        similarity: 0.7,
    },
    {
        id: 'dummy6-2',
        user_id: 'user6',
        main_keyword: '호수',
        keywords: ['호수', '데크', '새벽', '안개'],
        mood_keyword: '#차분한 #명상적인',
        description: '고요한 호숫가의 나무 데크입니다.',
        category: '휴식',
        sizeWeight: 0.05,
        src: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?q=80&w=2070&auto=format&fit=crop',
        relatedVideos: [
        { title: '고요한 호수 소리', embedId: 'm2-2B_2bL2E' }
        ],
        desired_self: false,
        desired_self_profile: null,
        metadata: {},
        rotate: 0,
        width: 300,
        height: 200,
        left: '350px',
        top: '250px',
        position: { x: 350, y: 250 },
        frameStyle: 'love',
        created_at: new Date().toISOString(),
        similarity: 0.7,
    },
];

  // ImageData 테이블
export const images7: ImageData[] = [    
  // user1 (ImageData 타입에 완벽히 맞춤)
    {
        id: 'dummy7-1', 
        user_id: 'user7',
        main_keyword: '풍경',
        keywords: ['산', '강', '하늘', '자연'],
        mood_keyword: '#평화로운 #고요한',
        description: '산과 강이 어우러진 멋진 풍경 이미지입니다.',
        category: '여행',
        sizeWeight: 0.03,
        src: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?q=80&w=1974&auto=format&fit=crop',
        relatedVideos: [
        { title: '아름다운 스위스 풍경', embedId: 'f3I0_z_b-F4' }
        ],
        desired_self: false,
        desired_self_profile: null,
        metadata: {},
        rotate: 0,
        width: 300,
        height: 200,
        left: '50px',
        top: '100px',
        position: { x: 50, y: 100 },
        frameStyle: 'healing',
        created_at: new Date().toISOString(),
        similarity: 0.7,
    },
    {
        id: 'dummy7-2',
        user_id: 'user7',
        main_keyword: '호수',
        keywords: ['호수', '데크', '새벽', '안개'],
        mood_keyword: '#차분한 #명상적인',
        description: '고요한 호숫가의 나무 데크입니다.',
        category: '휴식',
        sizeWeight: 0.05,
        src: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?q=80&w=2070&auto=format&fit=crop',
        relatedVideos: [
        { title: '고요한 호수 소리', embedId: 'm2-2B_2bL2E' }
        ],
        desired_self: false,
        desired_self_profile: null,
        metadata: {},
        rotate: 0,
        width: 300,
        height: 200,
        left: '350px',
        top: '250px',
        position: { x: 350, y: 250 },
        frameStyle: 'love',
        created_at: new Date().toISOString(),
        similarity: 0.7,
    },
];
  
export const images8: ImageData[] = [    
  // user1 (ImageData 타입에 완벽히 맞춤)
    {
        id: 'dummy8-1', 
        user_id: 'user8',
        main_keyword: '풍경',
        keywords: ['산', '강', '하늘', '자연'],
        mood_keyword: '#평화로운 #고요한',
        description: '산과 강이 어우러진 멋진 풍경 이미지입니다.',
        category: '여행',
        sizeWeight: 0.03,
        src: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?q=80&w=1974&auto=format&fit=crop',
        relatedVideos: [
        { title: '아름다운 스위스 풍경', embedId: 'f3I0_z_b-F4' }
        ],
        desired_self: false,
        desired_self_profile: null,
        metadata: {},
        rotate: 0,
        width: 300,
        height: 200,
        left: '50px',
        top: '100px',
        position: { x: 50, y: 100 },
        frameStyle: 'healing',
        created_at: new Date().toISOString(),
        similarity: 0.7,
    },
    {
        id: 'dummy8-2',
        user_id: 'user8',
        main_keyword: '호수',
        keywords: ['호수', '데크', '새벽', '안개'],
        mood_keyword: '#차분한 #명상적인',
        description: '고요한 호숫가의 나무 데크입니다.',
        category: '휴식',
            sizeWeight: 0.05,
        src: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?q=80&w=2070&auto=format&fit=crop',
        relatedVideos: [
        { title: '고요한 호수 소리', embedId: 'm2-2B_2bL2E' }
        ],
            desired_self: false,
        desired_self_profile: null,
        metadata: {},
        rotate: 0,
        width: 300,
        height: 200,
        left: '350px',
        top: '250px',
        position: { x: 350, y: 250 },
        frameStyle: 'love',
        created_at: new Date().toISOString(),
        similarity: 0.7,
    },
];
  
export const images9: ImageData[] = [    
  // user1 (ImageData 타입에 완벽히 맞춤)
    {
        id: 'dummy9-1', 
        user_id: 'user9',
        main_keyword: '풍경',
        keywords: ['산', '강', '하늘', '자연'],
        mood_keyword: '#평화로운 #고요한',
        description: '산과 강이 어우러진 멋진 풍경 이미지입니다.',
        category: '여행',
        sizeWeight: 0.03,
        src: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?q=80&w=1974&auto=format&fit=crop',
        relatedVideos: [
        { title: '아름다운 스위스 풍경', embedId: 'f3I0_z_b-F4' }
        ],
            desired_self: false,
        desired_self_profile: null,
        metadata: {},
        rotate: 0,
        width: 300,
        height: 200,
        left: '50px',
        top: '100px',
        position: { x: 50, y: 100 },
        frameStyle: 'healing',
        created_at: new Date().toISOString(),
        similarity: 0.7,
    },
    {
        id: 'dummy9-2',
        user_id: 'user9',
        main_keyword: '호수',
        keywords: ['호수', '데크', '새벽', '안개'],
        mood_keyword: '#차분한 #명상적인',
        description: '고요한 호숫가의 나무 데크입니다.',
        category: '휴식',
        sizeWeight: 0.05,
        src: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?q=80&w=2070&auto=format&fit=crop',
        relatedVideos: [
        { title: '고요한 호수 소리', embedId: 'm2-2B_2bL2E' }
        ],
            desired_self: false,
        desired_self_profile: null,
        metadata: {},
        rotate: 0,
        width: 300,
        height: 200,
        left: '350px',
        top: '250px',
        position: { x: 350, y: 250 },
        frameStyle: 'love',
        created_at: new Date().toISOString(),
        similarity: 0.7,
    },
];
  
export const images10: ImageData[] = [    
      // user1 (ImageData 타입에 완벽히 맞춤)
    {
    id: 'dummy10-1', 
    user_id: 'user10',
        main_keyword: '풍경',
        keywords: ['산', '강', '하늘', '자연'],
        mood_keyword: '#평화로운 #고요한',
        description: '산과 강이 어우러진 멋진 풍경 이미지입니다.',
        category: '여행',
        sizeWeight: 0.03,
        src: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?q=80&w=1974&auto=format&fit=crop',
        relatedVideos: [
        { title: '아름다운 스위스 풍경', embedId: 'f3I0_z_b-F4' }
        ],
            desired_self: false,
        desired_self_profile: null,
        metadata: {},
        rotate: 0,
        width: 300,
        height: 200,
        left: '50px',
        top: '100px',
        position: { x: 50, y: 100 },
        frameStyle: 'healing',
        created_at: new Date().toISOString(),
        similarity: 0.7,
    },
    {
    id: 'dummy10-2',
        user_id: 'user10',
        main_keyword: '호수',
        keywords: ['호수', '데크', '새벽', '안개'],
        mood_keyword: '#차분한 #명상적인',
        description: '고요한 호숫가의 나무 데크입니다.',
        category: '휴식',
        sizeWeight: 0.05,
        src: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?q=80&w=2070&auto=format&fit=crop',
        relatedVideos: [
        { title: '고요한 호수 소리', embedId: 'm2-2B_2bL2E' }
        ],
        desired_self: false,
        desired_self_profile: null,
        metadata: {},
        rotate: 0,
        width: 300,
        height: 200,
        left: '350px',
        top: '250px',
        position: { x: 350, y: 250 },
        frameStyle: 'love',
        created_at: new Date().toISOString(),
        similarity: 0.7,
    },
];

export const userImages: Record<string, ImageData[]> = {
  user1: images,
  user2: images2,
  user3: images3,
  user4: images4,
  user5: images5,
  user6: images6,
  user7: images7,
  user8: images8,
  user9: images9,
  user10: images10,
};

// ProfileData 테이블 (닉네임, 설명 등)
export const profiles: ProfileData[] = [
  {
    id: 'user1',
    nickname: '여행가 감자',
    description: '아름다운 풍경을 찾아 떠나는 것을 좋아합니다. 저의 여정을 함께해요!',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user2',
    nickname: '고양이 집사',
    description: '귀여운 고양이들과 함께하는 일상을 공유합니다.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user3',
    nickname: '커피 애호가',
    description: '세상 모든 카페를 탐방하는 커피 마니아입니다.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user4',
    nickname: '영화광',
    description: '최신 영화부터 고전 명작까지 모두 사랑하는 영화 덕후!',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user5',
    nickname: '요리하는 남자',
    description: '맛있는 요리로 행복을 나누는 셰프입니다.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user6',
    nickname: '책벌레',
    description: '책 속에서 세상을 배우는 독서가입니다.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user7',
    nickname: '운동하는 개발자',
    description: '코딩도 운동도 열정적으로!',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user8',
    nickname: '사진작가',
    description: '세상의 아름다움을 사진에 담는 작가입니다.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user9',
    nickname: '음악가',
    description: '음악으로 감정을 표현하는 뮤지션입니다.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user10',
    nickname: '여행 사진가',
    description: '여행하며 만난 순간을 사진으로 남깁니다.',
    created_at: new Date().toISOString(),
},
];