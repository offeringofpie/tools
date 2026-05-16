<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { marked, type Token } from 'marked';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  ImageRun,
  AlignmentType,
} from 'docx';
import JSZip from 'jszip';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type InputFormat =
  | 'image'
  | 'text'
  | 'markdown'
  | 'pdf'
  | 'docx'
  | 'epub'
  | 'html';
type OutputFormat = 'pdf' | 'docx' | 'epub' | 'rtf' | 'html';
type PageSizeKey = 'A5' | 'A4' | 'A3' | 'Letter' | 'Legal';
type ImageQuality = 'low' | 'medium' | 'high' | 'maximum';

interface FileItem {
  id: string;
  file: File;
  name: string;
  url: string;
  format: InputFormat;
  size: number;
  previewText?: string;
  previewUrl?: string;
}

interface NormalisedBlock {
  type: 'heading' | 'paragraph' | 'list-item' | 'code' | 'blockquote' | 'image';
  text?: string;
  depth?: number; // for heading
  ordered?: boolean;
  imageBytes?: Uint8Array;
  imageMime?: string;
  imageAlt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZES: Record<PageSizeKey, [number, number]> = {
  A5: [419.53, 595.28],
  A4: [595.28, 841.89],
  A3: [841.89, 1190.55],
  Letter: [612, 792],
  Legal: [612, 1008],
};

const DOCX_PAGE_SIZES: Record<PageSizeKey, { width: number; height: number }> =
  {
    A5: { width: 8391, height: 11906 },
    A4: { width: 11906, height: 16838 },
    A3: { width: 16838, height: 23811 },
    Letter: { width: 12240, height: 15840 },
    Legal: { width: 12240, height: 20160 },
  };

const DOCX_HEADING_MAP: Record<
  number,
  (typeof HeadingLevel)[keyof typeof HeadingLevel]
> = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
};

const ACCEPT = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/epub+zip',
  'text/html',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'text/plain',
  'text/markdown',
  '.md',
  '.docx',
  '.epub',
  '.html',
  '.htm',
].join(',');

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

const items = ref<FileItem[]>([]);
const dragging = ref(false);
const busy = ref(false);
const picker = ref<HTMLInputElement | null>(null);
const dragId = ref<string | null>(null);

const outputFormat = ref<OutputFormat>('pdf');
const pageSize = ref<PageSizeKey>('A4');
const imageQuality = ref<ImageQuality>('high');

const outputFormatOptions = [
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'DOCX' },
  { value: 'epub', label: 'EPUB' },
  { value: 'rtf', label: 'RTF' },
  { value: 'html', label: 'HTML' },
] as const;

const pageSizeOptions = [
  { value: 'A5', label: 'A5' },
  { value: 'A4', label: 'A4' },
  { value: 'A3', label: 'A3' },
  { value: 'Letter', label: 'US Letter' },
  { value: 'Legal', label: 'US Legal' },
] as const;

const qualityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'maximum', label: 'Maximum' },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Computed
// ─────────────────────────────────────────────────────────────────────────────

const hasImages = computed(() => items.value.some((i) => i.format === 'image'));

const showImageQuality = computed(
  () => hasImages.value && outputFormat.value !== 'rtf',
);

const showPageSize = computed(
  () => outputFormat.value === 'pdf' || outputFormat.value === 'docx',
);

const showPdfWarning = computed(
  () =>
    items.value.some((i) => i.format === 'pdf') && outputFormat.value !== 'pdf',
);

const downloadLabel = computed(
  () =>
    ({
      pdf: 'Download PDF',
      docx: 'Download DOCX',
      epub: 'Download EPUB',
      rtf: 'Download RTF',
      html: 'Download HTML',
    })[outputFormat.value],
);

// ─────────────────────────────────────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────────────────────────────────────

function detectFormat(file: File): InputFormat {
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf') return 'pdf';
  if (
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  )
    return 'docx';
  if (file.type === 'application/epub+zip' || name.endsWith('.epub'))
    return 'epub';
  if (
    file.type === 'text/html' ||
    name.endsWith('.html') ||
    name.endsWith('.htm')
  )
    return 'html';
  if (file.type.startsWith('image/')) return 'image';
  if (name.endsWith('.md') || file.type === 'text/markdown') return 'markdown';
  return 'text';
}

function formatLabel(fmt: InputFormat) {
  return {
    image: 'Image',
    text: 'Text',
    markdown: 'Markdown',
    pdf: 'PDF',
    docx: 'DOCX',
    epub: 'EPUB',
    html: 'HTML',
  }[fmt];
}

function bytesLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function qualityToJpeg(q: ImageQuality) {
  return { low: 0.45, medium: 0.65, high: 0.82, maximum: 0.92 }[q];
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function sanitize(value: string) {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[^\x20-\x7E\n\t]/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function safeTitle(name: string) {
  return sanitize(name.replace(/\.[^.]+$/, '')) || 'Document';
}

function escapeXml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function imageToJpegBytes(
  file: File,
  quality: ImageQuality,
): Promise<Uint8Array> {
  if (file.type === 'image/jpeg' && quality === 'maximum') {
    return new Uint8Array(await file.arrayBuffer());
  }
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0);
  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error('Canvas failed'))),
      'image/jpeg',
      qualityToJpeg(quality),
    ),
  );
  return new Uint8Array(await blob.arrayBuffer());
}

async function imageToPngBytes(file: File): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error('Canvas failed'))),
      'image/png',
    ),
  );
  return new Uint8Array(await blob.arrayBuffer());
}

async function fileToBase64(bytes: Uint8Array): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(new Blob([bytes]));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF.js helper (lazy loaded, used by pdf + epub input)
// ─────────────────────────────────────────────────────────────────────────────

let _pdfjsLib: any = null;

async function getPdfJs() {
  if (_pdfjsLib) return _pdfjsLib;
  const lib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const worker = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url');
  lib.GlobalWorkerOptions.workerSrc = worker.default;
  _pdfjsLib = lib;
  return lib;
}

