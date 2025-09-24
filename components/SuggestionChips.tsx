import React from 'react';

interface SuggestionChipsProps {
    suggestions: string[];
    onSelect: (suggestion: string) => void;
}

const SuggestionChips: React.FC<SuggestionChipsProps> = ({ suggestions, onSelect }) => {
    if (!suggestions || suggestions.length === 0) return null;

    return (
        <div className="w-full mt-3 animate-slide-in-bottom">
            <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => onSelect(suggestion)}
                        className="px-3 py-1.5 text-sm font-medium rounded-full bg-bg-tertiary hover:bg-bg-tertiary-hover text-text-primary transition-all duration-200 hover:shadow-sm border border-border-primary"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SuggestionChips;