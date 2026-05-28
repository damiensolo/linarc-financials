import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

const TooltipContext = createContext<{
  isVisible: boolean;
  show: () => void;
  hide: () => void;
  triggerRef: React.RefObject<HTMLElement>;
} | null>(null);

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Small delay to prevent flickering if passing quickly
    timeoutRef.current = window.setTimeout(() => setIsVisible(true), 100); 
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setIsVisible(false), 100);
  };

  return (
    <TooltipContext.Provider value={{ isVisible, show, hide, triggerRef }}>
      {children}
    </TooltipContext.Provider>
  );
};

export const TooltipTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({ children, asChild }) => {
  const context = useContext(TooltipContext);
  if (!context) throw new Error("TooltipTrigger must be used within a Tooltip");

  const child = React.Children.only(children) as React.ReactElement<any>;
  
  // Merge refs to allow child to keep its own ref
  const mergedRef = (node: HTMLElement) => {
      // Handle Tooltip's internal ref
      if (typeof context.triggerRef === 'function') {
          (context.triggerRef as Function)(node);
      } else if (context.triggerRef) {
          (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }

      // Handle child's existing ref (In React 19, ref is in props)
      const childRef = child.props.ref || (child as any).ref;
      if (childRef) {
          if (typeof childRef === 'function') {
              childRef(node);
          } else if (childRef && typeof childRef === 'object' && 'current' in childRef) {
              (childRef as any).current = node;
          }
      }
  };

  return React.cloneElement(child, {
    ref: mergedRef,
    onMouseEnter: (e: React.MouseEvent) => {
        child.props.onMouseEnter?.(e);
        context.show();
    },
    onMouseLeave: (e: React.MouseEvent) => {
        child.props.onMouseLeave?.(e);
        context.hide();
    },
    // Accessibility
    'aria-describedby': context.isVisible ? 'tooltip-content' : undefined,
  });
};

interface TooltipContentProps {
    children: React.ReactNode;
    className?: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
}

export const TooltipContent: React.FC<TooltipContentProps> = ({ children, className = '', side = 'top', align = 'center' }) => {
  const context = useContext(TooltipContext);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (context?.isVisible && context.triggerRef.current) {
      const updatePosition = () => {
          const trigger = context.triggerRef.current!;
          const rect = trigger.getBoundingClientRect();
          
          let top = 0;
          let left = 0;
          const offset = 8; // Gap between trigger and tooltip
          
          // Use fixed positioning logic (viewport relative)
          switch (side) {
            case 'top':
                top = rect.top - offset;
                left = rect.left + rect.width / 2;
                break;
            case 'bottom':
                top = rect.bottom + offset;
                left = rect.left + rect.width / 2;
                break;
            case 'left':
                top = rect.top + rect.height / 2;
                left = rect.left - offset;
                break;
            case 'right':
                top = rect.top + rect.height / 2;
                left = rect.right + offset;
                break;
          }
          
          setPosition({ top, left });
      };
      
      updatePosition();
      window.addEventListener('resize', updatePosition);
      // Use capture to detect scrolling of parent containers
      window.addEventListener('scroll', updatePosition, true);
      
      return () => {
          window.removeEventListener('resize', updatePosition);
          window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [context?.isVisible, context?.triggerRef, side]);

  if (!context || !context.isVisible) return null;

  // Transform logic for centering
  let transform = '';
  if (side === 'top') transform = 'translate(-50%, -100%)';
  if (side === 'bottom') transform = 'translate(-50%, 0)';
  if (side === 'left') transform = 'translate(-100%, -50%)';
  if (side === 'right') transform = 'translate(0, -50%)';

  return createPortal(
    <div
        ref={contentRef}
        id="tooltip-content"
        className={`z-[9999] max-w-xs rounded-md border border-slate-200 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 shadow-md animate-in fade-in-0 zoom-in-95 text-left leading-snug ${className}`}
        style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            transform: transform,
            pointerEvents: 'none',
            whiteSpace: 'normal',
        }}
    >
      {children}
    </div>,
    document.body
  );
};