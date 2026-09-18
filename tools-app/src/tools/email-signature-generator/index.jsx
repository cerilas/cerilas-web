import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Mail,
  Sparkles,
  Copy,
  Check,
  Download,
  Upload,
  Trash2,
  Plus,
  RotateCcw,
  Sliders,
  User,
  Building,
  Share2,
  FileCode,
  Palette,
  Eye,
  CheckCircle2,
  Info,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Sun,
  Moon,
  ChevronDown,
  Layers,
  AtSign,
  Phone,
  Globe,
  MapPin,
  Briefcase
} from 'lucide-react';
import ToolHeader from '../../components/ui/ToolHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import AdSlot from '../../components/ui/AdSlot';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import EmailSignatureSeo from './components/EmailSignatureSeo';
import { emailSignatureGeneratorManifest } from './manifest';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import {
  INITIAL_SIGNATURE_DATA,
  TEMPLATES,
  FONT_OPTIONS,
  ACCENT_PALETTE,
  SOCIAL_PLATFORMS,
  generateSignatureHtml,
  generatePlainTextSignature,
  copyVisualSignature,
  downloadHtmlFile
} from './signatureEngine';
import './email-signature.css';

export default function EmailSignatureGenerator({ onBack, toolMeta }) {
  const { visitorCount, conversionCount, getConversionLabel, trackAction, trackCopy, trackDownload } = useToolAnalytics(
    emailSignatureGeneratorManifest.slug,
    toolMeta || emailSignatureGeneratorManifest
  );

  // Core Form State
  const [signatureData, setSignatureData] = useState(INITIAL_SIGNATURE_DATA);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'branding' | 'socials' | 'style'
  const [previewTheme, setPreviewTheme] = useState('light'); // 'light' | 'dark'
  const [guideOpen, setGuideOpen] = useState(false);

  // Feedback State
  const [toastMessage, setToastMessage] = useState(null);
  const [isCopiedVisual, setIsCopiedVisual] = useState(false);
  const [isCopiedHtml, setIsCopiedHtml] = useState(false);

  const fileInputRef = useRef(null);

  const showToast = (msg, duration = 3200) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, duration);
  };

  // Field change handler
  const handleInputChange = (field, value) => {
    setSignatureData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Social link change handler
  const handleSocialChange = (platform, value) => {
    setSignatureData(prev => ({
      ...prev,
      socials: {
        ...prev.socials,
        [platform]: value
      }
    }));
  };

  // Logo file upload handler (converts to base64 Data URL)
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size should be under 2MB for optimal email loading');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      handleInputChange('logoUrl', event.target?.result || '');
      showToast('Logo uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    handleInputChange('logoUrl', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Custom Fields management
  const handleAddCustomField = () => {
    const newField = {
      id: `cf-${Date.now()}`,
      label: 'Office Hours',
      value: 'Mon - Fri, 9am - 6pm EST',
      link: ''
    };
    setSignatureData(prev => ({
      ...prev,
      customFields: [...prev.customFields, newField]
    }));
  };

  const handleUpdateCustomField = (id, key, val) => {
    setSignatureData(prev => ({
      ...prev,
      customFields: prev.customFields.map(f => (f.id === id ? { ...f, [key]: val } : f))
    }));
  };

  const handleRemoveCustomField = (id) => {
    setSignatureData(prev => ({
      ...prev,
      customFields: prev.customFields.filter(f => f.id !== id)
    }));
  };

  // Reset to initial demo data
  const handleResetData = () => {
    setSignatureData(INITIAL_SIGNATURE_DATA);
    showToast('Reset to default sample signature');
  };

  // Generated HTML & Plain Text Signature
  const generatedHtml = useMemo(() => {
    return generateSignatureHtml(signatureData);
  }, [signatureData]);

  const generatedPlainText = useMemo(() => {
    return generatePlainTextSignature(signatureData);
  }, [signatureData]);

  // Copy 1: Visual formatted copy (for Gmail / Outlook / Apple Mail paste)
  const handleCopyVisual = async () => {
    try {
      await copyVisualSignature(generatedHtml, generatedPlainText);
      setIsCopiedVisual(true);
      showToast('Copied! Now open Gmail/Outlook Settings and press Cmd+V / Ctrl+V to paste.');
      trackCopy?.({ format: 'visual', template: signatureData.template });
      setTimeout(() => setIsCopiedVisual(false), 2500);
    } catch {
      try {
        await navigator.clipboard.writeText(generatedHtml);
        setIsCopiedVisual(true);
        showToast('Visual copy restricted by browser; raw HTML copied to clipboard.');
        setTimeout(() => setIsCopiedVisual(false), 2500);
      } catch (err) {
        showToast('Unable to copy to clipboard. Please use the Download HTML option.');
      }
    }
  };

  // Copy 2: Raw HTML source code
  const handleCopyRawHtml = async () => {
    try {
      await navigator.clipboard.writeText(generatedHtml);
      setIsCopiedHtml(true);
      showToast('Raw HTML code copied to clipboard!');
      trackCopy?.({ format: 'raw_html', template: signatureData.template });
      setTimeout(() => setIsCopiedHtml(false), 2000);
    } catch {
      showToast('Failed to copy raw HTML code.');
    }
  };

  // Download HTML file
  const handleDownloadHtml = () => {
    const filename = `${(signatureData.fullName || 'email-signature').toLowerCase().replace(/\s+/g, '-')}.html`;
    downloadHtmlFile(generatedHtml, filename);
    showToast(`Downloaded ${filename}!`);
    trackDownload?.({ format: 'html', template: signatureData.template });
  };

  return (
    <div className="c-tool-page-container sig-page-container">
      {/* Tool Header */}
      <ToolHeader
        title={toolMeta?.title || emailSignatureGeneratorManifest.title}
        subtitle={toolMeta?.short_description || emailSignatureGeneratorManifest.shortDescription}
        onBack={onBack}
        backLabel="All Tools"
        badges={
          <>
            <Badge variant="blue" icon={<ShieldCheck size={12} strokeWidth={2} />}>
              100% In-Browser Privacy
            </Badge>
            <Badge variant="purple" icon={<Sparkles size={12} strokeWidth={2} />}>
              Gmail &amp; Outlook Ready
            </Badge>
            {visitorCount > 0 && (
              <Badge variant="neutral">
                {visitorCount.toLocaleString()} visitors
              </Badge>
            )}
            {conversionCount > 0 && (
              <Badge variant="brand">
                {conversionCount.toLocaleString()} {getConversionLabel('en')}
              </Badge>
            )}
          </>
        }
      />

      {/* Top Preset & Template Control Card */}
      <div className="sig-control-card">
        <div className="sig-presets-bar">
          <span className="sig-presets-label">
            <Layers size={14} /> Layout Template:
          </span>
          {TEMPLATES.map((tmpl) => {
            const isSelected = signatureData.template === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                className={`sig-preset-chip ${isSelected ? 'active' : ''}`}
                onClick={() => handleInputChange('template', tmpl.id)}
              >
                {tmpl.name}
                {tmpl.badge && <span className="sig-chip-badge">{tmpl.badge}</span>}
              </button>
            );
          })}

          <div className="sig-presets-actions">
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCcw size={13} />}
              onClick={handleResetData}
            >
              Reset Sample
            </Button>
          </div>
        </div>
      </div>

      {/* Main Studio Workspace Card */}
      <div className="sig-workspace-card">
        <div className="sig-workstation">
        {/* =======================================================
            LEFT COLUMN: Studio Controls
            ======================================================= */}
        <div className="sig-editor-card">
          {/* Segmented Pillar Navigation Tabs */}
          <div className="sig-tabs-nav">
            <button
              type="button"
              className={`sig-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={15} />
              <span>Identity &amp; Contact</span>
            </button>
            <button
              type="button"
              className={`sig-tab-btn ${activeTab === 'branding' ? 'active' : ''}`}
              onClick={() => setActiveTab('branding')}
            >
              <Building size={15} />
              <span>Logo &amp; Avatar</span>
            </button>
            <button
              type="button"
              className={`sig-tab-btn ${activeTab === 'socials' ? 'active' : ''}`}
              onClick={() => setActiveTab('socials')}
            >
              <Share2 size={15} />
              <span>Socials &amp; Custom</span>
            </button>
            <button
              type="button"
              className={`sig-tab-btn ${activeTab === 'style' ? 'active' : ''}`}
              onClick={() => setActiveTab('style')}
            >
              <Palette size={15} />
              <span>Design &amp; CTA</span>
            </button>
          </div>

          {/* TAB 1: PERSONAL & CONTACT DETAILS */}
          {activeTab === 'profile' && (
            <div className="sig-tab-pane">
              <div className="sig-group-card">
                <div className="sig-group-header">
                  <Briefcase size={14} /> Identity Information
                </div>
                <div className="sig-form-grid">
                  <div className="sig-input-group">
                    <label className="sig-input-label">Full Name</label>
                    <input
                      type="text"
                      className="sig-input"
                      placeholder="e.g. Sarah Jenkins"
                      value={signatureData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                    />
                  </div>

                  <div className="sig-input-group">
                    <label className="sig-input-label">Job Title</label>
                    <input
                      type="text"
                      className="sig-input"
                      placeholder="e.g. VP of Product Operations"
                      value={signatureData.jobTitle}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    />
                  </div>

                  <div className="sig-input-group">
                    <label className="sig-input-label">Department / Division</label>
                    <input
                      type="text"
                      className="sig-input"
                      placeholder="e.g. Product &amp; Design"
                      value={signatureData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                    />
                  </div>

                  <div className="sig-input-group">
                    <label className="sig-input-label">Company Name</label>
                    <input
                      type="text"
                      className="sig-input"
                      placeholder="e.g. Acme Global Inc."
                      value={signatureData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="sig-group-card">
                <div className="sig-group-header">
                  <AtSign size={14} /> Contact Coordinates
                </div>
                <div className="sig-form-grid">
                  <div className="sig-input-group">
                    <label className="sig-input-label">Email Address</label>
                    <input
                      type="email"
                      className="sig-input"
                      placeholder="sarah.jenkins@acme.com"
                      value={signatureData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>

                  <div className="sig-input-group">
                    <label className="sig-input-label">Office Phone</label>
                    <input
                      type="tel"
                      className="sig-input"
                      placeholder="+1 (555) 234-5678"
                      value={signatureData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>

                  <div className="sig-input-group">
                    <label className="sig-input-label">Mobile Phone <span className="optional">(Optional)</span></label>
                    <input
                      type="tel"
                      className="sig-input"
                      placeholder="+1 (555) 876-5432"
                      value={signatureData.mobile}
                      onChange={(e) => handleInputChange('mobile', e.target.value)}
                    />
                  </div>

                  <div className="sig-input-group">
                    <label className="sig-input-label">Website URL</label>
                    <input
                      type="text"
                      className="sig-input"
                      placeholder="https://cerilas.com"
                      value={signatureData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                    />
                  </div>

                  <div className="sig-input-group full-width">
                    <label className="sig-input-label">Office Address <span className="optional">(Optional)</span></label>
                    <input
                      type="text"
                      className="sig-input"
                      placeholder="500 Howard St, Suite 400, San Francisco, CA"
                      value={signatureData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOGO & AVATAR */}
          {activeTab === 'branding' && (
            <div className="sig-tab-pane">
              <div className="sig-logo-uploader">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />

                <div
                  className="sig-upload-box"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="sig-upload-icon">
                    <Upload size={22} />
                  </div>
                  <h4>Click to browse or drop company logo / portrait</h4>
                  <p>Supports PNG, JPEG, SVG, WebP (Max 2MB, converted 100% locally in-browser)</p>
                </div>

                <div className="sig-input-group">
                  <label className="sig-input-label">Or Enter Public Image URL</label>
                  <input
                    type="text"
                    className="sig-input"
                    placeholder="https://example.com/logo.png"
                    value={signatureData.logoUrl}
                    onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                  />
                </div>

                {signatureData.logoUrl && (
                  <div className="sig-logo-preview-card">
                    <div className="sig-logo-preview-thumb-wrap">
                      <img
                        src={signatureData.logoUrl}
                        alt="Logo preview"
                        className={`sig-preview-thumb sig-thumb-${signatureData.logoShape}`}
                        style={{ width: `${signatureData.logoSize}px`, height: `${signatureData.logoSize}px` }}
                      />
                    </div>
                    <div className="sig-logo-preview-details">
                      <div className="sig-logo-preview-title">Live Avatar Preview</div>
                      <div className="sig-logo-preview-dims">{signatureData.logoSize}px &bull; {signatureData.logoShape}</div>
                      <button
                        type="button"
                        className="sig-btn-text-danger"
                        onClick={handleRemoveLogo}
                      >
                        <Trash2 size={13} /> Remove Image
                      </button>
                    </div>
                  </div>
                )}

                <div className="sig-group-card">
                  <div className="sig-group-header">
                    <Sliders size={14} /> Avatar Shape &amp; Dimensions
                  </div>
                  
                  <div className="sig-input-group" style={{ marginBottom: '1rem' }}>
                    <label className="sig-input-label">Border Shape</label>
                    <div className="sig-shape-selector">
                      {[
                        { id: 'rounded', label: 'Rounded Box' },
                        { id: 'circle', label: 'Circle' },
                        { id: 'square', label: 'Sharp Square' }
                      ].map(s => (
                        <button
                          key={s.id}
                          type="button"
                          className={`sig-shape-btn ${signatureData.logoShape === s.id ? 'active' : ''}`}
                          onClick={() => handleInputChange('logoShape', s.id)}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="sig-input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="sig-input-label">Image Size</label>
                      <span className="sig-slider-badge">{signatureData.logoSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="48"
                      max="130"
                      step="2"
                      className="sig-range-slider"
                      value={signatureData.logoSize}
                      onChange={(e) => handleInputChange('logoSize', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SOCIALS & CUSTOM FIELDS */}
          {activeTab === 'socials' && (
            <div className="sig-tab-pane">
              <div className="sig-group-card">
                <div className="sig-group-header">
                  <Share2 size={14} /> Social Profiles &amp; Booking
                </div>
                <div className="sig-socials-grid">
                  {SOCIAL_PLATFORMS.map(platform => (
                    <div key={platform.id} className="sig-social-input-row">
                      <div className="sig-social-badge-tag" style={{ backgroundColor: platform.color }}>
                        {platform.iconText}
                      </div>
                      <input
                        type="text"
                        className="sig-input sig-social-field"
                        placeholder={platform.placeholder}
                        value={signatureData.socials[platform.id] || ''}
                        onChange={(e) => handleSocialChange(platform.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="sig-group-card">
                <div className="sig-group-header" style={{ justifyContent: 'space-between' }}>
                  <span><Plus size={14} /> Extensible Custom Fields</span>
                  <button
                    type="button"
                    className="sig-btn-mini-add"
                    onClick={handleAddCustomField}
                  >
                    <Plus size={12} /> Add Field
                  </button>
                </div>

                <div className="sig-custom-fields-list">
                  {signatureData.customFields.map((field) => (
                    <div key={field.id} className="sig-custom-field-row">
                      <input
                        type="text"
                        className="sig-input"
                        placeholder="Label (e.g. Pronouns)"
                        value={field.label}
                        onChange={(e) => handleUpdateCustomField(field.id, 'label', e.target.value)}
                      />
                      <input
                        type="text"
                        className="sig-input"
                        placeholder="Value (e.g. she/her)"
                        value={field.value}
                        onChange={(e) => handleUpdateCustomField(field.id, 'value', e.target.value)}
                      />
                      <input
                        type="text"
                        className="sig-input"
                        placeholder="Optional URL (https://...)"
                        value={field.link}
                        onChange={(e) => handleUpdateCustomField(field.id, 'link', e.target.value)}
                      />
                      <button
                        type="button"
                        className="sig-btn-delete-row"
                        title="Remove Field"
                        onClick={() => handleRemoveCustomField(field.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}

                  {signatureData.customFields.length === 0 && (
                    <div className="sig-empty-fields">
                      No custom rows yet. Click "Add Field" to add licenses, pronouns, or booking notes.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DESIGN & CTA */}
          {activeTab === 'style' && (
            <div className="sig-tab-pane">
              <div className="sig-group-card">
                <div className="sig-group-header">
                  <Palette size={14} /> Brand Color Accent
                </div>
                <div className="sig-palette-row">
                  {ACCENT_PALETTE.map((color) => {
                    const isSelected = signatureData.accentColor.toLowerCase() === color.toLowerCase();
                    return (
                      <div
                        key={color}
                        className={`sig-color-swatch ${isSelected ? 'active' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleInputChange('accentColor', color)}
                      >
                        {isSelected && <Check size={13} color="#ffffff" strokeWidth={3} />}
                      </div>
                    );
                  })}
                  <div className="sig-custom-color-picker">
                    <input
                      type="color"
                      value={signatureData.accentColor}
                      onChange={(e) => handleInputChange('accentColor', e.target.value)}
                      title="Choose Custom Color"
                    />
                  </div>
                  <input
                    type="text"
                    className="sig-input sig-hex-input"
                    value={signatureData.accentColor}
                    onChange={(e) => handleInputChange('accentColor', e.target.value)}
                    placeholder="#2563eb"
                  />
                </div>
              </div>

              <div className="sig-group-card">
                <div className="sig-group-header">
                  <FileCode size={14} /> Typography
                </div>
                <div className="sig-input-group">
                  <label className="sig-input-label">Email-Safe Universal Font</label>
                  <select
                    className="sig-select"
                    value={signatureData.fontFamily}
                    onChange={(e) => handleInputChange('fontFamily', e.target.value)}
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option key={font.id} value={font.value}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sig-group-card">
                <div className="sig-group-header">
                  <Sparkles size={14} /> Call-to-Action (CTA) Button
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
                  <input
                    type="checkbox"
                    id="cta-toggle"
                    checked={signatureData.ctaEnabled}
                    onChange={(e) => handleInputChange('ctaEnabled', e.target.checked)}
                    style={{ accentColor: '#2563eb', cursor: 'pointer', width: '17px', height: '17px' }}
                  />
                  <label htmlFor="cta-toggle" style={{ fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>
                    Enable Highlighted Action Button
                  </label>
                </div>

                {signatureData.ctaEnabled && (
                  <div className="sig-form-grid">
                    <div className="sig-input-group">
                      <label className="sig-input-label">Button Label</label>
                      <input
                        type="text"
                        className="sig-input"
                        placeholder="e.g. Schedule a Product Demo"
                        value={signatureData.ctaText}
                        onChange={(e) => handleInputChange('ctaText', e.target.value)}
                      />
                    </div>
                    <div className="sig-input-group">
                      <label className="sig-input-label">Destination Link</label>
                      <input
                        type="text"
                        className="sig-input"
                        placeholder="https://cerilas.com/demo"
                        value={signatureData.ctaUrl}
                        onChange={(e) => handleInputChange('ctaUrl', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="sig-group-card">
                <div className="sig-group-header">
                  <ShieldCheck size={14} /> Confidentiality &amp; Legal Disclaimer
                </div>
                <textarea
                  className="sig-textarea"
                  rows={3}
                  placeholder="Confidentiality statement or legal disclaimer appended to emails..."
                  value={signatureData.disclaimer}
                  onChange={(e) => handleInputChange('disclaimer', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* =======================================================
            RIGHT COLUMN: Realistic macOS / Apple Mail Preview & Action Deck
            ======================================================= */}
        <div className="sig-preview-column">
          <div className="sig-preview-card">
            {/* Window Chrome Header */}
            <div className="sig-preview-window-bar">
              <div className="sig-window-controls">
                <span className="sig-dot sig-dot-red" />
                <span className="sig-dot sig-dot-yellow" />
                <span className="sig-dot sig-dot-green" />
              </div>
              <div className="sig-window-title">
                New Message &mdash; Signature Preview
              </div>
              <div className="sig-theme-toggle-wrap">
                <button
                  type="button"
                  className={`sig-theme-btn ${previewTheme === 'light' ? 'active' : ''}`}
                  onClick={() => setPreviewTheme('light')}
                  title="Preview on Light Canvas"
                >
                  <Sun size={13} />
                </button>
                <button
                  type="button"
                  className={`sig-theme-btn ${previewTheme === 'dark' ? 'active' : ''}`}
                  onClick={() => setPreviewTheme('dark')}
                  title="Preview on Dark Canvas"
                >
                  <Moon size={13} />
                </button>
              </div>
            </div>

            {/* Email Simulator Window */}
            <div className={`sig-email-canvas ${previewTheme === 'dark' ? 'sig-canvas-dark' : 'sig-canvas-light'}`}>
              <div className="sig-sim-meta">
                <div className="sig-sim-meta-row">
                  <span className="sig-sim-meta-label">To:</span>
                  <span className="sig-sim-meta-pill">alex.rivera@client-enterprise.com</span>
                </div>
                <div className="sig-sim-meta-row">
                  <span className="sig-sim-meta-label">Subject:</span>
                  <span className="sig-sim-subject">Project Proposal &amp; Technical Scope Review</span>
                </div>
              </div>

              <div className="sig-sim-body">
                <p>Hi Alex,</p>
                <p>
                  Thanks for the insightful conversation earlier today. Please find the executive roadmap and technical specifications attached for your team's review.
                </p>
                <p style={{ marginTop: '0.85rem' }}>Warm regards,</p>
              </div>

              {/* Live Rendered HTML Signature */}
              <div
                className="sig-rendered-output"
                dangerouslySetInnerHTML={{ __html: generatedHtml }}
              />
            </div>

            {/* Apple Executive Action Deck */}
            <div className="sig-action-deck">
              {/* Primary Visual Copy Button */}
              <Button
                variant="primary"
                size="lg"
                icon={isCopiedVisual ? <Check size={18} /> : <Copy size={18} />}
                onClick={handleCopyVisual}
                className={`sig-btn-primary-action ${isCopiedVisual ? 'copied' : ''}`}
              >
                {isCopiedVisual ? 'Copied to Clipboard!' : 'Copy for Gmail / Apple Mail'}
              </Button>

              {/* Secondary Actions: HTML, Download, Reset */}
              <div className="sig-secondary-actions">
                <Button
                  variant="secondary"
                  size="md"
                  icon={isCopiedHtml ? <Check size={14} color="#10b981" /> : <FileCode size={14} />}
                  onClick={handleCopyRawHtml}
                  title="Copy raw HTML markup"
                >
                  {isCopiedHtml ? 'HTML Copied' : 'Raw HTML'}
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  icon={<Download size={14} />}
                  onClick={handleDownloadHtml}
                  title="Download standalone HTML file"
                >
                  Download .html
                </Button>

                <Button
                  variant="ghost"
                  size="md"
                  icon={<RotateCcw size={14} />}
                  onClick={handleResetData}
                  title="Reset to sample signature"
                >
                  Reset
                </Button>
              </div>

              {/* Quick Setup Drawer Trigger */}
              <button
                type="button"
                className="sig-guide-toggle"
                onClick={() => setGuideOpen(prev => !prev)}
              >
                <Info size={14} />
                <span>How to Install in Gmail, Outlook &amp; Apple Mail</span>
                <ChevronDown size={14} className={`sig-chevron ${guideOpen ? 'rotated' : ''}`} />
              </button>

              {guideOpen && (
                <div className="sig-quick-guide">
                  <div className="sig-guide-step">
                    <strong>1. Gmail:</strong> Go to <em>Settings &gt; General &gt; Signature</em>. Create a new signature and press <strong>Cmd+V / Ctrl+V</strong>.
                  </div>
                  <div className="sig-guide-step">
                    <strong>2. Apple Mail:</strong> Go to <em>Mail &gt; Settings &gt; Signatures</em>. Uncheck "Always match my default font", then paste.
                  </div>
                  <div className="sig-guide-step">
                    <strong>3. Outlook:</strong> Go to <em>Preferences &gt; Signatures</em>. Click "+" to create a new signature and paste directly.
                  </div>
                </div>
              )}

              {/* Toast Banner */}
              {toastMessage && (
                <div className="sig-toast success">
                  <CheckCircle2 size={15} />
                  <span>{toastMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* SEO Divider & Deep Technical Guide */}
      <ToolSeoDivider label="Comprehensive Technical Guide & Compatibility Specifications" />
      <EmailSignatureSeo />
    </div>
  );
}