async function extractPdfText(file: File): Promise<string> {
  try {
    const lib = await getPdfJs();
    const pdf = await lib.getDocument({ data: await file.arrayBuffer() })
      .promise;
    const parts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      parts.push(content.items.map((s: any) => s.str).join(' '));
    }
    return sanitize(parts.join('\n\n'));
  } catch {
    return `[Could not extract text from ${file.name}]`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DOM walker → NormalisedBlock[]  (used by HTML + DOCX input paths)
// ─────────────────────────────────────────────────────────────────────────────

function walkDom(root: Element, blocks: NormalisedBlock[]) {
  for (const node of Array.from(root.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = sanitize(node.textContent ?? '');
      if (text) blocks.push({ type: 'paragraph', text });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();

      if (/^h[1-6]$/.test(tag)) {
        blocks.push({
          type: 'heading',
          text: sanitize(el.textContent ?? ''),
          depth: Number(tag[1]),
        });
      } else if (
        tag === 'p' ||
        tag === 'div' ||
        tag === 'section' ||
        tag === 'article'
      ) {
        const text = sanitize(el.textContent ?? '');
        if (text) blocks.push({ type: 'paragraph', text });
      } else if (tag === 'ul' || tag === 'ol') {
        for (const li of Array.from(el.querySelectorAll('li'))) {
          blocks.push({
            type: 'list-item',
            text: sanitize(li.textContent ?? ''),
            ordered: tag === 'ol',
          });
        }
      } else if (tag === 'pre' || tag === 'code') {
        blocks.push({ type: 'code', text: sanitize(el.textContent ?? '') });
      } else if (tag === 'blockquote') {
        blocks.push({
          type: 'blockquote',
          text: sanitize(el.textContent ?? ''),
        });
      } else if (tag === 'img') {
        const alt = (el as HTMLImageElement).alt ?? '';
        blocks.push({ type: 'image', imageAlt: alt });
      } else {
        walkDom(el, blocks);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown → NormalisedBlock[]
// ─────────────────────────────────────────────────────────────────────────────

function markdownTokensToBlocks(tokens: Token[]): NormalisedBlock[] {
  const blocks: NormalisedBlock[] = [];
  for (const token of tokens) {
    if (token.type === 'heading') {
      blocks.push({
        type: 'heading',
        text: sanitize(token.text),
        depth: token.depth,
      });
    } else if (token.type === 'paragraph') {
      blocks.push({ type: 'paragraph', text: sanitize(token.text) });
    } else if (token.type === 'list') {
      for (const li of token.items) {
        blocks.push({
          type: 'list-item',
          text: sanitize(li.text),
          ordered: token.ordered,
        });
      }
    } else if (token.type === 'code') {
      blocks.push({ type: 'code', text: sanitize(token.text) });
    } else if (token.type === 'blockquote') {
      blocks.push({ type: 'blockquote', text: sanitize(token.text) });
    }
  }
  return blocks;
}

// ─────────────────────────────────────────────────────────────────────────────
// Input parsers → NormalisedBlock[]
// ─────────────────────────────────────────────────────────────────────────────

async function parseHtml(file: File): Promise<NormalisedBlock[]> {
  const raw = await file.text();
  const doc = new DOMParser().parseFromString(raw, 'text/html');
  const root = doc.body ?? doc.documentElement;
  const blocks: NormalisedBlock[] = [];
  walkDom(root, blocks);
  return blocks;
}

async function parseDocx(file: File): Promise<NormalisedBlock[]> {
  const mammoth = await import('mammoth');
  const result = await mammoth.convertToHtml({
    arrayBuffer: await file.arrayBuffer(),
  });
  const doc = new DOMParser().parseFromString(result.value, 'text/html');
  const blocks: NormalisedBlock[] = [];
  walkDom(doc.body, blocks);
  return blocks;
}

async function parseEpub(file: File): Promise<NormalisedBlock[]> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const blocks: NormalisedBlock[] = [];

  // Find OPF manifest
  const containerXml = await zip.file('META-INF/container.xml')?.async('text');
  if (!containerXml) return blocks;

  const containerDoc = new DOMParser().parseFromString(
    containerXml,
    'text/xml',
  );
  const opfPath = containerDoc
    .querySelector('rootfile')
    ?.getAttribute('full-path');
  if (!opfPath) return blocks;

  const opfXml = await zip.file(opfPath)?.async('text');
  if (!opfXml) return blocks;

  const opfDoc = new DOMParser().parseFromString(opfXml, 'text/xml');
  const opfDir = opfPath.includes('/')
    ? opfPath.split('/').slice(0, -1).join('/') + '/'
    : '';

  // Read spine order
  const spineIds = Array.from(opfDoc.querySelectorAll('spine itemref')).map(
    (el) => el.getAttribute('idref'),
  );

  const manifestItems = Object.fromEntries(
    Array.from(opfDoc.querySelectorAll('manifest item')).map((el) => [
      el.getAttribute('id'),
      el.getAttribute('href'),
    ]),
  );

  for (const id of spineIds) {
    const href = manifestItems[id!];
    if (!href) continue;
    const chapterPath = opfDir + href;
    const chapterXml = await zip.file(chapterPath)?.async('text');
    if (!chapterXml) continue;
    const chapterDoc = new DOMParser().parseFromString(chapterXml, 'text/html');
    walkDom(chapterDoc.body, blocks);
  }

  return blocks;
}

async function parseMarkdown(file: File): Promise<NormalisedBlock[]> {
  return markdownTokensToBlocks(marked.lexer(await file.text()));
}

async function parsePlainText(file: File): Promise<NormalisedBlock[]> {
  const title = safeTitle(file.name);
  const lines = sanitize(await file.text()).split('\n');
  return [
    { type: 'heading', text: title, depth: 1 },
    ...lines.map(
      (line): NormalisedBlock => ({ type: 'paragraph', text: line }),
    ),
  ];
}

async function itemToBlocks(item: FileItem): Promise<NormalisedBlock[]> {
  if (item.format === 'html') return parseHtml(item.file);
  if (item.format === 'docx') return parseDocx(item.file);
  if (item.format === 'epub') return parseEpub(item.file);
  if (item.format === 'markdown') return parseMarkdown(item.file);
  if (item.format === 'text') return parsePlainText(item.file);
  if (item.format === 'pdf') {
    const text = await extractPdfText(item.file);
    return text
      .split('\n\n')
      .map((para): NormalisedBlock => ({ type: 'paragraph', text: para }));
  }
  if (item.format === 'image') {
    return [{ type: 'image', imageAlt: safeTitle(item.name) }];
  }
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Preview generation
// ─────────────────────────────────────────────────────────────────────────────

async function buildPdfPreview(file: File) {
  if (!import.meta.client) return {};
  try {
    const lib = await getPdfJs();
    const pdf = await lib.getDocument({ data: await file.arrayBuffer() })
      .promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.35 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return {};
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    return { previewUrl: canvas.toDataURL('image/png') };
  } catch {
    return {};
  }
}

async function buildPreview(file: File, format: InputFormat) {
  if (format === 'pdf') return buildPdfPreview(file);
  if (format === 'image') return { previewUrl: URL.createObjectURL(file) };
  // text-like: show first 400 chars
  if (['text', 'markdown', 'html', 'docx', 'epub'].includes(format)) {
    const raw =
      format === 'docx' ? '[DOCX — preview on export]' : await file.text();
    return { previewText: sanitize(raw).slice(0, 400) };
  }
  return {};
}

// ─────────────────────────────────────────────────────────────────────────────
// File ingestion
// ─────────────────────────────────────────────────────────────────────────────

async function processFiles(files: FileList | File[]) {
  const prepared = await Promise.all(
    [...files].map(async (file) => {
      const format = detectFormat(file);
      const preview = await buildPreview(file, format);
      return {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        url: URL.createObjectURL(file),
        format,
        size: file.size,
        ...preview,
      } satisfies FileItem;
    }),
  );
  items.value.push(...prepared);
}

async function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target.files) return;
  const files = [...target.files];
  target.value = '';
  await processFiles(files);
}

function handleDrop(e: DragEvent) {
  dragging.value = false;
  if (e.dataTransfer?.files?.length) processFiles(e.dataTransfer.files);
}

function revokeItemUrls(item: FileItem) {
  URL.revokeObjectURL(item.url);
  if (item.previewUrl?.startsWith('blob:'))
    URL.revokeObjectURL(item.previewUrl);
}

function remove(item: FileItem) {
  revokeItemUrls(item);
  items.value = items.value.filter((i) => i.id !== item.id);
}

function clearAll() {
  items.value.forEach(revokeItemUrls);
  items.value = [];
}

onBeforeUnmount(clearAll);

// ─────────────────────────────────────────────────────────────────────────────
// Drag ordering
// ─────────────────────────────────────────────────────────────────────────────

function onDragStart(id: string) {
  dragId.value = id;
}
function onDragEnd() {
  dragId.value = null;
}

function onDragOver(id: string) {
  if (!dragId.value || dragId.value === id) return;
  const from = items.value.findIndex((i) => i.id === dragId.value);
  const to = items.value.findIndex((i) => i.id === id);
  if (from === -1 || to === -1) return;
  const next = [...items.value];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  items.value = next;
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF output
// ─────────────────────────────────────────────────────────────────────────────

async function buildPdf(): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  const [pw, ph] = PAGE_SIZES[pageSize.value];

  for (const item of items.value) {
    if (item.format === 'image') {
      const doc = await PDFDocument.create();
      const page = doc.addPage([pw, ph]);
      const bytes = await imageToJpegBytes(item.file, imageQuality.value);
      const img = await doc.embedJpg(bytes);
      const margin = 36;
      const aw = pw - margin * 2;
      const ah = ph - margin * 2;
      const scale = Math.min(aw / img.width, ah / img.height);
      page.drawImage(img, {
        x: margin + (aw - img.width * scale) / 2,
        y: margin + (ah - img.height * scale) / 2,
        width: img.width * scale,
        height: img.height * scale,
      });
      const pages = await merged.copyPages(doc, [0]);
      merged.addPage(pages[0]);
      continue;
    }

    if (item.format === 'pdf') {
      const src = await PDFDocument.load(await item.file.arrayBuffer(), {
        ignoreEncryption: true,
      });
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
      continue;
    }

    // text-like — render via blocks
    const blocks = await itemToBlocks(item);
    const doc = await PDFDocument.create();
    const regularFont = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
    const margin = 48;
    const baseSize = 11;
    const maxWidth = pw - margin * 2;

    let page = doc.addPage([pw, ph]);
    let y = ph - margin;

    function wrapText(
      input: string,
      size: number,
      font = regularFont,
    ): string[] {
      const lines: string[] = [];
      let line = '';
      for (const word of input.split(/\s+/)) {
        const next = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(next, size) > maxWidth) {
          if (line) lines.push(line);
          line = word;
        } else line = next;
      }
      if (line) lines.push(line);
      return lines;
    }

    function drawLine(text: string, size: number, font = regularFont) {
      if (!text.trim()) return;
      if (y < margin + size) {
        page = doc.addPage([pw, ph]);
        y = ph - margin;
      }
      page.drawText(text, {
        x: margin,
        y,
        size,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= Math.round(size * 1.5);
    }

    const headingScales = [1.9, 1.55, 1.3, 1.15, 1.05, 1];

    for (const block of blocks) {
      if (block.type === 'image') continue; // images handled above per-item
      const text = block.text ?? '';
      if (!text) continue;

      if (block.type === 'heading') {
        const scale = headingScales[Math.min((block.depth ?? 1) - 1, 5)];
        const size = Math.round(baseSize * scale);
        y -= 6;
        for (const line of wrapText(text, size, boldFont))
          drawLine(line, size, boldFont);
        y -= 4;
      } else if (block.type === 'list-item') {
        for (const line of wrapText('  - ' + text, baseSize))
          drawLine(line, baseSize);
      } else if (block.type === 'code') {
        for (const line of wrapText(text, Math.round(baseSize * 0.85)))
          drawLine(line, Math.round(baseSize * 0.85));
      } else {
        for (const line of wrapText(text, baseSize)) drawLine(line, baseSize);
      }
    }

    const docPages = await merged.copyPages(doc, doc.getPageIndices());
    docPages.forEach((p) => merged.addPage(p));
  }

  return merged.save({ useObjectStreams: true, addDefaultPage: false });
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCX output
// ─────────────────────────────────────────────────────────────────────────────

async function buildDocx(): Promise<Blob> {
  const ps = DOCX_PAGE_SIZES[pageSize.value];
  const allParagraphs: Paragraph[] = [];

  for (let idx = 0; idx < items.value.length; idx++) {
    const item = items.value[idx];
    const blocks = await itemToBlocks(item);

    for (const block of blocks) {
      if (block.type === 'image' && item.format === 'image') {
        const bytes = await imageToJpegBytes(item.file, imageQuality.value);
        const widthPx = Math.round(((ps.width * 0.9) / 1440) * 96);
        allParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: bytes,
                transformation: {
                  width: widthPx,
                  height: Math.round(widthPx * 0.75),
                },
                type: 'jpg',
              }),
            ],
          }),
        );
      } else if (block.type === 'heading') {
        allParagraphs.push(
          new Paragraph({
            heading:
              DOCX_HEADING_MAP[block.depth ?? 1] ?? HeadingLevel.HEADING_1,
            children: [new TextRun(block.text ?? '')],
          }),
        );
      } else if (block.type === 'list-item') {
        allParagraphs.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun(block.text ?? '')],
          }),
        );
      } else if (block.type === 'code') {
        allParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: block.text ?? '',
                font: 'Courier New',
                size: 18,
              }),
            ],
          }),
        );
      } else if (block.text) {
        allParagraphs.push(
          new Paragraph({ children: [new TextRun(block.text)] }),
        );
      }
    }

    if (idx < items.value.length - 1) {
      allParagraphs.push(
        new Paragraph({ pageBreakBefore: true, children: [] }),
      );
    }
  }

  return Packer.toBlob(
    new Document({
      sections: [
        {
          properties: {
            page: { size: { width: ps.width, height: ps.height } },
          },
          children: allParagraphs,
        },
      ],
    }),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EPUB output
// ─────────────────────────────────────────────────────────────────────────────

async function buildEpub(): Promise<Blob> {
  const zip = new JSZip();
  const uuid = crypto.randomUUID();
  const title = items.value.map((i) => safeTitle(i.name)).join(', ');

  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.folder('META-INF')!.file(
    'container.xml',
    `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  );

  const oebps = zip.folder('OEBPS')!;
  oebps.folder('css')!.file(
    'style.css',
    `
body { font-family: Georgia, serif; line-height: 1.6; margin: 1.5em; color: #111; }
h1,h2,h3,h4,h5,h6 { line-height: 1.2; margin-top: 1.4em; }
p { margin: 0.6em 0; }
pre,code { font-family: monospace; font-size: 0.88em; background: #f4f4f4; padding: 0.2em; }
blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 1em; color: #555; }
.image-wrap { text-align: center; margin: 1em 0; }
img { max-width: 100%; height: auto; }
`,
  );

  const chapterItems: string[] = [];
  const imageManifestItems: string[] = [];
  const spineItems: string[] = [];

  for (let idx = 0; idx < items.value.length; idx++) {
    const item = items.value[idx];
    const chId = `chapter-${idx}`;
    const chTitle = escapeXml(safeTitle(item.name));
    const blocks = await itemToBlocks(item);
    const parts: string[] = [];

    for (const block of blocks) {
      if (block.type === 'image' && item.format === 'image') {
        const bytes = await imageToPngBytes(item.file);
        const imgId = `img-${idx}`;
        const imgFile = `images/${imgId}.png`;
        oebps.folder('images')!.file(`${imgId}.png`, bytes);
        imageManifestItems.push(
          `<item id="${imgId}" href="${imgFile}" media-type="image/png"/>`,
        );
        parts.push(
          `<div class="image-wrap"><img src="../${imgFile}" alt="${escapeXml(block.imageAlt ?? '')}"/></div>`,
        );
      } else if (block.type === 'heading') {
        const d = Math.min(block.depth ?? 1, 6);
        parts.push(`<h${d}>${escapeXml(block.text ?? '')}</h${d}>`);
      } else if (block.type === 'list-item') {
        parts.push(`<p>&#x2022; ${escapeXml(block.text ?? '')}</p>`);
      } else if (block.type === 'code') {
        parts.push(`<pre><code>${escapeXml(block.text ?? '')}</code></pre>`);
      } else if (block.type === 'blockquote') {
        parts.push(
          `<blockquote><p>${escapeXml(block.text ?? '')}</p></blockquote>`,
        );
      } else if (block.text) {
        parts.push(`<p>${escapeXml(block.text)}</p>`);
      }
    }

    oebps.folder('chapters')!.file(
      `${chId}.xhtml`,
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${chTitle}</title>
  <link rel="stylesheet" type="text/css" href="../css/style.css"/>
</head>
<body>
<h1>${chTitle}</h1>
${parts.join('\n')}
</body>
</html>`,
    );

    chapterItems.push(
      `<item id="${chId}" href="chapters/${chId}.xhtml" media-type="application/xhtml+xml"/>`,
    );
    spineItems.push(`<itemref idref="${chId}"/>`);
  }

  oebps.file(
    'content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uuid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:language>en</dc:language>
    <dc:identifier id="uuid">${uuid}</dc:identifier>
  </metadata>
  <manifest>
    <item id="css" href="css/style.css" media-type="text/css"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    ${chapterItems.join('\n    ')}
    ${imageManifestItems.join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join('\n    ')}
  </spine>
</package>`,
  );

  oebps.file(
    'toc.ncx',
    `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${uuid}"/>
    <meta name="dtb:depth" content="1"/>
  </head>
  <docTitle><text>${escapeXml(title)}</text></docTitle>
  <navMap>
    ${items.value
      .map(
        (item, i) => `
    <navPoint id="nav-${i}" playOrder="${i + 1}">
      <navLabel><text>${escapeXml(safeTitle(item.name))}</text></navLabel>
      <content src="chapters/chapter-${i}.xhtml"/>
    </navPoint>`,
      )
      .join('')}
  </navMap>
</ncx>`,
  );

  return zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
}

// ─────────────────────────────────────────────────────────────────────────────
// RTF output (text-only)
// ─────────────────────────────────────────────────────────────────────────────

function rtfEscape(str: string) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/[^\x20-\x7E]/g, '');
}

