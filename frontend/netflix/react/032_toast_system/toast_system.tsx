import { ReactElement, ReactNode } from 'react';

export type ShowToastOptions = {
  duration?: number;
};

export type ToastHandle = {
  show: (message: string, options?: ShowToastOptions) => string;
  dismiss: (id: string) => void;
};

export type ToastProviderProps = {
  maxVisible?: number;
  duration?: number;
  children: ReactNode;
};

export function ToastProvider({
  maxVisible = 3,
  duration = 5000,
  children,
}: ToastProviderProps): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}

export function useToast(): ToastHandle {
  // TODO: implement
  throw new Error('Not implemented');
}

export function ToastViewport(): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}
