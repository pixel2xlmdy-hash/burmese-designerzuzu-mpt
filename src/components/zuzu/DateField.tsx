import { useState } from "react";
import { CalendarDays } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { maskDMY, parseDMY, toDMY } from "@/lib/tailor";

export function DateField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseDMY(value) ?? undefined;

  return (
    <div className="relative">
      <Input
        id={id}
        inputMode="numeric"
        placeholder="DD/MM/YYYY"
        value={value}
        onChange={(e) => onChange(maskDMY(e.target.value))}
        className="h-11 bg-card pr-11"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Pick date"
            className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-md text-primary hover:bg-secondary"
          >
            <CalendarDays className="h-5 w-5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            captionLayout="dropdown"
            startMonth={new Date(2015, 0)}
            endMonth={new Date(2040, 11)}
            onSelect={(d) => {
              if (d) onChange(toDMY(d));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
