export interface SortableOptions {
  container: HTMLElement;
  items: string[];
  onReorder: (items: string[]) => void;
}

export function createSortable(options: SortableOptions): {
  getItems: () => string[];
  destroy: () => void;
} {
  let currentItems = [...options.items];
  let draggedIndex: number | null = null;

  function render() {
    options.container.innerHTML = '';

    const ul = document.createElement('ul');
    ul.style.cssText = `
    list-style-type: none;
    padding: 0;
    margin: 0;
    `;

    currentItems.forEach((item, index) => {
      const li = document.createElement('li');
      li.textContent = item;
      li.draggable = true;
      li.dataset.index = String(index);
      li.dataset.sortableItem = '';
      li.style.cssText = `
        padding: 12px 16px;
        margin-bottom: 4px;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        cursor: grab;
        user-select: none;
        transition: background 0.15s, opacity 0.15s;
      `;
      ul.appendChild(li);
    });

    options.container.appendChild(ul);
  }

  function getItem(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof HTMLElement)) return null;
    return target.closest('li');
  }

  function getIndex(li: HTMLLIElement): number {
    return parseInt(li.dataset.index ?? '-1', 10);
  }

  function setDragStyles(li: HTMLLIElement) {
    li.style.opacity = '0.4';
    li.style.cursor = 'grabbing';
  }

  function clearDragStyles(li: HTMLLIElement) {
    li.style.opacity = '1';
    li.style.cursor = 'grab';
  }

  function setDropTarget(li: HTMLLIElement) {
    li.style.background = '#f0f4ff';
    li.style.borderColor = '#4a6cf7';
  }

  function clearDropTarget(li: HTMLLIElement) {
    li.style.background = 'white';
    li.style.borderColor = '#e0e0e0';
  }

  function clearAllDropTargets() {
    options.container
      .querySelectorAll('li')
      .forEach((li) => clearDropTarget(li as HTMLLIElement));
  }

  function onDragStart(e: DragEvent) {
    const li = getItem(e.target);
    if (!li) return;

    draggedIndex = getIndex(li as HTMLLIElement);
    e.dataTransfer?.setData('text/plain', String(draggedIndex));

    requestAnimationFrame(() => setDragStyles(li as HTMLLIElement));
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();

    const li = getItem(e.target);
    if (!li) return;

    const overIndex = getIndex(li as HTMLLIElement);

    if (overIndex === draggedIndex) return;

    clearAllDropTargets();
    setDropTarget(li as HTMLLIElement);
  }

  function onDragLeave(e: DragEvent) {
    if (!options.container.contains(e.relatedTarget as Node)) {
      clearAllDropTargets();
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();

    const li = getItem(e.target);
    if (!li || draggedIndex === null) return;

    const dropIndex = getIndex(li as HTMLLIElement);

    if (dropIndex === draggedIndex) return;

    const newItems = [...currentItems];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, removed);

    currentItems = newItems;
    draggedIndex = null;

    options.onReorder(currentItems);
    render();
  }

  function onDragEnd(e: DragEvent) {
    clearAllDropTargets();
    draggedIndex = null;

    const li = getItem(e.target);
    if (li) clearDragStyles(li as HTMLLIElement);
  }

  options.container.addEventListener('dragstart', onDragStart);
  options.container.addEventListener('dragover', onDragOver);
  options.container.addEventListener('dragleave', onDragLeave);
  options.container.addEventListener('drop', onDrop);
  options.container.addEventListener('dragend', onDragEnd);

  render();

  return {
    getItems: () => [...currentItems],
    destroy() {
      options.container.removeEventListener('dragstart', onDragStart);
      options.container.removeEventListener('dragover', onDragOver);
      options.container.removeEventListener('dragleave', onDragLeave);
      options.container.removeEventListener('drop', onDrop);
      options.container.removeEventListener('dragend', onDragEnd);
      options.container.innerHTML = '';
    },
  };
}
