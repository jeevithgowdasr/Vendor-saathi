import React, { useState } from 'react';
import { Table, LayoutGrid, ArrowUpDown, ChevronRight } from 'lucide-react';

/**
 * ResponsiveTable Component
 * Accessible, mobile-first responsive table supporting:
 * - Desktop/Tablet: Semantic <table> with sticky header, sticky key column, and horizontal scroll.
 * - Mobile (< 768px): Smooth adaptive stacked card view or view switcher.
 * - WCAG AA Contrast and minimum 44x44px touch targets.
 * 
 * @param {Object} props
 * @param {Array<{ key: string, label: string, render?: Function, width?: string|number, align?: 'left'|'center'|'right', sticky?: boolean }>} props.columns
 * @param {Array<Object>} props.data
 * @param {string} [props.keyField='id']
 * @param {boolean} [props.stickyHeader=true]
 * @param {boolean} [props.stickyFirstColumn=false]
 * @param {'card' | 'scroll' | 'toggle'} [props.mobileLayout='toggle']
 * @param {string} [props.emptyMessage='No records available']
 * @param {Function} [props.renderMobileCard] - Custom renderer for mobile card layout (row, index) => ReactNode
 * @param {string} [props.caption]
 * @param {string} [props.className='']
 * @param {Object} [props.style={}]
 */
export const ResponsiveTable = ({
  columns = [],
  data = [],
  keyField = 'id',
  stickyHeader = true,
  stickyFirstColumn = false,
  mobileLayout = 'toggle',
  emptyMessage = 'No records available',
  renderMobileCard,
  caption,
  className = '',
  style = {}
}) => {
  const [viewMode, setViewMode] = useState('auto'); // 'auto' | 'table' | 'card'

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div
        className="vs-card animate-fade-in"
        style={{
          padding: '36px 20px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          border: '1.5px solid #e2e8f0',
          color: '#475569',
          fontSize: '14px',
          fontWeight: '600'
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  const isCardViewActive = viewMode === 'card';
  const isTableViewActive = viewMode === 'table';

  return (
    <div className={`responsive-table-wrapper ${className}`} style={{ width: '100%', ...style }}>
      {/* Mobile / Tablet View Switcher Toggle */}
      {mobileLayout === 'toggle' && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          {caption && (
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.01em' }}>
              {caption}
            </span>
          )}

          <div
            style={{
              display: 'flex',
              backgroundColor: '#f1f5f9',
              borderRadius: '12px',
              padding: '3px',
              border: '1px solid #e2e8f0',
              marginLeft: 'auto'
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className="touch-target-44"
              style={{
                padding: '6px 12px',
                borderRadius: '9px',
                fontSize: '12px',
                fontWeight: '800',
                backgroundColor: isCardViewActive ? '#ffffff' : 'transparent',
                color: isCardViewActive ? '#059669' : '#64748b',
                boxShadow: isCardViewActive ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                border: 'none',
                cursor: 'pointer'
              }}
              title="Stacked Cards View"
            >
              <LayoutGrid size={15} />
              <span>Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className="touch-target-44"
              style={{
                padding: '6px 12px',
                borderRadius: '9px',
                fontSize: '12px',
                fontWeight: '800',
                backgroundColor: isTableViewActive ? '#ffffff' : 'transparent',
                color: isTableViewActive ? '#059669' : '#64748b',
                boxShadow: isTableViewActive ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                border: 'none',
                cursor: 'pointer'
              }}
              title="Full Data Table View"
            >
              <Table size={15} />
              <span>Table</span>
            </button>
          </div>
        </div>
      )}

      {/* Stacked Cards for Mobile View (When viewMode === 'card' or mobile screen and not forced table) */}
      {(mobileLayout === 'card' || isCardViewActive) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '14px'
          }}
        >
          {data.map((row, index) => {
            const rowKey = row[keyField] || `row_${index}`;

            if (typeof renderMobileCard === 'function') {
              return <React.Fragment key={rowKey}>{renderMobileCard(row, index)}</React.Fragment>;
            }

            return (
              <div
                key={rowKey}
                className="vs-card animate-fade-in"
                style={{
                  padding: '18px 20px',
                  borderRadius: '18px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
                }}
              >
                {columns.map((col) => {
                  const cellContent = typeof col.render === 'function' ? col.render(row[col.key], row, index) : row[col.key];

                  return (
                    <div
                      key={col.key}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '7px 0',
                        borderBottom: '1px solid #f1f5f9',
                        fontSize: '13px',
                        gap: '12px'
                      }}
                    >
                      <span style={{ fontWeight: '700', color: '#64748b', flexShrink: 0 }}>
                        {col.label}
                      </span>
                      <span
                        style={{
                          fontWeight: '800',
                          color: '#0f172a',
                          textAlign: 'right',
                          overflowWrap: 'break-word',
                          wordBreak: 'break-word'
                        }}
                      >
                        {cellContent}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Standard Semantic Data Table (When mobileLayout !== 'card' and not isCardViewActive) */}
      {(mobileLayout !== 'card' && !isCardViewActive) && (
        <div
          className={`table-responsive-container ${stickyHeader ? 'table-sticky-header' : ''} ${stickyFirstColumn ? 'table-sticky-col-first' : ''}`}
        >
          <table aria-label={caption || 'Data table'}>
            {caption && <caption className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>{caption}</caption>}
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    style={{
                      width: col.width || 'auto',
                      textAlign: col.align || 'left',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => {
                const rowKey = row[keyField] || `row_${index}`;

                return (
                  <tr key={rowKey}>
                    {columns.map((col, colIdx) => {
                      const cellContent = typeof col.render === 'function' ? col.render(row[col.key], row, index) : row[col.key];

                      return (
                        <td
                          key={col.key}
                          style={{
                            textAlign: col.align || 'left',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word'
                          }}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
