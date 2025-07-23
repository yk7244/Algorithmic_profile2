interface AutoArrangeButtonProps {
  isEditing: boolean;
  onAutoArrange: () => void;
}

const AutoArrangeButton = ({ isEditing, onAutoArrange }: AutoArrangeButtonProps) => {
if (!isEditing) return null;

  return (
    <div className="fixed top-[160px] right-[100px] z-30 group">
      <button
        onClick={onAutoArrange}
        className="px-4 py-2 backdrop-blur-sm text-gray-700 rounded-full shadow-md bg-black text-white transition-all"
        title="자동 정렬"
      >
        <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        >
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
      </button>
      {/* 호버 툴팁 */}
      <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white text-black px-6 py-3 rounded-2xl shadow-lg text-base font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none after:content-[''] after:absolute after:left-full after:top-1/2 after:-translate-y-1/2 after:border-8 after:border-y-transparent after:border-l-white after:border-r-transparent after:ml-[-1px]">
        이미지들을 자동으로 깔끔하게 정렬합니다.
      </div>

      
    </div>
);
};

export default AutoArrangeButton; 