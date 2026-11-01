import { ReactElement } from 'react';

export type FlexibleInputProps = {
  label: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};

export function FlexibleInput({
  label,
  value,
  defaultValue,
  onChange,
}: FlexibleInputProps): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}
