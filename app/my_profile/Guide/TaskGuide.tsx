import React, { useEffect, useMemo, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, Pen, SearchIcon } from "lucide-react";
import { CheckCircle } from "@mui/icons-material";
import { Notifications } from "@mui/icons-material";
import { AutoAwesome } from "@mui/icons-material";
import { isOneWeekPassed } from "@/app/utils/uploadCheck";
import { getReflectionData } from "@/app/utils/get/getReflectionData";

export default function TaskGuide({ isSearchMode }: { isSearchMode?: boolean }) {  
  if (isSearchMode) return null;
  const [taskOpen, setTaskOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [num, setNum] = useState(1);
  

  // 주차 업데이트 날짜 계산
  const upload_check = useMemo(() => isOneWeekPassed(), []);
  // 알고리즘 자화상 첫인상 남기기 여부 확인
  const reflectionData = getReflectionData();
  console.log('확인 reflectionData', reflectionData?.reflection1 ?? false);       
  const isReflection1 = reflectionData?.reflection1 !== false;
  const isSearched = reflectionData?.searched !== false;

  useEffect(() => {
    const nextNum = isReflection1 ? (isSearched ? 3 : 2) : 1;
    if (num !== nextNum) setNum(nextNum);
  }, [isReflection1, isSearched, num]);

  

  return (
    <div className="z-[150]">      
      <div className="absolute top-8 left-4 z-[10]">
        {/* [1]week 안내 */}
        <div className="ml-3 mt-10 flex flex-row ">
          <div className="flex-row items-center text-blue-600 font-semibold text-sm">
            <Notifications fontSize="small" className="text-gray-400 mb-1" />
          </div>
          <div className="text-gray-400 text-xs pl-2">
            <span className="font-bold text-gray-500 mr-2" >Week1.</span>
            새로운 주차까지 <span className="font-bold text-blue-600">{upload_check}일 </span>남았습니다.
          </div>
        </div>

        {/* [2]Task 진행상황 */}
        <div className="ml-3 mt-2 flex flex-col text-xs">
          <div className="flex flex-row items-center">
            <div className="flex flex-row items-center cursor-pointer" >
              <CheckCircle className="text-gray-400" fontSize="small"/>
              <div className="text-xs text-gray-500 font-bold ml-2">
                Task 진행상황: <span className="font-bold text-blue-600">{num}/3</span> 완료
              </div>
              {/* 진행상황 드롭다운 버튼 */}
              <button
                type="button"
                className="ml-2"
                onClick={() => setTaskOpen((prev) => !prev)}
                style={{ zIndex: 10 }}
                >
                {taskOpen ? (
                    <ChevronUpIcon className="w-4 h-4 text-black" />
                ) : (
                    <ChevronDownIcon className="w-4 h-4 text-black" />
                )}
              </button>
            </div>
          </div>
          
          {/* 진행상황 드롭다운 영역 */}
          {taskOpen && (
              <div className="mt-2 ml-6 flex flex-col gap-1">
                <div className="flex flex-row items-center">
                  <Pen className="w-3 h-3 mr-2 text-black group-hover:text-white transition-colors" />
                  <span className="text-blue-600 font-semibold mr-2">완료</span>
                  <span className="text-gray-500">1. 알고리즘 자화상 확인하기</span>
                </div>
                <div className="flex flex-row items-center">
                  <AutoAwesome className="mr-2 text-black group-hover:text-white transition-colors " fontSize="inherit"/>
                  {isReflection1 ? (
                    <span className="text-blue-600 font-semibold mr-2">완료</span>
                  ) : (
                    <span className="text-gray-400 font-semibold mr-2">미완</span>
                  )}
                  <span className={` ${isReflection1 ? 'text-gray-500' : 'text-gray-400'}`}>2. 알고리즘 자화상 첫인상 남기기</span>
                </div>
                <div className="flex flex-row items-center">
                  <SearchIcon className="mr-1 w-3 h-3 mr-2"  />
                  {isSearched ? (
                    <span className="text-blue-600 font-semibold mr-2">완료</span>
                  ):(
                    <span className="text-gray-400 font-semibold mr-2">미완</span>
                  )}
                  <span className={`${isSearched ? 'text-gray-500' : 'text-gray-400'}`}>3. 타인의 알고리즘 자화상에서 새로운 관심사 나의 알고리즘 자화상에 추가하기</span>
                </div>
              </div>
          )}
        </div>

        {/* [3] 사용방법 알아보기 */}
        <div className="flex flex-row items-center mt-2 px-4 py-2 backdrop-blur-sm text-blue-700 rounded-full 
          text-xs font-semibold transition w-fit">
            <div className="w-[14px] h-[14px] rounded-full bg-[#3B71FE] blur-[4px] animate-pulse mr-2" />
            <div className="ml-1 text-xs text-black"> 사용방법 알아보기 ?</div>
            <button className="text-[10px] text-white bg-blue-600  ml-2 rounded-full px-2 z-30 hover:bg-blue-400 transition"
              onClick={() => {
                setGuideOpen(true);
                console.log("사용방법 알아보기 버튼 클릭");
              }}
              > 열기 
            </button>
        </div>
        {/* 모달 */}
        {guideOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
            onClick={() => setGuideOpen(false)}
          >
            <div
              className="relative rounded-2xl p-0 w-[90vw] h-[90vh] max-w-[1200px] max-h-[670px] overflow-hidden "
              onClick={e => e.stopPropagation()}
            >
              {/* 이미지 배경 */}
              <img
                src="/images/guideImg.png"
                alt="가이드 이미지"
                className="absolute inset-0 w-full h-full object-contain z-0"
              />

              {/* 닫기 버튼 */}
              <button
                className="absolute top-0 right-4 px-4 py-1 bg-blue-600/80 shadow text-white rounded-full text-xs z-20"
                onClick={() => setGuideOpen(false)}
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 