import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, RotateCcw, Clock, ArrowRight } from 'lucide-react';

const PRESET_RANGES = [
  { id: 'all', label: 'Tüm Zamanlar' },
  { id: 'today', label: 'Bugün' },
  { id: 'yesterday', label: 'Dün' },
  { id: '3days', label: 'Son 3 Gün' },
  { id: '7days', label: 'Son 1 Hafta' },
  { id: '30days', label: 'Son 1 Ay' },
  { id: '90days', label: 'Son 3 Ay' },
  { id: '180days', label: 'Son 6 Ay' },
  { id: '365days', label: 'Son 1 Yıl' },
  { id: 'custom', label: 'Özel Tarih' }
];

export default function AdminTimeFilter({
  selectedRange = 'all',
  onSelectRange,
  customStartDate = '',
  customEndDate = '',
  onApplyCustomRange,
  onReset,
  loading = false,
  activeFilterLabel = 'Tüm Zamanlar'
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(selectedRange === 'custom');
  const [startDate, setStartDate] = useState(customStartDate);
  const [endDate, setEndDate] = useState(customEndDate);
  const dropdownRef = useRef(null);

  // Sync state if selectedRange changes from outside
  useEffect(() => {
    setIsCustomMode(selectedRange === 'custom');
  }, [selectedRange]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetSelect = (presetId) => {
    if (presetId === 'custom') {
      setIsCustomMode(true);
      setDropdownOpen(false);
    } else {
      setIsCustomMode(false);
      setDropdownOpen(false);
      if (onSelectRange) onSelectRange(presetId);
    }
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    if (onApplyCustomRange) {
      onApplyCustomRange(startDate, endDate);
    }
  };

  const currentLabel = PRESET_RANGES.find(r => r.id === selectedRange)?.label || activeFilterLabel || 'Tüm Zamanlar';
  const isFiltered = selectedRange !== 'all';

  return (
    <div className="admin-time-filter-bar">
      <div className="admin-time-filter-container">
        {/* Left: Filter label & Dropdown selector */}
        <div className="admin-time-filter-left" ref={dropdownRef}>
          <div className="admin-time-filter-badge-wrap">
            <span className="admin-time-filter-caption">
              <Clock size={14} className="admin-time-icon" />
              Zaman Aralığı:
            </span>
          </div>

          <div className="admin-time-dropdown-wrap">
            <button
              type="button"
              className={`admin-time-dropdown-btn ${isFiltered ? 'is-active' : ''}`}
              onClick={() => setDropdownOpen(prev => !prev)}
              aria-expanded={dropdownOpen}
              aria-label="Tarih aralığı seçin"
            >
              <Calendar size={15} />
              <span className="admin-time-dropdown-label">{currentLabel}</span>
              <ChevronDown size={14} className={`admin-time-chevron ${dropdownOpen ? 'is-open' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="admin-time-dropdown-menu">
                <div className="admin-time-dropdown-header">
                  <span>Hazır Zaman Aralıkları</span>
                </div>
                {PRESET_RANGES.map((preset) => {
                  const isSelected = selectedRange === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={`admin-time-dropdown-item ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => handlePresetSelect(preset.id)}
                    >
                      <span>{preset.label}</span>
                      {isSelected && <Check size={14} className="admin-time-check-icon" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick presets for rapid desktop switching */}
          <div className="admin-time-quick-pills">
            {['today', 'yesterday', '7days', '30days', 'all'].map((pid) => {
              const p = PRESET_RANGES.find(r => r.id === pid);
              const isActive = selectedRange === pid;
              return (
                <button
                  key={pid}
                  type="button"
                  className={`admin-time-pill ${isActive ? 'is-active' : ''}`}
                  onClick={() => handlePresetSelect(pid)}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Custom Date Pickers or Status Indicator */}
        <div className="admin-time-filter-right">
          {isCustomMode ? (
            <form className="admin-time-custom-form" onSubmit={handleApplyCustom}>
              <div className="admin-time-date-inputs">
                <label className="admin-time-date-field">
                  <span className="admin-time-field-label">Başlangıç</span>
                  <input
                    type="date"
                    className="admin-time-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </label>
                <span className="admin-time-date-sep">
                  <ArrowRight size={13} />
                </span>
                <label className="admin-time-date-field">
                  <span className="admin-time-field-label">Bitiş</span>
                  <input
                    type="date"
                    className="admin-time-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </label>
              </div>

              <button
                type="submit"
                className="admin-action-btn primary admin-time-apply-btn"
                disabled={!startDate || !endDate || loading}
              >
                Uygula
              </button>
            </form>
          ) : (
            <div className="admin-time-status-info">
              {isFiltered && (
                <div className="admin-time-active-pill">
                  <span>Aktif Filtre: {currentLabel}</span>
                </div>
              )}
            </div>
          )}

          {isFiltered && onReset && (
            <button
              type="button"
              className="admin-time-reset-btn"
              onClick={onReset}
              title="Tüm Zamanlara Sıfırla"
              aria-label="Tarih filtresini sıfırla"
            >
              <RotateCcw size={13} />
              <span>Sıfırla</span>
            </button>
          )}

          {loading && (
            <div className="admin-time-spinner" title="Veriler güncelleniyor..." />
          )}
        </div>
      </div>
    </div>
  );
}
