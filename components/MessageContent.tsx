import React, { useState, useEffect, useRef } from 'react';
import ChevronDownIcon from './icons/ChevronDownIcon';

// Props interface including the sender
interface MessageContentProps {
  text: string;
  isStreaming?: boolean;
  sender: 'user' | 'ai' | 'system';
}


// Renders inline markdown elements like bold and code.
const renderInlineMarkdown = (text: string) => {
  if (!text) return null;
  // Split by bold and code markdown, but keep the delimiters for processing.
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="bg-bg-tertiary text-sm rounded px-1 py-0.5">{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

const orderedListRegex = /^\d+[.)]\s/;
const unorderedListRegex = /^(\*|-|•)\s/;

// A more robust, line-by-line markdown parser that correctly handles various block types.
const renderFormattedText = (text: string) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Headings
        if (trimmedLine.startsWith('### ')) { elements.push(<h3 key={i}>{renderInlineMarkdown(trimmedLine.substring(4))}</h3>); i++; continue; }
        if (trimmedLine.startsWith('## ')) { elements.push(<h2 key={i}>{renderInlineMarkdown(trimmedLine.substring(3))}</h2>); i++; continue; }
        if (trimmedLine.startsWith('# ')) { elements.push(<h1 key={i}>{renderInlineMarkdown(trimmedLine.substring(2))}</h1>); i++; continue; }

        // Unordered List
        if (unorderedListRegex.test(trimmedLine)) {
            const listItems = [];
            while (i < lines.length && unorderedListRegex.test(lines[i].trim())) {
                listItems.push(lines[i].trim().replace(unorderedListRegex, ''));
                i++;
            }
            elements.push(<ul key={`ul-${i}`}>{listItems.map((item, idx) => <li key={idx}>{renderInlineMarkdown(item)}</li>)}</ul>);
            continue;
        }

        // Ordered List
        if (orderedListRegex.test(trimmedLine)) {
            const listItems = [];
            while (i < lines.length && orderedListRegex.test(lines[i].trim())) {
                listItems.push(lines[i].trim().replace(orderedListRegex, ''));
                i++;
            }
            elements.push(<ol key={`ol-${i}`}>{listItems.map((item, idx) => <li key={idx}>{renderInlineMarkdown(item)}</li>)}</ol>);
            continue;
        }
        
        // Empty lines are treated as breaks between elements
        if (trimmedLine === '') {
            i++;
            continue;
        }

        // Default to Paragraph: Group consecutive non-empty, non-block lines.
        const paraLines: string[] = [];
        while (i < lines.length && lines[i].trim() !== '') {
            const currentLineTrimmed = lines[i].trim();
            // Break if we hit a new block type
            if (/^(#)/.test(currentLineTrimmed) || unorderedListRegex.test(currentLineTrimmed) || orderedListRegex.test(currentLineTrimmed)) {
                break;
            }
            paraLines.push(lines[i]);
            i++;
        }

        if (paraLines.length > 0) {
            // Join with a space to respect soft line breaks within a paragraph.
            elements.push(<p key={`p-${i}`}>{renderInlineMarkdown(paraLines.join(' '))}</p>);
        }
    }

    return <>{elements}</>;
};


const MessageContent: React.FC<MessageContentProps> = ({ text, isStreaming = false, sender }) => {
  const [displayedText, setDisplayedText] = useState('');
  const animationTimer = useRef<number | null>(null);
  const textRef = useRef(text);
  textRef.current = text;

  // New state and constants for collapsible content
  const CONTENT_THRESHOLD = 1200; // Characters to trigger collapsibility
  const isLongContent = text.length > CONTENT_THRESHOLD;
  const [isExpanded, setIsExpanded] = useState(false); // Long content starts collapsed

  // Determine if content should be expanded (always true when streaming)
  const isEffectivelyExpanded = isExpanded || isStreaming;
  const canBeCollapsed = isLongContent && !isStreaming;

  // Letter-by-letter streaming animation effect.
  useEffect(() => {
    if (!isStreaming) {
      if (animationTimer.current) clearTimeout(animationTimer.current);
      setDisplayedText(text);
      return;
    }

    // Handle stream resets (e.g., regeneration)
    if (displayedText && !text.startsWith(displayedText)) {
      setDisplayedText('');
    }

    const animate = () => {
      setDisplayedText(current => {
        const fullText = textRef.current;
        if (current.length >= fullText.length) {
          // Animation complete for the current text prop.
          return current;
        }
        
        // Reveal the text one character at a time for a "letter by letter" effect.
        const newText = fullText.substring(0, current.length + 1);

        // Schedule the next frame. A small delay creates the animation effect.
        animationTimer.current = window.setTimeout(animate, 25);
        return newText;
      });
    };

    // Clear any existing animation timer before starting a new one.
    if (animationTimer.current) {
      clearTimeout(animationTimer.current);
    }
    animate();

    // Cleanup function to stop animation when component unmounts or dependencies change.
    return () => {
      if (animationTimer.current) {
        clearTimeout(animationTimer.current);
        animationTimer.current = null;
      }
    };
  }, [text, isStreaming]);

  const content = renderFormattedText(displayedText);
  
  // Determine gradient color based on sender for the fade-out effect
  const gradientColor = sender === 'user'
      ? 'from-bg-accent'
      : 'from-bg-secondary';
      
  // By applying the prose classes directly to the content wrapper,
  // we ensure list styles (like custom bullets) are applied correctly,
  // even within the complex layout of the collapsible container.
  const proseClasses = `prose ${sender === 'user' ? 'prose-invert' : ''}`;

  return (
    <div className="relative">
      <div
        className={`
          transition-all duration-700 ease-in-out overflow-hidden
          ${proseClasses}
          ${isLongContent && !isEffectivelyExpanded ? 'max-h-80' : 'max-h-[5000px]'}
        `}
      >
        {content}
        {/* Fade-out effect for collapsed content */}
        {isLongContent && !isEffectivelyExpanded && (
          <div className={`absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t ${gradientColor} to-transparent pointer-events-none`} />
        )}
      </div>

      {canBeCollapsed && (
        <div className={`
            flex justify-end 
            ${isExpanded ? 'pt-2' : 'absolute bottom-2 right-2'}
        `}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-bg-tertiary/80 hover:bg-bg-tertiary-hover/90 backdrop-blur-sm text-text-secondary hover:text-text-primary transition-all duration-200"
            aria-expanded={isExpanded}
          >
            <span>{isExpanded ? 'Show Less' : 'Show More'}</span>
            <ChevronDownIcon className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageContent;