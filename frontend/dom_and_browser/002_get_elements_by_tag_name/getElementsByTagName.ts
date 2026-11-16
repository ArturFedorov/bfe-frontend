export function getElementsByTagName(root: any, tagName: string): any[] {
  const result: any[] = [];
  const wildCard = tagName === '*';
  const wanted = tagName.toUpperCase();

  const walk = (el: any): void=> {
    for(const child of el.children ?? []) {
      if(wildCard || String(child.tagName).toUpperCase() === wanted) {
        result.push(child);
      }
      walk(child);
    }
  }

  walk(root);
  return result;
}
