"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Search, Filter } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UserProfile {
  user_id: string;
  nickname: string;
  description: string;
  images: any[];
  created_at: string;
  updated_at: string;
}

export default function ExplorePage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchAllProfiles();
  }, []);

  const fetchAllProfiles = async () => {
    setIsLoading(true);
    try {
      // 현재 사용자 제외하고 모든 프로필 가져오기
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id;

      const { data: profiles, error } = await supabase
        .from('moodboard_profiles')
        .select('user_id, nickname, description, images, created_at, updated_at')
        .neq('user_id', currentUserId) // 현재 사용자 제외
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // 이미지가 있는 프로필만 필터링
      const profilesWithImages = (profiles || []).filter(profile => 
        profile.images && profile.images.length > 0
      );

      setProfiles(profilesWithImages);
    } catch (error) {
      console.error('프로필 불러오기 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 및 필터링
  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = !searchTerm || 
      profile.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.images.some(img => 
        img.main_keyword?.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCategory = selectedCategory === 'all' || 
      profile.images.some(img => img.category === selectedCategory);

    return matchesSearch && matchesCategory;
  });

  // 카테고리 목록 추출
  const categories = ['all', ...Array.from(new Set(
    profiles.flatMap(profile => 
      profile.images.map(img => img.category).filter(Boolean)
    )
  ))];

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-blue-800">
      <div className="max-w-7xl mx-auto p-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="mr-4 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <Users className="h-8 w-8" />
                Explore Moodboards
              </h1>
              <p className="text-white/70 mt-2">다른 사용자들의 무드보드를 탐색해보세요</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-white/70 text-sm">발견된 프로필</div>
            <div className="text-3xl font-bold text-white">{filteredProfiles.length}</div>
          </div>
        </div>
        
        {/* 검색 및 필터 */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 검색바 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-5 w-5" />
                <input
                  type="text"
                  placeholder="닉네임, 설명, 관심사로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* 카테고리 필터 */}
            <div className="flex items-center gap-2">
              <Filter className="text-white/60 h-5 w-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white/20 border border-white/30 rounded-lg text-white px-3 py-3 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {categories.map(category => (
                  <option key={category} value={category} className="bg-gray-800 text-white">
                    {category === 'all' ? '모든 카테고리' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* 프로필 그리드 */}
        <div className="mt-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
              <p className="text-white text-xl">무드보드를 불러오는 중...</p>
            </div>
          ) : filteredProfiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProfiles.map((profile) => (
                <div 
                  key={profile.user_id}
                  className="group bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/15 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl"
                  onClick={() => router.push(`/others_profile/${profile.user_id}`)}
                >
                  {/* 프로필 헤더 */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">
                      {profile.nickname}
                    </h3>
                    <p className="text-white/70 text-sm line-clamp-2 mb-3">
                      {profile.description}
                    </p>
                    <div className="text-white/50 text-xs">
                      {new Date(profile.updated_at).toLocaleDateString('ko-KR')} 업데이트
                    </div>
                  </div>
                  
                  {/* 무드보드 미리보기 */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {profile.images.slice(0, 4).map((image, idx) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-white/5">
                        <img 
                          src={image.src || '/images/placeholder.jpg'} 
                          alt={image.main_keyword || 'image'}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/placeholder.jpg';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* 관심사 키워드 */}
                  <div className="flex flex-wrap gap-1">
                    {Array.from(new Set(
                      profile.images.map(img => img.main_keyword).filter(Boolean)
                    )).slice(0, 3).map((keyword, idx) => (
                      <span 
                        key={idx}
                        className="bg-white/20 px-2 py-1 rounded-full text-xs text-white/90"
                      >
                        #{keyword}
                      </span>
                    ))}
                    {profile.images.length > 3 && (
                      <span className="bg-white/20 px-2 py-1 rounded-full text-xs text-white/90">
                        +{profile.images.length - 3}개
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Users className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                {searchTerm || selectedCategory !== 'all' 
                  ? '검색 결과가 없습니다' 
                  : '아직 탐색할 프로필이 없습니다'
                }
              </h3>
              <p className="text-white/70">
                {searchTerm || selectedCategory !== 'all'
                  ? '다른 검색어나 필터를 시도해보세요'
                  : '다른 사용자들이 프로필을 만들 때까지 기다려주세요'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 