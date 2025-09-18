import React from 'react';
import type { AIModel } from '../types';
import { AVAILABLE_MODELS } from '../constants';

interface ChatModelSwitcherProps {
    currentModelId: AIModel['id'];
    onSelectModel: (modelId: AIModel['id']) => void;
    disabled: boolean;
}

const ChatModelSwitcher: React.FC<ChatModelSwitcherProps> = ({ currentModelId, onSelectModel, disabled }) => {
    return (
        <div className="flex items-center flex-wrap gap-2">
            {AVAILABLE_MODELS.map((model) => (
                <button
                    key={model.id}
                    onClick={() => onSelectModel(model.id)}
                    disabled={disabled}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        currentModelId === model.id
                            ? 'bg-bg-accent text-text-on-accent border-transparent shadow'
                            : 'bg-bg-secondary hover:bg-bg-tertiary-hover border-border-secondary'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={model.description}
                >
                    <model.icon className="w-4 h-4" />
                    <span>{model.name}</span>
                </button>
            ))}
        </div>
    );
};

export default React.memo(ChatModelSwitcher);