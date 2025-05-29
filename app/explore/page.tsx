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
      console.log('🔍 explore 페이지: 프로필 데이터 로딩 시작');
      
      // 현재 사용자 제외하고 모든 프로필 가져오기
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id;
      console.log('현재 사용자 ID:', currentUserId);

      // 1. moodboard_profiles에서 기본 프로필 정보 가져오기
      const { data: moodboardProfiles, error: profileError } = await supabase
        .from('moodboard_profiles')
        .select('user_id, nickname, description, images, created_at, updated_at')
        .neq('user_id', currentUserId) // 현재 사용자 제외
        .order('updated_at', { ascending: false });

      if (profileError) {
        console.log('moodboard_profiles 오류:', profileError);
      }

      console.log('moodboard_profiles 결과:', moodboardProfiles?.length || 0, '개');

      // 2. clusters 테이블에서도 사용자 정보 가져오기 (대안 데이터)
      const { data: clusterData, error: clusterError } = await supabase
        .from('clusters')
        .select('user_id, main_keyword, main_image_url, category, created_at')
        .neq('user_id', currentUserId)
        .order('created_at', { ascending: false });

      if (clusterError) {
        console.log('clusters 오류:', clusterError);
      }

      console.log('clusters 결과:', clusterData?.length || 0, '개');

      // 3. 사용자 프로필 정보 가져오기 (실제 닉네임을 위해)
      const { data: authProfiles, error: authProfileError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url');

      if (authProfileError) {
        console.log('profiles 조회 오류:', authProfileError);
      }

      // 프로필 정보를 매핑으로 변환
      const profileMap = new Map();
      if (authProfiles) {
        authProfiles.forEach(profile => {
          profileMap.set(profile.id, profile);
        });
      }

      // 4. 두 데이터 소스 결합하여 프로필 생성
      let finalProfiles: UserProfile[] = [];

      // moodboard_profiles 데이터가 있으면 우선 사용
      if (moodboardProfiles && moodboardProfiles.length > 0) {
        const profilesWithImages = moodboardProfiles.filter(profile => 
          profile.images && profile.images.length > 0
        );
        
        // 실제 닉네임 정보 추가
        finalProfiles = profilesWithImages.map(profile => {
          const authProfile = profileMap.get(profile.user_id);
          return {
            ...profile,
            nickname: authProfile?.full_name || profile.nickname || `사용자 ${profile.user_id.substring(0, 8)}`
          };
        });
        
        console.log('✅ moodboard_profiles에서', profilesWithImages.length, '개 프로필 로드');
      }

      // moodboard_profiles가 비어있으면 clusters에서 생성
      if (finalProfiles.length === 0 && clusterData && clusterData.length > 0) {
        console.log('📋 clusters 데이터로 프로필 생성 중...');
        
        // 사용자별로 클러스터 그룹화
        const userClusters = clusterData.reduce((acc: any, cluster) => {
          if (!acc[cluster.user_id]) {
            acc[cluster.user_id] = [];
          }
          acc[cluster.user_id].push(cluster);
          return acc;
        }, {});

        // 각 사용자별로 프로필 생성
        finalProfiles = Object.entries(userClusters).map(([userId, clusters]: [string, any]) => {
          const userClusters = clusters as any[];
          const latestCluster = userClusters[0];
          const authProfile = profileMap.get(userId);
          
          return {
            user_id: userId,
            nickname: authProfile?.full_name || `사용자 ${userId.substring(0, 8)}`,
            description: `${userClusters.length}개의 관심사를 가진 사용자`,
            images: userClusters.map((cluster: any) => ({
              id: cluster.id,
              src: cluster.main_image_url || '/images/placeholder.jpg',
              main_keyword: cluster.main_keyword,
              category: cluster.category,
            })),
            created_at: latestCluster.created_at,
            updated_at: latestCluster.created_at,
          };
        });

        console.log('✅ clusters에서', finalProfiles.length, '개 프로필 생성');
      }

      setProfiles(finalProfiles);
      console.log('🎉 최종 프로필 수:', finalProfiles.length);
      
    } catch (error) {
      console.error('❌ 프로필 불러오기 오류:', error);
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
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="mr-4 text-gray-700 hover:bg-gray-100"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
                <Users className="h-8 w-8 text-purple-600" />
                다른 사용자 탐색
              </h1>
              <p className="text-gray-600 mt-2">다른 사용자들의 무드보드를 탐색해보세요</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-gray-500 text-sm">발견된 프로필</div>
            <div className="text-3xl font-bold text-purple-600">{filteredProfiles.length}</div>
          </div>
        </div>
        
        {/* 검색 및 필터 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 mb-8 shadow-lg border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 검색바 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="닉네임, 설명, 관심사로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* 카테고리 필터 */}
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400 h-5 w-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded-lg text-gray-800 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {categories.map(category => (
                  <option key={category} value={category} className="bg-white text-gray-800">
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
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 text-xl">무드보드를 불러오는 중...</p>
            </div>
          ) : filteredProfiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProfiles.map((profile) => (
                <div 
                  key={profile.user_id}
                  className="group bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 hover:bg-white hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
                  onClick={() => router.push(`/others_profile/${profile.user_id}`)}
                >
                  {/* 프로필 헤더 */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
                      {profile.nickname}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {profile.description}
                    </p>
                    <div className="text-gray-400 text-xs">
                      {new Date(profile.updated_at).toLocaleDateString('ko-KR')} 업데이트
                    </div>
                  </div>
                  
                  {/* 무드보드 미리보기 */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {profile.images.slice(0, 4).map((image, idx) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
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
                        className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium"
                      >
                        #{keyword}
                      </span>
                    ))}
                    {profile.images.length > 3 && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                        +{profile.images.length - 3}개
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {searchTerm || selectedCategory !== 'all' 
                  ? '검색 결과가 없습니다' 
                  : '아직 탐색할 프로필이 없습니다'
                }
              </h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory !== 'all'
                  ? '다른 검색어나 필터를 시도해보세요'
                  : '다른 사용자들이 프로필을 만들 때까지 기다려주세요'
                }
              </p>
              <div className="mt-6">
                <Button 
                  onClick={() => router.push('/my_profile')}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  내 프로필로 돌아가기
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 