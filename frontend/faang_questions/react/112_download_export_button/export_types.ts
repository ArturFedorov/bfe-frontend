export type ExportStatus =
  | { status: 'waiting' }
  | { status: 'success'; url: string; fileName: string }
  | { status: 'failed'; error: string };

export interface ExportApi {
  startExport(): Promise<{ jobId: string }>;
  getStatus(jobId: string): Promise<ExportStatus>;
}
