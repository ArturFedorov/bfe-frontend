import { ReactElement } from 'react';

export type DropdownMenuItem = {
  id: string;
  label: string;
  disabled?: boolean;
};

export type DropdownMenuProps = {
  label: string;
  items: DropdownMenuItem[];
  onSelect?: (id: string) => void;
};

export function DropdownMenu({
  label,
  items,
  onSelect,
}: DropdownMenuProps): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}
