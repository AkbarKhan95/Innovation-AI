
import React, { useState, useRef, useLayoutEffect } from 'react';
import type { AIModel } from '../types';
import { AVAILABLE_MODELS } from '../constants';

interface ChatModelSwitcherProps {
    currentModelId: AIModel['id'];
    onSelectModel: (modelId: AIModel['id']) => void;
    disabled: boolean;
}

const ChatModelSwitcher: React.FC<ChatModelSwitcherProps> = ({ currentModelId, onSelectModel, disabled }) => {
    const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({ opacity: 0 });
    const [isTransitionEnabled, setIsTransitionEnabled] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRefs = useRef<Map<AIModel['id'], HTMLButtonElement | null>>(new Map());

    useLayoutEffect(() => {
        const activeButton = buttonRefs.current.get(currentModelId);

        if (activeButton) {
            const { offsetLeft, offsetWidth } = activeButton;

            // First, update the position.
            setHighlightStyle({
                left: `${offsetLeft}px`,
                width: `${offsetWidth}px`,
                opacity: 1,
            });

            // If transitions are not yet enabled (i.e., this is the first mount)
            if (!isTransitionEnabled) {
                // Schedule enabling transitions to happen *after* this initial paint.
                // This ensures the browser doesn't try to animate from a zero/stale state.
                const rafId = requestAnimationFrame(() => {
                    setIsTransitionEnabled(true);
                });
                return () => cancelAnimationFrame(rafId);
            }
        }
    }, [currentModelId, isTransitionEnabled]);

    return (
        <div ref={containerRef} className="relative flex items-center p-1 bg-bg-secondary rounded-full shadow-inner">
            <div
                className={`absolute h-[calc(100%-8px)] my-1 bg-bg-accent rounded-full ease-in-out ${
                    isTransitionEnabled ? 'transition-all duration-300' : ''
                }`}
                style={highlightStyle}
            />
            {AVAILABLE_MODELS.map((model) => (
                <button
                    key={model.id}
                    ref={(el) => { buttonRefs.current.set(model.id, el); }}
                    onClick={() => onSelectModel(model.id)}
                    disabled={disabled}
                    className={`relative z-10 px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary ${
                        currentModelId === model.id
                            ? 'text-text-on-accent'
                            : 'text-text-secondary hover:text-text-primary'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={model.description}
                >
                    <div className="flex items-center gap-2">
                        <model.icon className="w-4 h-4"/>
                        <span>{model.name}</span>
                    </div>
                </button>
            ))}
        </div>
    );
};

export default React.memo(ChatModelSwitcher);