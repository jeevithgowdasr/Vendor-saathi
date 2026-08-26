import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

export const NotificationToast = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const isDanger = toast.type === 'danger';
  const isInfo = toast.type === 'info';

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      right: '24px',
      zIndex: 3000,
      background: isDanger 
        ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
        : isInfo
        ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
        : 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
      color: '#ffffff',
      padding: '14px 22px',
      borderRadius: '16px',
      boxShadow: '0 16px 36px -6px rgba(0, 0, 0, 0.35)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      maxWidth: '420px',
      fontSize: '13.5px',
      fontWeight: '700',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      backdropFilter: 'blur(8px)'
    }} className="animate-toast-slide">
      {isDanger ? (
        <AlertCircle size={20} color="#ffffff" style={{ flexShrink: 0 }} />
      ) : isInfo ? (
        <Info size={20} color="#ffffff" style={{ flexShrink: 0 }} />
      ) : (
        <CheckCircle2 size={20} color="#ffffff" style={{ flexShrink: 0 }} />
      )}
      <span style={{ lineHeight: 1.3 }}>{toast.message}</span>
    </div>
  );
};
