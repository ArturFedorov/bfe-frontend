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

const BACK: Partial<Record<WizardStep, WizardStep>> = {
  review: 'contacts',
  contacts: 'company',
};

const NEXT: Partial<
  Record<WizardStep, { to: WizardStep; when: (d: WizardData) => boolean }>
> = {
  company: { to: 'contacts', when: (d) => d.companyName.trim() !== '' },
  contacts: { to: 'review', when: (d) => d.contactEmail.trim() !== '' },
};

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'next':
      const next = NEXT[state.step];
      if (next?.to && next.when(state.data)) {
        return {
          step: next?.to as WizardStep,
          data: state.data,
        };
      }

      return state;

    case 'back':
      if (BACK[state.step]) {
        return {
          ...state,
          step: BACK[state.step] as WizardStep,
        };
      }

      return state;

    case 'setField':
      if (state.step === 'submitted') {
        return state;
      }

      return {
        ...state,
        data: { ...state.data, [action.field]: action.value },
      };

    case 'submit':
      if (
        state.step === 'review' &&
        state.data.companyName &&
        state.data.contactEmail
      ) {
        return {
          ...state,
          step: 'submitted',
        };
      }

      return state;

    default:
      return state;
  }
}

export function wizardReducer(
  state: WizardState,
  action: WizardAction,
): WizardState {
  return reducer(state, action);
}
