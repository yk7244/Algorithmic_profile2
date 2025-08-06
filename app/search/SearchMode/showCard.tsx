


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageData } from '@/app/types/profile';
import { getUserFullProfileById } from "@/app/utils/get/getUserData";
import { calculateUserSimilarity } from "@/lib/similarity";
import { useAuth } from '@/context/AuthContext';

// 3D 카드 스택 컴포넌트
interface CardStack3DProps {
    cards: ImageData[];
    searchKeyword: string;
}

const CardStack3D: React.FC<CardStack3DProps> = ({ cards, searchKeyword }) => {
    const [centerIdx, setCenterIdx] = useState(0);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [userSimilarities, setUserSimilarities] = useState<{[userId: string]: number}>({});
    const { user } = useAuth();

    // ✅ cards가 undefined이거나 빈 배열인 경우 처리
    const safeCards = cards || [];
    const total = safeCards.length;
    const cardWidth = 340; // w-72
    const gap = 1; // 카드 간격(px)
    const router = useRouter();

    // ✅ 카드가 없는 경우 early return
    if (safeCards.length === 0) {
        return (
            <div className="relative w-full h-[500px] flex items-center justify-center select-none bg-transparent mt-10">
                <div className="text-white text-center">
                    <div className="text-lg mb-2">검색 결과가 없습니다</div>
                    <div className="text-sm text-gray-400">다른 키워드로 검색해보세요</div>
                </div>
            </div>
        );
    }

    // 중복 사용자 ID 제거
    const uniqueUserIds = [...new Set(safeCards.map(card => card.user_id).filter((id): id is string => Boolean(id)))];

    // 카드들의 프로필 정보 로드 (최적화 - 중복 제거 + dependency 개선)
    useEffect(() => {
        const loadProfiles = async () => {
            console.log(`🔍 프로필 로딩 시작: ${uniqueUserIds.length}개 고유 사용자`);
            
            const profilePromises = uniqueUserIds.map(async (userId) => {
                try {
                    const result = await getUserFullProfileById(userId);
                    if (result.profile) {
                        console.log(`✅ 프로필 로드 성공: ${result.profile.nickname} (${userId})`);
                        return result.profile;
                    } else {
                        console.log(`⚠️ 프로필 없음, 기본 프로필 생성: ${userId}`);
                        return {
                            id: userId,
                            user_id: userId,
                            nickname: `사용자${userId.slice(-4)}`,
                            description: '',
                            backgroundColor: '#000000',
                            created_at: new Date().toISOString()
                        };
                    }
                } catch (error) {
                    console.error(`❌ 프로필 로드 실패 (${userId}):`, error);
                    return {
                        id: userId,
                        user_id: userId,
                        nickname: `사용자${userId.slice(-4)}`,
                        description: '',
                        backgroundColor: '#000000',
                        created_at: new Date().toISOString()
                    };
                }
            });
            
            const loadedProfiles = await Promise.all(profilePromises);
            const validProfiles = loadedProfiles.filter(profile => profile !== null && profile !== undefined);
            console.log(`✅ 프로필 로딩 완료: ${validProfiles.length}개`);
            setProfiles(validProfiles);
        };

        if (uniqueUserIds.length > 0) {
            loadProfiles();
        }
    }, [uniqueUserIds.length]); // 고유 사용자 수만 dependency로 설정

    // 사용자간 유사도 계산 (최적화 - 한 번만 실행 + 캐시 활용)
    useEffect(() => {
        const calculateUserSimilarities = async () => {
            if (!user?.id || profiles.length === 0) return;

            try {
                console.log(`🎯 유사도 계산 시작: ${profiles.length}개 사용자 (캐시 활용)`);
                
                // 현재 사용자의 프로필 정보 가져오기 (한 번만)
                const currentUserProfile = await getUserFullProfileById(user.id);
                if (!currentUserProfile.user || !currentUserProfile.profile) {
                    console.log('⚠️ 현재 사용자 프로필을 가져올 수 없음');
                    return;
                }

                const similarities: {[userId: string]: number} = {};

                // 병렬 처리로 유사도 계산 (캐시 덕분에 중복 계산 방지)
                const validProfiles = profiles.filter(profile => profile && profile.user_id && profile.user_id !== user.id);
                
                const similarityPromises = validProfiles.map(async (profile) => {
                    try {
                        const otherUserProfile = await getUserFullProfileById(profile.user_id);
                        if (otherUserProfile.user && otherUserProfile.profile) {
                            const similarity = await calculateUserSimilarity(
                                currentUserProfile,
                                otherUserProfile
                            );
                            return { userId: profile.user_id, similarity, nickname: profile.nickname };
                        }
                    } catch (error) {
                        console.error(`❌ ${profile.user_id}와의 유사도 계산 실패:`, error);
                    }
                    return null;
                });

                const results = await Promise.all(similarityPromises);
                
                results.forEach(result => {
                    if (result) {
                        similarities[result.userId] = result.similarity;
                        console.log(`✅ ${result.nickname}과의 유사도: ${(result.similarity * 100).toFixed(1)}%`);
                    }
                });

                setUserSimilarities(similarities);
                console.log('✅ 사용자간 유사도 계산 완료');
            } catch (error) {
                console.error('❌ 사용자간 유사도 계산 중 오류:', error);
            }
        };

        // 약간의 딜레이를 주어 프로필 로딩이 완료된 후 실행
        const timeoutId = setTimeout(calculateUserSimilarities, 300);
        return () => clearTimeout(timeoutId);
    }, [profiles.length, user?.id]); // profiles 전체가 아닌 length만 의존

    // 중앙 카드 이동 함수 (좌우 화살표 등에서 사용)
    const moveCenter = (dir: number) => {
    setCenterIdx((prev) => {
        let next = prev + dir;
        if (next < 0) next = 0;
        if (next > total - 1) next = total - 1;
        return next;
    });
    };
    const handleCardClick = (card: ImageData, idx: number, isCenter: boolean) => {
        if (!isCenter) {
            setCenterIdx(idx);
        } else if (card.user_id) {
            console.log(`🔗 다른 사용자 무드보드로 이동:`, {
                userId: card.user_id,
                mainKeyword: card.main_keyword,
                similarity: card.similarity ? `${Math.round(card.similarity * 100)}%` : 'N/A'
            });
            router.push(`/others_profile/${card.user_id}?main_keyword=${encodeURIComponent(card.main_keyword || '')}&searchKeyword=${encodeURIComponent(searchKeyword)}&userIds=${encodeURIComponent(uniqueUserIds.join(','))}`);
        } else {
            console.warn('⚠️ 클릭한 카드에 user_id가 없습니다:', card);
        }
    };
    
    
    return (
    <div className="relative w-full h-[500px] flex items-center justify-center select-none bg-transparent mt-10">
        {/* 좌측 화살표 */}
        <button
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 text-white/60 hover:text-white text-3xl"
        onClick={() => moveCenter(-3)}
        disabled={centerIdx === 0}
        style={{ opacity: centerIdx === 0 ? 0.2 : 1 }}
        aria-label="이전"
        >
        &#8592;
        </button>

        {/* 카드들 */}
        {safeCards.map((card, idx) => {
            const offset = idx - centerIdx;
            const isCenter = offset === 0;
            const cardSrc = card.src || '/cards/default_card.png';
            const userId = card.user_id;
            // ✅ userId로 프로필 찾기 (디버깅 로그 추가)
            const profile = profiles.find(p => p && p.user_id === userId);
            
            // 디버깅: 프로필 매칭 상태 로그
            if (!profile && idx === centerIdx) { // 중앙 카드일 때만 로그
                console.log(`⚠️ 프로필 매칭 실패:`, {
                    cardUserId: userId,
                    availableProfiles: profiles.map(p => ({ user_id: p?.user_id, nickname: p?.nickname })),
                    profilesLength: profiles.length
                });
            } else if (profile && idx === centerIdx) {
                console.log(`✅ 프로필 매칭 성공:`, {
                    userId: profile.user_id,
                    nickname: profile.nickname
                });
            }
            return (
                <div
                key={card.id || idx}
                onClick={() => handleCardClick(card, idx, isCenter)}
                className={`absolute top-1/2 left-1/2 transition-all duration-500 cursor-pointer ${isCenter ? 'z-20' : 'z-10'}`}
                style={{
                    transform: `
                    translate(-50%, -50%)
                    translateX(${offset * (cardWidth + gap)}px)
                    scale(${isCenter ? 1.18 : 0.85})
                    `,
                    opacity: isCenter ? 1 : 0.5,
                    filter: isCenter ? 'none' : ' ',
                    boxShadow: 'none',
                    transition: 'all 0.5s cubic-bezier(.4,1,.2,1)',
                }}
                >
                        <div className="w-72 object-cover flex flex-col group">
                            {/* main_keyword는 카드 상단 */}
                            <span className="mb-2 ml-2 font-semibold text-gray-800 text-lg z-10">
                                <span className="text-sm">{profile?.nickname || '이름 없음'}님의</span> <br/>
                                #{card.main_keyword}
                            </span>
                            <div className="w-72 h-72 object-cover flex flex-col items-start relative overflow-hidden">
                                {/* 이미지 */}
                                <img src={cardSrc} alt="" className="w-72 h-full object-cover shadow-lg z-0" />
                                {/* 이미지 내 좌측 상단 70% + 비슷한 키워드예요 */}
                                <div className="absolute top-4 left-4 flex flex-col items-end gap-2 z-20">
                                    <div className="bg-blue-700 backdrop-blur-lg text-white font-bold px-2 py-0.5 rounded-full text-[12px]">
                                        클러스터 유사도 {Math.round((card.similarity || 0) * 100)}%
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-lg text-white font-bold px-2 py-0.5 rounded-full text-[12px]">
                                        사용자 유사도 {Math.round((userSimilarities[userId] || 0) * 100)}%
                                    </div>
                                </div>
                                {/* 중앙 하단 그라데이션 오버레이 */}
                                <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-black/90 to-transparent z-10" />
                                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-black/90 to-transparent z-10" />

                                
                                {/* 중앙 하단 정보 */}
                                {isCenter && (
                                <div className="absolute bottom-0 left-0 w-full flex flex-col items-center z-20 group font-semibold">
                                    {/* 프로필 유사도 
                                    <div className="flex items-center transition-all duration-300 text-xs text-white/70 opacity-80">
                                        <span className="text-blue-200 font-bold drop-shadow">{profile?.nickname || '이름 없음'}님</span> 은 당신과 전체적으로
                                    </div>
                                    <div className="flex items-center mb-2 transition-all duration-300 text-xs text-white/70 opacity-80">
                                        <span className="text-blue-200 font-bold px-2 py-0.5 rounded-full  ">프로필 유도 {similarities[0]*100}%</span>  
                                        <span className="text-white">  유사해요</span>
                                    </div>
                                    */}
                                    <button
                                        className="z-20 bg-white/30 backdrop-blur-sm text-white font-bold px-3 py-2 rounded-full shadow-lg mt-2 text-xs -mb-8 group-hover:mb-3 
                                        transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300
                                        hover:bg-white/80 hover:shadow-lg hover:text-black "
                                    >
                                        알고리즘 자화상 전체 보러가기
                                    </button>
                                </div>
                                )}
                            </div>
                            <div className="mt-2 text-[12px] z-10">
                                <div className="text-white">
                                    {(card?.description || '').slice(0, 60)}{card?.description && card.description.length > 60 ? '...' : ''}
                                </div>
                                <div className=" mt-1 text-sm z-10">
                                    {(card?.keywords || []).slice(0, 4).map((keyword, index) => (
                                        <span key={index} className="text-blue-200 text-[12px] z-10">   
                                            #{keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                
                </div>
            );
        })}
        {/* 우측 화살표 */}
        <button
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 text-white/60 hover:text-white text-3xl"
        onClick={() => moveCenter(3)}
        disabled={centerIdx === total - 1}
        style={{ opacity: centerIdx === total - 1 ? 0.2 : 1 }}
        aria-label="다음"
        >
        &#8594;
        </button>
    </div>
    );
};

export default CardStack3D;        