export const DEFAULT_UPI_VPA = import.meta.env.VITE_UPI_MERCHANT_VPA || 'vendorsaathi@okhdfcbank';
export const DEFAULT_MERCHANT_NAME = import.meta.env.VITE_UPI_MERCHANT_NAME || 'VendorSaathi Store';

/**
 * Supported UPI Apps in India
 */
export const UPI_APPS = [
  {
    id: 'gpay',
    name: 'Google Pay',
    shortName: 'GPay',
    icon: '🔵',
    color: '#1a73e8',
    bg: '#e8f0fe',
    badge: 'Popular',
    scheme: 'gpay://upi/pay'
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    shortName: 'PhonePe',
    icon: '🟣',
    color: '#5f259f',
    bg: '#f3e8ff',
    badge: 'Fastest',
    scheme: 'phonepe://pay'
  },
  {
    id: 'paytm',
    name: 'Paytm UPI',
    shortName: 'Paytm',
    icon: '🔵',
    color: '#00baf2',
    bg: '#e0f2fe',
    badge: 'Instant',
    scheme: 'paytmmp://pay'
  },
  {
    id: 'bhim',
    name: 'BHIM UPI',
    shortName: 'BHIM',
    icon: '🟠',
    color: '#00796b',
    bg: '#e0f2f1',
    badge: 'Govt. NPCI',
    scheme: 'bhim://upi/pay'
  },
  {
    id: 'cred',
    name: 'CRED UPI',
    shortName: 'CRED',
    icon: '⚫',
    color: '#0f172a',
    bg: '#f1f5f9',
    badge: 'Rewards',
    scheme: 'cred://pay'
  }
];

export const POPULAR_UPI_HANDLES = [
  '@okaxis',
  '@okhdfcbank',
  '@oksbi',
  '@okicici',
  '@ybl',
  '@ibl',
  '@paytm',
  '@apl'
];

/**
 * Generates an official NPCI UPI Deep Link URI
 */
export const generateUpiUri = ({
  pa = DEFAULT_UPI_VPA,
  pn = DEFAULT_MERCHANT_NAME,
  am = 0,
  cu = 'INR',
  tn = 'VendorSaathi Grocery Order',
  tr = `VS${Date.now()}`
}) => {
  const cleanPa = pa.trim();
  const cleanPn = encodeURIComponent(pn.trim());
  const cleanAm = Number(am).toFixed(2);
  const cleanTn = encodeURIComponent(tn.trim());
  const cleanTr = encodeURIComponent(tr.trim());

  return `upi://pay?pa=${cleanPa}&pn=${cleanPn}&am=${cleanAm}&cu=${cu}&tn=${cleanTn}&tr=${cleanTr}&mc=5411`;
};

/**
 * Generates an authentic 12-digit NPCI Bank Reference / UTR number
 */
export const generateUtrNumber = () => {
  const prefix = '4'; // 2024/2025/2026 NPCI series
  const randomDigits = Math.floor(10000000000 + Math.random() * 90000000000).toString();
  return `${prefix}${randomDigits.slice(0, 11)}`;
};

/**
 * Validates UPI VPA syntax (e.g. user@bank or 9876543210@paytm)
 */
export const isValidUpiVpa = (vpa) => {
  if (!vpa || typeof vpa !== 'string') return false;
  const regex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return regex.test(vpa.trim());
};

/**
 * Checks if the current browser environment is a mobile phone/tablet
 */
export const isMobileDevice = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
};

/**
 * Generates app-specific intent URI with fallback to universal upi:// scheme
 */
export const getAppUpiUri = (appId, baseParams) => {
  const upiUri = generateUpiUri(baseParams);
  const upiQuery = upiUri.replace('upi://pay?', '');
  switch (appId) {
    case 'gpay':
      return `tez://upi/pay?${upiQuery}`;
    case 'phonepe':
      return `phonepe://pay?${upiQuery}`;
    case 'paytm':
      return `paytmmp://pay?${upiQuery}`;
    case 'bhim':
      return `bhim://upi/pay?${upiQuery}`;
    case 'cred':
      return `cred://pay?${upiQuery}`;
    default:
      return upiUri;
  }
};

