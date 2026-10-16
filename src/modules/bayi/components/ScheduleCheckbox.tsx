import React from "react";
import { Check } from "lucide-react";

export interface ScheduleCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
  title?: string;
  size?: "md" | "sm";
}

export const ScheduleCheckbox: React.FC<ScheduleCheckboxProps> = ({
  checked,
  onToggle,
  label,
  title,
  size = "md"
}) => {
  const isMd = size === "md";

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      title={title}
      onClick={onToggle}
      className={`inline-flex items-center justify-center shrink-0 rounded-[10px] cursor-pointer hover:bg-surface-sunken/60 focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2 transition-colors ${
        isMd ? "w-11 h-11" : "w-10 h-10"
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex items-center justify-center rounded-[6px] transition-colors border-[1.5px] ${
          isMd ? "w-[22px] h-[22px]" : "w-[20px] h-[20px]"
        } ${
          checked
            ? "bg-primary border-primary text-primary-fg"
            : "border-border-strong hover:border-text bg-surface shadow-2xs"
        }`}
      >
        {checked && (
          <Check
            className={`${isMd ? "w-3.5 h-3.5" : "w-3 h-3"} stroke-[3]`}
            aria-hidden="true"
          />
        )}
      </span>
    </button>
  );
};
