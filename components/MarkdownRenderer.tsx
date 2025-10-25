
import React from 'react';

// This function handles inline formatting like **bold** and *italic*.
const parseInlineText = (text: string): React.ReactNode => {
    // A simple regex approach for non-nested formatting.
    // Split by bold, italic or code, then render the appropriate tag.
    const parts = text
        .split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g)
        .filter(part => part); // Remove empty strings from split

    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={index}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={index} className="font-code bg-black/50 text-cyan-400 px-1 py-0.5 rounded-md text-sm">{part.slice(1, -1)}</code>;
        }
        return part;
    });
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.trim().split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={elements.length} className="list-disc list-inside space-y-1 my-2 pl-4">
                    {listItems.map((item, index) => (
                        <li key={index}>{parseInlineText(item)}</li>
                    ))}
                </ul>
            );
            listItems = [];
        }
    };

    lines.forEach(line => {
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            // It's a list item
            listItems.push(line.trim().substring(2));
        } else {
            // It's not a list item, so if we were in a list, render it.
            flushList();
            // Then render the current line as a paragraph.
            if (line.trim()) {
                elements.push(<p key={elements.length}>{parseInlineText(line)}</p>);
            }
        }
    });

    // Flush any remaining list items at the end of the content
    flushList();

    return <div className="break-words flex flex-col gap-y-3">{elements}</div>;
};

export default MarkdownRenderer;