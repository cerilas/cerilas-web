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
import { youtubeThumbnailDownloaderManifest } from './youtube-thumbnail-downloader/manifest';
import { startupRunwayCalculatorManifest } from './startup-runway-calculator/manifest';
import { mrrCalculatorManifest } from './mrr-calculator/manifest';
import { arrCalculatorManifest } from './arr-calculator/manifest';
import { churnCalculatorManifest } from './churn-calculator/manifest';
import { ltvCalculatorManifest } from './ltv-calculator/manifest';
import { cacCalculatorManifest } from './cac-calculator/manifest';
import { ltvCacCalculatorManifest } from './ltv-cac-calculator/manifest';
import { aiLinkHallucinationCheckerManifest } from './ai-link-hallucination-checker/manifest';
import { aiCrawlerCheckerManifest } from './ai-crawler-checker/manifest';
import { llmsTxtManifest } from './llms-txt-tools/manifest';

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
  },
  [youtubeThumbnailDownloaderManifest.slug]: {
    manifest: youtubeThumbnailDownloaderManifest,
    component: lazy(() => import('./youtube-thumbnail-downloader'))
  },
  [startupRunwayCalculatorManifest.slug]: {
    manifest: startupRunwayCalculatorManifest,
    component: lazy(() => import('./startup-runway-calculator'))
  },
  [mrrCalculatorManifest.slug]: {
    manifest: mrrCalculatorManifest,
    component: lazy(() => import('./mrr-calculator'))
  },
  [arrCalculatorManifest.slug]: {
    manifest: arrCalculatorManifest,
    component: lazy(() => import('./arr-calculator'))
  },
  [churnCalculatorManifest.slug]: {
    manifest: churnCalculatorManifest,
    component: lazy(() => import('./churn-calculator'))
  },
  [ltvCalculatorManifest.slug]: {
    manifest: ltvCalculatorManifest,
    component: lazy(() => import('./ltv-calculator'))
  },
  [cacCalculatorManifest.slug]: {
    manifest: cacCalculatorManifest,
    component: lazy(() => import('./cac-calculator'))
  },
  [ltvCacCalculatorManifest.slug]: {
    manifest: ltvCacCalculatorManifest,
    component: lazy(() => import('./ltv-cac-calculator'))
  },
  [aiLinkHallucinationCheckerManifest.slug]: {
    manifest: aiLinkHallucinationCheckerManifest,
    component: lazy(() => import('./ai-link-hallucination-checker'))
  },
  [aiCrawlerCheckerManifest.slug]: {
    manifest: aiCrawlerCheckerManifest,
    component: lazy(() => import('./ai-crawler-checker'))
  },
  [llmsTxtManifest.slug]: {
    manifest: llmsTxtManifest,
    component: lazy(() => import('./llms-txt-tools'))
  },
  'llms-txt-generator': {
    manifest: { ...llmsTxtManifest, slug: 'llms-txt-generator', title: 'LLMs.txt Generator' },
    component: lazy(() => import('./llms-txt-tools'))
  },
  'llms-txt-checker': {
    manifest: { ...llmsTxtManifest, slug: 'llms-txt-checker', title: 'LLMs.txt Checker' },
    component: lazy(() => import('./llms-txt-tools'))
  },
  'llms-txt-validator': {
    manifest: { ...llmsTxtManifest, slug: 'llms-txt-validator', title: 'LLMs.txt Validator' },
    component: lazy(() => import('./llms-txt-tools'))
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

