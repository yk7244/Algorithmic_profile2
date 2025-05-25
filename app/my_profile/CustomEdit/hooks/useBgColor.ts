import { useState, useEffect } from "react";

export function useBgColor(defaultColor: string = 'bg-[#F2F2F2]') {
  const [bgColor, setBgColor] = useState(defaultColor);

  useEffect(() => {
    const savedBgColor = localStorage.getItem('moodboard-bg-color');
    if (savedBgColor) setBgColor(savedBgColor);
  }, []);

  const handleBgColorChange = (colorClass: string) => {
    setBgColor(colorClass);
    localStorage.setItem('moodboard-bg-color', colorClass);
  };

  return { bgColor, handleBgColorChange };
} 