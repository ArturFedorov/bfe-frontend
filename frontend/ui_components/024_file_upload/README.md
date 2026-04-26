# 24. File Upload with Preview

**Difficulty:** Medium
**Topics:** File API, drag-and-drop, async preview, validation

---

## Description

Build a file upload zone. The user can either click to pick files or drag-and-drop them onto the zone. Each accepted file shows a preview (image thumbnail for images, filename for everything else) and can be individually removed before upload. The component validates file type and size.

## Requirements

- Click on the drop zone opens the native file picker
- Drag-and-drop files onto the zone adds them
- Visual highlight of the zone while dragging over it
- Image files render an image thumbnail using `FileReader.readAsDataURL`
- Non-image files render filename + size
- `accept` (mime types) and `maxSize` (bytes) reject invalid files
- `getFiles()` returns currently accepted files
- `removeFile(index)` drops a file
- `onChange(files)` fires whenever the file list changes
- `onError(file, reason)` fires for rejected files
- `destroy()` removes elements and listeners

## Examples

```ts
const upload = createFileUpload({
  container: document.getElementById('drop')!,
  accept: ['image/png', 'image/jpeg'],
  maxSize: 5 * 1024 * 1024,
  onChange: (files) => console.log(files),
});

upload.getFiles(); // []
upload.removeFile(0);
```

## Approach Hints

<details>
<summary>Hint 1</summary>
For drag-and-drop you must call <code>event.preventDefault()</code> on both <code>dragover</code> AND <code>drop</code> — without preventDefault on dragover, the drop event never fires.
</details>

<details>
<summary>Hint 2</summary>
<code>FileReader.readAsDataURL</code> is async. Listen to <code>load</code> and <code>error</code> events. Store one reader per file in flight or recreate per call — just don't share a single reader across files.
</details>

<details>
<summary>Hint 3</summary>
For the click-to-pick path, render a hidden <code>&lt;input type="file" multiple&gt;</code> and trigger <code>.click()</code> from the zone's click handler. Listen to its <code>change</code> event to read <code>input.files</code>.
</details>
