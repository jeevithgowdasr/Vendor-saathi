/**
 * useVendorProducts — Custom Hook
 * Manages vendor product CRUD operations with the backend API,
 * optimistic UI updates, filtering, sorting, view switching, and toast notifications.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  fetchVendorProducts,
  createVendorProductApi,
  updateVendorProductApi,
  toggleProductAvailabilityApi,
  deleteVendorProductApi
} from '../services/vendorProductApi';
import { subscribeToVendorProducts } from '../firebase';

export const DEFAULT_FORM = {
  name: '',
  category: 'Vegetable',
  price: '',
  unit: 'kg',
  available_quantity: '10',
  is_available: true,
  image_url: '',
  description: ''
};

export const PRODUCT_CATEGORIES = [
  'All',
  'Vegetable',
  'Fruit',
  'Flower',
  'Dairy',
  'Snacks',
  'Grocery & Staples',
  'Spices',
  'Beverages',
  'Bakery',
  'Other'
];

export const PRODUCT_UNITS = [
  { value: 'kg', label: 'kg (Kilogram)' },
  { value: 'g', label: 'g (Gram)' },
  { value: '250 g', label: '250 g' },
  { value: '500 g', label: '500 g' },
  { value: 'bunch', label: 'bunch (Kattu)' },
  { value: 'litre', label: 'litre' },
  { value: 'ml', label: 'ml' },
  { value: 'piece', label: 'piece (No.)' },
  { value: 'packet', label: 'packet' },
  { value: 'box', label: 'box' },
  { value: 'dozen', label: 'dozen' }
];

// Quick templates for fast 1-click addition
export const QUICK_PRODUCT_TEMPLATES = [
  {
    name: 'Fresh Farm Tomatoes',
    category: 'Vegetable',
    price: '25',
    unit: 'kg',
    available_quantity: '20',
    image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80',
    description: 'Fresh and firm red tomatoes from Moodbidri village farms.'
  },
  {
    name: 'Local Organic Potatoes',
    category: 'Vegetable',
    price: '30',
    unit: 'kg',
    available_quantity: '15',
    image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80',
    description: 'Clean medium potatoes, ideal for cooking and curries.'
  },
  {
    name: 'Fragrant Red Roses (Pooja)',
    category: 'Flower',
    price: '60',
    unit: 'bunch',
    available_quantity: '12',
    image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80',
    description: 'Freshly cut fragrant pooja flowers for home & temple.'
  },
  {
    name: 'Farm Fresh Cow Milk',
    category: 'Dairy',
    price: '28',
    unit: 'litre',
    available_quantity: '25',
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80',
    description: 'Pure early morning cow milk packaged safely.'
  },
  {
    name: 'South Canara Banana Chips',
    category: 'Snacks',
    price: '50',
    unit: 'packet',
    available_quantity: '30',
    image_url: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=500&q=80',
    description: 'Crunchy golden raw banana chips fried in pure coconut oil.'
  }
];

export function useVendorProducts({ token, onToast } = {}) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);

  // Filters & display
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'in-stock' | 'out-of-stock'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Modal / form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = create mode
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [imagePreview, setImagePreview] = useState('');

  // Track pending toggle ops to prevent double-clicks
  const pendingToggles = useRef(new Set());

  // Determine token
  const effectiveToken = useMemo(() => {
    if (token) return token;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vs_auth_token') || 'vendor_session_token';
    }
    return 'vendor_session_token';
  }, [token]);

  // ─── Load Products ────────────────────────────────────────────────────────
  const loadProducts = useCallback(async (opts = {}) => {
    setIsLoading(true);
    try {
      const catParam = opts.category !== undefined 
        ? opts.category 
        : (selectedCategory !== 'All' ? selectedCategory : undefined);
      const searchParam = opts.search !== undefined ? opts.search : searchQuery;

      const data = await fetchVendorProducts(effectiveToken, {
        category: catParam,
        search: searchParam || undefined
      });
      setProducts(data.products || []);
    } catch (err) {
      console.warn('Load products err:', err);
      onToast?.(`⚠️ Could not reach server: ${err.message}`, 'danger');
    } finally {
      setIsLoading(false);
    }
  }, [effectiveToken, selectedCategory, searchQuery, onToast]);

  // Initial load
  useEffect(() => {
    loadProducts();
  }, [effectiveToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time Firebase Firestore product synchronization
  useEffect(() => {
    const vendorId = effectiveToken && !effectiveToken.startsWith('vs_') && !effectiveToken.includes('_session_') ? effectiveToken : 'v1';
    const unsubscribe = subscribeToVendorProducts(vendorId, (firebaseProducts) => {
      if (firebaseProducts && firebaseProducts.length > 0) {
        setProducts(firebaseProducts);
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [effectiveToken]);

  // Debounced search / filter re-fetch
  const searchTimeout = useRef(null);
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [selectedCategory, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Filtered Products (Client-Side Refinement) ───────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Stock status filter
      if (stockFilter === 'in-stock' && p.is_available === false) return false;
      if (stockFilter === 'out-of-stock' && p.is_available !== false) return false;

      // Category filter (if not already handled or for local state)
      if (selectedCategory !== 'All') {
        const catA = (p.category || '').toLowerCase();
        const catB = selectedCategory.toLowerCase();
        if (!catA.includes(catB) && !catB.includes(catA)) return false;
      }

      // Name search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const catMatch = (p.category || '').toLowerCase().includes(q);
        const descMatch = (p.description || '').toLowerCase().includes(q);
        if (!nameMatch && !catMatch && !descMatch) return false;
      }

      return true;
    });
  }, [products, stockFilter, selectedCategory, searchQuery]);

  // ─── Form Helpers ─────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData(DEFAULT_FORM);
    setFormErrors({});
    setImagePreview('');
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    const formVals = {
      name: product.name || '',
      category: product.category || 'Vegetable',
      price: product.price?.toString() || '',
      unit: product.unit || 'kg',
      available_quantity: product.available_quantity !== undefined 
        ? product.available_quantity.toString() 
        : (product.availableStock?.toString() || '10'),
      is_available: product.is_available !== undefined ? product.is_available : true,
      image_url: product.image_url || product.image || '',
      description: product.description || ''
    };
    setFormData(formVals);
    setImagePreview(formVals.image_url);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData(DEFAULT_FORM);
    setFormErrors({});
    setImagePreview('');
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
    if (field === 'image_url') {
      setImagePreview(value);
    }
  };

  const applyTemplate = (template) => {
    setFormData({
      ...DEFAULT_FORM,
      ...template
    });
    setImagePreview(template.image_url || '');
    setFormErrors({});
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormErrors(prev => ({ ...prev, image_url: 'Image must be ≤ 5 MB.' }));
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFormErrors(prev => ({ ...prev, image_url: 'Only JPG, PNG or WebP files accepted.' }));
      return;
    }

    setFormErrors(prev => ({ ...prev, image_url: null }));
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setImagePreview(dataUrl);
      setFormData(prev => ({ ...prev, image_url: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  // ─── Validation ───────────────────────────────────────────────────────────
  const validateForm = () => {
    const errs = {};
    if (!formData.name || !formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = 'Product name is required (minimum 2 characters).';
    }
    if (!formData.category || !formData.category.trim()) {
      errs.category = 'Please select a product category.';
    }
    const priceNum = Number(formData.price);
    if (!formData.price || isNaN(priceNum) || priceNum <= 0) {
      errs.price = 'Enter a valid price greater than ₹0.';
    }
    if (!formData.unit || !formData.unit.trim()) {
      errs.unit = 'Please select a unit (e.g. kg, litre).';
    }
    const qty = Number(formData.available_quantity);
    if (formData.available_quantity !== '' && (isNaN(qty) || qty < 0)) {
      errs.available_quantity = 'Stock quantity cannot be negative.';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Create ───────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;

    const payload = {
      name: formData.name.trim(),
      category: formData.category.trim(),
      price: Number(formData.price),
      unit: formData.unit.trim().toLowerCase(),
      available_quantity: formData.available_quantity !== '' ? Number(formData.available_quantity) : 10,
      availableStock: formData.available_quantity !== '' ? Number(formData.available_quantity) : 10,
      is_available: formData.is_available,
      stockStatus: formData.is_available ? 'in-stock' : 'out-of-stock',
      image_url: formData.image_url.trim() || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80',
      image: formData.image_url.trim() || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80',
      description: (formData.description || '').trim()
    };

    setIsSaving(true);
    const tempId = `temp_${Date.now()}`;
    const optimisticProduct = { ...payload, _id: tempId, id: tempId, isOptimistic: true };

    // Optimistic UI insert
    setProducts(prev => [optimisticProduct, ...prev]);

    try {
      const result = await createVendorProductApi(effectiveToken, payload);
      const created = result.product || optimisticProduct;
      setProducts(prev => prev.map(p => (p.id === tempId || p._id === tempId ? created : p)));
      onToast?.(`🎉 "${created.name}" added to store catalog!`, 'success');
      closeModal();
    } catch (err) {
      setProducts(prev => prev.filter(p => p.id !== tempId && p._id !== tempId));
      onToast?.(`❌ Failed to create product: ${err.message}`, 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Update ───────────────────────────────────────────────────────────────
  const handleUpdate = async (e) => {
    e?.preventDefault();
    if (!editingProduct || !validateForm()) return;

    const productId = editingProduct._id || editingProduct.id;
    const payload = {
      name: formData.name.trim(),
      category: formData.category.trim(),
      price: Number(formData.price),
      unit: formData.unit.trim().toLowerCase(),
      available_quantity: formData.available_quantity !== '' ? Number(formData.available_quantity) : 0,
      availableStock: formData.available_quantity !== '' ? Number(formData.available_quantity) : 0,
      is_available: formData.is_available,
      stockStatus: formData.is_available ? 'in-stock' : 'out-of-stock',
      image_url: formData.image_url.trim() || editingProduct.image_url || editingProduct.image,
      image: formData.image_url.trim() || editingProduct.image_url || editingProduct.image,
      description: (formData.description || '').trim()
    };

    setIsSaving(true);
    // Optimistic UI update
    setProducts(prev => prev.map(p =>
      (p._id || p.id) === productId ? { ...p, ...payload, isOptimistic: true } : p
    ));

    try {
      const result = await updateVendorProductApi(effectiveToken, productId, payload);
      const updated = result.product || { ...editingProduct, ...payload };
      setProducts(prev => prev.map(p =>
        (p._id || p.id) === productId ? { ...updated, isOptimistic: false } : p
      ));
      onToast?.(`✅ "${updated.name}" updated successfully!`, 'success');
      closeModal();
    } catch (err) {
      setProducts(prev => prev.map(p =>
        (p._id || p.id) === productId ? { ...editingProduct, isOptimistic: false } : p
      ));
      onToast?.(`❌ Update failed: ${err.message}`, 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Toggle Availability ─────────────────────────────────────────────────
  const handleToggleAvailability = async (product) => {
    const productId = product._id || product.id;
    if (pendingToggles.current.has(productId)) return;
    pendingToggles.current.add(productId);

    const nextAvail = !product.is_available;
    const nextStatus = nextAvail ? 'in-stock' : 'out-of-stock';

    // Optimistic UI toggle
    setProducts(prev => prev.map(p =>
      (p._id || p.id) === productId
        ? { ...p, is_available: nextAvail, stockStatus: nextStatus, isOptimistic: true }
        : p
    ));

    try {
      await toggleProductAvailabilityApi(effectiveToken, productId, nextAvail);
      setProducts(prev => prev.map(p =>
        (p._id || p.id) === productId ? { ...p, isOptimistic: false } : p
      ));
      onToast?.(
        nextAvail
          ? `🟢 "${product.name}" marked In Stock`
          : `🔴 "${product.name}" marked Out of Stock`,
        'info'
      );
    } catch (err) {
      // Rollback
      setProducts(prev => prev.map(p =>
        (p._id || p.id) === productId
          ? { ...p, is_available: product.is_available, stockStatus: product.stockStatus, isOptimistic: false }
          : p
      ));
      onToast?.(`❌ Failed to toggle availability: ${err.message}`, 'danger');
    } finally {
      pendingToggles.current.delete(productId);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (product) => {
    const productId = product._id || product.id;
    if (!window.confirm(`Are you sure you want to remove "${product.name}" from your catalog?`)) {
      return;
    }

    setIsDeleting(productId);
    const prevProducts = [...products];
    // Optimistic remove
    setProducts(prev => prev.filter(p => (p._id || p.id) !== productId));

    try {
      await deleteVendorProductApi(effectiveToken, productId);
      onToast?.(`🗑️ "${product.name}" removed from catalog.`, 'info');
    } catch (err) {
      // Rollback
      setProducts(prevProducts);
      onToast?.(`❌ Failed to delete product: ${err.message}`, 'danger');
    } finally {
      setIsDeleting(null);
    }
  };

  // ─── Computed Statistics ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter(p => p.is_available !== false).length;
    const outOfStock = products.filter(p => p.is_available === false).length;
    const uniqueCats = new Set(products.map(p => p.category).filter(Boolean));
    return {
      total,
      inStock,
      outOfStock,
      categoriesCount: uniqueCats.size
    };
  }, [products]);

  return {
    // Data
    products,
    filteredProducts,
    stats,
    isLoading,
    isSaving,
    isDeleting,

    // Controls & Filters
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    stockFilter,
    setStockFilter,
    viewMode,
    setViewMode,

    // Modal state
    isModalOpen,
    editingProduct,
    formData,
    formErrors,
    imagePreview,

    // Handlers
    loadProducts,
    openCreateModal,
    openEditModal,
    closeModal,
    handleFormChange,
    handleImageFileUpload,
    applyTemplate,
    handleCreate,
    handleUpdate,
    handleToggleAvailability,
    handleDelete
  };
}

export default useVendorProducts;
