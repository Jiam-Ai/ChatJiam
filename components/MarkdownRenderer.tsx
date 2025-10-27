
import React from 'react';

// This function handles inline formatting like **bold**, *italic*, links, etc.
const parseInlineText = (text: string): React.ReactNode => {
    // Regex to capture bold, italic, strikethrough, inline code, and links.
    const parts = text
        .split(/(\*\*.*?\*\*|\*.*?\*|~~.*?~~|`.*?`|\[.*?\]\(.*?\))/g)
        .filter(part => part); // Remove empty strings from split

    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={index}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('~~') && part.endsWith('~~')) {
            return <s key={index}>{part.slice(2, -2)}</s>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={index} className="font-code bg-black/50 text-cyan-400 px-1 py-0.5 rounded-md text-sm">{part.slice(1, -1)}</code>;
        }
        const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
            return <a key={index} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300 transition-colors">{linkMatch[1]}</a>;
        }
        return part;
    });
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.trim().split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Headings
        const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const text = headingMatch[2];
            // FIX: The `JSX` namespace was not found, causing errors with dynamic tags.
            // Using a specific string literal union type for the tag name resolves the issue.
            const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
            const classes = [
                "", // index 0 placeholder
                "text-2xl font-title font-bold mt-4 mb-2", // h1
                "text-xl font-title font-bold mt-4 mb-2", // h2
                "text-lg font-title font-bold mt-3 mb-1", // h3
                "text-base font-bold mt-2 mb-1", // h4
                "text-sm font-semibold mt-2 mb-1", // h5
                "text-xs font-semibold mt-2 mb-1"  // h6
            ];
            elements.push(<Tag key={`heading-${i}`} className={classes[level]}>{parseInlineText(text)}</Tag>);
            i++;
            continue;
        }

        // Horizontal Rule
        if (line.trim().match(/^(-{3,}|\*{3,}|_{3,})$/)) {
            elements.push(<hr key={`hr-${i}`} className="my-4 border-gray-600" />);
            i++;
            continue;
        }

        // Blockquotes
        if (line.startsWith('> ')) {
            const blockquoteLines = [];
            while (i < lines.length && lines[i].startsWith('> ')) {
                blockquoteLines.push(lines[i].substring(2));
                i++;
            }
            elements.push(
                <blockquote key={`quote-${i}`} className="border-l-4 border-gray-500 pl-4 my-2 italic text-gray-400">
                    <p>{parseInlineText(blockquoteLines.join('\n'))}</p>
                </blockquote>
            );
            continue;
        }
        
        // Lists
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            const listItems = [];
            while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
                listItems.push(lines[i].trim().substring(2));
                i++;
            }
             elements.push(
                <ul key={`list-${i}`} className="list-disc list-inside space-y-1 my-2 pl-4">
                    {listItems.map((item, index) => (
                        <li key={index}>{parseInlineText(item)}</li>
                    ))}
                </ul>
            );
            continue;
        }
        
        // Paragraphs
        if (line.trim()) {
            elements.push(<p key={`p-${i}`}>{parseInlineText(line)}</p>);
        }
        
        i++;
    }
    
    return <div className="break-words flex flex-col gap-y-3">{elements}</div>;
};

export default MarkdownRenderer;
