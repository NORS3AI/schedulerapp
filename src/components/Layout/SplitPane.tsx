import { useState, useCallback, useRef, ReactNode } from 'react';

interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
}

export function SplitPane({
  left,
  right,
  defaultLeftWidth = 350,
  minLeftWidth = 250,
  maxLeftWidth = 500,
}: SplitPaneProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      if (newWidth >= minLeftWidth && newWidth <= maxLeftWidth) {
        setLeftWidth(newWidth);
      }
    },
    [isDragging, minLeftWidth, maxLeftWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex h-full"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Left pane - hidden when printing */}
      <div
        className="flex-shrink-0 overflow-hidden no-print"
        style={{ width: leftWidth }}
      >
        {left}
      </div>

      {/* Divider - hidden when printing */}
      <div
        className={`w-1 bg-gray-200 dark:bg-gray-700 cursor-col-resize hover:bg-primary-400 dark:hover:bg-primary-600 transition-colors no-print ${
          isDragging ? 'bg-primary-500' : ''
        }`}
        onMouseDown={handleMouseDown}
      />

      {/* Right pane - main print area */}
      <div className="flex-1 overflow-hidden print:overflow-visible">{right}</div>
    </div>
  );
}
