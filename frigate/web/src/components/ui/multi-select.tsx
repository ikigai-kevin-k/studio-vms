import { Check, ChevronsUpDown, X } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { capitalize, upperCase } from "lodash";

export type Option = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: Option[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  title?: string;
  hasError?: boolean;
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = "Select items...",
  title = "",
  hasError = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (item: string) => {
    if (Array.isArray(value)) {
      onChange(value.filter((i) => i !== item));
    } else {
      onChange(item);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="">
          <p className="pl-1 text-gray-300">{title}</p>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "h-auto min-h-10 w-full justify-between",
              hasError && "border-red-500"
            )}
          >
            <div className="flex flex-wrap gap-1">
              {value.length > 0 ? (
                Array.isArray(value) ? (
                  value.map((item) => (
                    <Badge
                      variant="secondary"
                      key={item}
                      className="mb-1 mr-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnselect(item);
                      }}
                    >
                      {options.find((o) => o.value === item)?.label ?? item}
                      <X className="ml-1 h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </Badge>
                  ))
                ) : (
                  <Badge
                    variant="secondary"
                    className="mb-1 mr-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnselect(value);
                    }}
                  >
                    {options.find((o) => o.value === value)?.label ?? value}
                    <X className="ml-1 h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </Badge>
                )
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command className="w-full">
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    onChange(
                      Array.isArray(value)
                        ? value.includes(option.value)
                          ? value.filter((item) => item !== option.value)
                          : [...value, option.value]
                        : option.value,
                    );
                    setOpen(true); // Keep open for multi-selection
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      (
                        Array.isArray(value)
                          ? value.includes(option.value)
                          : value === option.value
                      )
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
