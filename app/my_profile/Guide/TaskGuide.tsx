import React, { useEffect, useMemo, useState } from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, Pen, SearchIcon } from "lucide-react";
import { CheckCircle } from "@mui/icons-material";
import { Notifications } from "@mui/icons-material";
import { AutoAwesome } from "@mui/icons-material";
import { isOneWeekPassed } from "@/app/utils/uploadCheck";
import { getReflectionData } from "@/app/utils/get/getReflectionData";
import { createPortal } from "react-dom";

const TaskGuide = ({ isSearchMode }: { isSearchMode?: boolean }) => {  
  if (isSearchMode) return null;
  const [taskOpen, setTaskOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [num, setNum] = useState(1);
  const [taskContentOpen, setTaskContentOpen] = useState(false);

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
    <div className="z-50 ">      
      <div className="mt-10 absolute justify-center top-8 ">
        {taskOpen ? (
          <div className="flex flex-row items-start">
            {/* TaskGuide 내용 */}
            <div className="bg-white/20 backdrop-blur-lg rounded-r-lg p-4 shadow-lg ">
              {/* [1]week 안내 */}
              <div className="ml-3 flex flex-row ">
                <div className="flex-row items-center text-blue-600 font-semibold text-sm">
                  <Notifications fontSize="inherit" className="text-gray-300 mb-1" />
                </div>
                <div className="text-gray-400 text-xs pl-2">
                  <span className="font-bold text-gray-400 mr-2" >Week1.</span>
                  새로운 주차까지 <span className="font-bold text-blue-600">{7-upload_check}일 </span>남았습니다.
                </div>
              </div>

              {/* [2]Task 진행상황 */}
              <div className="ml-3 flex flex-col text-xs mt-2">
                <div className="flex flex-row items-center">
                  <div className="flex flex-row items-center cursor-pointer" >
                    <CheckCircle className="text-gray-300" fontSize="inherit"/>
                    <div className="text-xs text-gray-400 font-bold ml-2 ">
                      Task 진행상황: <span className="font-bold text-blue-600">{num}/3</span> 완료
                    </div>
                    {/* 진행상황 드롭다운 버튼 */}
                    <button
                      type="button"
                      className="ml-2"
                      onClick={() => setTaskContentOpen((k) => !k)}
                      style={{ zIndex: 10 }}
                      >
                      {taskContentOpen ? (
                          <ChevronUpIcon className="w-4 h-4 text-black" />
                      ) : (
                          <ChevronDownIcon className="w-4 h-4 text-black" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* 진행상황 드롭다운 영역 */}
                {taskContentOpen && (
                    <div className="mt-2 ml-6 flex flex-col gap-1 bg-white/10 backdrop-blur-lg rounded-lg p-4">
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
                        <span className={`${isSearched ? 'text-gray-500' : 'text-gray-400'}`}>3. 다른 사람의 알고리즘 자화상에서 새로운 관심사 탐색하기</span>
                      </div>
                    </div>
                )}
              </div>

              {/* [3] 사용방법 알아보기 */}
              <div className="flex flex-row items-center mt-2 px-4 py-2 text-blue-700 rounded-full
                text-xs font-semibold transition w-fit">
                  <div className="w-[10px] h-[10px] rounded-full bg-[#3B71FE] blur-[4px] animate-pulse mr-2" />
                  <div className="ml-1 text-xs text-gray-500"> 사용방법 알아보기 ?</div>
                  <button className="text-[10px] text-white bg-blue-600  ml-2 rounded-full px-2 z-30 hover:bg-blue-400 transition"
                    onClick={() => {
                      setGuideOpen(true);
                      console.log("사용방법 알아보기 버튼 클릭");
                    }}
                    > 열기 
                  </button>
              </div>
              {/* 모달 */}
              {guideOpen && typeof window !== "undefined" &&
                createPortal(
                  (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-lg"
                      onClick={() => setGuideOpen(false)}
                    >
                      <div
                        className="relative p-0 w-screen h-screen max-w-none max-h-none "
                        onClick={e => e.stopPropagation()}
                      >
                        {/* 이미지 배경 */}
                        <img
                          src="/images/guideImg.png"
                          alt="가이드 이미지"
                          className="absolute inset-0 w-full h-full object-contain z-0 p-10"
                        />

                        {/* 닫기 버튼 */}
                        <button
                          className="absolute top-20 right-14 px-4 py-1 bg-blue-600/80 shadow text-white rounded-full text-xs z-20"
                          onClick={() => setGuideOpen(false)}
                        >
                          닫기
                        </button>
                      </div>
                    </div>
                  ),
                  document.body
                )
              }
            </div>
            {/* 오른쪽에 붙는 버튼 */}
            <button onClick={() => setTaskOpen((prev) => !prev)}
              className="transition-all bg-black/20 backdrop-blur-lg rounded-r-lg p-2 py-4 text-white flex flex-row items-center text-xs shadow-lg font-bold"
              >
                
              <ChevronLeftIcon className="w-4 h-4 text-white" />
            </button>
          </div>
        ):(
          <div className="flex flex-row items-center">
            <button onClick={() => setTaskOpen((prev) => !prev)}
              className="bg-black/20 backdrop-blur-lg rounded-r-lg p-2 py-4 text-white flex flex-row items-center text-xs shadow-lg font-bold"
              >
                task 가이드
              <ChevronRightIcon className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
        

        
      </div>
    </div>
  );
} 
export default TaskGuide;