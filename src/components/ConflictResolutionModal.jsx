import React from 'react';
import {
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowRight,
  X,
  Compass,
  Store,
  Calendar,
  ShieldAlert
} from 'lucide-react';

/**
 * ConflictResolutionModal Component
 *
 * Displays a non-blocking conflict warning when a proposed schedule overlaps with
 * an existing vendor of the same/similar category in the same area and time window.
 *
 * Provides 3 resolution choices:
 *  1. "Pick Another Time" (adjacent open time slots on the same day)
 *  2. "Explore Recommended Areas" (alternative neighborhoods with zero competing vendors)
 *  3. "Continue Anyway" (persists visit with hasConflict: true & conflictResolution: 'ignored')
 */
export const ConflictResolutionModal = ({
  isOpen,
  onClose,
  conflictData,
  proposedSchedule,
  onSelectTimeSlot,
  onSelectRecommendedArea,
  onContinueAnyway,
  isSaving = false
}) => {
  if (!isOpen || !conflictData) return null;

  const {
    conflicts = [],
    primaryConflict = null,
    suggestedTimeSlots = [],
    recommendedAreas = []
  } = conflictData;

  const competingName = primaryConflict?.competingVendorName || 'Another Local Merchant';
  const competingCategory = primaryConflict?.competingCategory || proposedSchedule?.vendorCategory || 'Similar Category';
  const overlappingWindow = primaryConflict?.overlappingTimeWindow || 'Overlapping Time Window';
  const areaName = primaryConflict?.areaName || proposedSchedule?.area?.areaName || 'Target Area';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div
        className="animate-scale-up"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(217, 119, 6, 0.25)',
          border: '1.5px solid #fde68a',
          padding: '28px'
        }}
      >
        {/* ─── Modal Header ──────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingBottom: '16px',
            borderBottom: '1px solid #fef3c7'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                backgroundColor: '#fef3c7',
                border: '1px solid #fde68a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706'
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3
                  id="conflict-modal-title"
                  style={{
                    fontSize: '19px',
                    fontWeight: '900',
                    color: '#92400e',
                    margin: 0,
                    letterSpacing: '-0.01em'
                  }}
                >
                  Vendor Schedule Overlap Detected
                </h3>
                <span
                  style={{
                    backgroundColor: '#fffbeb',
                    color: '#b45309',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    border: '1px solid #fde68a'
                  }}
                >
                  Non-Blocking
                </span>
              </div>
              <span style={{ fontSize: '12.5px', color: '#78350f', display: 'block', marginTop: '2px' }}>
                Another vendor in the same category is scheduled around the same time and location.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── Conflict Warning Details Card ─────────────────────────────── */}
        <div
          style={{
            marginTop: '18px',
            backgroundColor: '#fffbeb',
            borderRadius: '16px',
            padding: '16px 20px',
            border: '1px solid #fcd34d'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldAlert size={18} color="#d97706" />
            <strong style={{ fontSize: '13.5px', color: '#92400e' }}>
              Competing Vendor Details ({conflicts.length} overlapping visit{conflicts.length > 1 ? 's' : ''}):
            </strong>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginTop: '10px'
            }}
          >
            <div style={{ backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '12px', border: '1px solid #fef3c7' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#b45309', textTransform: 'uppercase', display: 'block' }}>
                Competing Merchant
              </span>
              <strong style={{ fontSize: '14px', color: '#0f172a' }}>{competingName}</strong>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '12px', border: '1px solid #fef3c7' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#b45309', textTransform: 'uppercase', display: 'block' }}>
                Vendor Category
              </span>
              <strong style={{ fontSize: '14px', color: '#0f172a' }}>{competingCategory}</strong>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '12px', border: '1px solid #fef3c7' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#b45309', textTransform: 'uppercase', display: 'block' }}>
                Overlapping Window
              </span>
              <strong style={{ fontSize: '14px', color: '#d97706' }}>{overlappingWindow}</strong>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '12px', border: '1px solid #fef3c7' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#b45309', textTransform: 'uppercase', display: 'block' }}>
                Target Neighborhood
              </span>
              <strong style={{ fontSize: '14px', color: '#0f172a' }}>{areaName}</strong>
            </div>
          </div>

          <p style={{ margin: '12px 0 0 0', fontSize: '12.5px', color: '#78350f', lineHeight: 1.5 }}>
            💡 <strong>Why resolve this?</strong> Operating concurrently in the same neighborhood may dilute footfall and split buyer demand.
            Choose one of the 3 options below to maximize your daily sales:
          </p>
        </div>

        {/* ─── Resolution Choice 1: "Suggest Different Time" ──────────────── */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '12px'
              }}
            >
              1
            </div>
            <h4 style={{ fontSize: '14.5px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
              Choice 1: Pick an Open Time Slot in {areaName}
            </h4>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '10px' }}>
            Adjacent non-competing time windows calculated for that same date:
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {suggestedTimeSlots && suggestedTimeSlots.length > 0 ? (
              suggestedTimeSlots.map((slot, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    backgroundColor: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Clock size={16} color="#0284c7" />
                    <div>
                      <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{slot.label}</strong>
                      <span style={{ fontSize: '11.5px', color: '#059669', display: 'block', fontWeight: '700' }}>
                        ✅ Zero competing {competingCategory} vendors
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectTimeSlot(slot)}
                    disabled={isSaving}
                    className="touch-target-44"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12.5px',
                      fontWeight: '800',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>Use This Time</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: '#f8fafc',
                  fontSize: '12.5px',
                  color: '#64748b'
                }}
              >
                No standard adjacent slots found. You may manually edit the time in the schedule form.
              </div>
            )}
          </div>
        </div>

        {/* ─── Resolution Choice 2: "Suggest Different Area" ──────────────── */}
        <div style={{ marginTop: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                backgroundColor: '#f0fdf4',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '12px'
              }}
            >
              2
            </div>
            <h4 style={{ fontSize: '14.5px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
              Choice 2: Explore Recommended Alternative Areas
            </h4>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '10px' }}>
            Nearby high-demand neighborhoods in Moodbidri & Mijar open during your planned hours:
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
            {recommendedAreas && recommendedAreas.length > 0 ? (
              recommendedAreas.map((rec, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #bbf7d0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{rec.areaName}</strong>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          color: '#065f46',
                          backgroundColor: '#ecfdf5',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          border: '1px solid #a7f3d0'
                        }}
                      >
                        {rec.distanceFromCurrentKm} km away
                      </span>
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#059669', display: 'block', marginTop: '4px', fontWeight: '700' }}>
                      ✨ {rec.reason}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectRecommendedArea(rec)}
                    disabled={isSaving}
                    className="touch-target-44"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12.5px',
                      fontWeight: '800',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>Switch to {rec.areaName.split(',')[0]}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: '#f8fafc',
                  fontSize: '12.5px',
                  color: '#64748b'
                }}
              >
                No alternative areas found in the preset database.
              </div>
            )}
          </div>
        </div>

        {/* ─── Resolution Choice 3: "Continue Anyway" (Non-blocking Bypass) ── */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '18px',
            borderTop: '1px dashed #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '12px'
              }}
            >
              3
            </div>
            <h4 style={{ fontSize: '14.5px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
              Choice 3: Proceed Without Changes (Non-Blocking Bypass)
            </h4>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              backgroundColor: '#f8fafc',
              padding: '14px 16px',
              borderRadius: '14px',
              border: '1px solid #e2e8f0'
            }}
          >
            <div>
              <strong style={{ fontSize: '13px', color: '#334155', display: 'block' }}>
                Keep your planned schedule as-is
              </strong>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Your visit will be saved with a market overlap warning flag (<code>hasConflict: true</code>).
              </span>
            </div>

            <button
              type="button"
              onClick={onContinueAnyway}
              disabled={isSaving}
              className="touch-target-44"
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                backgroundColor: '#d97706',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: '800',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)'
              }}
            >
              <CheckCircle2 size={16} />
              <span>Continue Anyway</span>
            </button>
          </div>
        </div>

        {/* ─── Modal Footer ──────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginTop: '18px',
            paddingTop: '12px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              fontSize: '12.5px',
              fontWeight: '700',
              color: '#475569',
              cursor: isSaving ? 'not-allowed' : 'pointer'
            }}
          >
            ← Back to Edit Schedule Form
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolutionModal;
