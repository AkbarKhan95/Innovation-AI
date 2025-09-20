import React from 'react';
import XIcon from './icons/XIcon';
import BotIcon from './icons/BotIcon';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeatureSection: React.FC<{ title: string; children: React.ReactNode; screenshot: React.ReactNode; }> = ({ title, children, screenshot }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center py-6 border-b border-border-primary last:border-b-0">
        <div className="prose prose-sm max-w-none text-text-secondary">
            <h3 className="text-lg font-bold text-text-primary">{title}</h3>
            {children}
        </div>
        {screenshot}
    </div>
);

const ScreenshotPlaceholder: React.FC<{ description: string; className?: string }> = ({ description, className = '' }) => (
    <div className={`bg-bg-tertiary border border-border-secondary rounded-lg p-4 flex items-center justify-center text-center text-text-secondary text-xs aspect-[16/10] ${className}`}>
        {description}
    </div>
);


const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-modal-backdrop backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className="bg-bg-secondary shadow-2xl h-full w-full md:rounded-xl md:h-[90vh] md:max-h-[800px] md:max-w-4xl flex flex-col" onClick={e => e.stopPropagation()}>
            <header className="flex items-center justify-between flex-shrink-0 p-4 border-b border-border-primary">
                <div className="flex items-center gap-3">
                    <BotIcon className="w-7 h-7 text-bg-accent" />
                    <h2 className="text-xl font-bold text-text-primary">About Innovation AI</h2>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-bg-tertiary-hover transition-colors">
                    <XIcon className="w-5 h-5 text-text-secondary" />
                </button>
            </header>
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-none">
                    <p className="text-center text-text-secondary mb-8">
                        Welcome to Innovation AI, your dedicated partner for brainstorming and creative exploration. This app is built to help you generate, visualize, and organize your most ambitious ideas using the power of Google's Gemini models.
                    </p>
                    
                    <FeatureSection 
                        title="Multi-Modal Chat"
                        screenshot={<ScreenshotPlaceholder description="[Screenshot of the chat interface showing a text prompt, followed by AI-generated text, an image, and a video]" />}
                    >
                        <p>Engage in dynamic conversations, generate high-quality images, or create stunning videos directly from your prompts. Switch between Chat, Image, and Video modes to bring any concept to life.</p>
                    </FeatureSection>

                    <FeatureSection 
                        title="Brainstorm Board"
                        screenshot={<ScreenshotPlaceholder description="[Screenshot of the Brainstorm Board with several idea notes connected by lines]" />}
                    >
                        <p>Never lose a great idea. Send any AI response directly to your Brainstorm Board, a freeform canvas where you can connect concepts, rearrange thoughts, and build a visual map of your project.</p>
                    </FeatureSection>

                    <FeatureSection 
                        title="Grounded & Up-to-Date"
                        screenshot={<ScreenshotPlaceholder description="[Screenshot of an AI response with the 'Sources from Google Search' dropdown expanded, showing several web links]" />}
                    >
                        <p>Ask about current events or trending topics. The AI uses Google Search to provide answers grounded in the latest information from the web, complete with source citations for you to explore further.</p>
                    </FeatureSection>

                    <FeatureSection 
                        title="Personalize Your Experience"
                        screenshot={<ScreenshotPlaceholder description="[Screenshot of the Dashboard showing the grid of colorful theme selection buttons]" />}
                    >
                        <p>Make the app your own. Choose from a variety of beautiful themes, select a voice for text-to-speech, and customize your profile to create an environment that inspires you.</p>
                    </FeatureSection>

                    <p className="text-center text-text-secondary mt-8 font-semibold">Happy Innovating!</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AboutModal;