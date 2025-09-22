import React, { useState, useEffect, useRef } from 'react';

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
        if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
            const listItems = [];
            // Gather all consecutive list items
            while (i < lines.length && (lines[i].trim().startsWith('* ') || lines[i].trim().startsWith('- '))) {
                listItems.push(lines[i].trim().substring(2));
                i++;
            }
            elements.push(<ul key={`ul-${i}`}>{listItems.map((item, idx) => <li key={idx}>{renderInlineMarkdown(item)}</li>)}</ul>);
            continue;
        }

        // Ordered List
        if (/^\d+\.\s/.test(trimmedLine)) {
            const listItems = [];
            while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
                listItems.push(lines[i].trim().replace(/^\d+\.\s/, ''));
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
            if (/^(#|(\*|-)\s|\d+\.\s)/.test(currentLineTrimmed)) {
                break;
            }
            paraLines.push(lines[i]);
            i++;
        }

        if (paraLines.length > 0) {
            // Join with space for soft line breaks within a paragraph
            elements.push(<p key={`p-${i}`}>{renderInlineMarkdown(paraLines.join(' '))}</p>);
        }
    }

    return <>{elements}</>;
};


const MessageContent: React.FC<{ text: string; isStreaming?: boolean }> = ({ text, isStreaming = false }) => {
  const [displayedText, setDisplayedText] = useState('');
  const animationTimer = useRef<number | null>(null);
  const textRef = useRef(text);
  textRef.current = text;

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

  // Use the new, robust renderer on the streaming text.
  return renderFormattedText(displayedText);
};

export default MessageContent;