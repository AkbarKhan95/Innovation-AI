import React, { useState, useEffect, useRef } from 'react';

// A more robust markdown renderer for inline elements.
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

const MessageContent: React.FC<{ text: string; isStreaming?: boolean }> = ({ text, isStreaming = false }) => {
  const [displayedText, setDisplayedText] = useState('');
  const animationFrameId = useRef<number | null>(null);
  const textRef = useRef(text);
  textRef.current = text;

  // Word-by-word streaming animation effect.
  useEffect(() => {
    if (!isStreaming) {
      if (animationFrameId.current) clearTimeout(animationFrameId.current);
      setDisplayedText(text);
      return;
    }
    
    if (displayedText && !text.startsWith(displayedText)) {
      setDisplayedText('');
    }

    const animate = () => {
      setDisplayedText(currentDisplayedText => {
        if (currentDisplayedText.length >= textRef.current.length) {
          return currentDisplayedText;
        }
        const remainingText = textRef.current.substring(currentDisplayedText.length);
        const match = remainingText.match(/^\S+\s*/);
        const nextWord = match ? match[0] : remainingText;
        const newText = currentDisplayedText + nextWord;
        animationFrameId.current = window.setTimeout(animate, 40);
        return newText;
      });
    };
    
    if (animationFrameId.current) clearTimeout(animationFrameId.current);
    animate();

    return () => {
      if (animationFrameId.current) {
        clearTimeout(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [text, isStreaming]);

  if (!displayedText) {
    return null;
  }

  // Refactored Rendering Logic:
  // 1. Split the text into "blocks" separated by one or more empty lines.
  // 2. Process each block to determine if it's a heading, table, list, or paragraph.
  // This correctly handles multi-line paragraphs, which was a flaw in the previous implementation.
  const blocks = displayedText.split(/\n\s*\n/).filter(block => block.trim() !== '');

  return (
    <>
      {blocks.map((block, blockIndex) => {
        const trimmedBlock = block.trim();
        
        // Check for Headings
        if (trimmedBlock.startsWith('# ')) return <h1 key={blockIndex}>{renderInlineMarkdown(trimmedBlock.substring(2))}</h1>;
        if (trimmedBlock.startsWith('## ')) return <h2 key={blockIndex}>{renderInlineMarkdown(trimmedBlock.substring(3))}</h2>;
        if (trimmedBlock.startsWith('### ')) return <h3 key={blockIndex}>{renderInlineMarkdown(trimmedBlock.substring(4))}</h3>;
        
        const lines = trimmedBlock.split('\n');

        // Check for Tables
        const isTable = lines.length > 1 && lines[0].includes('|') && lines[1].trim().replace(/[-|: ]/g, '').length === 0;
        if (isTable) {
            const headers = lines[0].split('|').map(h => h.trim()).filter(Boolean);
            const rows = lines.slice(2).map(rowLine => rowLine.split('|').map(c => c.trim()).filter(Boolean));
            return (
                <div key={blockIndex} className="overflow-x-auto my-4">
                    <table className="min-w-full divide-y divide-border-secondary border border-border-secondary">
                        <thead className="bg-bg-tertiary"><tr >{headers.map((h, i) => <th key={i} scope="col" className="px-4 py-2 text-left text-xs font-bold text-text-primary uppercase tracking-wider">{renderInlineMarkdown(h)}</th>)}</tr></thead>
                        <tbody className="bg-bg-secondary divide-y divide-border-primary">{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="px-4 py-2 whitespace-normal text-sm text-text-secondary">{renderInlineMarkdown(cell)}</td>)}</tr>)}</tbody>
                    </table>
                </div>
            );
        }

        // Check for Lists (Unordered and Ordered)
        // Heuristic: If every line in a block starts with a list marker, treat it as a list.
        const isUnorderedList = lines.every(line => line.trim().startsWith('* '));
        if (isUnorderedList) {
            return <ul key={blockIndex} className="list-disc list-inside space-y-1 my-2 pl-2">{lines.map((item, i) => <li key={i}>{renderInlineMarkdown(item.trim().substring(2))}</li>)}</ul>;
        }
        const isOrderedList = lines.every(line => /^\d+\.\s/.test(line.trim()));
        if (isOrderedList) {
            return <ol key={blockIndex} className="list-decimal list-inside space-y-1 my-2 pl-4">{lines.map((item, i) => <li key={i}>{renderInlineMarkdown(item.trim().replace(/^\d+\.\s/, ''))}</li>)}</ol>;
        }

        // Default to Paragraph
        // Join lines with a space to respect markdown's handling of soft line breaks.
        return <p key={blockIndex}>{renderInlineMarkdown(lines.join(' '))}</p>;
      })}
    </>
  );
};

export default MessageContent;
