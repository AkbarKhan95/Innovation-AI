import React, { useState, useRef, useEffect } from 'react';
import type { AIModel } from '../types';
import { AVAILABLE_MODELS } from '../constants';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface ModelSwitcherProps {
    currentModelId: AIModel['id'];
    onSelectModel: (modelId: AIModel['id']) => void;
    title: string;
}

const ModelSwitcher: React.FC<ModelSwitcherProps> = ({ currentModelId, onSelectModel, title }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const currentModel = AVAILABLE_MODELS.find(m => m.id === currentModelId) || AVAILABLE_MODELS[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (modelId: AIModel['id']) => {
        onSelectModel(modelId);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="flex flex-col items-center md:items-start">
                 <h1 className="text-lg font-semibold truncate px-2 text-text-primary hidden md:block">{title}</h1>
                 <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-bg-tertiary-hover transition-colors"
                 >
                    <currentModel.icon className="w-5 h-5 text-bg-accent" />
                    <span className="text-sm font-medium text-text-secondary">{currentModel.name}</span>
                    <ChevronDownIcon className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                 </button>
            </div>

            {isOpen && (
                <div className="absolute top-full mt-2 z-20 w-64 bg-bg-secondary rounded-lg shadow-xl border border-border-primary overflow-hidden animate-slide-in-bottom origin-top-left">
                    {AVAILABLE_MODELS.map(model => (
                        <button
                            key={model.id}
                            onClick={() => handleSelect(model.id)}
                            className={`w-full flex items-start text-left gap-3 p-3 transition-colors ${currentModelId === model.id ? 'bg-bg-accent/10' : 'hover:bg-bg-tertiary'}`}
                        >
                            <model.icon className={`w-6 h-6 flex-shrink-0 ${currentModelId === model.id ? 'text-bg-accent' : 'text-text-secondary'}`} />
                            <div>
                                <p className={`font-semibold text-sm ${currentModelId === model.id ? 'text-bg-accent' : 'text-text-primary'}`}>{model.name}</p>
                                <p className="text-xs text-text-secondary">{model.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ModelSwitcher;
