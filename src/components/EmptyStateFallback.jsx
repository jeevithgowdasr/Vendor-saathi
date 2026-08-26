import React from 'react';
import { PackageOpen, Sparkles, RefreshCw } from 'lucide-react';

/**
 * EmptyStateFallback Component
 * Standardized fallback UI rendered when queries or data arrays return empty ([]).
 * 
 * @param {Object} props
 * @param {string} [props.title='No Items Found'] - Heading title
 * @param {string} [props.description='There are no records matching your request right now.'] - Body text
 * @param {React.ComponentType} [props.icon=PackageOpen] - Lucide icon
 * @param {string} [props.actionLabel] - Primary action button text
 * @param {Function} [props.onAction] - Primary action button callback
 * @param {string} [props.secondaryActionLabel] - Optional secondary button text
 * @param {Function} [props.onSecondaryAction] - Optional secondary button callback
 * @param {boolean} [props.compact=false] - Compact rendering
 */
export const EmptyStateFallback = ({
  title = 'No Items Found',
  description = 'There are no items matching your criteria right now. Try modifying your search or filters.',
  icon: Icon = PackageOpen,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
  style = {}
}) => {
  return (
    <div
      className="vs-card animate-fade-in"
      style={{
        textAlign: 'center',
        padding: compact ? '32px 16px' : '54px 24px',
        borderRadius: '24px',
        backgroundColor: '#ffffff',
        border: '1.5px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '520px',
        margin: '0 auto',
        boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
        ...style
      }}
    >
      <div
        style={{
          width: compact ? '54px' : '72px',
          height: compact ? '54px' : '72px',
          borderRadius: '50%',
          backgroundColor: '#f0fdf4',
          color: '#059669',
          border: '1.5px solid #a7f3d0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          boxShadow: '0 8px 20px -4px rgba(16, 185, 129, 0.2)'
        }}
      >
        <Icon size={compact ? 26 : 34} />
      </div>

      <h3
        style={{
          fontSize: compact ? '16px' : '20px',
          fontWeight: '900',
          color: '#0f172a',
          letterSpacing: '-0.02em',
          margin: '0 0 6px 0'
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: compact ? '12.5px' : '13.5px',
          color: '#64748b',
          lineHeight: '1.5',
          maxWidth: '400px',
          margin: '0 0 20px 0'
        }}
      >
        {description}
      </p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="btn-primary"
            style={{
              padding: compact ? '8px 16px' : '10px 20px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '800'
            }}
          >
            {actionLabel}
          </button>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="btn-outline"
            style={{
              padding: compact ? '8px 16px' : '10px 20px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '800'
            }}
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
