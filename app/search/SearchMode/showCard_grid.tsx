import { useRouter } from "next/navigation";
import { ImageData } from '@/app/types/profile';
import { profiles } from '@/app/others_profile/dummy-data';

interface CardGridProps {
    cards: ImageData[];
    searchKeyword: string[];
}

const CardGrid: React.FC<CardGridProps> = ({ cards, searchKeyword }) => {
    const router = useRouter();
    return (
      <div className="relative w-full">
        {/* 카드 그리드 */}
        <div className="grid grid-cols-4 gap-8 py-8 px-4 max-h-[700px] scroll-able">
            {cards.map((image, idx) => {
                const imageSrc = image.src || '/images/default_image.png';
                const userId = image.user_id;
                const profile = profiles.find(p => p.id === userId);
                return (
                    <button
                        key={image.id || idx}
                        className="relative cursor-pointer hover:scale-105 transition-all duration-300 flex flex-col group "
                        onClick={() => {
                            if (userId) {
                                router.push(
                                `/others_profile/${userId}?main_keyword=${encodeURIComponent(image.main_keyword || '')}&searchKeyword=${encodeURIComponent(Array.isArray(searchKeyword) ? searchKeyword.join(',') : '')}`
                                );
                            }
                        }}
                    >
                        <span className="mb-2 font-semibold text-gray-800 text-base text-left">
                            #{image.main_keyword}
                        </span>
                        <div className="relative w-60 h-40 mb-2">
                            <img src={imageSrc} alt="" className="w-full h-full object-cover shadow-lg" />
                            {/* 호버 시 검은 오버레이 */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />
                            {/* 호버 시 중앙에 버튼 텍스트 */}
                            <span className="flex flex-col items-center justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-full shadow-lg font-bold text-sm text-white opacity-0 group-hover:opacity-100 transition-all pointer-events-none text-center whitespace-nowrap">
                                {profile?.nickname || '이름 없음'}님 <br/>알고리즘 자화상 보러가기
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
        
            
    </div>
    );
};

export default CardGrid;        