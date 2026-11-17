function hasClass(el: any, className: string): boolean {
  if (el.classList && typeof el.classList.contains === 'function') {
    return el.classList.contains(className);
  }

  const classes: string[] = String(el.className ?? '').split(/\s+/);
  return classes.includes(className);
}

export function getElementsByClassName(root: any, className: string): any[] {
  const result: any[] = [];

  const walk = (el: any) => {
    for (const child of el.children ?? []) {
      if (hasClass(child, className)) result.push(child);
      walk(child);
    }
  };

  walk(root);
  return result;
}
