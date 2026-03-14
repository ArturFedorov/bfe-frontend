import { createCalendar, CalendarOptions } from './calendar';

function setupDOM() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  return container;
}

function teardownDOM(container: HTMLElement) {
  container.remove();
}

function getDayCells(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[data-day]'));
}

function getHeader(container: HTMLElement) {
  return container.querySelector('[data-calendar-header]')?.textContent ?? '';
}

function clickDay(container: HTMLElement, day: number) {
  const cells = getDayCells(container);
  const cell = cells.find((c) => c.getAttribute('data-day') === String(day)) as
    | HTMLElement
    | undefined;
  cell?.click();
}

describe('createCalendar', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = setupDOM();
  });

  afterEach(() => {
    teardownDOM(container);
  });

  it('should render a month grid with day cells', () => {
    createCalendar({
      container,
      initialDate: new Date(2024, 0, 15),
    });

    const cells = getDayCells(container);
    expect(cells.length).toBe(31);
  });

  it('should display the month and year in the header', () => {
    createCalendar({
      container,
      initialDate: new Date(2024, 0, 15),
    });

    const header = getHeader(container);
    expect(header).toContain('January');
    expect(header).toContain('2024');
  });

  it('should select a date on click', () => {
    const cal = createCalendar({
      container,
      initialDate: new Date(2024, 0, 1),
    });

    clickDay(container, 15);

    const selected = cal.getSelected();
    expect(selected).not.toBeNull();
    expect(selected!.getDate()).toBe(15);
    expect(selected!.getMonth()).toBe(0);
    expect(selected!.getFullYear()).toBe(2024);
  });

  it('should call onSelect callback when a date is clicked', () => {
    const onSelect = jest.fn();
    createCalendar({
      container,
      initialDate: new Date(2024, 0, 1),
      onSelect,
    });

    clickDay(container, 10);

    expect(onSelect).toHaveBeenCalledTimes(1);
    const arg = onSelect.mock.calls[0][0] as Date;
    expect(arg.getDate()).toBe(10);
  });

  it('should navigate to next month', () => {
    const cal = createCalendar({
      container,
      initialDate: new Date(2024, 0, 1),
    });

    cal.nextMonth();

    const header = getHeader(container);
    expect(header).toContain('February');
    expect(header).toContain('2024');
  });

  it('should navigate to previous month', () => {
    const cal = createCalendar({
      container,
      initialDate: new Date(2024, 1, 1),
    });

    cal.prevMonth();

    const header = getHeader(container);
    expect(header).toContain('January');
    expect(header).toContain('2024');
  });

  it('should disable dates outside minDate/maxDate', () => {
    createCalendar({
      container,
      initialDate: new Date(2024, 0, 15),
      minDate: new Date(2024, 0, 10),
      maxDate: new Date(2024, 0, 20),
    });

    const cells = getDayCells(container);
    const day5 = cells.find(
      (c) => c.getAttribute('data-day') === '5',
    ) as HTMLElement;
    const day15 = cells.find(
      (c) => c.getAttribute('data-day') === '15',
    ) as HTMLElement;
    const day25 = cells.find(
      (c) => c.getAttribute('data-day') === '25',
    ) as HTMLElement;

    expect(day5?.classList.contains('disabled')).toBe(true);
    expect(day15?.classList.contains('disabled')).toBe(false);
    expect(day25?.classList.contains('disabled')).toBe(true);
  });

  it('should not select disabled dates', () => {
    const onSelect = jest.fn();
    const cal = createCalendar({
      container,
      initialDate: new Date(2024, 0, 15),
      minDate: new Date(2024, 0, 10),
      maxDate: new Date(2024, 0, 20),
      onSelect,
    });

    clickDay(container, 5);

    expect(onSelect).not.toHaveBeenCalled();
    expect(cal.getSelected()).toBeNull();
  });

  it('should return null from getSelected() initially', () => {
    const cal = createCalendar({ container });

    expect(cal.getSelected()).toBeNull();
  });

  it('should set date programmatically and navigate to its month', () => {
    const cal = createCalendar({
      container,
      initialDate: new Date(2024, 0, 1),
    });

    cal.setDate(new Date(2024, 5, 20));

    const header = getHeader(container);
    expect(header).toContain('June');
    expect(cal.getSelected()!.getDate()).toBe(20);
    expect(cal.getSelected()!.getMonth()).toBe(5);
  });

  it('should clean up DOM on destroy()', () => {
    const cal = createCalendar({ container });

    cal.destroy();

    expect(container.innerHTML).toBe('');
  });
});
