import { ProfileData, ImageData } from '@/app/types/profile';

interface SearchCardProps {
  profile: ProfileData & { images: ImageData[] };
  onCardClick: (profileId: string) => void;
}

export default function SearchCard({ profile, onCardClick }: SearchCardProps) {
  // 이미지가 없는 경우 처리
  const firstImage = profile.images && profile.images.length > 0 ? profile.images[0] : null;
  const defaultImage = '/images/default_image.png'; // 기본 이미지 경로

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
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-3">
              <span className="text-white font-bold text-2xl">
                53%
              </span>
            </div>
            <h3 className="text-white font-bold text-xl">{profile.nickname}</h3>
          </div>
        </div>
      </div>
    </div>
  );
} 