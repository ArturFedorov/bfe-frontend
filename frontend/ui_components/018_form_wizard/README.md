# 18. Form Wizard

**Difficulty:** Hard  
**Topics:** DOM manipulation, form handling, validation, multi-step state

---

## Description

Build a multi-step form wizard that guides users through a series of form steps. Each step has a title and a set of form fields. Navigation between steps supports validation — required fields must be filled before advancing.

## Requirements

- Render the first step's title and form fields on creation
- `next()` advances to the next step; returns `false` if validation fails (required fields empty)
- `prev()` goes back to the previous step (no validation needed)
- On the final step, calling `next()` with valid data triggers `onSubmit` with all collected data
- `getCurrentStep()` returns the current step index (0-based)
- `getData()` returns all form data collected across all steps as a flat object
- Each field is rendered as an `<input>` with `name` and `type` attributes
- `destroy()` removes all listeners and cleans up the DOM

## Examples

```ts
const container = document.getElementById('wizard')!;

const wizard = createFormWizard({
  container,
  steps: [
    { title: 'Personal Info', fields: [
      { name: 'firstName', type: 'text', required: true },
      { name: 'lastName', type: 'text', required: true },
    ]},
    { title: 'Contact', fields: [
      { name: 'email', type: 'email', required: true },
      { name: 'phone', type: 'tel' },
    ]},
  ],
  onSubmit: (data) => console.log('Submitted:', data),
});

wizard.next(); // validates, advances to step 2
wizard.prev(); // back to step 1
console.log(wizard.getCurrentStep()); // 0
console.log(wizard.getData()); // { firstName: '', lastName: '', ... }
wizard.destroy();
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Maintain a <code>currentStep</code> index and a data object. On each step render, create <code>&lt;input&gt;</code> elements. When moving away from a step, read input values into the data object.
</details>

<details>
<summary>Hint 2</summary>
For validation, check each required field in the current step. If any required field's value is empty (after trimming), return <code>false</code> from <code>next()</code>.
</details>

<details>
<summary>Hint 3</summary>
When the user is on the last step and calls <code>next()</code> with valid data, collect the current step's data then call <code>onSubmit</code> with the complete data object.
</details>
