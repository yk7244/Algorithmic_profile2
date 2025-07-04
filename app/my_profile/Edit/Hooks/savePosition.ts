import { saveProfileImages } from "@/app/utils/saveImageData";

export function savePositions(images: any[], positions: Record<string, {x: number, y: number}>) {
    const ImagesPosition = images.map(img => {
      const pos = positions[img.id];
      if (pos) {
        return {
          ...img,
          left: `${pos.x}px`,
          top: `${pos.y}px`,
        };
      }
      return img;
    });
    saveProfileImages(ImagesPosition);
  }
  