import {
  createFileExplorer,
  FileNode,
  FileExplorerOptions,
} from './fileExplorer';

function setupDOM() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  return container;
}

function teardownDOM(container: HTMLElement) {
  container.remove();
}

function getNodeElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[data-node]'));
}

function getFolderElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[data-node-type="folder"]'));
}

function getFileElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[data-node-type="file"]'));
}

function getChildren(folderEl: Element) {
  return folderEl.querySelector('[data-children]') as HTMLElement | null;
}

const data: FileNode[] = [
  {
    name: 'src',
    type: 'folder',
    children: [
      { name: 'index.ts', type: 'file' },
      {
        name: 'utils',
        type: 'folder',
        children: [{ name: 'helpers.ts', type: 'file' }],
      },
    ],
  },
  { name: 'README.md', type: 'file' },
];

describe('createFileExplorer', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = setupDOM();
  });

  afterEach(() => {
    teardownDOM(container);
  });

  it('should render the tree structure', () => {
    createFileExplorer({ container, data });

    const nodes = getNodeElements(container);
    expect(nodes.length).toBeGreaterThanOrEqual(2);

    const folders = getFolderElements(container);
    expect(folders.length).toBeGreaterThanOrEqual(1);

    const files = getFileElements(container);
    expect(files.length).toBeGreaterThanOrEqual(1);
  });

  it('should render folder names and file names', () => {
    createFileExplorer({ container, data });

    expect(container.textContent).toContain('src');
    expect(container.textContent).toContain('README.md');
  });

  it('should toggle folder expand/collapse on click', () => {
    createFileExplorer({ container, data });

    const folders = getFolderElements(container);
    const srcFolder = folders.find((f) =>
      f.textContent?.includes('src'),
    ) as HTMLElement;

    srcFolder.click();
    const childrenContainer = getChildren(srcFolder);
    if (childrenContainer) {
      const isVisible =
        childrenContainer.style.display !== 'none' &&
        !childrenContainer.classList.contains('hidden');
      expect(isVisible).toBe(true);
    }

    srcFolder.click();
    const childrenAfter = getChildren(srcFolder);
    if (childrenAfter) {
      const isHidden =
        childrenAfter.style.display === 'none' ||
        childrenAfter.classList.contains('hidden');
      expect(isHidden).toBe(true);
    }
  });

  it('should select a node on click', () => {
    const explorer = createFileExplorer({ container, data });

    const files = getFileElements(container);
    const readmeFile = files.find((f) =>
      f.textContent?.includes('README.md'),
    ) as HTMLElement;

    readmeFile.click();

    const selected = explorer.getSelected();
    expect(selected).not.toBeNull();
    expect(selected!.name).toBe('README.md');
  });

  it('should call onSelect callback when a node is clicked', () => {
    const onSelect = jest.fn();
    createFileExplorer({ container, data, onSelect });

    const files = getFileElements(container);
    const readmeFile = files.find((f) =>
      f.textContent?.includes('README.md'),
    ) as HTMLElement;

    readmeFile.click();

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'README.md', type: 'file' }),
    );
  });

  it('should return null from getSelected() when nothing is selected', () => {
    const explorer = createFileExplorer({ container, data });

    expect(explorer.getSelected()).toBeNull();
  });

  it('should render nested folders', () => {
    createFileExplorer({ container, data });

    expect(container.textContent).toContain('utils');
    expect(container.textContent).toContain('helpers.ts');
  });

  it('should clean up DOM on destroy()', () => {
    const explorer = createFileExplorer({ container, data });

    explorer.destroy();

    expect(container.innerHTML).toBe('');
  });
});
