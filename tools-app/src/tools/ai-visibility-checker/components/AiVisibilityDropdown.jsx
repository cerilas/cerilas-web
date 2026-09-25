import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Modern Apple / Frontier AI-inspired Dropdown Component
 * Features: Frosted glass popover, country flags, sub-descriptions, badges, keyboard navigation
 */
export default function AiVisibilityDropdown({
  id,
  label,
  icon,
  options = [],
  value,
  onChange,
  disabled = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const listboxRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard accessibility
  const handleKeyDown = useCallback(
    (e) => {
      if (disabled) return;
      if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          return;
        }
        const currentIndex = options.findIndex((opt) => opt.value === value);
        const direction = e.key === 'ArrowDown' ? 1 : -1;
        const nextIndex = Math.min(
          Math.max(currentIndex + direction, 0),
          options.length - 1
        );
        if (options[nextIndex]) {
          onChange(options[nextIndex].value);
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (!isOpen) {
          e.preventDefault();
          setIsOpen(true);
        }
      }
    },
    [disabled, isOpen, options, value, onChange]
  );

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  const handleSelect = (optVal) => {
    onChange(optVal);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`aivc-dropdown-group ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Field Label */}
      <div className="aivc-dropdown-label-bar">
        <label htmlFor={id} className="aivc-dropdown-label">
          {icon}
          <span>{label}</span>
        </label>
        {selectedOption?.badge && (
          <span className="aivc-dropdown-pill-badge">{selectedOption.badge}</span>
        )}
      </div>

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        className="aivc-dropdown-trigger"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <div className="aivc-dropdown-trigger-content">
          <div className="aivc-dropdown-icon-slot" aria-hidden="true">
            {selectedOption?.icon}
          </div>
          <div className="aivc-dropdown-trigger-texts">
            <span className="aivc-dropdown-trigger-title">{selectedOption?.label}</span>
          </div>
          {selectedOption?.code && (
            <span className="aivc-dropdown-code-tag">{selectedOption.code}</span>
          )}
        </div>
        <ChevronDown
          size={15}
          className={`aivc-dropdown-chevron ${isOpen ? 'rotated' : ''}`}
          strokeWidth={2}
        />
      </button>

      {/* Floating Glassmorphic Popover */}
      {isOpen && (
        <div
          ref={listboxRef}
          className="aivc-dropdown-menu"
          role="listbox"
          aria-labelledby={id}
        >
          <div className="aivc-dropdown-menu-header">
            <span>Select {label}</span>
            <span className="aivc-dropdown-menu-hint">{options.length} options</span>
          </div>
          <div className="aivc-dropdown-options-scroll">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  className={`aivc-dropdown-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt.value)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="aivc-dropdown-item-left">
                    <div className="aivc-dropdown-item-icon-slot" aria-hidden="true">
                      {opt.icon}
                    </div>
                    <div className="aivc-dropdown-item-texts">
                      <div className="aivc-dropdown-item-title-row">
                        <span className="aivc-dropdown-item-label">{opt.label}</span>
                        {opt.code && (
                          <span className="aivc-dropdown-item-code">{opt.code}</span>
                        )}
                      </div>
                      {opt.desc && (
                        <span className="aivc-dropdown-item-desc">{opt.desc}</span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="aivc-dropdown-item-check">
                      <Check size={14} strokeWidth={2.5} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
