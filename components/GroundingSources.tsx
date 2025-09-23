import React, { useState } from 'react';
import type { GroundingChunk } from '../types';
import SearchIcon from './icons/SearchIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface GroundingSourcesProps {
    chunks: GroundingChunk[];
}

// This helper function now validates the URI and returns both the hostname (or original URI) and a boolean indicating validity.
// This prevents the `new URL()` constructor from being called with invalid data outside of a try-catch block.
const getHostnameAndValidity = (uri: string): [string, boolean] => {
    if (typeof uri !== 'string' || !uri) {
        return ['Invalid source URI', false];
    }
    try {
        const url = new URL(uri);
        return [url.hostname, true];
    } catch (e) {
        console.warn(`Invalid URL provided for grounding source: ${uri}`);
        return [uri, false]; // Return original uri for display, but mark as invalid
    }
};


const GroundingSources: React.FC<GroundingSourcesProps> = ({ chunks }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!chunks || chunks.length === 0) {
        return null;
    }

    return (
        <div className="mt-3 pt-3 border-t border-border-secondary/50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full text-left rounded-md p-1 -m-1 hover:bg-bg-tertiary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-expanded={isOpen}
                aria-controls="grounding-sources-list"
            >
                <h4 className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                    <SearchIcon className="w-4 h-4" />
                    <span>Sources from Google Search ({chunks.length})</span>
                </h4>
                <ChevronDownIcon className={`w-5 h-5 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <div
                id="grounding-sources-list"
                className={`transition-all duration-300 ease-in-out overflow-y-auto ${
                    isOpen ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="space-y-1.5 pt-1">
                    {chunks.map((chunk, index) => {
                        // Ensure chunk.web exists to prevent runtime errors.
                        if (!chunk || !chunk.web) return null;

                        const [hostname, isValid] = getHostnameAndValidity(chunk.web.uri);
                        
                        // If the URL is invalid, we render a disabled-looking element that is not a link.
                        // This prevents any attempt to use the invalid URI in an href, which is a more robust fix.
                        if (!isValid) {
                            return (
                                <div 
                                    key={index}
                                    className="block p-2 rounded-lg bg-bg-tertiary/50"
                                >
                                    <p className="text-sm font-medium text-text-secondary truncate" title={chunk.web.title}>
                                        {chunk.web.title || 'Source'}
                                    </p>
                                    <p className="text-xs text-red-500 truncate" title={`Invalid URI: ${hostname}`}>
                                        Invalid source link
                                    </p>
                                </div>
                            );
                        }
                        
                        // For valid URLs, render the full anchor tag.
                        return (
                            <a 
                                key={index} 
                                href={chunk.web.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block p-2 rounded-lg bg-bg-tertiary/50 hover:bg-bg-tertiary-hover transition-colors"
                            >
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate" title={chunk.web.title}>
                                    {chunk.web.title || hostname}
                                </p>
                                <p className="text-xs text-text-secondary truncate" title={chunk.web.uri}>
                                    {hostname}
                                </p>
                            </a>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default GroundingSources;