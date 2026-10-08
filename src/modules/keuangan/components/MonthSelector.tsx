import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, currentMonthKey, monthLabel } from "../utils/dates";

interface MonthSelectorProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedMonth,
  onMonthChange
}) => {
  const currentKey = currentMonthKey();
  const isAtCurrentMonth = selectedMonth >= currentKey;

  const handlePrev = () => {
    onMonthChange(addMonths(selectedMonth, -1));
  };

  const handleNext = () => {
    if (!isAtCurrentMonth) {
      onMonthChange(addMonths(selectedMonth, 1));
    }
  };

  return (
    <div className="flex items-center gap-2 bg-surface-sunken p-1.5 rounded-[12px] border border-border shrink-0">
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Bulan sebelumnya"
        title="Bulan sebelumnya"
        className="p-1.5 rounded-[8px] hover:bg-surface text-text-2 hover:text-text transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <span className="text-[14px] font-medium text-text px-2 min-w-[120px] text-center select-none">
        {monthLabel(selectedMonth)}
      </span>

      <button
        type="button"
        onClick={handleNext}
        disabled={isAtCurrentMonth}
        aria-label="Bulan berikutnya"
        title="Bulan berikutnya"
        className={`p-1.5 rounded-[8px] transition min-h-[36px] min-w-[36px] flex items-center justify-center ${
          isAtCurrentMonth
            ? "opacity-40 cursor-not-allowed text-text-3"
            : "hover:bg-surface text-text-2 hover:text-text cursor-pointer"
        }`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
