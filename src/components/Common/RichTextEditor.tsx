import { useRef, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text...',
  className = '',
  minHeight = '100px',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      editorRef.current.innerHTML = value || '';
    }
    isInternalUpdate.current = false;
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      const html = editorRef.current.innerHTML;
      // Sanitize HTML before saving
      const clean = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'br', 'p', 'a'],
        ALLOWED_ATTR: ['href', 'target'],
      });
      onChange(clean);
    }
  }, [onChange]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
      }
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  return (
    <div className={`border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          title="Bold (Ctrl+B)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          title="Italic (Ctrl+I)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 4h4m-2 0l-4 16m0 0h4" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          title="Underline (Ctrl+U)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v7a5 5 0 0010 0V4M5 20h14" />
          </svg>
        </button>
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          title="Bullet List"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            <circle cx="2" cy="6" r="1" fill="currentColor" />
            <circle cx="2" cy="12" r="1" fill="currentColor" />
            <circle cx="2" cy="18" r="1" fill="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          title="Numbered List"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13" />
            <text x="2" y="8" fontSize="8" fill="currentColor">1</text>
            <text x="2" y="14" fontSize="8" fill="currentColor">2</text>
            <text x="2" y="20" fontSize="8" fill="currentColor">3</text>
          </svg>
        </button>
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        <button
          type="button"
          onClick={insertLink}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          title="Insert Link"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="p-3 bg-white dark:bg-gray-800 text-sm focus:outline-none prose prose-sm dark:prose-invert max-w-none"
        style={{ minHeight }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        [contenteditable] li {
          margin: 0.25rem 0;
        }
        [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

// Display component for showing rich text (read-only)
export function RichTextDisplay({ html, className = '' }: { html: string; className?: string }) {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'br', 'p', 'a'],
    ALLOWED_ATTR: ['href', 'target'],
  });

  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