async function buildRtf(): Promise<Blob> {
  const parts: string[] = [
    '{\\rtf1\\ansi\\deff0',
    '{\\fonttbl{\\f0 Helvetica;}{\\f1 Courier New;}}',
    '{\\colortbl;\\red17\\green17\\blue17;}',
    '\\f0\\fs22\\cf1',
  ];

  const headingFontSizes = [36, 30, 26, 24, 22, 22];

  for (let idx = 0; idx < items.value.length; idx++) {
    const item = items.value[idx];
    const blocks = await itemToBlocks(item);

    if (idx > 0) parts.push('\\page');

    for (const block of blocks) {
      if (block.type === 'image') continue; // skipped in RTF
      const text = rtfEscape(block.text ?? '');
      if (!text) continue;

      if (block.type === 'heading') {
        const fs = headingFontSizes[Math.min((block.depth ?? 1) - 1, 5)];
        parts.push(`\\pard\\sb240\\sa60\\b\\fs${fs} ${text}\\b0\\fs22\\par`);
      } else if (block.type === 'list-item') {
        parts.push(`\\pard\\li360\\fi-360\\sb40 \\bullet  ${text}\\par`);
      } else if (block.type === 'code') {
        parts.push(`\\pard\\sb60\\sa60\\f1\\fs18 ${text}\\f0\\fs22\\par`);
      } else if (block.type === 'blockquote') {
        parts.push(`\\pard\\li720\\sb60\\sa60\\i ${text}\\i0\\par`);
      } else {
        parts.push(`\\pard\\sb60\\sa60 ${text}\\par`);
      }
    }
  }

  parts.push('}');
  return new Blob([parts.join('\n')], { type: 'application/rtf' });
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML output
// ─────────────────────────────────────────────────────────────────────────────

async function buildHtml(): Promise<Blob> {
  const sections: string[] = [];

  for (const item of items.value) {
    const blocks = await itemToBlocks(item);
    const parts: string[] = [];

    for (const block of blocks) {
      if (block.type === 'image' && item.format === 'image') {
        const bytes = await imageToPngBytes(item.file);
        const b64 = await fileToBase64(bytes);
        parts.push(
          `<figure><img src="data:image/png;base64,${b64}" alt="${escapeHtml(block.imageAlt ?? '')}" style="max-width:100%;height:auto;"/></figure>`,
        );
      } else if (block.type === 'heading') {
        const d = Math.min(block.depth ?? 1, 6);
        parts.push(`<h${d}>${escapeHtml(block.text ?? '')}</h${d}>`);
      } else if (block.type === 'list-item') {
        parts.push(`<li>${escapeHtml(block.text ?? '')}</li>`);
      } else if (block.type === 'code') {
        parts.push(`<pre><code>${escapeHtml(block.text ?? '')}</code></pre>`);
      } else if (block.type === 'blockquote') {
        parts.push(`<blockquote>${escapeHtml(block.text ?? '')}</blockquote>`);
      } else if (block.text) {
        parts.push(`<p>${escapeHtml(block.text)}</p>`);
      }
    }

    sections.push(`<section>\n${parts.join('\n')}\n</section>`);
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Converted Document</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.7; color: #111; }
    h1,h2,h3,h4,h5,h6 { line-height: 1.25; margin-top: 2em; }
    p { margin: 0.75em 0; }
    pre { background: #f4f4f4; padding: 1em; overflow-x: auto; border-radius: 4px; }
    code { font-family: monospace; font-size: 0.88em; }
    blockquote { border-left: 4px solid #ccc; margin-left: 0; padding-left: 1em; color: #555; }
    section { margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 1px solid #eee; }
    section:last-child { border-bottom: none; }
    figure { text-align: center; margin: 1.5em 0; }
    li { margin: 0.3em 0; }
  </style>
</head>
<body>
${sections.join('\n')}
</body>
</html>`;

  return new Blob([html], { type: 'text/html' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Export dispatcher
// ─────────────────────────────────────────────────────────────────────────────

const builders: Record<
  OutputFormat,
  () => Promise<{ blob: Blob; filename: string }>
> = {
  pdf: async () => ({
    blob: new Blob([await buildPdf()], { type: 'application/pdf' }),
    filename: 'converted.pdf',
  }),
  docx: async () => ({ blob: await buildDocx(), filename: 'converted.docx' }),
  epub: async () => ({ blob: await buildEpub(), filename: 'converted.epub' }),
  rtf: async () => ({ blob: await buildRtf(), filename: 'converted.rtf' }),
  html: async () => ({ blob: await buildHtml(), filename: 'converted.html' }),
};

async function download() {
  if (!items.value.length) return;
  busy.value = true;
  try {
    const { blob, filename } = await builders[outputFormat.value]();
    triggerDownload(blob, filename);
  } catch (error) {
    console.error(error);
    alert('Export failed. Check the console for details.');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <input
      ref="picker"
      type="file"
      multiple
      :accept="ACCEPT"
      class="hidden"
      @change="handleFileSelect"
    />

    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div class="space-y-2">
        <h1 class="text-2xl md:text-3xl font-bold text-white">
          Document Converter
        </h1>
        <p class="text-base-400">
          Convert between PDF, DOCX, EPUB, RTF, HTML, images, markdown and text.
        </p>
      </div>
      <div v-if="items.length">
        <UButton variant="soft" icon="i-heroicons-trash" @click="clearAll"
          >Clear</UButton
        >
      </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-6">
      <!-- Sidebar -->
      <div v-if="items.length" class="w-full lg:w-72 lg:order-last shrink-0">
        <div class="lg:sticky lg:top-8">
          <UCard
            class="border border-base-800 bg-base-900/50"
            :ui="{ body: { base: 'overflow-visible' } }"
          >
            <template #header>
              <h2
                class="text-xs font-bold text-white uppercase tracking-widest"
              >
                Settings
              </h2>
            </template>

            <div class="space-y-5">
              <UFormField label="Output Format">
                <USelect
                  v-model="outputFormat"
                  :items="outputFormatOptions"
                  class="w-full"
                />
              </UFormField>

              <UFormField v-if="showPageSize" label="Page Size">
                <USelect
                  v-model="pageSize"
                  :items="pageSizeOptions"
                  class="w-full"
                />
              </UFormField>

              <UFormField v-if="showImageQuality" label="Image Quality">
                <USelect
                  v-model="imageQuality"
                  :items="qualityOptions"
                  class="w-full"
                />
              </UFormField>

              <div
                v-if="showPdfWarning"
                class="rounded-lg border border-amber-800/50 bg-amber-950/30 p-3 text-xs text-amber-400"
              >
                <p class="font-medium mb-1">PDF input detected</p>
                <p>
                  PDF → {{ outputFormat.toUpperCase() }} extracts raw text only.
                  Layout and embedded images will not be preserved.
                </p>
              </div>

              <UButton
                block
                color="primary"
                size="lg"
                icon="i-heroicons-arrow-down-tray"
                :loading="busy"
                @click="download"
              >
                {{ downloadLabel }}
              </UButton>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Main -->
      <div class="flex-1 space-y-6">
        <UCard
          v-if="!items.length"
          class="border-2 border-dashed min-h-100 flex items-center justify-center transition-all"
          :class="
            dragging
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-base-800 bg-base-900/30 hover:border-base-700 hover:bg-base-900/40'
          "
          role="button"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="handleDrop"
          @click="picker?.click()"
        >
          <div
            class="flex flex-col items-center justify-center p-12 text-center"
          >
            <UIcon
              name="i-heroicons-document-arrow-up"
              class="w-16 h-16 text-base-600 mb-4"
            />
            <h3 class="text-lg font-medium text-white mb-2">Drop files here</h3>
            <p class="text-sm text-base-500">
              PDF · DOCX · EPUB · HTML · images · .txt · .md
            </p>
          </div>
        </UCard>

        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <div
            class="border-2 border-dashed border-base-800 rounded-xl bg-base-900/20 flex flex-col items-center justify-center min-h-62.5 hover:border-base-700 hover:bg-base-900/40 transition-all group"
            role="button"
            @click="picker?.click()"
          >
            <UIcon
              name="i-heroicons-plus-circle"
              class="w-10 h-10 text-base-700 group-hover:text-base-500 transition-colors"
            />
            <span
              class="text-sm font-medium text-base-600 group-hover:text-base-400 mt-2"
              >Add more</span
            >
          </div>

          <UCard
            v-for="item in items"
            :key="item.id"
            draggable="true"
            class="border border-base-800 bg-base-900/50 flex flex-col overflow-hidden cursor-grab active:cursor-grabbing"
            :class="
              dragId === item.id ? 'opacity-60 ring-1 ring-primary-500' : ''
            "
            :ui="{ body: { padding: 'p-0' } }"
            @dragstart="onDragStart(item.id)"
            @dragenter.prevent="onDragOver(item.id)"
            @dragover.prevent
            @dragend="onDragEnd"
          >
            <div
              class="flex items-center justify-between gap-2 px-3 py-2 border-b border-base-800 bg-base-900/80"
            >
              <div class="flex items-center gap-2 min-w-0">
                <UIcon
                  name="i-heroicons-bars-3"
                  class="w-4 h-4 text-base-500 shrink-0"
                />
                <span class="text-xs font-medium text-white truncate">{{
                  item.name
                }}</span>
              </div>
              <UButton
                size="xs"
                variant="subtle"
                color="error"
                icon="i-heroicons-x-mark"
                @click.stop="remove(item)"
              />
            </div>

            <div
              class="relative w-full bg-base-950 overflow-hidden flex items-center justify-center min-h-48"
            >
              <img
                v-if="item.previewUrl"
                :src="item.previewUrl"
                class="w-full h-48 object-contain bg-base-950"
              />
              <div
                v-else-if="item.previewText"
                class="w-full h-48 overflow-hidden p-4 text-xs leading-5 text-base-400 font-mono whitespace-pre-wrap"
              >
                {{ item.previewText }}
              </div>
              <div
                v-else
                class="flex flex-col items-center justify-center text-base-500 p-6 text-center"
              >
                <UIcon name="i-heroicons-document" class="w-10 h-10 mb-2" />
                <span class="text-xs">No preview</span>
              </div>
            </div>

            <div
              class="p-3 border-t border-base-800 bg-base-900/80 flex items-center justify-between text-[10px] text-base-500 font-mono"
            >
              <span>{{ formatLabel(item.format) }}</span>
              <span>{{ bytesLabel(item.size) }}</span>
            </div>
          </UCard>
        </div>

        <p v-if="items.length > 1" class="text-xs text-base-500 px-1">
          Drag cards to set the export order.
        </p>
      </div>
    </div>
  </div>
</template>
