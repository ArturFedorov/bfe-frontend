export interface CalendarOptions {
  container: HTMLElement;
  initialDate?: Date;
  onSelect?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

export function createCalendar(options: CalendarOptions): {
  getSelected: () => Date | null;
  setDate: (date: Date) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  destroy: () => void;
} {
  return {
    getSelected: () => null,
    setDate() {},
    nextMonth() {},
    prevMonth() {},
    destroy() {},
  };
}
