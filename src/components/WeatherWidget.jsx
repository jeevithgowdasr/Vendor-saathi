import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getLiveWeatherForecast } from '../services/weatherService';
import { CloudRain, Wind, Droplets, RefreshCw, AlertCircle, Sun, Cloud, Thermometer, ShieldCheck } from 'lucide-react';

export const WeatherWidget = ({ compact = false, showAdvisory = true }) => {
  const { currentLocation, selectedLanguage, t } = useApp();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      const lat = currentLocation?.lat ?? 13.0682;
      const lng = currentLocation?.lng ?? 74.9961;
      const data = await getLiveWeatherForecast(lat, lng);
      setWeather(data);
    } catch (err) {
      console.warn('WeatherWidget fetch warning:', err);
      setError('Could not load local live weather');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [currentLocation?.lat, currentLocation?.lng, lastRefreshed]);

  if (loading && !weather) {
    return (
      <div
        className="vs-card"
        style={{
          padding: compact ? '10px 16px' : '16px 20px',
          borderRadius: '18px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <RefreshCw size={18} className="spin" color="#2563eb" />
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
          Calibrating live local weather telemetry...
        </span>
      </div>
    );
  }

  if (error && !weather) {
    return null;
  }

  const isKannada = selectedLanguage === 'kn';
  const conditionText = isKannada ? (weather?.conditionKn || weather?.condition) : weather?.condition;

  if (compact) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '6px 14px',
          borderRadius: '20px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          fontSize: '12.5px',
          fontWeight: '700',
          color: '#0f172a'
        }}
        title={`Live weather at ${currentLocation?.village || 'Current Location'}: ${weather?.temperature}°C`}
      >
        <span style={{ fontSize: '16px' }}>{weather?.icon || '🌤️'}</span>
        <span>{weather?.temperature}°C</span>
        <span style={{ color: '#64748b', fontWeight: '500' }}>•</span>
        <span style={{ color: '#1d4ed8' }}>{conditionText}</span>
        {weather?.rainProbability > 30 && (
          <span style={{ color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '11.5px' }}>
            <Droplets size={12} /> {weather.rainProbability}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="vs-card"
      style={{
        padding: '18px 22px',
        borderRadius: '22px',
        background: 'linear-gradient(135deg, #eff6ff 0%, #eff6ff 50%, #eff6ff 100%)',
        border: '1.5px solid #bfdbfe',
        boxShadow: '0 4px 16px rgba(37, 99, 235, 0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              border: '1px solid #dbeafe'
            }}
          >
            {weather?.icon || '🌤️'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', lineHeight: 1 }}>
                {weather?.temperature}°C
              </span>
              <span
                style={{
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '800'
                }}
              >
                {t('weather.liveMeteo', 'LIVE METEO')}
              </span>
            </div>
            <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#1e293b', marginTop: '4px' }}>
              {conditionText}
              {isKannada && weather?.condition && (
                <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '6px', fontWeight: '500' }}>
                  ({weather.condition})
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: '#334155', fontWeight: '600' }}>
            <Droplets size={14} color="#0284c7" />
            <span>{weather?.humidity ?? 68}% {t('weather.humidity', 'Humidity')}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: '#334155', fontWeight: '600' }}>
            <Wind size={14} color="#2563eb" />
            <span>{weather?.windSpeed ?? 12} km/h {t('weather.wind', 'Wind')}</span>
          </div>

          <button
            onClick={() => setLastRefreshed(Date.now())}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#475569'
            }}
            title={t('weather.refreshTip', 'Refresh live weather telemetry')}
          >
            <RefreshCw size={12} className={loading ? 'spin' : ''} />
            <span>{weather?.updatedAt || 'Now'}</span>
          </button>
        </div>
      </div>

      {showAdvisory && weather?.deliveryTip && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px dashed #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>
            <ShieldCheck size={14} color="#2563eb" />
            <span>
              <strong>{t('weather.advisory', 'Delivery Advisory:')}</strong> {weather.deliveryTip}
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            📍 {currentLocation?.village || 'Mijar'}, {currentLocation?.town || 'Moodbidri'}
          </span>
        </div>
      )}
    </div>
  );
};
