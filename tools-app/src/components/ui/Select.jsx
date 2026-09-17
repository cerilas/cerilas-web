import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './Select.css';

/**
 * Modern Apple-styled Custom Select Component.
 * Replaces browser default select elements with a frosted glass floating dropdown.
 *
 * @param {Array<{value: string|number, label: string, description?: string}>} options
 * @param {string|number} value
 * @param {function} onChange
 * @param {string} [placeholder]
 * @param {string} [className]
 * @param {string} [id]
 */
export default function Select({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  className = '',
  id
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard accessibility
  const handleKeyDown = useCallback(
    (e) => {
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
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    },
    [isOpen, options, value, onChange]
  );

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const handleSelect = (optValue) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`apple-select-container ${isOpen ? 'open' : ''} ${className}`}
      id={id}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="apple-select-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="apple-select-value">
          {selectedOption ? (
            selectedOption.label
          ) : (
            <span className="apple-select-placeholder">{placeholder}</span>
          )}
        </span>
        <ChevronDown size={16} className="apple-select-chevron" strokeWidth={1.75} />
      </button>

      {isOpen && (
        <div className="apple-select-dropdown" role="listbox">
          {options.map((option) => {
            const isSelected = String(option.value) === String(value);
            return (
              <div
                key={option.value}
                className={`apple-select-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(option.value)}
                role="option"
                aria-selected={isSelected}
              >
                <div className="apple-select-option-content">
                  <span className="apple-select-option-label">{option.label}</span>
                  {option.description && (
                    <span className="apple-select-option-desc">{option.description}</span>
                  )}
                </div>
                {isSelected && (
                  <Check size={15} className="apple-select-check" strokeWidth={2} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
