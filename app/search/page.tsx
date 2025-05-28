"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    // URL에서 키워드 파라미터 가져오기
    const keywordParam = searchParams.get('keywords');
    if (keywordParam) {
      const keywordArray = keywordParam.split(',');
      setKeywords(keywordArray);
      
      // 여기서 검색 로직 구현
      performSearch(keywordArray);
    } else {
      setIsLoading(false);
    }
  }, [searchParams]);

  const performSearch = async (searchKeywords: string[]) => {
    setIsLoading(true);
    try {
      // 1. 모든 moodboard_profiles 불러오기
      const { data: profiles, error } = await supabase
        .from('moodboard_profiles')
        .select('user_id, nickname, description, images');

      if (error) throw error;

      // 2. 키워드 필터링
      const results = (profiles || []).filter(profile => {
        const images = profile.images || [];
        const profileKeywords = images.flatMap((img: any) =>
          [img.main_keyword, ...(img.keywords || [])]
        );
        return searchKeywords.some(keyword =>
          profileKeywords.some(profileKeyword =>
            profileKeyword?.toLowerCase().includes(keyword.toLowerCase())
          )
        );
      });

      setSearchResults(results);
    } catch (error) {
      console.error('검색 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-900 via-gray-900 to-blue-800">
      <div className="max-w-6xl mx-auto p-8">
        {/* 헤더 */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mr-4 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold text-white">Search Results</h1>
        </div>
        
        {/* 검색 키워드 표시 */}
        <div className="mb-8">
          <h2 className="text-xl text-white/80 mb-4">Searching for profiles with interests in:</h2>
          <div className="flex flex-wrap gap-3">
            {keywords.map((keyword, index) => (
              <div 
                key={index}
                className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30"
              >
                <span className="text-xl font-bold text-white">
                  #{keyword}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* 검색 결과 */}
        <div className="mt-12">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
              <p className="text-white text-xl">Searching for matching profiles...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((profile) => (
                <div 
                  key={profile.id}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/15 transition-all cursor-pointer"
                  onClick={() => router.push(`/others_profile/${profile.id}`)}
                >
                  <h3 className="text-2xl font-bold text-white mb-3">{profile.nickname}</h3>
                  <p className="text-white/80 text-sm mb-4 line-clamp-2">{profile.description}</p>
                  
                  {/* 프로필 이미지 미리보기 */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {profile.images.slice(0, 4).map((image) => (
                      <div key={image.id} className="aspect-square rounded-lg overflow-hidden">
                        <img 
                          src={image.src} 
                          alt={image.main_keyword}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* 키워드 표시 */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {Array.from(new Set(profile.images.map(img => img.main_keyword))).slice(0, 5).map((keyword, idx) => (
                      <span 
                        key={idx}
                        className="bg-white/20 px-3 py-1 rounded-full text-sm text-white"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Search className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No matching profiles found</h3>
              <p className="text-white/70">Try selecting different interests or check back later</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
