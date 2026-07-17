import { useState, useCallback, useRef } from "react"
import {
  format,
  addDays,
  startOfWeek as startOfWeekFns,
  endOfWeek,
  eachWeekOfInterval,
  getMonth,
  getDate,
  parse,
  startOfDay,
  endOfDay,
} from "date-fns"
import { cn } from "@/lib/utils"

export interface ContributionDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface GitmapColors {
  empty: string
  level1: string
  level2: string
  level3: string
  level4: string
}

type WeekColumn = { days: (ContributionDay | null)[]; weekStart: Date }
type MonthLabel = { month: string; xOffset: number }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const DAY_LABELS = [
  { label: "Mon", row: 1 },
  { label: "Wed", row: 3 },
  { label: "Fri", row: 5 },
]
const DAY_LABEL_WIDTH = 28
const MONTH_LABEL_HEIGHT = 15

function generateWeeks(from: Date, to: Date, contributions: ContributionDay[]): WeekColumn[] {
  const map = new Map(contributions.map((c) => [c.date, c]))
  const rangeStart = startOfDay(from)
  const rangeEnd = endOfDay(to)
  const gridStart = startOfWeekFns(rangeStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(rangeEnd, { weekStartsOn: 0 })

  return eachWeekOfInterval({ start: gridStart, end: gridEnd }, { weekStartsOn: 0 }).map((weekStart) => ({
    weekStart,
    days: Array.from({ length: 7 }, (_, d) => {
      const day = addDays(weekStart, d)
      const key = format(day, "yyyy-MM-dd")
      return day >= rangeStart && day <= rangeEnd ? (map.get(key) ?? { date: key, count: 0, level: 0 }) : null
    }),
  }))
}

function getMonthLabels(weeks: WeekColumn[], cellSize: number, cellGap: number): MonthLabel[] {
  const labels: MonthLabel[] = []
  const cellTotal = cellSize + cellGap

  weeks.forEach((week, i) => {
    const firstOfMonth = week.days.find((d) => d && getDate(parse(d.date, "yyyy-MM-dd", new Date())) === 1)
    if (firstOfMonth) {
      const date = parse(firstOfMonth.date, "yyyy-MM-dd", new Date())
      const xOffset = i * cellTotal
      const lastLabel = labels[labels.length - 1]
      if (!labels.length || (lastLabel && xOffset - lastLabel.xOffset >= 28)) {
        const monthName = MONTHS[getMonth(date)]
        if (monthName) {
          labels.push({ month: monthName, xOffset })
        }
      }
    }
  })
  return labels
}

const LEVEL_COLORS: Record<0 | 1 | 2 | 3 | 4, keyof GitmapColors> = {
  0: "empty",
  1: "level1",
  2: "level2",
  3: "level3",
  4: "level4",
}

interface GitmapProps {
  contributions: ContributionDay[]
  from: Date
  to: Date
  colors: GitmapColors
  cellSize?: number
  cellGap?: number
  showMonths?: boolean
  showDays?: boolean
  showCounts?: boolean
  className?: string
}

export function Gitmap({
  contributions,
  from,
  to,
  colors,
  cellSize = 10,
  cellGap = 3,
  showMonths = true,
  showDays = true,
  showCounts = false,
  className,
}: GitmapProps) {
  const cellTotal = cellSize + cellGap
  const weeks = generateWeeks(from, to, contributions)
  const monthLabels = getMonthLabels(weeks, cellSize, cellGap)

  const gridHeight = 7 * cellSize + 6 * cellGap
  const gridWidth = weeks.length * cellSize + (weeks.length - 1) * cellGap

  const tooltipRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [tooltipData, setTooltipData] = useState<{ date: string; count: number } | null>(null)
  const lastCellData = useRef<{ date: string; count: number } | null>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const date = target.dataset.date
    const count = target.dataset.count

    if (tooltipRef.current) {
      tooltipRef.current.style.left = `${e.clientX}px`
      tooltipRef.current.style.top = `${e.clientY}px`

      // Update data only when hovering a cell
      if (date && count !== undefined) {
        const newData = { date, count: parseInt(count, 10) }
        lastCellData.current = newData
        setTooltipData(newData)
      }

      // Check if mouse is within the grid bounds
      if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect()
        const isInGrid =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom

        // Show tooltip if we're in the grid and have data
        if (isInGrid && lastCellData.current) {
          tooltipRef.current.style.opacity = "1"
        } else if (!isInGrid) {
          tooltipRef.current.style.opacity = "0"
        }
      }
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (tooltipRef.current) {
      tooltipRef.current.style.opacity = "0"
    }
    lastCellData.current = null
  }, [])

  return (
    <div
      className={cn("relative", className)}
      style={{
        paddingLeft: showDays ? DAY_LABEL_WIDTH : 0,
        paddingTop: showMonths ? MONTH_LABEL_HEIGHT : 0,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {showMonths && (
        <div className="absolute -top-1" style={{ left: showDays ? DAY_LABEL_WIDTH : 0 }}>
          {monthLabels.map(({ month, xOffset }, i) => (
            <span
              key={`${month}-${i}`}
              className="absolute text-[11px] text-muted-foreground leading-none"
              style={{ left: xOffset }}
            >
              {month}
            </span>
          ))}
        </div>
      )}

      {showDays && (
        <div className="absolute left-0" style={{ top: showMonths ? MONTH_LABEL_HEIGHT : 0, width: DAY_LABEL_WIDTH }}>
          {DAY_LABELS.map(({ label, row }) => (
            <span
              key={label}
              className="absolute text-[11px] text-muted-foreground leading-none right-2"
              style={{ top: row * cellTotal + cellSize / 2, transform: "translateY(-50%)" }}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <div
        ref={gridRef}
        className="grid"
        style={{
          gridTemplateRows: `repeat(7, ${cellSize}px)`,
          gridTemplateColumns: `repeat(${weeks.length}, ${cellSize}px)`,
          gap: cellGap,
          width: gridWidth,
          height: gridHeight,
        }}
      >
        {weeks.map((week, col) =>
          week.days.map((day, row) =>
            day === null ? (
              <div key={`${col}-${row}`} style={{ gridRow: row + 1, gridColumn: col + 1 }} />
            ) : (
              <div
                key={`${col}-${row}`}
                className={cn("rounded-[2px]", showCounts && "flex items-center justify-center")}
                style={{
                  gridRow: row + 1,
                  gridColumn: col + 1,
                  backgroundColor: colors[LEVEL_COLORS[day.level as 0 | 1 | 2 | 3 | 4]],
                  width: cellSize,
                  height: cellSize,
                }}
                data-date={day.date}
                data-count={day.count}
              >
                {showCounts && day.count > 0 && (
                  <span
                    className={cn(
                      "font-mono leading-none pointer-events-none",
                      day.level <= 1 && "text-foreground/80",
                      (day.level === 2 || day.level === 3) && "text-muted dark:text-foreground/80",
                      day.level === 4 && "text-background"
                    )}
                    style={{ fontSize: `${Math.max(8 - String(day.count).length, 4)}px` }}
                  >
                    {day.count}
                  </span>
                )}
              </div>
            )
          )
        )}
      </div>

      <div
        ref={tooltipRef}
        className="pointer-events-none fixed z-50 opacity-0"
        style={{
          transform: "translate(-50%, -100%) translateY(-8px)",
        }}
      >
        <div className="relative rounded-sm bg-foreground px-2 py-1 text-[10px] text-background whitespace-nowrap">
          {tooltipData && (
            <>
              <span className="font-medium">{tooltipData.count} contribution{tooltipData.count !== 1 ? "s" : ""}</span>
              <span className=""> on {format(parse(tooltipData.date, "yyyy-MM-dd", new Date()), "MMM d, yyyy")}</span>
            </>
          )}
          <div
            className="absolute left-1/2 -translate-x-1/2 size-2 rotate-45 rounded-[1px] bg-foreground"
            style={{ bottom: -3.5 }}
          />
        </div>
      </div>
    </div>
  )
}
