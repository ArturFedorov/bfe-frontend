export type FileRejectReason = 'type' | 'size';

export interface FileUploadOptions {
  container: HTMLElement;
  accept?: string[];
  maxSize?: number;
  multiple?: boolean;
  onChange?: (files: File[]) => void;
  onError?: (file: File, reason: FileRejectReason) => void;
}

export function createFileUpload(options: FileUploadOptions): {
  getFiles: () => File[];
  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  destroy: () => void;
} {
  return {
    getFiles: () => [],
    addFiles() {},
    removeFile() {},
    destroy() {},
  };
}
