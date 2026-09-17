import QRCode from 'qrcode';

/**
 * Builds standard formatted string based on selected QR data type.
 */
export function buildQrPayload(type, formData) {
  switch (type) {
    case 'url': {
      let raw = (formData.url || '').trim();
      if (!raw) return 'https://cerilas.com';
      if (!/^https?:\/\//i.test(raw)) {
        return `https://${raw}`;
      }
      return raw;
    }
    case 'text':
      return formData.text || 'Cerilas Yüksek Teknoloji';

    case 'wifi': {
      const ssid = (formData.ssid || '').trim();
      const pass = formData.password || '';
      const enc = formData.encryption || 'WPA';
      const hidden = formData.hidden ? 'H:true;' : '';
      if (!ssid) return 'WIFI:S:Cerilas-Guest;T:WPA;P:cerilas2026;;';
      if (enc === 'nopass') {
        return `WIFI:S:${ssid};T:nopass;${hidden};`;
      }
      return `WIFI:S:${ssid};T:${enc};P:${pass};${hidden};`;
    }

    case 'vcard': {
      const first = (formData.firstName || '').trim();
      const last = (formData.lastName || '').trim();
      const phone = (formData.phone || '').trim();
      const email = (formData.email || '').trim();
      const org = (formData.organization || '').trim();
      const title = (formData.title || '').trim();
      const website = (formData.website || '').trim();

      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${last};${first};;;`,
        `FN:${first} ${last}`.trim(),
        org ? `ORG:${org}` : '',
        title ? `TITLE:${title}` : '',
        phone ? `TEL;TYPE=CELL:${phone}` : '',
        email ? `EMAIL:${email}` : '',
        website ? `URL:${website}` : '',
        'END:VCARD'
      ].filter(Boolean);

      return lines.join('\n');
    }

    case 'email': {
      const to = (formData.emailTo || '').trim();
      const subject = encodeURIComponent(formData.emailSubject || '');
      const body = encodeURIComponent(formData.emailBody || '');
      return `mailto:${to}?subject=${subject}&body=${body}`;
    }

    default:
      return 'https://cerilas.com';
  }
}

/**
 * Generates an SVG string representation of the QR code.
 */
export async function generateQrSvg(text, options = {}) {
  const {
    colorDark = '#000000',
    colorLight = '#ffffff',
    errorCorrectionLevel = 'M',
    margin = 2
  } = options;

  return await QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel,
    margin,
    color: {
      dark: colorDark,
      light: colorLight === 'transparent' ? '#00000000' : colorLight
    }
  });
}

/**
 * Downloads the current canvas content as a PNG file.
 */
export function downloadCanvasPng(canvas, filename = 'cerilas-qrcode.png') {
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads raw SVG markup as a `.svg` file.
 */
export function downloadSvgFile(svgString, filename = 'cerilas-qrcode.svg') {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies the canvas image directly to system clipboard as image/png.
 * Preserves user gesture context for Safari and supports standard Chromium ClipboardItem API.
 */
export async function copyCanvasToClipboard(canvas) {
  if (!canvas) throw new Error('Canvas not available');

  if (!navigator.clipboard || !navigator.clipboard.write) {
    throw new Error('Clipboard API not supported in this browser or context');
  }

  // Helper to convert canvas to blob
  const getBlob = () => new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create image blob'));
    }, 'image/png');
  });

  // 1. Safari / WebKit requirement: ClipboardItem must accept a Promise<Blob>
  // and navigator.clipboard.write must be called synchronously during the user event tick
  if (typeof ClipboardItem !== 'undefined') {
    try {
      const item = new ClipboardItem({
        'image/png': getBlob()
      });
      await navigator.clipboard.write([item]);
      return true;
    } catch (safariErr) {
      console.warn('Promise-based ClipboardItem attempt failed, trying resolved blob:', safariErr);
      // 2. Chromium / Firefox fallback (where passing a Promise inside ClipboardItem might not be supported)
      const blob = await getBlob();
      const item = new ClipboardItem({
        'image/png': blob
      });
      await navigator.clipboard.write([item]);
      return true;
    }
  }

  throw new Error('ClipboardItem is not supported on this device');
}
