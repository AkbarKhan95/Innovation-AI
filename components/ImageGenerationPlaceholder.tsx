import React from 'react';

interface ImageGenerationPlaceholderProps {
    message: string;
}

const ImageGenerationPlaceholder: React.FC<ImageGenerationPlaceholderProps> = ({ message }) => {
    const dotCount = 64; // 8x8 grid
    const dots = Array.from({ length: dotCount });

    return (
        <div className="relative aspect-square w-full p-4 bg-bg-tertiary rounded-lg overflow-hidden">
            <p className="absolute top-4 left-1/2 -translate-x-1/2 text-text-secondary text-sm animate-fade-in z-10 whitespace-nowrap">
                {message}
            </p>
            <div className="grid grid-cols-8 gap-3 w-full h-full">
                {dots.map((_, i) => {
                    const row = Math.floor(i / 8);
                    const col = i % 8;
                    return (
                        <div
                            key={i}
                            className="w-full h-full rounded-full bg-bg-secondary animate-dot-pulse"
                            style={{ animationDelay: `${(row * 0.1) + (col * 0.05)}s` }}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default ImageGenerationPlaceholder;
