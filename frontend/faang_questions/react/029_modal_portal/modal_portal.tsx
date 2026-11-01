import { ReactElement, ReactNode } from 'react';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Modal({
  open,
  onClose,
  title,
  children,
}: ModalProps): ReactElement | null {
  // TODO: implement
  throw new Error('Not implemented');
}
