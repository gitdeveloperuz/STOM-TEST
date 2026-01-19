
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  primaryColor?: string;
}

export const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  primaryColor = '#0ea5e9'
}) => {
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const renderPageNumbers = () => {
    const pages = [];
    const delta = 1; 
    const left = currentPage - delta;
    const right = currentPage + delta + 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= left && i < right)) {
            range.push(i);
        }
    }

    for (const i of range) {
        if (l) {
            if (i - l === 2) {
                rangeWithDots.push(l + 1);
            } else if (i - l !== 1) {
                rangeWithDots.push('...');
            }
        }
        rangeWithDots.push(i);
        l = i;
    }

    return rangeWithDots.map((page, index) => {
        if (page === '...') {
            return <span key={`dots-${index}`} className="px-2 text-slate-400 font-bold select-none">...</span>;
        }
        const pageNum = page as number;
        return (
            <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg text-sm font-bold transition-all ${
                    currentPage === pageNum 
                    ? 'text-white shadow-md transform -translate-y-0.5' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
                style={currentPage === pageNum ? { backgroundColor: primaryColor } : {}}
            >
                {pageNum}
            </button>
        );
    });
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-12 animate-fade-in flex-wrap pb-4">
        <button 
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
            <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 flex-wrap justify-center">
            {renderPageNumbers()}
        </div>

        <button 
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
            <ChevronRight className="h-5 w-5" />
        </button>
    </div>
  );
};
