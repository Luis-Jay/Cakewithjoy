import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  mode?: "single" | "range";
  selectedRange?: { from?: Date; to?: Date };
  onRangeSelect?: (range: { from?: Date; to?: Date }) => void;
  className?: string;
}

export function Calendar({ 
  selected, 
  onSelect, 
  mode = "single",
  selectedRange,
  onRangeSelect,
  className = "" 
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected ? new Date(selected.getFullYear(), selected.getMonth(), 1) : new Date()
  );

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    
    if (mode === "range" && onRangeSelect) {
      if (!selectedRange?.from || (selectedRange?.from && selectedRange?.to)) {
        // Start new range
        onRangeSelect({ from: selectedDate, to: undefined });
      } else if (selectedDate < selectedRange.from) {
        // If selected date is before from, make it the new from
        onRangeSelect({ from: selectedDate, to: undefined });
      } else {
        // Complete the range
        onRangeSelect({ from: selectedRange.from, to: selectedDate });
      }
    } else {
      onSelect?.(selectedDate);
    }
  };

  const isSelected = (day: number) => {
    if (mode === "range" && selectedRange) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const time = date.getTime();
      const fromTime = selectedRange.from?.getTime();
      const toTime = selectedRange.to?.getTime();
      
      if (fromTime && !toTime) {
        return time === fromTime;
      }
      if (fromTime && toTime) {
        return time === fromTime || time === toTime;
      }
      return false;
    }
    
    if (!selected) return false;
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  };

  const isInRange = (day: number) => {
    if (mode === "range" && selectedRange?.from && selectedRange?.to) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const time = date.getTime();
      const fromTime = selectedRange.from.getTime();
      const toTime = selectedRange.to.getTime();
      
      return time > fromTime && time < toTime;
    }
    return false;
  };

  const isToday = (day: number) => {
    const today = new Date();
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const renderCalendarDays = () => {
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const selected = isSelected(day);
      const inRange = isInRange(day);
      const today = isToday(day);

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`
            p-2 rounded-md transition-colors
            hover:bg-accent
            ${selected ? "bg-primary text-white hover:bg-primary/90" : ""}
            ${inRange ? "bg-primary/20" : ""}
            ${today && !selected ? "border border-primary" : ""}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className={`p-4 border rounded-lg bg-background ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-center text-muted-foreground p-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>
    </div>
  );
}