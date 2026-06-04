"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Rango } from "../services/reportes-service"

interface DateRangeFilterProps {
  rango: Rango;
  onRangoChange: (r: Rango) => void;
}

function toRango(from: Date, to: Date): Rango {
  return { desde: format(from, "yyyy-MM-dd"), hasta: format(to, "yyyy-MM-dd") };
}

export function DateRangeFilter({ rango, onRangoChange }: DateRangeFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [selection, setSelection] = React.useState<DateRange | undefined>({
    from: new Date(rango.desde),
    to: new Date(rango.hasta),
  });

  const applyPreset = (from: Date, to: Date) => {
    const r = toRango(from, to);
    setSelection({ from, to });
    onRangoChange(r);
    setOpen(false);
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setSelection(range);
    if (range?.from && range?.to) {
      onRangoChange(toRango(range.from, range.to));
      setOpen(false);
    }
  };

  const now = new Date();
  const today = format(now, "d MMM yyyy", { locale: es });
  const label = selection?.from && selection?.to
    ? `${format(selection.from, "d MMM yyyy", { locale: es })} – ${format(selection.to, "d MMM yyyy", { locale: es })}`
    : today;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => applyPreset(now, now)}
      >
        Hoy
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => applyPreset(startOfMonth(now), endOfMonth(now))}
      >
        Este mes
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => applyPreset(startOfYear(now), endOfYear(now))}
      >
        Este año
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarIcon className="size-4" />
            <span>{label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={selection}
            onSelect={handleCalendarSelect}
            numberOfMonths={2}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
