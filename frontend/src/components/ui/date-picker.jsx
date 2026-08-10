"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

function DatePicker({
  value,
  onChange,
  placeholder = "Sélectionner une date",
  className,
  ...props
}) {
  const [open, setOpen] = React.useState(false);

  const displayValue = value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start font-normal",
              !value && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <CalendarIcon className="opacity-50" />
        <span>{displayValue || placeholder}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? new Date(`${value}T00:00:00`) : undefined}
          onSelect={(date) => {
            onChange(date ? date.toISOString().slice(0, 10) : "");
            setOpen(false);
          }}
          {...props}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
