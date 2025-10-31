import * as React from "react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      fixedWeeks
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "relative space-y-4",
        caption: "grid grid-cols-3 items-center pt-1 pb-2",
        caption_label: "text-sm font-medium text-center col-start-2",
        nav: "contents",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-9 w-9 p-0 col-start-1 justify-self-start text-foreground hover:bg-accent hover:text-accent-foreground [&_svg]:fill-foreground dark:[&_svg]:fill-white"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-9 w-9 p-0 col-start-3 justify-self-end text-foreground hover:bg-accent hover:text-accent-foreground [&_svg]:fill-foreground dark:[&_svg]:fill-white"
        ),
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] flex items-center justify-center",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-full w-full p-0 font-normal"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
