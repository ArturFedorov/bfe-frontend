import type { ReactElement } from 'react';

export interface PartnerAccessFormValues {
  partnerId: string;
  contactEmail: string;
}

export interface PartnerAccessFormProps {
  /** Called only when both fields are valid. */
  onSubmit: (values: PartnerAccessFormValues) => void;
}

export function PartnerAccessForm({ onSubmit }: PartnerAccessFormProps): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}
