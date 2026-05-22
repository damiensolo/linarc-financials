
import React, { useState, useEffect, useRef } from 'react';
import { format, isValid } from 'date-fns';
import { cn } from '../../../lib/utils';
import { Calendar } from './Calendar';
import { Popover } from './Popover';
import { ChevronDownIcon } from '../Icons';

interface DatePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({ date, setDate, className, open, onOpenChange }) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = open !== undefined ? open : internalOpen;

    // Focus the calendar when it opens
    useEffect(() => {
        if (isOpen) {
            // Small timeout to ensure portal is rendered
            const timer = setTimeout(() => {
                const el = document.querySelector('[data-calendar-container="true"]') as HTMLElement;
                if (el) el.focus();
            }, 10);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    return (
        <Popover
            open={isOpen}
            onOpenChange={onOpenChange || setInternalOpen}
            trigger={
                <button
                    type="button"
                    className={cn(
                        "flex w-full items-center justify-between text-left px-3 py-2 bg-white border border-gray-300 rounded-md group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400",
                        !date && "text-gray-500",
                        date && "text-gray-900 font-medium",
                        isOpen && "border-blue-500 bg-blue-50",
                        className
                    )}
                >
                    <span className="truncate flex-1 text-left text-sm">
                        {date && isValid(date) ? format(date, "MMM d, yyyy") : "Pick a date"}
                    </span>
                    <ChevronDownIcon className={cn(
                        "w-4 h-4 text-gray-600 transition-all duration-200 ml-2 flex-shrink-0",
                        isOpen && "rotate-180"
                    )} />
                </button>
            }
            content={
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                        setDate(d);
                        if (onOpenChange) onOpenChange(false);
                        else setInternalOpen(false);
                    }}
                    className="rounded-md"
                />
            }
        />
    );
};
