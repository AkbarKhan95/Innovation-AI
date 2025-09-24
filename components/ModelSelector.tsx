

import React from 'react';
import type { AIModel, Topic } from '../types';
import { AVAILABLE_MODELS, TOPICS } from '../constants';
import BotIcon from './icons/BotIcon';

interface ModelSelectorProps {
    onSelectModel: (modelId: AIModel['id']) => void;
    onPromptWithTopic: (topic: Topic) => void;
    onOpenAbout: () => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ onSelectModel, onPromptWithTopic, onOpenAbout }) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-start p-4 md:p-8 text-center overflow-y-auto">
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center pt-16 md:pt-12">
                <BotIcon className="w-16 h-16 md:w-20 md:h-20 text-text-secondary mb-4" />
                <h2 className="text-2xl md:text-3xl font-bold mb-3 text-text-primary">Welcome to Innovation AI</h2>
                <p className="text-text-secondary mb-4 max-w-lg">
                    Begin by selecting a powerful model, or kickstart your creative process with one of our innovation-focused topics.
                </p>
                <button onClick={onOpenAbout} className="text-sm text-blue-500 hover:underline mb-12">
                    Learn more about the app's features
                </button>

                {/* Model Selection Cards */}
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {AVAILABLE_MODELS.map((model) => (
                        <div key={model.id} className="flex flex-col text-left p-6 rounded-lg bg-bg-secondary border border-border-primary shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-blue-500/50">
                            <div className="flex items-center mb-3">
                                <model.icon className="w-7 h-7 mr-3 text-blue-500" />
                                <h3 className="font-bold text-lg text-text-primary">{model.name}</h3>
                            </div>
                            <p className="text-sm text-text-secondary flex-grow mb-4">
                                {model.description}
                            </p>
                            <button
                                onClick={() => onSelectModel(model.id)}
                                className="mt-auto w-full text-center px-4 py-2 bg-bg-accent text-text-on-accent font-semibold rounded-lg hover:bg-bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-bg-secondary"
                            >
                                Try Now
                            </button>
                        </div>
                    ))}
                </div>

                {/* Topic Starters */}
                <h3 className="text-lg font-semibold text-text-secondary text-center mt-12 mb-6">Or start with a topic...</h3>
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4">
                    {TOPICS.map((topic) => (
                        <button 
                            key={topic.id} 
                            onClick={() => onPromptWithTopic(topic)} 
                            className="flex flex-col items-center text-center p-4 rounded-lg bg-bg-tertiary hover:bg-bg-tertiary-hover border border-transparent hover:border-border-secondary transition-all duration-200"
                        >
                            <topic.icon className="w-8 h-8 mb-2 text-blue-500"/>
                            <h3 className="font-semibold text-sm text-text-primary">{topic.name}</h3>
                            <p className="text-xs text-text-secondary hidden sm:block mt-1">{topic.description}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ModelSelector;
