import {
  WizardAction,
  WizardState,
  initialWizardState,
  wizardReducer,
} from './wizard_reducer';

function run(state: WizardState, actions: WizardAction[]): WizardState {
  return actions.reduce(wizardReducer, state);
}

const filled: WizardAction[] = [
  { type: 'setField', field: 'companyName', value: 'Acme CDN' },
  { type: 'setField', field: 'contactEmail', value: 'ops@acme.io' },
];

describe('wizardReducer', () => {
  it('starts on the company step with empty data', () => {
    expect(initialWizardState.step).toBe('company');
    expect(initialWizardState.data).toEqual({ companyName: '', contactEmail: '' });
  });

  describe('legal transitions', () => {
    it('advances company -> contacts once companyName is filled', () => {
      const state = run(initialWizardState, [
        { type: 'setField', field: 'companyName', value: 'Acme CDN' },
        { type: 'next' },
      ]);
      expect(state.step).toBe('contacts');
    });

    it('advances contacts -> review once contactEmail is filled', () => {
      const state = run(initialWizardState, [...filled, { type: 'next' }, { type: 'next' }]);
      expect(state.step).toBe('review');
    });

    it('goes back review -> contacts -> company', () => {
      let state = run(initialWizardState, [...filled, { type: 'next' }, { type: 'next' }]);
      state = wizardReducer(state, { type: 'back' });
      expect(state.step).toBe('contacts');
      state = wizardReducer(state, { type: 'back' });
      expect(state.step).toBe('company');
    });

    it('submits from review when both fields are filled', () => {
      const state = run(initialWizardState, [
        ...filled,
        { type: 'next' },
        { type: 'next' },
        { type: 'submit' },
      ]);
      expect(state.step).toBe('submitted');
    });
  });

  describe('illegal transitions are no-ops (same reference)', () => {
    it('next from company with a blank companyName does nothing', () => {
      expect(wizardReducer(initialWizardState, { type: 'next' })).toBe(initialWizardState);
    });

    it('next from contacts with a blank contactEmail does nothing', () => {
      const state = run(initialWizardState, [
        { type: 'setField', field: 'companyName', value: 'Acme CDN' },
        { type: 'next' },
      ]);
      expect(wizardReducer(state, { type: 'next' })).toBe(state);
    });

    it('next from review does nothing (submit is the only way out)', () => {
      const state = run(initialWizardState, [...filled, { type: 'next' }, { type: 'next' }]);
      expect(wizardReducer(state, { type: 'next' })).toBe(state);
    });

    it('back from the first step does nothing', () => {
      expect(wizardReducer(initialWizardState, { type: 'back' })).toBe(initialWizardState);
    });

    it('whitespace-only companyName does not satisfy the guard', () => {
      const state = run(initialWizardState, [
        { type: 'setField', field: 'companyName', value: '   ' },
      ]);
      expect(wizardReducer(state, { type: 'next' })).toBe(state);
    });
  });

  describe('data preservation', () => {
    it('back preserves everything the user entered', () => {
      let state = run(initialWizardState, [...filled, { type: 'next' }, { type: 'next' }]);
      state = run(state, [{ type: 'back' }, { type: 'back' }]);
      expect(state.data).toEqual({ companyName: 'Acme CDN', contactEmail: 'ops@acme.io' });
    });

    it('setField does not mutate previous state', () => {
      const next = wizardReducer(initialWizardState, {
        type: 'setField',
        field: 'companyName',
        value: 'Acme CDN',
      });
      expect(initialWizardState.data.companyName).toBe('');
      expect(next.data.companyName).toBe('Acme CDN');
    });
  });

  describe('submit guard', () => {
    it('cannot submit from company or contacts', () => {
      expect(wizardReducer(initialWizardState, { type: 'submit' })).toBe(initialWizardState);
      const contacts = run(initialWizardState, [
        { type: 'setField', field: 'companyName', value: 'Acme CDN' },
        { type: 'next' },
      ]);
      expect(wizardReducer(contacts, { type: 'submit' })).toBe(contacts);
    });

    it('submitted is terminal: every action is a no-op', () => {
      const done = run(initialWizardState, [
        ...filled,
        { type: 'next' },
        { type: 'next' },
        { type: 'submit' },
      ]);
      expect(wizardReducer(done, { type: 'back' })).toBe(done);
      expect(wizardReducer(done, { type: 'next' })).toBe(done);
      expect(wizardReducer(done, { type: 'submit' })).toBe(done);
      expect(
        wizardReducer(done, { type: 'setField', field: 'companyName', value: 'x' }),
      ).toBe(done);
    });
  });
});
