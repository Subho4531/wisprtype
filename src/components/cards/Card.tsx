import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  colSpan?: string;
  rowSpan?: string;
}

export function Card({
  children,
  className,
  title,
  colSpan = "col-span-1",
  rowSpan = "row-span-1"
}: CardProps) {
  return (
    <div className={cn(
      "relative bg-white dark:bg-zinc-900 p-6 group transition-colors duration-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between",
      colSpan,
      rowSpan,
      className
    )}>
      {/* Header */}
      {(title) && (
        <div className="flex items-start justify-between mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4 transition-colors duration-300">
          <div>
            {title && <h3 className="text-base font-medium tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h3>}
          </div>
        </div>
      )}

      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
