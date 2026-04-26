/**
 * @jest-environment jsdom
 */
import { createFileUpload, FileUploadOptions } from './fileUpload';

function makeFile(name: string, type: string, size = 100) {
  const file = new File(['x'.repeat(size)], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function setup(overrides: Partial<FileUploadOptions> = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const onChange = jest.fn();
  const onError = jest.fn();
  const upload = createFileUpload({
    container,
    onChange,
    onError,
    ...overrides,
  });
  return { container, upload, onChange, onError };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createFileUpload', () => {
  test('renders a drop zone', () => {
    const { container } = setup();
    expect(container.querySelector('[data-drop-zone]')).toBeTruthy();
  });

  test('addFiles appends to file list', () => {
    const { upload, onChange } = setup();
    const f = makeFile('a.txt', 'text/plain');
    upload.addFiles([f]);
    expect(upload.getFiles()).toHaveLength(1);
    expect(onChange).toHaveBeenCalled();
  });

  test('rejects files with disallowed type', () => {
    const { upload, onError } = setup({ accept: ['image/png'] });
    const f = makeFile('a.txt', 'text/plain');
    upload.addFiles([f]);
    expect(upload.getFiles()).toHaveLength(0);
    expect(onError).toHaveBeenCalledWith(f, 'type');
  });

  test('rejects files exceeding maxSize', () => {
    const { upload, onError } = setup({ maxSize: 50 });
    const f = makeFile('big.txt', 'text/plain', 100);
    upload.addFiles([f]);
    expect(upload.getFiles()).toHaveLength(0);
    expect(onError).toHaveBeenCalledWith(f, 'size');
  });

  test('removeFile drops the file at index', () => {
    const { upload } = setup();
    upload.addFiles([
      makeFile('a.txt', 'text/plain'),
      makeFile('b.txt', 'text/plain'),
    ]);
    upload.removeFile(0);
    expect(upload.getFiles().map((f) => f.name)).toEqual(['b.txt']);
  });

  test('drop event adds files', () => {
    const { container, upload } = setup();
    const zone = container.querySelector('[data-drop-zone]') as HTMLElement;
    const file = makeFile('a.png', 'image/png');
    const dataTransfer = {
      files: [file],
      items: [],
      types: ['Files'],
    } as unknown as DataTransfer;
    const event = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
    zone.dispatchEvent(event);
    expect(upload.getFiles()).toHaveLength(1);
  });

  test('dragover preventDefault is called', () => {
    const { container } = setup();
    const zone = container.querySelector('[data-drop-zone]') as HTMLElement;
    const event = new Event('dragover', { bubbles: true, cancelable: true });
    zone.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  test('renders preview entries for added files', () => {
    const { container, upload } = setup();
    upload.addFiles([makeFile('a.txt', 'text/plain')]);
    expect(container.querySelectorAll('[data-file]').length).toBe(1);
  });

  test('destroy clears DOM', () => {
    const { container, upload } = setup();
    upload.destroy();
    expect(container.children.length).toBe(0);
  });
});
