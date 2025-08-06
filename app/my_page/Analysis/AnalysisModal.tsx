import React, { useEffect, useState } from "react";
import { ClusterHistory, WatchHistory } from "@/app/types/profile";
import { getWatchHistory } from "@/app/utils/get/getWatchHistory";
import { getWatchHistory_by_clusterHistory_id } from "@/app/utils/get/getWatchHistory_array";
import { Button } from "react-day-picker";

interface AnalysisModalProps {
    open: boolean;
    onClose: () => void;
    history: ClusterHistory;
}

const steps = [
    {
        title: "시청기록 키워드 추출",
        desc: "시청한 영상에서 키워드를 뽑아냈어요.",
    },
    {
        title: "키워드 그룹화",
        desc: "비슷한 키워드끼리 묶어 정리했어요.",
    },
    {
        title: "키워드 그룹을 대표하는 표현 생성",
        desc: "묶음을 관통하는 감정이나 상황을 표현했어요.",
    },
    {
        title: "그룹 이미지화",
        desc: "묶음을 잘 표현해주는 이미지로 나타냈어요.",
    },
];

const description= [
    {
        title: "키워드 추출 기준",
        desc: "GPT 언어모델을 통해, 내가 본 영상들의 제목, 설명, 태그를 살펴서 관심 주제와 감정 흐름을 읽어낼 수 있는 키워드를 5개씩 뽑았어요. 이 키워드들은 당신이 어떤 주제에 관심이 있었고, 어떤 성향인지 혹은 어떤 분위기의 콘텐츠에 자주 머물렀는지를 보여줍니다.\n \n 키워드1: 영상 핵심 주제, 키워드2: 콘텐츠 유형, 키워드3: 감정/톤, 키워드4: 대상 시청자, 키워드5: 트렌드/이슈",
    },
    {
        title: "키워드 그룹화 기준",
        desc: "GPT 언어모델을 통해, 키워드들을 모아 비슷한 주제끼리 그룹을 만들었어요. \n 각 그룹에 해당하는 영상들도 함께 분류되었어요.",
    },
    {
        title: "키워드 그룹을 대표하는 표현 생성 기준",
        desc: "GPT 언어모델을 통해, 그룹의 키워드와 영상제목들을 기반으로 시청 성향을 표현해 줄 수 있는 알고리즘 정체성 키워드를 생성했어요. \n (1)콘텐츠에 대한 관심의 흐름을 살펴보고, \n(2)어떠한 취향으로 혹은 어떤 목적으로 유튜브를 시청을 하게 되는지, \n(3)이를 통해 내면의 가치와 감정의 흐름을 파악하려 했어요.",
    },
    {
        title: "그룹 이미지화 기준",
        desc: "각 영상의 제목과 메인 키워드 매칭 점수를 계산해 가장 관련도가 높은 영상을 선택해 썸네일을 가져왔어요. 이 썸네일은 그룹의 핵심 감정이나 상황을 잘 표현해주는 이미지에요.",
    },
];

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ open, onClose, history }) => {
    const [watchHistory, setWatchHistory] = useState<WatchHistory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [videoOpen, setVideoOpen] = useState(false);
    const [descriptionOpen, setDescriptionOpen] = useState(false);
    const [showDetail_num, setShowDetail_num] = useState(0);
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');

    useEffect(() => {
        const loadWatchHistory = async () => {
            try {
                setIsLoading(true);
                console.log('🔄 AnalysisModal: 시청 기록 로드 시작', history.id);
                
                // clusterHistory_id로부터 watchHistory 배열 가져오기 (비동기)
                const getwatchHistory = await getWatchHistory_by_clusterHistory_id(history);
                
                console.log('✅ AnalysisModal: 시청 기록 로드 완료', getwatchHistory.length, '개');
                setWatchHistory(getwatchHistory);
            } catch (error) {
                console.error('❌ AnalysisModal: 시청 기록 로드 오류', error);
                setWatchHistory([]); // 오류 시 빈 배열로 설정
            } finally {
                setIsLoading(false);
            }
        };

        if (history?.id) {
            loadWatchHistory();
        }
    }, [history]);

    const [showDetail, setShowDetail] = useState(false);


    // 로딩 중이거나 데이터가 없을 때 안전한 처리
    const date = (Array.isArray(watchHistory) && watchHistory[0]?.timestamp?.slice(0, 10)) || new Date().toISOString().slice(0, 10);
    const totalVideos = Array.isArray(watchHistory) ? watchHistory.length : 0;
    const allKeywords = Array.isArray(watchHistory) ? watchHistory.flatMap((v) => v.keywords || []) : [];
    const totalKeywords = allKeywords.length;
    
    //console.log('현재 history', history);

    if (!open) return null;

    // 로딩 중일 때 로딩 화면 표시
    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
                <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center min-h-[300px]" onClick={e => e.stopPropagation()}>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-lg font-medium text-gray-700">분석 데이터를 불러오는 중...</p>
                    <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</p>
                </div>
            </div>
        );
    }
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="absolute top-6 mt-[12px] left-[120px] bg-[#F5F5F5] text-black rounded-full px-4 py-2 text-sm font-bold">{date}</div>
            <div className="bg-white rounded-3xl shadow-xl mt-[55px] ml-[120px] mr-[120px] h-[650px] relative flex overflow-hidden" onClick={e => e.stopPropagation()}>
                <button
                    className="absolute top-6 right-10 text-gray-400 hover:text-black text-2xl z-10"
                    onClick={onClose}
                    aria-label="닫기"
                >
                    ×
                </button>
                {/* 왼쪽 탭 타임라인 */}
                <div className="w-[420px] bg-white flex flex-col items-center px-0 relative h-full">
                    <div className="flex flex-col gap-0 w-full relative h-full justify-center items-center ">
                        {/* 세로선 */}
                        <div className="absolute left-[70px] w-[2px] bg-gray-200 z-0" style={{height: 'calc(100% - 300px)'}} />
                            {steps.map((step, idx) => (
                                <button
                                    key={step.title}
                                    className={`ml-10 mr-10 p-2 rounded-2xl justfy-centerflex items-start gap-4 relative z-10 mb-2 w-[380px] text-left focus:outline-none ${activeStep === idx ? 'bg-black' : ''}`}
                                    onClick={() => {
                                        setActiveStep(idx);
                                        setShowDetail(false);
                                    }}
                                    
                                    tabIndex={0}
                                    type="button"
                                >
                                    <div className="ml-6 flex flex-row justify-center items-center">
                                        <div className="flex flex-col items-center">
                                            <div className={`rounded-full flex items-center justify-center font-bold text-xl border-4 border-black shadow ${activeStep === idx ? 'bg-white text-black w-11 h-11 ' : 'bg-black text-white w-10 h-10 '}`}>
                                                {idx + 1}
                                            </div>
                                        </div>
                                        <div className="pt-1 flex-1">
                                            <div className="rounded-xl px-4 py-2">
                                                <div className={`font-bold text-lg text-black ${activeStep === idx ? 'text-white' : ''}`}>{step.title}</div>
                                                <div className={`text-gray-500 text-sm mt-1 ${activeStep === idx ? 'text-gray-300' : ''}`}>{step.desc}</div>
                                            </div>
                                            
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                </div>
                {/* 오른쪽 탭 타임라인 */}
                <div className="w-[700px] h-full ml-10 flex flex-col p-14 bg-[#F7F7F8] overflow-y-auto">
                    {activeStep === 0 && (
                        // 1단계: 기존 시청기록/키워드 리스트 => watchHistory 배열 불러오기
                        <>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex gap-8">
                                <div className="text-gray-700 text-md">총 분석 영상 수: <span className="font-bold text-lg">{totalVideos}</span></div>
                                <div className="text-gray-700 text-md">총 키워드 수: <span className="font-bold text-lg">{totalKeywords}</span></div>
                            </div>
                            <button className="text-blue-600 text-sm cursor-pointer hover:underline select-none"
                            onClick={() => {
                                setShowDetail_num(1);
                                setShowDetail(true);
                            }}
                            >
                                키워드 추출 기준이 궁금해요 ?
                            </button>
                            
                        </div>
                        {showDetail && (
                            <div className="flex z-50 top-0 left-0 w-full h-full justify-end">
                                <div className="bg-gray-200 rounded-xl p-3 px-6 w-[80%] h-full relative">
                                    <button className="absolute top-3 right-6 text-gray-400 hover:text-black text-xs bg-black/80 text-white rounded-full px-4 py-1 z-10"
                                    onClick={() => setShowDetail(false)}
                                    >
                                        닫기
                                    </button>
                                    <p className="text-md font-bold mb-4 text-black">{description[showDetail_num-1].title}</p>
                                    <p className="text-gray-500 text-sm whitespace-pre-line text-left ">{description[showDetail_num-1].desc}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col w-full overflow-y-auto mt-10">
                            {watchHistory.map((video, idx) => (
                                <div key={video.videoId + idx} className="mb-7">
                                    <div className="font-bold text-lg text-black mb-2 max-w-[80%] truncate">{video.title}</div>
                                    <div className="flex flex-wrap gap-2">
                                        {(video.keywords || []).map((kw, i) => (
                                            <span key={kw + i} className="bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-sm font-semibold">{kw}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        </>
                    )}
                    {activeStep === 1 && (
                        // 2단계: 키워드 그룹화 결과 or 설명
                        <>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex gap-8">
                                <div className="text-gray-700 text-md">
                                    총 키워드 묶음 개수: <span className="font-bold text-lg">{history.images.length}</span>
                                </div>
                            </div>
                            <button className="text-blue-600 text-sm cursor-pointer hover:underline select-none"
                            onClick={() => {
                                setShowDetail_num(2);
                                setShowDetail(true);
                            }}
                            >
                                키워드를 묶은 기준이 궁금해요 ?
                            </button>
                        </div>
                        {showDetail && (
                            <div className="flex z-50 top-0 left-0 w-full h-full justify-end">
                                <div className="bg-gray-200 rounded-xl p-3 px-6 w-[80%] h-full relative">
                                    <button className="absolute top-3 right-6 text-gray-400 hover:text-black text-xs bg-black/80 text-white rounded-full px-4 py-1 z-10"
                                    onClick={() => setShowDetail(false)}
                                    >
                                        닫기
                                    </button>
                                    <p className="text-md font-bold mb-4 text-black">{description[showDetail_num-1].title}</p>
                                    <p className="text-gray-500 text-sm whitespace-pre-line text-left ">{description[showDetail_num-1].desc}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col w-full overflow-y-auto mt-10">
                            {history.images.map((image, i) => (        
                                <div key={image.id + i} className="bg-white rounded-xl p-6 mb-4">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {image.keywords.map((kw, i) => (
                                            <span key={kw + i} className="bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-sm font-semibold">{kw}</span>
                                        ))}
                                    </div>
                                    
                                    {/* 포함된 영상 수 */}
                                    <div className="flex items-center gap-2 text-gray-500 text-sm font-semibold">
                                    <span>포함된 영상: {image.relatedVideos.length}개</span>
                                    {image.relatedVideos.length > 0 && (
                                        <button
                                            onClick={() => setVideoOpen((prev) => !prev)}    
                                            className="text-blue-500 underline text-xs focus:outline-none"
                                        >
                                            {videoOpen ? "숨기기" : "보기"}
                                        </button>
                                    )}
                                </div>

                                {videoOpen && (
                                    <ul className="mt-2 space-y-1">
                                        {image.relatedVideos.map((video: any, idx: number) => (
                                            <li key={idx}>
                                                <a
                                                    href={video.url || video.link || `https://www.youtube.com/watch?v=${video.videoId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline text-sm"
                                                >
                                                    {video.title || video.name || video.videoId}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                </div>
                            ))}
                        </div>
                        </>
                    )}
                    {activeStep === 2 && (
                        // 3단계: 대표 표현 생성 결과 or 설명
                        <>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex gap-8">
                                <div className="text-gray-700 text-md">
                                    총 키워드 묶음 개수: <span className="font-bold text-lg">{history.images.length}</span>
                                </div>
                            </div>
                            <button className="text-blue-600 text-sm cursor-pointer hover:underline select-none"
                            onClick={() => {
                                setShowDetail_num(3);
                                setShowDetail(true);
                            }}
                            >
                                표현의 기준이 궁금해요 ?
                            </button>
                        </div>
                        {showDetail && (
                            <div className="flex z-50 top-0 left-0 w-full h-full justify-end">
                                <div className="bg-gray-200 rounded-xl p-3 px-6 w-[80%] h-full relative">
                                    <button className="absolute top-3 right-6 text-gray-400 hover:text-black text-xs bg-black/80 text-white rounded-full px-4 py-1 z-10"
                                    onClick={() => setShowDetail(false)}
                                    >
                                        닫기
                                    </button>
                                    <p className="text-md font-bold mb-4 text-black">{description[showDetail_num-1].title}</p>
                                    <p className="text-gray-500 text-sm whitespace-pre-line text-left ">{description[showDetail_num-1].desc}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col w-full overflow-y-auto mt-4">
                            {history.images.map((image, i) => (        
                                <div key={image.id + i} className="bg-white rounded-xl p-6 mb-4">
                                    <div className="text-black text-xl font-bold mb-4">
                                        #{image.main_keyword}
                                    </div>
                                    <div className="text-gray-500 text-sm font-medium mb-1">
                                        <span className="font-bold text-black">카테고리:</span> {image.category}
                                    </div>
                                    <div className="text-gray-500 text-sm font-medium mb-1">
                                        <span className="font-bold text-black">무드:</span> {image.mood_keyword}
                                    </div>
                                    <div className="text-gray-500 text-sm font-medium mb-1">
                                        <span className="font-bold text-black">설명: </span> 
                                        
                                        {descriptionOpen ?   (
                                            <>
                                            {image.description}
                                            <button className="text-blue-500 underline text-xs focus:outline-none" onClick={() => setDescriptionOpen((prev) => !prev)}>줄이기   </button>
                                            </>
                                        ):(
                                            <>
                                            {image.description.slice(0, 100)}...                                        
                                            <button className="text-blue-500 underline text-xs focus:outline-none" onClick={() => setDescriptionOpen((prev) => !prev)}>더보기</button>
                                            </>
                                        )}
                                        </div>
                                    <div className="text-gray-500 text-sm mt-3 mb-3 flex flex-wrap gap-1">
                                        <div className="font-bold text-black mr-1">키워드:</div> 
                                        {image.keywords.map((kw, i) => (
                                            <span key={kw + i} className="bg-gray-200 text-gray-700 rounded-full px-2 py-1 text-xs font-medium">{kw}</span>
                                        ))}
                                        
                                    </div>
                                    
                                    
                                    
                                    {/* 포함된 영상 수 */}
                                    <div className="flex items-center gap-2 text-gray-500 text-sm font-semibold">
                                    <span>포함된 영상: {image.relatedVideos.length}개</span>
                                    {image.relatedVideos.length > 0 && (
                                        <button
                                            onClick={() => setVideoOpen((prev) => !prev)}    
                                            className="text-blue-500 underline text-xs focus:outline-none"
                                        >
                                            {videoOpen ? "숨기기" : "보기"}
                                        </button>
                                    )}
                                </div>

                                {videoOpen && (
                                    <ul className="mt-2 space-y-1">
                                        {image.relatedVideos.map((video: any, idx: number) => (
                                            <li key={idx}>
                                                <a
                                                    href={video.url || video.link || `https://www.youtube.com/watch?v=${video.videoId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline text-sm"
                                                >
                                                    {video.title || video.name || video.videoId}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                </div>
                            ))}
                        </div>
                        </>
                    )}
                    {activeStep === 3 && (
                        // 4단계: 그룹 이미지화 결과 or 설명
                        <>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex gap-8">
                                <div className="text-gray-700 text-md">
                                    총 키워드 묶음 개수: <span className="font-bold text-lg">{history.images.length}</span>
                                </div>
                                
                            </div>
                            <button className="text-blue-600 text-sm cursor-pointer hover:underline select-none"
                            onClick={() => {
                                setShowDetail_num(4);
                                setShowDetail(true);
                            }}
                            >
                                표현의 기준이 궁금해요 ?
                            </button>
                        </div>
                        {showDetail && (
                            <div className="flex z-50 top-0 left-0 w-full h-full justify-end">
                                <div className="bg-gray-200 rounded-xl p-3 px-6 w-[80%] h-full relative">
                                    <button className="absolute top-3 right-6 text-gray-400 hover:text-black text-xs bg-black/80 text-white rounded-full px-4 py-1 z-10"
                                    onClick={() => setShowDetail(false)}
                                    >
                                        닫기
                                    </button>
                                    <p className="text-md font-bold mb-4 text-black">{description[showDetail_num-1].title}</p>
                                    <p className="text-gray-500 text-sm whitespace-pre-line text-left ">{description[showDetail_num-1].desc}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col w-full overflow-y-auto mt-10">
                            {history.images.map((image, i) => (        
                                <div key={image.id + i} className="flex bg-white rounded-2xl shadow mb-6 w-full max-w-4xl gap-6 ">
                                    <div className="w-[50%] h-full relative overflow-hidden rounded-l-2xl">
                                        <img
                                            src={image.src}
                                            alt={image.main_keyword}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="w-[50%] flex flex-col justify-start ">
                                        <div key={image.id + i} className="bg-white rounded-xl p-6 mb-4">
                                        <div className="text-black text-xl font-bold mb-4">
                                            #{image.main_keyword}
                                        </div>
                                        <div className="text-gray-500 text-sm font-medium mb-1">
                                            <span className="font-bold text-black">카테고리:</span> {image.category}
                                        </div>
                                        <div className="text-gray-500 text-sm font-medium mb-1">
                                            <span className="font-bold text-black">무드:</span> {image.mood_keyword}
                                        </div>
                                        <div className="text-gray-500 text-sm font-medium mb-1">
                                            <span className="font-bold text-black">설명: </span> 
                                            
                                            {descriptionOpen ?   (
                                                <>
                                                {image.description}
                                                <button className="text-blue-500 underline text-xs focus:outline-none" onClick={() => setDescriptionOpen((prev) => !prev)}>줄이기   </button>
                                                </>
                                            ):(
                                                <>
                                                {image.description.slice(0, 100)}...                                        
                                                <button className="text-blue-500 underline text-xs focus:outline-none" onClick={() => setDescriptionOpen((prev) => !prev)}>더보기</button>
                                                </>
                                            )}
                                            </div>
                                        <div className="text-gray-500 text-sm mt-3 mb-3 flex flex-wrap gap-1">
                                            <div className="font-bold text-black mr-1">키워드:</div> 
                                            {image.keywords.map((kw, i) => (
                                                <span key={kw + i} className="bg-gray-200 text-gray-700 rounded-full px-2 py-1 text-xs font-medium">{kw}</span>
                                            ))}
                                            
                                        </div>
                                        
                                        
                                        
                                        {/* 포함된 영상 수 */}
                                        <div className="flex items-center gap-2 text-gray-500 text-sm font-semibold">
                                            <span>포함된 영상: {image.relatedVideos.length}개</span>
                                            {image.relatedVideos.length > 0 && (
                                                <button
                                                    onClick={() => setVideoOpen((prev) => !prev)}    
                                                    className="text-blue-500 underline text-xs focus:outline-none"
                                                >
                                                    {videoOpen ? "숨기기" : "보기"}
                                                </button>
                                            )}
                                        </div>

                                        {videoOpen && (
                                            <ul className="mt-2 space-y-1">
                                                {image.relatedVideos.map((video: any, idx: number) => (
                                                    <li key={idx}>
                                                        <a
                                                            href={video.url || video.link || `https://www.youtube.com/watch?v=${video.videoId}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline text-sm"
                                                        >
                                                            {video.title || video.name || video.videoId}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>

                        </>
                    )}
                </div>
                
            </div>
        </div>
    );
};
