import { lazy } from 'react';
import { qrGeneratorManifest } from './qr-generator/manifest';
import { imageCompressorManifest } from './image-compressor/manifest';
import { pomodoroManifest } from './pomodoro-timer/manifest';
import { pdfCompressorManifest } from './pdf-compressor/manifest';
import { atsResumeCheckerManifest } from './ats-resume-checker/manifest';
import { backgroundRemoverManifest } from './background-remover/manifest';
import { pdfRagCleanerManifest } from './pdf-rag-cleaner/manifest';
import { aiContentDetectorManifest } from './ai-content-detector/manifest';
import { pdfEditorManifest } from './pdf-editor/manifest';
import { videoCompressorManifest } from './video-compressor/manifest';
import { webhookTesterManifest } from './webhook-tester/manifest';
import { jsonBeautifierManifest } from './json-beautifier/manifest';
import { emailSignatureGeneratorManifest } from './email-signature-generator/manifest';

/**
 * Enterprise Scalable Tool Registry.
 * Supports on-demand dynamic code-splitting via React.lazy().
 * Initial bundle contains zero heavy tool libraries (pdf.js, image workers, etc.).
 * When scaled to 1,000+ tools, each tool is isolated into its own async chunk.
 */
export const toolsRegistry = {
  [qrGeneratorManifest.slug]: {
    manifest: qrGeneratorManifest,
    component: lazy(() => import('./qr-generator'))
  },
  [imageCompressorManifest.slug]: {
    manifest: imageCompressorManifest,
    component: lazy(() => import('./image-compressor'))
  },
  [pomodoroManifest.slug]: {
    manifest: pomodoroManifest,
    component: lazy(() => import('./pomodoro-timer'))
  },
  [pdfCompressorManifest.slug]: {
    manifest: pdfCompressorManifest,
    component: lazy(() => import('./pdf-compressor'))
  },
  [atsResumeCheckerManifest.slug]: {
    manifest: atsResumeCheckerManifest,
    component: lazy(() => import('./ats-resume-checker'))
  },
  [backgroundRemoverManifest.slug]: {
    manifest: backgroundRemoverManifest,
    component: lazy(() => import('./background-remover'))
  },
  [pdfRagCleanerManifest.slug]: {
    manifest: pdfRagCleanerManifest,
    component: lazy(() => import('./pdf-rag-cleaner'))
  },
  [aiContentDetectorManifest.slug]: {
    manifest: aiContentDetectorManifest,
    component: lazy(() => import('./ai-content-detector'))
  },
  [pdfEditorManifest.slug]: {
    manifest: pdfEditorManifest,
    component: lazy(() => import('./pdf-editor'))
  },
  [videoCompressorManifest.slug]: {
    manifest: videoCompressorManifest,
    component: lazy(() => import('./video-compressor'))
  },
  [webhookTesterManifest.slug]: {
    manifest: webhookTesterManifest,
    component: lazy(() => import('./webhook-tester'))
  },
  [jsonBeautifierManifest.slug]: {
    manifest: jsonBeautifierManifest,
    component: lazy(() => import('./json-beautifier'))
  },
  [emailSignatureGeneratorManifest.slug]: {
    manifest: emailSignatureGeneratorManifest,
    component: lazy(() => import('./email-signature-generator'))
  }
};

export function getRegisteredTool(slug) {
  return toolsRegistry[slug] || null;
}

export function getAllRegisteredTools() {
  return Object.values(toolsRegistry).map((item) => ({
    ...item.manifest,
    short_description: item.manifest.short_description || item.manifest.shortDescription || item.manifest.seo?.description || ''
  }));
}

