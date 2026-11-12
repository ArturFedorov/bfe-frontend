/**
 * Milestone 5b — template editor with live preview, problems and SMS counter.
 * See README.md in this folder. Tests: TemplateEditor.test.tsx.
 */
import type { ReactNode } from 'react';
import { api as defaultApi, type Api } from '../../shell/api';
import type { Template } from '../../shell/types';
import type { Vars } from './template';

export interface TemplateEditorProps {
  /** Backend for `listTemplates()`, `listBlocks()`, `saveTemplate()`. Default: the shared app instance. */
  api?: Api;
  /** Template to open. Default: the first template returned by `listTemplates()`. */
  templateId?: string;
  /** Sample variables used by the preview. */
  sampleVars?: Vars;
  /** Called after a successful save. */
  onSaved?: (template: Template) => void;
}

export const DEFAULT_SAMPLE_VARS: Vars = {
  first_name: 'Ava',
  plan: 'pro',
  brand: 'Campaign Studio',
  cart_count: 3,
};

export function TemplateEditor({
  api = defaultApi,
  templateId,
  sampleVars = DEFAULT_SAMPLE_VARS,
  onSaved,
}: TemplateEditorProps): ReactNode {
  void api;
  void templateId;
  void sampleVars;
  void onSaved;
  throw new Error('Not implemented');
}
