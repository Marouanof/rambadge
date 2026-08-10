"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

function Combobox({
  items = [],
  value = "",
  onChange,
  placeholder = "Rechercher...",
  emptyText = "Aucun résultat",
  displayValue,
  className,
}) {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");

  const selected = items.find((item) => String(item.value) === String(value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal",
              !selected && "text-muted-foreground",
              className
            )}
          />
        }
      >
        {displayValue
          ? displayValue(selected)
          : selected
            ? selected.label
            : placeholder}
        <ChevronsUpDownIcon className="opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--popover-anchor-width)] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={input}
            onValueChange={setInput}
            placeholder={placeholder}
            className="h-9!"
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {items
                .filter((item) =>
                  item.label.toLowerCase().includes(input.toLowerCase())
                )
                .map((item) => (
                  <CommandItem
                    key={item.value}
                    value={String(item.value)}
                    onSelect={() => {
                      onChange(item.value);
                      setOpen(false);
                      setInput("");
                    }}
                  >
                    {item.label}
                    <CheckIcon
                      className={cn(
                        "ml-auto",
                        String(item.value) === String(value)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { Combobox };
