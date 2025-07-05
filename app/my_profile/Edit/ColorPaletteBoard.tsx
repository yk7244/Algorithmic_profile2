import React from "react";

interface ColorOption {
  name: string;
  class: string;
}

interface ColorPaletteBoardProps {
  colorOptions: ColorOption[];
  bgColor: string;
  onColorChange: (colorClass: string) => void;
}

const ColorPaletteBoard: React.FC<ColorPaletteBoardProps> = ({
  colorOptions,
  bgColor,
  onColorChange,
}) => (
  <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-auto bg-white/90 backdrop-blur-sm pr-10 pl-10 py-4 rounded-[60px] shadow-lg z-50">
    <div className="flex flex-col items-center gap-1">
      <p className="text-gray-700 text-sm">배경색 변경</p>
      <div className="flex items-center gap-3">
        {colorOptions.map((color) => (
          <button
            key={color.class}
            onClick={() => onColorChange(color.class)}
            className={`
              w-6 h-6 rounded-full ${color.class} transition-all duration-300
              hover:scale-110 shadow-md hover:shadow-lg
              ${bgColor === color.class ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
              relative group
            `}
          >
            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2  
              bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 
              group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {color.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default ColorPaletteBoard; 