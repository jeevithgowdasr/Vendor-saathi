import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { AsyncButton } from './AsyncButton';

/**
 * ErrorStateFallback Component
 * Standardized error boundary and API failure fallback UI with interactive retry trigger.
 * 
 * @param {Object} props
 * @param {string} [props.title='Unable to Load Data'] - Heading title
 * @param {string|Error} [props.error='A network or server communication issue occurred.'] - Error message
 * @param {Function} [props.onRetry] - Callback to retry fetching
 * @param {boolean} [props.isRetrying=false] - Whether retry request is currently pending
 * @param {string} [props.retryLabel='Try Again ⟳'] - Retry button label
 * @param {Function} [props.onSecondaryAction] - Optional secondary action (e.g. Back to Home)
 * @param {string} [props.secondaryActionLabel='Back to Home'] - Secondary button label
 * @param {boolean} [props.compact=false] - Compact mode
 */
export const ErrorStateFallback = ({
  title = 'Unable to Load Data',
  error,
  onRetry,
  isRetrying = false,
  retryLabel = 'Try Again ⟳',
  onSecondaryAction,
  secondaryActionLabel = 'Back to Home',
  compact = false,
  style = {}
}) => {
  const errorMessage = typeof error === 'string'
    ? error
    : error?.message || 'We encountered an issue fetching this data. Please check your internet connection and try again.';

  return (
    <div
      className="vs-card animate-fade-in"
      style={{
        textAlign: 'center',
        padding: compact ? '28px 16px' : '48px 24px',
        borderRadius: '24px',
        backgroundColor: '#ffffff',
        border: '1.5px solid #fecaca',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '520px',
        margin: '0 auto',
        boxShadow: '0 4px 16px -2px rgba(239, 68, 68, 0.08)',
        ...style
      }}
    >
      <div
        style={{
          width: compact ? '52px' : '68px',
          height: compact ? '52px' : '68px',
          borderRadius: '50%',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          border: '1.5px solid #fca5a5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          boxShadow: '0 8px 20px -4px rgba(239, 68, 68, 0.2)'
        }}
      >
        <AlertTriangle size={compact ? 26 : 32} />
      </div>

      <h3
        style={{
          fontSize: compact ? '16px' : '19px',
          fontWeight: '900',
          color: '#991b1b',
          letterSpacing: '-0.02em',
          margin: '0 0 6px 0'
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: compact ? '12px' : '13px',
          color: '#64748b',
          lineHeight: '1.5',
          maxWidth: '420px',
          margin: '0 0 20px 0',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word'
        }}
      >
        {errorMessage}
      </p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {onRetry && (
          <AsyncButton
            isPending={isRetrying}
            loadingText="Retrying..."
            onClick={onRetry}
            icon={RefreshCw}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              padding: compact ? '8px 16px' : '10px 20px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '800'
            }}
          >
            {retryLabel}
          </AsyncButton>
        )}

        {onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="btn-outline"
            style={{
              padding: compact ? '8px 16px' : '10px 20px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '800',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeft size={15} />
            <span>{secondaryActionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};
