import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { handleNumericKeyDown } from '../utils/validators';

/**
 * Reusable FormField Component
 * Enforces accessibility, inline error displays, clean word wrapping,
 * password visibility toggles, and numeric input keydown protection.
 */
export const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required = false,
  disabled = false,
  helperText,
  maxLength,
  minLength,
  min,
  max,
  step,
  rows = 3,
  isTextArea = false,
  isCurrency = false,
  allowDecimal = true,
  children,
  icon: Icon,
  className = '',
  style = {}
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === 'password';
  const effectiveType = isPasswordField ? (showPassword ? 'text' : 'password') : type;
  const isNumericField = type === 'number' || isCurrency;

  const currentLength = typeof value === 'string' ? value.length : 0;
  const fieldId = `field_${name || Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${fieldId}_error`;
  const helperId = `${fieldId}_helper`;

  const onKeyDownHandler = (e) => {
    if (isNumericField) {
      handleNumericKeyDown(e, allowDecimal);
    }
  };

  return (
    <div 
      className={`form-field-container ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        marginBottom: '14px',
        width: '100%',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
        ...style
      }}
    >
      {/* Label and Character Count Header */}
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label 
            htmlFor={fieldId}
            style={{
              fontSize: '12.5px',
              fontWeight: '800',
              color: error ? '#dc2626' : '#334155',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              userSelect: 'none'
            }}
          >
            {Icon && <Icon size={14} style={{ flexShrink: 0, color: error ? '#dc2626' : '#059669' }} />}
            <span>{label}</span>
            {required && <span style={{ color: '#ef4444', fontWeight: '900' }}>*</span>}
          </label>

          {maxLength && (
            <span style={{ 
              fontSize: '11px', 
              color: currentLength >= maxLength ? '#ef4444' : '#94a3b8',
              fontWeight: currentLength >= maxLength ? '800' : '600'
            }}>
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      )}

      {/* Input / TextArea / Custom Control Container */}
      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
        {isCurrency && (
          <span style={{
            position: 'absolute',
            left: '12px',
            color: '#64748b',
            fontWeight: '800',
            fontSize: '14px',
            pointerEvents: 'none',
            zIndex: 1
          }}>
            ₹
          </span>
        )}

        {isTextArea ? (
          <textarea
            id={fieldId}
            name={name}
            value={value ?? ''}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            maxLength={maxLength}
            minLength={minLength}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : (helperText ? helperId : undefined)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              border: error ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
              backgroundColor: disabled ? '#f1f5f9' : '#ffffff',
              fontSize: '13.5px',
              fontWeight: '600',
              color: '#0f172a',
              outline: 'none',
              resize: 'vertical',
              minHeight: '75px',
              boxShadow: error ? '0 0 0 3px rgba(239, 68, 68, 0.12)' : 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word'
            }}
          />
        ) : children ? (
          children
        ) : (
          <input
            id={fieldId}
            name={name}
            type={effectiveType}
            value={value ?? ''}
            onChange={onChange}
            onBlur={onBlur}
            onKeyDown={onKeyDownHandler}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            minLength={minLength}
            min={min}
            max={max}
            step={step}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : (helperText ? helperId : undefined)}
            style={{
              width: '100%',
              padding: isCurrency 
                ? '10px 14px 10px 28px' 
                : isPasswordField 
                  ? '10px 42px 10px 14px' 
                  : '10px 14px',
              borderRadius: '12px',
              border: error ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
              backgroundColor: disabled ? '#f1f5f9' : '#ffffff',
              fontSize: '13.5px',
              fontWeight: '600',
              color: '#0f172a',
              outline: 'none',
              boxShadow: error ? '0 0 0 3px rgba(239, 68, 68, 0.12)' : 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word'
            }}
          />
        )}

        {/* Password Show / Hide Toggle Button */}
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: '10px',
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              borderRadius: '6px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {/* Helper text if no error */}
      {helperText && !error && (
        <span 
          id={helperId}
          style={{ fontSize: '11.5px', color: '#64748b', marginLeft: '2px', lineHeight: '1.3' }}
        >
          {helperText}
        </span>
      )}

      {/* Inline Error Message */}
      {error && (
        <div 
          id={errorId}
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '5px',
            color: '#dc2626',
            fontSize: '12px',
            fontWeight: '700',
            marginTop: '2px',
            marginLeft: '2px',
            lineHeight: '1.3'
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
