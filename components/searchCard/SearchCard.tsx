import { ProfileData, ImageData } from '@/app/types/profile';

interface SearchCardProps {
  profile: ProfileData & { images: ImageData[] };
  onCardClick: (profileId: string) => void;
  similarity?: number;
}

export default function SearchCard({ profile, onCardClick, similarity = 0 }: SearchCardProps) {
  // 이미지가 없는 경우 처리
  const firstImage = profile.images && profile.images.length > 0 ? profile.images[0] : null;
  const defaultImage = '/images/default_image.png'; // 기본 이미지 경로

  // 🎨 유사도에 따른 색상 결정
  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 80) return 'text-green-400';
    if (similarity >= 60) return 'text-yellow-400';
    if (similarity >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  // 🎨 유사도에 따른 배경 색상 결정
  const getSimilarityBgColor = (similarity: number) => {
    if (similarity >= 80) return 'bg-green-500/20';
    if (similarity >= 60) return 'bg-yellow-500/20';
    if (similarity >= 40) return 'bg-orange-500/20';
    return 'bg-red-500/20';
  };

return (
    <div 
      className="transition-all cursor-pointer group"
    onClick={() => onCardClick(profile.id)}
    >
    {/* 가장 유사한 이미지 미리보기 */}
      <div className="relative mb-4">
        <div className="aspect-square rounded-lg overflow-hidden">
        <img 
            src={firstImage?.src || defaultImage} 
            alt={firstImage?.main_keyword || profile.nickname}
            className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-50"
            onError={(e) => {
              e.currentTarget.src = defaultImage;
            }}
        />
        </div>
        
        {/* 호버시 나타나는 오버레이 */}
        <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center">
        <div className="text-center">
            <div className={`backdrop-blur-sm px-4 py-2 rounded-full mb-3 ${getSimilarityBgColor(similarity)}`}>
              <span className={`font-bold text-2xl ${getSimilarityColor(similarity)}`}>
                {similarity}%
              </span>
            </div>
            <h3 className="text-white font-bold text-xl">{profile.nickname}</h3>
            <p className="text-white/80 text-sm mt-1">
              {similarity >= 80 ? '매우 높은 유사도' :
               similarity >= 60 ? '높은 유사도' :
               similarity >= 40 ? '보통 유사도' : '낮은 유사도'}
            </p>
        </div>
        </div>
    </div>
    </div>
);
} 