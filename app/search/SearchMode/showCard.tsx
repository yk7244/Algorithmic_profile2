


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageData } from '@/app/types/profile';
import { getUserFullProfileById } from "@/app/utils/get/getUserData";

// 3D 카드 스택 컴포넌트
interface CardStack3DProps {
    cards: ImageData[];
    searchKeyword: string;
}

const CardStack3D: React.FC<CardStack3DProps> = ({ cards, searchKeyword }) => {
    const [centerIdx, setCenterIdx] = useState(0);
    const [profiles, setProfiles] = useState<any[]>([]);

    const total = cards.length;
    const cardWidth = 340; // w-72
    const gap = 1; // 카드 간격(px)
    const router = useRouter();

    // 유사도 계산을 위한 사용자 ID 목록
    const userIds = cards.map(card => card.user_id).filter((id): id is string => Boolean(id));
    const similarities = [
        0.7,
    ]



    // 카드들의 프로필 정보 로드
    useEffect(() => {
        const loadProfiles = async () => {
            const profilePromises = cards.map(async (card) => {
                if (card.user_id) {
                    const result = await getUserFullProfileById(card.user_id);
                    return result.profile;
                }
                return null;
            });
            
            const loadedProfiles = await Promise.all(profilePromises);
            setProfiles(loadedProfiles);
        };

        if (cards.length > 0) {
            loadProfiles();
        }
    }, [cards]);

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
            router.push(`/others_profile/${card.user_id}?main_keyword=${encodeURIComponent(card.main_keyword || '')}&searchKeyword=${encodeURIComponent(searchKeyword)}&userIds=${encodeURIComponent(userIds.join(','))}`);
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
        {cards.map((card, idx) => {
            const offset = idx - centerIdx;
            const isCenter = offset === 0;
            const cardSrc = card.src || '/cards/default_card.png';
            const userId = card.user_id;
            // 유상님✅ userId로 프로필 찾기
            const profile = profiles.find(p => p.id === userId);
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
                                #{card.main_keyword}
                            </span>
                            <div className="w-72 h-72 object-cover flex flex-col items-start relative overflow-hidden">
                                {/* 이미지 */}
                                <img src={cardSrc} alt="" className="w-72 h-full object-cover shadow-lg z-0" />
                                {/* 이미지 내 좌측 상단 70% + 비슷한 키워드예요 */}
                                <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
                                    <span className="bg-white/20 backdrop-blur-lg text-white font-bold px-2 py-0.5 rounded-full text-[12px]">{(card as any).similarity * 100}%</span>
                                    <span className="text-white/80 text-xs drop-shadow ">비슷한 키워드예요</span>
                                </div>
                                {/* 중앙 하단 그라데이션 오버레이 */}
                                <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-black/90 to-transparent z-10" />
                                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-black/90 to-transparent z-10" />

                                
                                {/* 중앙 하단 정보 */}
                                {isCenter && (
                                <div className="absolute bottom-0 left-0 w-full flex flex-col items-center z-20 group font-semibold">
                                    <div className="flex items-center transition-all duration-300 text-xs text-white/70 opacity-80">
                                        <span className="text-blue-200 font-bold drop-shadow">{profile?.nickname || '이름 없음'}님</span> 은 당신과 전체적으로
                                    </div>
                                    <div className="flex items-center mb-2 transition-all duration-300 text-xs text-white/70 opacity-80">
                                        <span className="text-blue-200 font-bold px-2 py-0.5 rounded-full  ">{similarities[0]*100}%</span>  
                                        <span className="text-white">  유사해요</span>
                                    </div>
                                    
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
                                    {card?.description.slice(0, 60)}...
                                </div>
                                <div className=" mt-1 text-sm z-10">
                                    {card?.keywords.slice(0, 4).map((keyword, index) => (
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