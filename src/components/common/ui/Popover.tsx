import React, { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../lib/utils';

interface PopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  className?: string;
}

export const Popover: React.FC<PopoverProps> = ({
  trigger,
  content,
  open: controlledOpen,
  onOpenChange,
  align = 'start',
  sideOffset = 4,
  className,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const updateCoords = useCallback(() => {
    if (triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const content = contentRef.current;
      
      let top = triggerRect.bottom + sideOffset;
      let left = triggerRect.left;

      // If content is rendered, we can do smarter positioning
      if (content) {
        const contentRect = content.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Basic alignment calculation
        if (align === 'center') {
          left = triggerRect.left + (triggerRect.width / 2) - (contentRect.width / 2);
        } else if (align === 'end') {
          left = triggerRect.right - contentRect.width;
        }

        // Right side boundary
        if (left + contentRect.width > viewportWidth - 12) {
          left = viewportWidth - contentRect.width - 12;
        }
        // Left side boundary
        if (left < 12) {
          left = 12;
        }

        // Bottom boundary check - flip to top if it doesn't fit
        if (top + contentRect.height > viewportHeight - 12) {
          const above = triggerRect.top - contentRect.height - sideOffset;
          // Only flip if it actually fits above, otherwise just clamp to bottom
          if (above > 12) {
            top = above;
          } else {
            top = viewportHeight - contentRect.height - 12;
          }
        }
      }

      setCoords({
        top,
        left,
        width: triggerRect.width
      });
    }
  }, [align, sideOffset]);

  useLayoutEffect(() => {
    if (isOpen) {
      updateCoords();
    }
  }, [isOpen, updateCoords]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current && 
        !triggerRef.current.contains(event.target as Node) &&
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) updateCoords();
    };
    const handleResize = () => {
        if (isOpen) updateCoords();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, updateCoords, setOpen]);

  return (
    <>
      <div ref={triggerRef} onClick={() => setOpen(!isOpen)} className="inline-block w-full">
        {trigger}
      </div>
      {isOpen && createPortal(
        <div
          ref={contentRef}
          data-popover-content="true"
          className={cn(
            "fixed z-[9999] rounded-md border border-slate-200 bg-white shadow-md outline-none animate-in fade-in-0 zoom-in-95",
            className
          )}
          style={{
            top: coords.top,
            left: coords.left,
          }}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
};