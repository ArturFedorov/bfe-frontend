export interface CheckboxNode {
  label: string;
  checked?: boolean;
  children?: CheckboxNode[];
}

interface FlatNode {
  id: string;
  label: string;
  parentId: string | null;
  childIds: string[];
  depth: number;
}

export function createNestedCheckboxes(
  container: HTMLElement,
  data: CheckboxNode[],
): { getState: () => CheckboxNode[] } {
  const flatMap = new Map<string, FlatNode>();
  const checkedIds = new Set<string>();
  const rootIds: string[] = [];
  let idCounter = 0;

  function buildFlatMap(
    nodes: CheckboxNode[],
    parentId: string | null,
    depth: number,
  ): string[] {
    return nodes.map((node) => {
      const id = String(idCounter++);
      const childIds = node.children
        ? buildFlatMap(node.children, id, depth + 1)
        : [];

      flatMap.set(id, { id, label: node.label, parentId, childIds, depth });

      if (node.checked) checkedIds.add(id);

      return id;
    });
  }

  const ids = buildFlatMap(data, null, 0);
  ids.forEach((id) => rootIds.push(id));

  rootIds.forEach((id) => {
    if (checkedIds.has(id)) propagateDown(id, true);
  });

  function propagateDown(id: string, checked: boolean) {
    const queue = [id];

    while (queue.length > 0) {
      const current = queue.shift();
      checked
        ? checkedIds.add(current as string)
        : checkedIds.delete(current as string);
      flatMap
        .get(current as string)!
        .childIds.forEach((cId) => queue.push(cId));
    }
  }

  function propagateUp(id: string) {
    let parentId = flatMap.get(id)!.parentId;

    while (parentId !== null) {
      const parent = flatMap.get(parentId)!;
      const allChecked = parent.childIds.every((cId) => checkedIds.has(cId));

      if (allChecked) {
        checkedIds.add(parentId);
      } else {
        checkedIds.delete(parentId);
      }

      parentId = parent.parentId;
    }
  }

  function isIndeterminate(id: string): boolean {
    const node = flatMap.get(id)!;
    if (node.childIds.length === 0) return false;

    const allChecked = node.childIds.every((cId) => checkedIds.has(cId));
    const noneChecked = node.childIds.every((cId) => !checkedIds.has(cId));
    const anyChildIndeterminate = node.childIds.some((cId) =>
      isIndeterminate(cId),
    );

    return !allChecked && (!noneChecked || anyChildIndeterminate);
  }

  function render() {
    container.innerHTML = '';
    const ul = createList(rootIds);
    ul.setAttribute('role', 'tree');
    container.appendChild(ul);
  }

  function syncDom() {
    const inputs = container.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"][data-id]',
    );
    inputs.forEach((input) => {
      const id = input.dataset.id!;
      const checked = checkedIds.has(id);
      const indeterminate = isIndeterminate(id);
      input.checked = checked;
      input.indeterminate = indeterminate;
      const li = input.closest('li');
      if (li) {
        li.setAttribute(
          'aria-checked',
          indeterminate ? 'mixed' : String(checked),
        );
      }
    });
  }

  function createList(ids: string[]): HTMLUListElement {
    const ul = document.createElement('ul');
    ul.style.cssText = 'list-style:none; padding:0; margin:0;';
    ids.forEach((id) => ul.appendChild(createItem(id)));
    return ul;
  }

  function createItem(id: string): HTMLLIElement {
    const node = flatMap.get(id)!;
    const checked = checkedIds.has(id);
    const indeterminate = isIndeterminate(id);

    const li = document.createElement('li');
    li.setAttribute('role', 'treeitem');
    li.setAttribute('aria-checked', indeterminate ? 'mixed' : String(checked));
    li.style.cssText = `padding-left: ${node.depth * 20}px; margin: 4px 0;`;

    const label = document.createElement('label');
    label.style.cssText =
      'display:flex; align-items:center; gap:8px; cursor:pointer;';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.indeterminate = indeterminate;
    input.dataset.id = id;

    label.appendChild(input);
    label.appendChild(document.createTextNode(node.label));
    li.appendChild(label);

    if (node.childIds.length > 0) {
      li.appendChild(createList(node.childIds));
    }

    return li;
  }

  function onchange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.type !== 'checkbox') return;

    const id = input.dataset.id;
    if (!id) return;

    propagateDown(id, input.checked);
    propagateUp(id);
    syncDom();
  }

  container.addEventListener('change', onchange);
  render();

  function buildState(ids: string[]): CheckboxNode[] {
    return ids.map((id) => {
      const node = flatMap.get(id);
      const result: CheckboxNode = {
        label: node?.label as string,
        checked: checkedIds.has(id),
      };

      if (node!.childIds.length > 0) {
        result.children = buildState(node?.childIds as string[]);
      }

      return result;
    });
  }

  return { getState: () => buildState(rootIds) };
}
