export type WizardStep = 'company' | 'contacts' | 'review' | 'submitted';

export interface WizardData {
  companyName: string;
  contactEmail: string;
}

export interface WizardState {
  step: WizardStep;
  data: WizardData;
}

export type WizardAction =
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'setField'; field: keyof WizardData; value: string }
  | { type: 'submit' };

export const initialWizardState: WizardState = {
  step: 'company',
  data: { companyName: '', contactEmail: '' },
};

export function wizardReducer(
  state: WizardState,
  action: WizardAction,
): WizardState {
  // TODO: implement — legal transitions only; illegal transitions return the
  // SAME state reference (no-op, never throw). See README for the transition table.
  throw new Error('Not implemented');
}
