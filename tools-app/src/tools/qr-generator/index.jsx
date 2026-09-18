import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import { 
  SlidersHorizontal, 
  Palette, 
  Eye, 
  Download, 
  FileCode, 
  Copy, 
  ArrowLeft,
  Link2,
  Type,
  Wifi,
  Contact,
  Mail
} from 'lucide-react';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { useTranslation } from '../../i18n';
import { 
  buildQrPayload, 
  generateQrSvg, 
  downloadCanvasPng, 
  downloadSvgFile, 
  copyCanvasToClipboard 
} from './helpers';
import { qrGeneratorManifest } from './manifest';
import Select from '../../components/ui/Select';
import ToolHeader from '../../components/ui/ToolHeader';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import Badge from '../../components/ui/Badge';
import QrSeoSection from './components/QrSeoSection';
import AdSlot from '../../components/ui/AdSlot';
import './qr-generator.css';

const COLOR_PRESETS = [
  { name: 'Onyx', hex: '#000000' },
  { name: 'Navy', hex: '#0f172a' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Violet', hex: '#6366f1' },
  { name: 'Crimson', hex: '#e11d48' },
  { name: 'Amber', hex: '#d97706' },
];

const QR_TYPE_LABELS = {
  url: 'URL',
  text: 'Text',
  wifi: 'Wi-Fi',
  vcard: 'vCard',
  email: 'Email',
};

export default function QrGeneratorTool({ onBack, toolMeta }) {
  const { t, language } = useTranslation();
  const { visitorCount, conversionCount, getConversionLabel, trackAction } = useToolAnalytics(
    qrGeneratorManifest.slug,
    toolMeta
  );
  const canvasRef = useRef(null);

  // Type selection
  const [qrType, setQrType] = useState('url');

  // Form State
  const [formData, setFormData] = useState({
    url: 'https://cerilas.com',
    text: '',
    ssid: '',
    password: '',
    encryption: 'WPA',
    hidden: false,
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    organization: '',
    title: '',
    website: '',
    emailTo: '',
    emailSubject: '',
    emailBody: ''
  });

  // Customization State
  const [colorDark, setColorDark] = useState('#000000');
  const [colorLight, setColorLight] = useState('#ffffff');
  const [errorLevel, setErrorLevel] = useState('M');
  const [margin, setMargin] = useState(2);
  const [resolution, setResolution] = useState(512);

  // UI State
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Render QR Code onto Canvas
  const renderQr = useCallback(async () => {
    if (!canvasRef.current) return;
    const payload = buildQrPayload(qrType, formData);

    try {
      await QRCode.toCanvas(canvasRef.current, payload, {
        width: resolution,
        margin: Number(margin),
        errorCorrectionLevel: errorLevel,
        color: {
          dark: colorDark,
          light: colorLight === 'transparent' ? '#00000000' : colorLight
        }
      });
    } catch (err) {
      console.error('QR Render Error:', err);
    }
  }, [qrType, formData, colorDark, colorLight, errorLevel, margin, resolution]);

  // Debounced QR Code re-render on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      renderQr();
      trackAction('generate', { type: qrType, size: resolution });
    }, 200);
    return () => clearTimeout(timer);
  }, [renderQr, trackAction, qrType, resolution]);

  // Actions
  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    downloadCanvasPng(canvasRef.current, `cerilas-qr-${qrType}.png`);
    trackAction('download_png', { type: qrType, size: resolution });
    showToast(t('qr.toastPng'));
  };

  const handleDownloadSvg = async () => {
    const payload = buildQrPayload(qrType, formData);
    try {
      const svg = await generateQrSvg(payload, {
        colorDark,
        colorLight,
        errorCorrectionLevel: errorLevel,
        margin: Number(margin)
      });
      downloadSvgFile(svg, `cerilas-qr-${qrType}.svg`);
      trackAction('download_svg', { type: qrType });
      showToast(t('qr.toastSvg'));
    } catch (err) {
      console.error('SVG Export Error:', err);
      showToast(t('qr.toastSvgFailed'));
    }
  };

  const handleCopyClipboard = async () => {
    if (!canvasRef.current) return;
    try {
      await copyCanvasToClipboard(canvasRef.current);
      trackAction('copy', { type: qrType });
      showToast(t('qr.toastCopied'));
    } catch (err) {
      console.warn('Copy image to clipboard failed:', err);
      // Fallback: If browser blocks binary image clipboard (e.g. Firefox strict policy or permission prompt denied),
      // copy the encoded QR URL/text so user still gets their data copied
      try {
        const payload = buildQrPayload(qrType, formData);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(payload);
          trackAction('copy_text_fallback', { type: qrType });
          showToast(t('qr.toastCopiedText'));
          return;
        }
      } catch (fallbackErr) {
        console.warn('Text clipboard fallback also failed:', fallbackErr);
      }
      showToast(t('qr.toastCopyFailed'));
    }
  };

  const bgPresets = [
    { name: t('qr.design.bgWhite'), hex: '#ffffff' },
    { name: t('qr.design.bgLightGray'), hex: '#f8fafc' },
    { name: t('qr.design.bgTransparent'), hex: 'transparent' },
  ];

  const wifiSecurityOptions = [
    { value: 'WPA', label: t('qr.fields.secWpa'), description: 'WPA2 / WPA3 (Recommended)' },
    { value: 'WEP', label: t('qr.fields.secWep'), description: 'Legacy WEP standard' },
    { value: 'nopass', label: t('qr.fields.secNone'), description: 'Open network without password' },
  ];

  const errorCorrectionOptions = [
    { value: 'L', label: t('qr.design.errorLow'), description: '7% data recovery • Clean & light' },
    { value: 'M', label: t('qr.design.errorMedium'), description: '15% data recovery • Standard' },
    { value: 'Q', label: t('qr.design.errorQuartile'), description: '25% data recovery • For posters & print' },
    { value: 'H', label: t('qr.design.errorHigh'), description: '30% data recovery • Maximum durability' },
  ];

  const resolutionOptions = [
    { value: 256, label: t('qr.design.res256'), description: 'Web thumbnail & avatars' },
    { value: 512, label: t('qr.design.res512'), description: 'Standard digital screens' },
    { value: 1024, label: t('qr.design.res1024'), description: 'High-definition sharp display' },
    { value: 2048, label: t('qr.design.res2048'), description: 'Ultra-res for billboard & print' },
  ];

  const handleApplyPreset = (preset) => {
    if (preset.type) setQrType(preset.type);
    if (preset.errorLevel) setErrorLevel(preset.errorLevel);
    if (preset.resolution) setResolution(preset.resolution);
    if (preset.url) setFormData((prev) => ({ ...prev, url: preset.url }));
    if (preset.ssid) setFormData((prev) => ({ ...prev, ssid: preset.ssid }));
    if (preset.encryption) setFormData((prev) => ({ ...prev, encryption: preset.encryption }));
    window.scrollTo({ top: 80, behavior: 'smooth' });
  };

  return (
    <div className="c-tool-page-container qr-page-container">
      {/* Standardized Tool Header */}
      <ToolHeader
        title={t('qr.title')}
        subtitle={t('qr.subtitle')}
        onBack={onBack}
        backLabel={t('qr.backToTools') || 'All Tools'}
        badges={
          <>
            <Badge variant="success">
              {t('qr.statusActive') || 'Permanent (Never Expires)'}
            </Badge>
            {visitorCount > 0 && (
              <Badge variant="neutral" icon={<Eye size={12} strokeWidth={2} />}>
                {visitorCount.toLocaleString()} {t('catalog.uniqueVisitors')}
              </Badge>
            )}
            {conversionCount > 0 && (
              <Badge variant="neutral" icon={<Download size={12} strokeWidth={2} />}>
                {conversionCount.toLocaleString()} {getConversionLabel(language || 'en')}
              </Badge>
            )}
          </>
        }
      />

      {/* Main Grid: Control Panel (Left) & Preview (Right) */}
      <div className="qr-tool-container">
        {/* Left Side: Form Controls */}
        <div className="qr-panel">
          <div className="qr-panel-title">
            <SlidersHorizontal size={18} />
            {t('qr.step1Title')}
          </div>

          {/* Type Selector Tabs */}
          <div className="qr-type-tabs">
            <button 
              className={`qr-tab-btn ${qrType === 'url' ? 'active' : ''}`}
              onClick={() => setQrType('url')}
            >
              <Link2 size={15} /> {t('qr.tabs.url')}
            </button>
            <button 
              className={`qr-tab-btn ${qrType === 'text' ? 'active' : ''}`}
              onClick={() => setQrType('text')}
            >
              <Type size={15} /> {t('qr.tabs.text')}
            </button>
            <button 
              className={`qr-tab-btn ${qrType === 'wifi' ? 'active' : ''}`}
              onClick={() => setQrType('wifi')}
            >
              <Wifi size={15} /> {t('qr.tabs.wifi')}
            </button>
            <button 
              className={`qr-tab-btn ${qrType === 'vcard' ? 'active' : ''}`}
              onClick={() => setQrType('vcard')}
            >
              <Contact size={15} /> {t('qr.tabs.vcard')}
            </button>
            <button 
              className={`qr-tab-btn ${qrType === 'email' ? 'active' : ''}`}
              onClick={() => setQrType('email')}
            >
              <Mail size={15} /> {t('qr.tabs.email')}
            </button>
          </div>

          {/* Dynamic Form Content */}
          {qrType === 'url' && (
            <div className="qr-form-group">
              <label className="qr-label">{t('qr.fields.urlLabel')}</label>
              <input 
                type="url" 
                className="qr-input" 
                placeholder={t('qr.fields.urlPlaceholder')}
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
              />
            </div>
          )}

          {qrType === 'text' && (
            <div className="qr-form-group">
              <label className="qr-label">{t('qr.fields.textLabel')}</label>
              <textarea 
                className="qr-textarea" 
                placeholder={t('qr.fields.textPlaceholder')}
                value={formData.text}
                onChange={(e) => handleInputChange('text', e.target.value)}
              />
            </div>
          )}

          {qrType === 'wifi' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="qr-form-group">
                <label className="qr-label">{t('qr.fields.ssidLabel')}</label>
                <input 
                  type="text" 
                  className="qr-input" 
                  placeholder={t('qr.fields.ssidPlaceholder')}
                  value={formData.ssid}
                  onChange={(e) => handleInputChange('ssid', e.target.value)}
                />
              </div>
              <div className="qr-input-row">
                <div className="qr-form-group">
                  <label className="qr-label">{t('qr.fields.passwordLabel')}</label>
                  <input 
                    type="password" 
                    className="qr-input" 
                    placeholder={t('qr.fields.passwordPlaceholder')}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                </div>
                <div className="qr-form-group">
                  <label className="qr-label">{t('qr.fields.securityLabel')}</label>
                  <Select 
                    value={formData.encryption}
                    onChange={(val) => handleInputChange('encryption', val)}
                    options={wifiSecurityOptions}
                  />
                </div>
              </div>
              <label className="qr-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={formData.hidden}
                  onChange={(e) => handleInputChange('hidden', e.target.checked)}
                />
                {t('qr.fields.hiddenSsid')}
              </label>
            </div>
          )}

          {qrType === 'vcard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div className="qr-input-row">
                <div className="qr-form-group">
                  <label className="qr-label">{t('qr.fields.firstName')}</label>
                  <input 
                    type="text" 
                    className="qr-input" 
                    placeholder={t('qr.fields.firstNamePlaceholder')}
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                  />
                </div>
                <div className="qr-form-group">
                  <label className="qr-label">{t('qr.fields.lastName')}</label>
                  <input 
                    type="text" 
                    className="qr-input" 
                    placeholder={t('qr.fields.lastNamePlaceholder')}
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                  />
                </div>
              </div>
              <div className="qr-input-row">
                <div className="qr-form-group">
                  <label className="qr-label">{t('qr.fields.phone')}</label>
                  <input 
                    type="tel" 
                    className="qr-input" 
                    placeholder={t('qr.fields.phonePlaceholder')}
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
                <div className="qr-form-group">
                  <label className="qr-label">{t('qr.fields.email')}</label>
                  <input 
                    type="email" 
                    className="qr-input" 
                    placeholder={t('qr.fields.emailPlaceholder')}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>
              <div className="qr-input-row">
                <div className="qr-form-group">
                  <label className="qr-label">{t('qr.fields.company')}</label>
                  <input 
                    type="text" 
                    className="qr-input" 
                    placeholder={t('qr.fields.companyPlaceholder')}
                    value={formData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                  />
                </div>
                <div className="qr-form-group">
                  <label className="qr-label">{t('qr.fields.jobTitle')}</label>
                  <input 
                    type="text" 
                    className="qr-input" 
                    placeholder={t('qr.fields.jobTitlePlaceholder')}
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {qrType === 'email' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div className="qr-form-group">
                <label className="qr-label">{t('qr.fields.emailTo')}</label>
                <input 
                  type="email" 
                  className="qr-input" 
                  placeholder={t('qr.fields.emailToPlaceholder')}
                  value={formData.emailTo}
                  onChange={(e) => handleInputChange('emailTo', e.target.value)}
                />
              </div>
              <div className="qr-form-group">
                <label className="qr-label">{t('qr.fields.emailSubject')}</label>
                <input 
                  type="text" 
                  className="qr-input" 
                  placeholder={t('qr.fields.emailSubjectPlaceholder')}
                  value={formData.emailSubject}
                  onChange={(e) => handleInputChange('emailSubject', e.target.value)}
                />
              </div>
              <div className="qr-form-group">
                <label className="qr-label">{t('qr.fields.emailBody')}</label>
                <textarea 
                  className="qr-textarea" 
                  placeholder={t('qr.fields.emailBodyPlaceholder')}
                  value={formData.emailBody}
                  onChange={(e) => handleInputChange('emailBody', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Customization Section */}
          <div className="qr-customization-section">
            <div className="qr-panel-title">
              <Palette size={18} />
              {t('qr.step2Title')}
            </div>

            {/* Foreground Color */}
            <div className="qr-form-group">
              <label className="qr-label">{t('qr.design.foreground')}</label>
              <div className="qr-swatches">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.hex}
                    type="button"
                    title={p.name}
                    className={`qr-swatch ${colorDark.toLowerCase() === p.hex.toLowerCase() ? 'active' : ''}`}
                    style={{ backgroundColor: p.hex }}
                    onClick={() => setColorDark(p.hex)}
                  />
                ))}
                <div className="qr-color-input-wrapper">
                  <input 
                    type="color" 
                    className="qr-color-picker"
                    value={colorDark}
                    onChange={(e) => setColorDark(e.target.value)}
                  />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{colorDark}</span>
                </div>
              </div>
            </div>

            {/* Background Color */}
            <div className="qr-form-group">
              <label className="qr-label">{t('qr.design.background')}</label>
              <div className="qr-swatches">
                {bgPresets.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    title={p.name}
                    className={`qr-swatch ${colorLight === p.hex ? 'active' : ''}`}
                    style={{ 
                      backgroundColor: p.hex === 'transparent' ? '#eee' : p.hex,
                      backgroundImage: p.hex === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                      backgroundSize: '8px 8px'
                    }}
                    onClick={() => setColorLight(p.hex)}
                  />
                ))}
              </div>
            </div>

            {/* Error Correction & Margin */}
            <div className="qr-input-row">
              <div className="qr-form-group">
                <label className="qr-label">{t('qr.design.errorCorrection')}</label>
                <Select
                  value={errorLevel}
                  onChange={(val) => setErrorLevel(val)}
                  options={errorCorrectionOptions}
                />
              </div>
              <div className="qr-form-group">
                <label className="qr-label">{t('qr.design.resolution')}</label>
                <Select
                  value={resolution}
                  onChange={(val) => setResolution(Number(val))}
                  options={resolutionOptions}
                />
              </div>
            </div>

            {/* Margin Slider */}
            <div className="qr-form-group">
              <label className="qr-label">{t('qr.design.margin')}</label>
              <div className="qr-range-row">
                <input 
                  type="range" 
                  min="0" 
                  max="6" 
                  step="1"
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                />
                <span className="qr-range-value">{margin} {t('qr.design.modules')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Live Sticky Preview & Actions */}
        <div className="qr-panel qr-preview-panel">
          <div className="qr-panel-title" style={{ width: '100%', justifyContent: 'center' }}>
            <Eye size={18} /> {t('qr.previewTitle')}
          </div>

          <div className="qr-canvas-card">
            <canvas ref={canvasRef} />
          </div>

          <div className="qr-preview-meta">
            <h4>{t('qr.readyLabel', { type: QR_TYPE_LABELS[qrType] || qrType })}</h4>
            <p>{t('qr.readyMeta', { res: resolution, level: errorLevel })}</p>
          </div>

          {toastMessage && (
            <div className="qr-toast">
              ✓ {toastMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="qr-actions">
            <button 
              className="qr-btn-primary"
              onClick={handleDownloadPng}
            >
              <Download size={18} /> {t('qr.downloadPng')}
            </button>

            <div className="qr-btn-row">
              <button 
                className="qr-btn-secondary"
                onClick={handleDownloadSvg}
              >
                <FileCode size={16} /> {t('qr.downloadSvg')}
              </button>
              <button 
                className="qr-btn-secondary"
                onClick={handleCopyClipboard}
              >
                <Copy size={16} /> {t('qr.copyClipboard')}
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Modern High-Conversion SEO & FAQ Guide for US Search Intent (Partitioned below the fold) */}
      <ToolSeoDivider label="QR Code Standards, Design Guidelines & FAQs" />
      <QrSeoSection onApplyPreset={handleApplyPreset} />

      {/* Google AdSense Slot: Bottom 970x250 / 728x90 Pre-Footer Banner */}
      <AdSlot format="billboard" slotId="ad-qr-bottom-billboard" />
    </div>
  );
}
