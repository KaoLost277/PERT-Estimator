'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, text, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: -9999, y: -9999 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(handle);
  }, []);

  const updatePosition = React.useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let x = rect.left + rect.width / 2;
      let y = rect.top;

      if (position === 'top') {
        y = rect.top - 8;
      } else if (position === 'bottom') {
        y = rect.bottom + 8;
      } else if (position === 'left') {
        x = rect.left - 8;
        y = rect.top + rect.height / 2;
      } else if (position === 'right') {
        x = rect.right + 8;
        y = rect.top + rect.height / 2;
      }

      setCoords({ x, y });
    }
  }, [position]);

  useEffect(() => {
    if (isVisible) {
      // Defer position update to avoid React cascading render warning
      const handle = requestAnimationFrame(updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        cancelAnimationFrame(handle);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
    return undefined;
  }, [isVisible, updatePosition]);

  const posClasses = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2',
  };

  return (
    <div 
      ref={triggerRef}
      className="inline-block relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onTouchStart={() => setIsVisible(true)}
      onTouchEnd={() => setTimeout(() => setIsVisible(false), 2000)}
    >
      {children}
      {isVisible && mounted && typeof document !== 'undefined' && createPortal(
        <div 
          className={cn(
            "fixed z-[99999] pointer-events-none px-3 py-2 text-xs font-medium text-white bg-slate-800 rounded-lg animate-in fade-in duration-200 w-max max-w-[250px] text-center leading-relaxed",
            posClasses[position]
          )}
          style={{ left: coords.x, top: coords.y }}
        >
          {text}
          {/* Arrow */}
          <div className={cn(
            "absolute w-2 h-2 bg-slate-800 rotate-45",
            position === 'top' && "bottom-[-4px] left-1/2 -translate-x-1/2",
            position === 'bottom' && "top-[-4px] left-1/2 -translate-x-1/2",
            position === 'left' && "right-[-4px] top-1/2 -translate-y-1/2",
            position === 'right' && "left-[-4px] top-1/2 -translate-y-1/2",
          )} />
        </div>,
        document.body
      )}
    </div>
  );
}
