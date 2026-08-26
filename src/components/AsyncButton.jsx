import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * AsyncButton Component
 * Renders an accessible button that automatically enters a disabled, loading state
 * with an animated spinner while an async mutation is pending, preventing double clicks.
 * 
 * @param {Object} props
 * @param {boolean} [props.isPending=false] - Whether mutation is in flight
 * @param {string} [props.loadingText] - Text to display while loading
 * @param {boolean} [props.disabled=false] - Explicitly disable button
 * @param {Function} [props.onClick] - Click handler
 * @param {React.ReactNode} props.children - Default button content
 * @param {string} [props.className] - CSS class name (e.g. 'btn-primary', 'btn-outline')
 * @param {Object} [props.style] - Inline styles
 * @param {string} [props.type='button'] - Button type
 * @param {React.ComponentType} [props.icon] - Optional leading Lucide icon
 * @param {'primary' | 'outline' | 'danger' | 'success'} [props.variant='primary']
 */
export const AsyncButton = ({
  isPending = false,
  loadingText,
  disabled = false,
  onClick,
  children,
  className = '',
  style = {},
  type = 'button',
  icon: Icon,
  variant = 'primary',
  ...rest
}) => {
  const isDisabled = isPending || disabled;

  // Derive class from variant if no custom class supplied
  let computedClassName = className;
  if (!computedClassName) {
    if (variant === 'primary') computedClassName = 'btn-primary';
    else if (variant === 'outline') computedClassName = 'btn-outline';
    else computedClassName = 'btn-primary';
  }

  const baseStyle = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.75 : 1,
    transition: 'all 0.2s ease',
    userSelect: 'none',
    ...style
  };

  const handleClick = (e) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={handleClick}
      className={computedClassName}
      style={baseStyle}
      aria-busy={isPending}
      {...rest}
    >
      {isPending ? (
        <>
          <Loader2 size={18} className="animate-spin" style={{ flexShrink: 0 }} />
          <span>{loadingText || 'Processing...'}</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={18} style={{ flexShrink: 0 }} />}
          {children}
        </>
      )}
    </button>
  );
};
