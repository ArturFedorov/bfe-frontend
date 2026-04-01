export function createAutocomplete(
  input: HTMLInputElement,
  container: HTMLElement,
  fetchSuggestions: (query: string) => Promise<string[]>,
): { destroy: () => void } {
  let activeIndex = -1;
  let controller: AbortController | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const list = document.createElement('ul');
  list.setAttribute('role', 'listbox');
  list.style.display = 'none';
  container.appendChild(list);

  function hideDropdown() {
    list.style.display = 'none';
    activeIndex = -1;
    input.setAttribute('aria-activedescendant', '');
  }

  function setActiveIndex(index: number, items: HTMLElement[]) {
    items.forEach((item) => item.classList.remove('active'));
    activeIndex = index;
    if (index >= 0 && items[index]) {
      items[index].classList.add('active');
      input.setAttribute('aria-activedescendant', items[index].id);
    }
  }

  function renderSuggestions(suggestions: string[]) {
    list.innerHTML = '';
    activeIndex = -1;

    if (suggestions.length == 0) {
      hideDropdown();
      return;
    }

    suggestions.forEach((text, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.id = `option-${i}`;
      li.textContent = text;

      li.addEventListener('click', () => {
        input.value = text;
        hideDropdown();
      });

      list.appendChild(li);
    });

    list.style.display = 'block';
  }

  async function fetch(query: string) {
    controller?.abort();
    controller = new AbortController();

    try {
      const result = await fetchSuggestions(query);
      renderSuggestions(result);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      throw err;
    }
  }

  function onInput() {
    const query = input.value.trim();
    if (debounceTimer) clearTimeout(debounceTimer);

    if (!query) {
      controller?.abort();
      hideDropdown();
      return;
    }

    debounceTimer = setTimeout(() => fetch(query), 300);
  }

  function onKeydown(e: KeyboardEvent) {
    const items = Array.from(list.querySelectorAll('li')) as HTMLElement[];
    if (!items.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((activeIndex + 1) % items.length, items);
        break;

      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((activeIndex - 1 + items.length) % items.length, items);
        break;

      case 'Enter':
        if (activeIndex >= 0 && items[activeIndex]) {
          input.value = items[activeIndex].textContent!;
          hideDropdown();
        }
        break;

      case 'Escape':
        hideDropdown();
        return;
    }
  }

  function onClickOutside(e: MouseEvent) {
    if (!container.contains(e.target as Node)) {
      hideDropdown();
    }
  }

  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', 'autocomplete-list');
  list.id = 'autocomplete-list';

  input.addEventListener('input', onInput);
  input.addEventListener('keydown', onKeydown);
  document.addEventListener('click', onClickOutside);

  return {
    destroy() {
      input.removeEventListener('input', onInput);
      input.removeEventListener('keydown', onKeydown);
      document.removeEventListener('click', onClickOutside);
      controller?.abort();

      if (debounceTimer) clearTimeout(debounceTimer);
      list.remove();
    },
  };
}
