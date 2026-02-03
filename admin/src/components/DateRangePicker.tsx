
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears } from "date-fns";

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>(dateRange);

  const handleApply = () => {
    onDateRangeChange(tempRange);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempRange(dateRange);
    setIsOpen(false);
  };

  const getPresetRanges = () => {
    const today = new Date();

    return [
      {
        label: "Hôm nay",
        range: {
          from: startOfDay(today),
          to: endOfDay(today)
        }
      },
      {
        label: "Hôm qua",
        range: {
          from: startOfDay(subDays(today, 1)),
          to: endOfDay(subDays(today, 1))
        }
      },
      {
        label: "Tuần này",
        range: {
          from: startOfWeek(today, { weekStartsOn: 1 }),
          to: endOfWeek(today, { weekStartsOn: 1 })
        }
      },
      {
        label: "Tuần trước",
        range: {
          from: startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }),
          to: endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 })
        }
      },
      {
        label: "Tháng này",
        range: {
          from: startOfMonth(today),
          to: endOfMonth(today)
        }
      },
      {
        label: "Tháng trước",
        range: {
          from: startOfMonth(subMonths(today, 1)),
          to: endOfMonth(subMonths(today, 1))
        }
      },
      {
        label: "Năm này",
        range: {
          from: startOfYear(today),
          to: endOfYear(today)
        }
      },
      {
        label: "Năm trước",
        range: {
          from: startOfYear(subYears(today, 1)),
          to: endOfYear(subYears(today, 1))
        }
      }
    ];
  };

  const handlePresetSelect = (preset: { label: string; range: DateRange }) => {
    setTempRange(preset.range);
    onDateRangeChange(preset.range);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <CalendarIcon className="h-4 w-4 mr-2" />
          {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Quick Presets */}
          <div className="border-r p-4 space-y-2 min-w-[180px]">
            <div className="text-sm font-medium mb-3">Thời gian nhanh</div>
            {getPresetRanges().map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left font-normal"
                onClick={() => handlePresetSelect(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Custom Date Range */}
          <div className="p-4 space-y-4">
            <div className="text-sm font-medium">Chọn khoảng thời gian tùy chỉnh</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs text-gray-500">Từ ngày</div>
                <Calendar
                  mode="single"
                  selected={tempRange.from}
                  onSelect={(date) => date && setTempRange(prev => ({ ...prev, from: date }))}
                  className="pointer-events-auto"
                />
              </div>

              <div className="space-y-2">
                <div className="text-xs text-gray-500">Đến ngày</div>
                <Calendar
                  mode="single"
                  selected={tempRange.to}
                  onSelect={(date) => date && setTempRange(prev => ({ ...prev, to: date }))}
                  className="pointer-events-auto"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleApply}>
                Áp dụng
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
