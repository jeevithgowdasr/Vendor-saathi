const ORDER_STATUS_LABELS = {
  placed: 'Placed',
  accepted: 'Accepted',
  preparing: 'Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  rejected: 'Cancelled'
};

const CATEGORY_LABELS = {
  vegetables: 'Vegetables',
  fruits: 'Fruits',
  spices: 'Spices',
  grocery: 'Grocery',
  grains: 'Grains',
  dairy: 'Dairy & Essentials',
  daily_essentials: 'Daily Essentials',
  dry_fruits: 'Dry Fruits',
  bakery: 'Bakery',
  others: 'Others'
};

const PRODUCT_IMAGES = {
  tomato: '/products/product-1.jpg',
  potato: '/products/product-10.jpg',
  onion: '/products/product-1.jpg',
  chilli: '/products/product-4.jpg',
  chili: '/products/product-4.jpg',
  milk: '/products/product-5.jpg',
  rice: '/products/product-8.jpg',
  banana: '/products/product-2.jpg',
  mango: '/products/product-7.jpg'
};

const DEFAULT_VENDOR_IMAGE = '/vendors/vendor-1.jpg';
const DEFAULT_PRODUCT_IMAGE = '/products/product-1.jpg';
const ORDER_TIMELINE = ['Placed', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered'];

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const toOrderStatusKey = (value) => {
  if (!value) return 'placed';
  const normalized = String(value).trim().toLowerCase().replace(/\s+/g, '_');
  if (normalized === 'out_for_delivery') return 'out_for_delivery';
  if (normalized === 'rejected') return 'cancelled';
  return ORDER_STATUS_LABELS[normalized] ? normalized : 'placed';
};

export const toOrderStatusLabel = (value) => ORDER_STATUS_LABELS[toOrderStatusKey(value)] || 'Placed';

export const categoryToSlug = (value) => {
  if (!value) return 'others';
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'others';
};

const categoryToDisplay = (value) => CATEGORY_LABELS[String(value || '').replace(/-/g, '_')] || 'Others';

const guessProductImage = (name) => {
  const lower = String(name || '').toLowerCase();
  const match = Object.keys(PRODUCT_IMAGES).find((key) => lower.includes(key));
  return (match && PRODUCT_IMAGES[match]) || DEFAULT_PRODUCT_IMAGE;
};

const formatOrderDate = (value) => {
  if (!value) return new Date().toLocaleString();
  if (typeof value === 'string') return value;
  const timestamp = value?.seconds ? new Date(value.seconds * 1000) : new Date(value);
  if (Number.isNaN(timestamp.getTime())) return new Date().toLocaleString();
  return timestamp.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const buildTimeline = (statusLabel, existingTimeline = [], timestamp = 'Pending') => {
  const completedIndex = ORDER_TIMELINE.indexOf(statusLabel);
  const existingByStatus = new Map(existingTimeline.map((step) => [step.status, step]));

  if (statusLabel === 'Cancelled') {
    return [
      {
        status: 'Placed',
        label: 'Order Placed',
        time: existingByStatus.get('Placed')?.time || timestamp,
        completed: true
      },
      {
        status: 'Cancelled',
        label: 'Order Cancelled',
        time: timestamp,
        completed: true
      }
    ];
  }

  return ORDER_TIMELINE.map((step, index) => {
    const existing = existingByStatus.get(step);
    return {
      status: step,
      label: existing?.label || (
        step === 'Placed' ? 'Order Placed' :
        step === 'Accepted' ? 'Vendor Accepted' :
        step === 'Preparing' ? 'Preparing Fresh Produce' :
        step === 'Out for Delivery' ? 'Out for Delivery with Rider' :
        'Delivered to Doorstep'
      ),
      time: existing?.time || (index <= completedIndex ? timestamp : 'Pending'),
      completed: existing?.completed ?? index <= completedIndex
    };
  });
};

export const normalizeVendorRecord = (raw = {}, fallback = {}) => {
  const categorySlug = categoryToSlug(raw.category || fallback.category || 'others');
  const businessName = raw.businessName || raw.name || fallback.name || 'Vendor Store';
  const ownerName = raw.owner || raw.contactName || fallback.owner || raw.name || 'Local Vendor';
  const status = ['online', 'busy', 'offline'].includes(raw.status) ? raw.status : (fallback.status || 'online');
  const isOpen = raw.isOpen ?? fallback.isOpen ?? status !== 'offline';

  return {
    id: raw.id || fallback.id || `vendor_${Date.now()}`,
    name: businessName,
    businessName,
    owner: ownerName,
    status,
    statusLabel: raw.statusLabel || fallback.statusLabel || (status === 'busy' ? '🟠 Busy (High Demand)' : isOpen ? '🟢 Open Now' : '🔴 Closed'),
    distance: raw.distance || fallback.distance || '1.5 km',
    distanceKm: safeNumber(raw.distanceKm ?? fallback.distanceKm, 1.5),
    location: raw.location || raw.address || fallback.location || 'Nearby Market',
    rating: safeNumber(raw.rating ?? fallback.rating, 4.7),
    reviewCount: safeNumber(raw.reviewCount ?? fallback.reviewCount, 0),
    deliveryTime: raw.deliveryTime || fallback.deliveryTime || '20–30 min delivery',
    isOpen,
    phone: raw.phone || fallback.phone || '+91 9876543210',
    verified: raw.verified ?? fallback.verified ?? true,
    badge: raw.badge || fallback.badge || 'Live',
    categories: Array.isArray(raw.categories) && raw.categories.length
      ? raw.categories
      : Array.isArray(fallback.categories) && fallback.categories.length
        ? fallback.categories
        : [categoryToDisplay(categorySlug)],
    image: raw.image || raw.avatar || fallback.image || fallback.avatar || DEFAULT_VENDOR_IMAGE,
    avatar: raw.avatar || raw.image || fallback.avatar || fallback.image || DEFAULT_VENDOR_IMAGE,
    address: raw.address || fallback.address || raw.location || 'Local delivery area'
  };
};

export const normalizeProductRecord = (raw = {}, vendor = {}) => {
  const stock = safeNumber(raw.availableStock ?? raw.stockQty, 0);
  const reorderLevel = safeNumber(raw.reorderLevel, 5);
  const category = categoryToSlug(raw.category || 'others');

  return {
    id: raw.id || `product_${Date.now()}`,
    name: raw.name || 'Fresh Produce',
    shortName: raw.shortName || String(raw.name || 'Produce').split(' ')[0],
    category,
    price: safeNumber(raw.price ?? raw.sellPrice),
    originalPrice: safeNumber(raw.originalPrice, safeNumber(raw.price ?? raw.sellPrice) * 1.2),
    unit: raw.unit || 'kg',
    availableStock: stock,
    stockStatus: raw.stockStatus || (stock <= 0 ? 'out-of-stock' : stock <= reorderLevel ? 'low-stock' : 'in-stock'),
    vendorId: raw.vendorId || vendor.id || 'v1',
    vendorName: raw.vendorName || vendor.name || 'Vendor Store',
    vendorDistance: raw.vendorDistance || vendor.distance || '1.5 km',
    rating: safeNumber(raw.rating, 4.7),
    reviewCount: safeNumber(raw.reviewCount, 0),
    isPopular: raw.isPopular ?? true,
    isOrganic: raw.isOrganic ?? false,
    image: raw.image || raw.imageUrl || guessProductImage(raw.name),
    description: raw.description || `Fresh ${raw.name || 'produce'} from ${raw.vendorName || vendor.name || 'your neighbourhood vendor'}.`
  };
};

export const normalizeOrderRecord = (raw = {}, vendors = []) => {
  const vendorLookup = vendors.find((vendor) => vendor.id === raw.vendorId);
  const status = toOrderStatusLabel(raw.status);
  const timeStamp = formatOrderDate(raw.updatedAt || raw.createdAt);
  const items = (raw.items || []).map((item, index) => ({
    id: item.id || item.productId || `item_${index}`,
    productId: item.productId || item.id || `item_${index}`,
    name: item.name || 'Item',
    price: safeNumber(item.price ?? item.unitPrice),
    unit: item.unit || 'unit',
    quantity: safeNumber(item.quantity ?? item.qty, 1),
    image: item.image || guessProductImage(item.name)
  }));
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = safeNumber(raw.total ?? raw.totalAmount, subtotal);

  return {
    id: raw.id || `VS${Date.now()}`,
    date: formatOrderDate(raw.createdAt),
    vendorId: raw.vendorId || vendorLookup?.id || 'v1',
    vendorName: raw.vendorName || vendorLookup?.name || 'Vendor Store',
    vendorPhone: raw.vendorPhone || vendorLookup?.phone || '+91 9876543210',
    vendorDistance: raw.vendorDistance || vendorLookup?.distance || '1.5 km',
    items,
    subtotal,
    deliveryFee: safeNumber(raw.deliveryFee, subtotal > 300 || subtotal === 0 ? 0 : 20),
    discount: safeNumber(raw.discount, 0),
    total,
    paymentMethod: raw.paymentMethod || 'Cash on Delivery',
    paymentStatus: raw.paymentStatus || 'Pending Doorstep Payment',
    upiRefId: raw.upiRefId || null,
    upiVpa: raw.upiVpa || null,
    upiApp: raw.upiApp || null,
    customerId: raw.customerId || 'guest_customer',
    customerName: raw.customerName || 'Guest Customer',
    customerPhone: raw.customerPhone || '',
    status,
    statusKey: toOrderStatusKey(raw.status),
    deliveryAddress: raw.deliveryAddress || raw.address || 'Delivery address to be confirmed',
    deliveryContact: raw.deliveryContact || raw.customerPhone || '',
    customerGPS: raw.customerGPS || {
      lat: safeNumber(raw.latitude, 0),
      lng: safeNumber(raw.longitude, 0),
      accuracy: 0
    },
    estimatedDelivery: raw.estimatedDelivery || (status === 'Delivered' ? 'Delivered' : '20–30 min'),
    riderLocation: raw.riderLocation || null,
    timeline: buildTimeline(status, raw.timeline, timeStamp)
  };
};

export const toFirebaseOrderPayload = (order = {}) => ({
  ...order,
  status: toOrderStatusKey(order.status || order.statusKey),
  totalAmount: safeNumber(order.totalAmount ?? order.total),
  items: (order.items || []).map((item) => ({
    productId: item.productId || item.id,
    name: item.name,
    qty: safeNumber(item.qty ?? item.quantity, 1),
    unitPrice: safeNumber(item.unitPrice ?? item.price),
    unit: item.unit || 'unit',
    image: item.image || null
  }))
});
