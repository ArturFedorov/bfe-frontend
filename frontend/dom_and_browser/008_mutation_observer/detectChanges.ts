export interface Change {
  type: 'add' | 'remove' | 'update';
  path: string;
  oldValue?: any;
  newValue?: any;
}

export function detectChanges(oldObj: any, newObj: any): Change[] {
  return [];
}
