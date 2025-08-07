'use client'; // 클라이언트 사이드 인터랙션이 필요하면 사용합니다.

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { CheckCircle2, UserPlus, UserX, Lock } from 'lucide-react';
import { Reflection_answer, WatchHistory } from '../types/profile';   
import { getClusterHistory } from '@/app/utils/get/getClusterHistory';
import { ClusterHistory } from '@/app/types/profile';
import { ClusterHistoryCard } from './History/ClusterHistoryCard';  
import { UpdateCard } from './History/UpdateCard';
import { handleToggleOpenToConnect } from "@/app/utils/save/saveUserData";
import { UserData } from "@/app/types/profile";
import { getUserData } from '@/app/utils/get/getUserData';
import { useRouter } from 'next/navigation';

// 실제 페이지 이름으로 함수 이름을 변경하세요. (예: UpdatePage, SearchMapPage)
export default function MyPage() {
const { logout, isLoggedIn, isLoading, user } = useAuth();
const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'open_setting'>('profile');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [clusterHistory, setClusterHistory] = useState<ClusterHistory[]>([]);
  const [reflection_answer, setReflection_answer] = useState<Reflection_answer[]>([]);



  

  useEffect(() => {
    const loadData = async () => {
      try {
        // DB에서 클러스터 히스토리 조회
        const history = await getClusterHistory();
        setClusterHistory(history);
        console.log('✅ 클러스터 히스토리 로드 완료:', history.length, '개');
        
        // DB에서 사용자 데이터 조회
        const userData = await getUserData();
        if (userData) {
          // DB 타입을 프론트엔드 타입으로 변환
          const convertedUserData: UserData = {
            ...userData,
            nickname: userData.nickname || '',
            last_analysis_time: userData.last_analysis_at || undefined,
            updated_at: userData.updated_at || undefined
          };
          setUserData(convertedUserData);
        }
        console.log('✅ 사용자 데이터 로드 완료:', userData?.nickname);
      } catch (error) {
        console.error('❌ 내 페이지 데이터 로드 오류:', error);
      }
    };

    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn]);

  // 최신 기록 날짜 구하기
  const latestEntry = clusterHistory[clusterHistory.length - 1];
  

  // 공개 상태 토글 핸들러 (DB 연결)
  const handleToggle = async () => {
    if (!userData) return;
    
    try {
      // DB에서 공개 상태 토글
      const success = await handleToggleOpenToConnect(userData.id);
      
      if (success) {
        // UI 업데이트
        const updated = { ...userData, open_to_connect: !userData.open_to_connect };
        setUserData(updated);
        console.log('✅ 공개 상태 토글 완료:', updated.open_to_connect ? '공개' : '비공개');
      } else {
        console.error('❌ 공개 상태 토글 실패');
      }
    } catch (error) {
      console.error('❌ 공개 상태 토글 오류:', error);
    }
  };

  return (
    <div className="min-h-screen h-screen bg-gray-50 flex flex-row overflow-hidden">
      {/* 왼쪽 메뉴탭 */}
      <aside className="w-120 min-w-[300px] flex flex-col justify-between pl-10 pt-10">
        <nav className="w-full space-y-2 pt-20 px-8 flex flex-col">
          <button
            className={`text-lg text-left w-full px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'profile' ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('profile')}
          >
            내 알고리즘 시각화 히스토리
          </button>
          <button
            className={`text-lg text-left w-full px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'open_setting' ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}
            disabled  `}
            onClick={() => setActiveTab('open_setting')}
          >
            내 알고리즘 시각화 공개 설정
          </button>
        </nav>
        <div className="w-full px-8 pb-20 mb-10">
          <button
            onClick={async () => {
              try {
                console.log('🔄 로그아웃 시도 중...');
                await logout();
                console.log('✅ 로그아웃 성공');
                // 홈페이지로 리다이렉트
                window.location.href = '/';
              } catch (error) {
                console.error('❌ 로그아웃 실패:', error);
              }
            }}
            className="w-full text-lg font-medium rounded-lg px-4 py-3 bg-gray-900 text-white hover:bg-gray-800 transition-colors rounded-[10px]"
          >
            로그아웃 하기
          </button>
        </div>
      </aside>

      {/* 오른쪽 내용 */}
      <main className="flex-1 flex flex-col items-start justify-start w-full box-border pt-20 pr-10 pl-10 mt-10 overflow-y-auto">
        {activeTab === 'profile' && (
          <>
            {/* 최신 기록 날짜 안내 */}
            {clusterHistory.length > 0 && (
              <UpdateCard history={latestEntry} />
            )}
            {/* ClusterHistory 카드 리스트 */}
            <div className="mt-8 scrollbar-auto">
              {clusterHistory.length === 0 ? (
                <div className="text-gray-400 text-base py-10">아직 분석 이력이 없습니다.</div>
              ) : (
                clusterHistory.slice().reverse().map((history, idx) => (
                  <>
                  <ClusterHistoryCard  history={history} latest={idx === 0} />  
                  </>
                ))
              )}
            </div>
          </>
        )}
        {/* 공개 설정 
        {activeTab === 'open_setting' && (
          <div className="w-full mx-auto flex flex-col items-center justify-center py-2 pr-20">
          <div className={`w-full flex items-center gap-6 px-8 py-8 rounded-2xl shadow-lg border transition-all duration-300
            ${userData?.open_to_connect ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
            <div className={`flex items-center justify-center w-16 h-16 rounded-full
              ${userData?.open_to_connect ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-400"}`}>
              {userData?.open_to_connect ? <UserPlus className="w-8 h-8" /> : <UserX className="w-8 h-8" />}
            </div>
            <div className="flex-1">
              <div className={`text-xl font-bold mb-1 ${userData?.open_to_connect ? "text-blue-700" : "text-gray-700"}`}>
                {userData?.open_to_connect ? "내 알고리즘 공개" : "내 알고리즘 비공개"}
              </div>
              <div className="text-gray-500 text-sm">
                {userData?.open_to_connect
                  ? "다른 사용자가 내 알고리즘 시각화를 둘러볼 수 있도록 허용할게요." 
                  : "다른 사용자가 내 알고리즘 시각화를 볼 수 없도록 할게요."}
              </div>
            </div>
          
            <button
              onClick={handleToggle}
              className={`relative w-14 h-8 flex items-center rounded-full transition-colors duration-300
                ${userData?.open_to_connect ? "bg-blue-500" : "bg-gray-300"}`}
              aria-label="공개 여부 전환"
            >
              <span
                className={`inline-block w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-300
                  ${userData?.open_to_connect ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>
        </div>
        
        )}
        */}
      </main>
    </div>
  );
} 