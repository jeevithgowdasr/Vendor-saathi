import React from 'react';
import {
  Package,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  X,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  List,
  Sparkles,
  Check,
  Upload,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import {
  useVendorProducts,
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
  QUICK_PRODUCT_TEMPLATES
} from '../hooks/useVendorProducts';
import { FormField } from './FormField';

export const VendorProductsTab = ({ token, vendorId, onToast, vendorName = 'My Store' }) => {
  const {
    products,
    filteredProducts,
    stats,
    isLoading,
    isSaving,
    isDeleting,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    stockFilter,
    setStockFilter,
    viewMode,
    setViewMode,
    isModalOpen,
    editingProduct,
    formData,
    formErrors,
    imagePreview,
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
  } = useVendorProducts({ token, vendorId, onToast, vendorName });

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* ─── 1. Header & Live Metrics Bar ───────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: '900',
                color: '#0f172a',
                letterSpacing: '-0.02em',
                margin: 0
              }}
            >
              Product & Produce Management
            </h2>
            <span
              className="badge"
              style={{
                backgroundColor: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                fontSize: '11.5px',
                fontWeight: '800'
              }}
            >
              ⚡ Live Sync
            </span>
          </div>
          <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginTop: '2px' }}>
            Manage pricing, stock status, and catalog availability for {vendorName}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => loadProducts()}
            disabled={isLoading}
            className="touch-target-44"
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              color: '#475569',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            title="Refresh product catalog"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden-mobile">Refresh</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="touch-target-44"
            style={{
              padding: '11px 20px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '13.5px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 18px -4px rgba(16, 185, 129, 0.45)',
              transition: 'transform 0.15s ease'
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* ─── 2. Metric Counters ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '22px'
        }}
      >
        <div
          className="vs-card"
          style={{
            padding: '16px 18px',
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            border: '1.5px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Package size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
              Total Catalog
            </span>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', lineHeight: 1.1 }}>
              {stats.total}
            </div>
          </div>
        </div>

        <div
          className="vs-card"
          style={{
            padding: '16px 18px',
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            border: '1.5px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
              In Stock & Active
            </span>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#059669', lineHeight: 1.1 }}>
              {stats.inStock}
            </div>
          </div>
        </div>

        <div
          className="vs-card"
          style={{
            padding: '16px 18px',
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            border: '1.5px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: stats.outOfStock > 0 ? '#fef2f2' : '#f8fafc',
              color: stats.outOfStock > 0 ? '#dc2626' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AlertCircle size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
              Out of Stock
            </span>
            <div
              style={{
                fontSize: '22px',
                fontWeight: '900',
                color: stats.outOfStock > 0 ? '#dc2626' : '#64748b',
                lineHeight: 1.1
              }}
            >
              {stats.outOfStock}
            </div>
          </div>
        </div>

        <div
          className="vs-card"
          style={{
            padding: '16px 18px',
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            border: '1.5px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#f5f3ff',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Layers size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
              Active Categories
            </span>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#7c3aed', lineHeight: 1.1 }}>
              {stats.categoriesCount}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Search, Filter Toolbar & View Toggle ─────────────────────── */}
      <div
        className="vs-card"
        style={{
          padding: '16px 20px',
          borderRadius: '18px',
          backgroundColor: '#ffffff',
          border: '1.5px solid #e2e8f0',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {/* Search Box */}
          <div
            style={{
              position: 'relative',
              flex: '1 1 280px',
              maxWidth: '420px'
            }}
          >
            <Search
              size={18}
              color="#94a3b8"
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              placeholder="Search products by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 36px 10px 42px',
                borderRadius: '12px',
                border: '1.5px solid #cbd5e1',
                fontSize: '13.5px',
                color: '#0f172a',
                outline: 'none',
                backgroundColor: '#f8fafc',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#10b981';
                e.target.style.backgroundColor = '#ffffff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.backgroundColor = '#f8fafc';
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Stock Filter & View Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Stock status filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '12px' }}>
              <button
                type="button"
                onClick={() => setStockFilter('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '800',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: stockFilter === 'all' ? '#ffffff' : 'transparent',
                  color: stockFilter === 'all' ? '#0f172a' : '#64748b',
                  boxShadow: stockFilter === 'all' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                All Status
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('in-stock')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '800',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: stockFilter === 'in-stock' ? '#ecfdf5' : 'transparent',
                  color: stockFilter === 'in-stock' ? '#065f46' : '#64748b',
                  boxShadow: stockFilter === 'in-stock' ? '0 2px 6px rgba(16,185,129,0.15)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                🟢 In Stock
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('out-of-stock')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '800',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: stockFilter === 'out-of-stock' ? '#fee2e2' : 'transparent',
                  color: stockFilter === 'out-of-stock' ? '#991b1b' : '#64748b',
                  boxShadow: stockFilter === 'out-of-stock' ? '0 2px 6px rgba(239,68,68,0.15)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                🔴 Out of Stock
              </button>
            </div>

            {/* View Switcher: Table vs Grid */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '12px' }}>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  padding: '7px 10px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'table' ? '#ffffff' : 'transparent',
                  color: viewMode === 'table' ? '#0f172a' : '#64748b',
                  boxShadow: viewMode === 'table' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: '700'
                }}
                title="Table View"
              >
                <List size={16} />
                <span className="hidden-mobile">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '7px 10px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'grid' ? '#ffffff' : 'transparent',
                  color: viewMode === 'grid' ? '#0f172a' : '#64748b',
                  boxShadow: viewMode === 'grid' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: '700'
                }}
                title="Grid View"
              >
                <LayoutGrid size={16} />
                <span className="hidden-mobile">Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none'
          }}
        >
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: '800',
              color: '#94a3b8',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              marginRight: '4px'
            }}
          >
            Category:
          </span>
          {PRODUCT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: isSelected ? '800' : '600',
                  cursor: 'pointer',
                  border: isSelected ? '1.5px solid #10b981' : '1.5px solid #e2e8f0',
                  backgroundColor: isSelected ? '#ecfdf5' : '#ffffff',
                  color: isSelected ? '#065f46' : '#475569',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 8px rgba(16, 185, 129, 0.15)' : 'none'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 4. Product List Display (Table or Grid) ─────────────────────── */}
      {isLoading && products.length === 0 ? (
        <div
          className="vs-card"
          style={{
            padding: '56px 20px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '20px'
          }}
        >
          <RefreshCw size={36} color="#10b981" className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
          <strong style={{ fontSize: '16px', color: '#0f172a', display: 'block' }}>
            Loading Vendor Products...
          </strong>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Fetching verified catalog data from VendorSaathi backend
          </span>
        </div>
      ) : filteredProducts.length === 0 ? (
        /* Empty State */
        <div
          className="vs-card"
          style={{
            padding: '52px 24px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            border: '2px dashed #cbd5e1'
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#f0fdf4',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)'
            }}
          >
            <Package size={36} />
          </div>

          <strong style={{ fontSize: '18px', color: '#0f172a', display: 'block', marginBottom: '6px' }}>
            {products.length === 0
              ? 'Your Store Catalog is Empty'
              : 'No Products Match Your Filter Criteria'}
          </strong>

          <p
            style={{
              fontSize: '13.5px',
              color: '#64748b',
              maxWidth: '440px',
              margin: '0 auto 20px auto',
              lineHeight: 1.5
            }}
          >
            {products.length === 0
              ? `You haven't listed any farm produce, vegetables, flowers, or dairy yet. Add items now to allow customers in Moodbidri & Mijar to place instant orders!`
              : `Try resetting the search keyword or selecting 'All' categories to see your entire product catalog.`}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {products.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setStockFilter('all');
                }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Clear All Filters
              </button>
            )}

            <button
              type="button"
              onClick={openCreateModal}
              className="btn-primary"
              style={{
                padding: '10px 22px',
                borderRadius: '14px',
                fontSize: '13.5px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={16} /> Add First Harvest Product
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* ─── TABLE VIEW ──────────────────────────────────────────────── */
        <div
          className="vs-card"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)'
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                    Product
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                    Category
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                    Price / Unit
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                    Stock Level
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                    Availability Toggle
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const prodId = product._id || product.id;
                  const isAvailable = product.is_available !== false;
                  const qty = product.available_quantity !== undefined ? product.available_quantity : (product.availableStock || 0);

                  return (
                    <tr
                      key={prodId}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                        opacity: product.isOptimistic ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafafa')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Product details */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={product.image_url || product.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80'}
                            alt={product.name}
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '12px',
                              objectFit: 'cover',
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              flexShrink: 0
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80';
                            }}
                          />
                          <div>
                            <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>
                              {product.name}
                            </strong>
                            <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                              ID: #{prodId.slice(-6)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700'
                          }}
                        >
                          <Tag size={11} color="#64748b" />
                          {product.category || 'Produce'}
                        </span>
                      </td>

                      {/* Price / Unit */}
                      <td style={{ padding: '14px 18px' }}>
                        <div>
                          <span style={{ fontSize: '15px', fontWeight: '900', color: '#059669' }}>
                            ₹{product.price}
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginLeft: '4px' }}>
                            / {product.unit}
                          </span>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: '800',
                              color: qty <= 2 && qty > 0 ? '#d97706' : qty === 0 ? '#dc2626' : '#0f172a'
                            }}
                          >
                            {qty} {product.unit}
                          </span>
                          {qty <= 2 && qty > 0 && (
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: '800',
                                backgroundColor: '#fef3c7',
                                color: '#b45309',
                                padding: '2px 6px',
                                borderRadius: '6px'
                              }}
                            >
                              Low
                            </span>
                          )}
                          {qty === 0 && (
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: '800',
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                padding: '2px 6px',
                                borderRadius: '6px'
                              }}
                            >
                              Empty
                            </span>
                          )}
                        </div>
                      </td>

                      {/* In-Stock Switch */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleAvailability(product)}
                            aria-label={`Toggle availability for ${product.name}`}
                            className="touch-target-44"
                            style={{
                              position: 'relative',
                              width: '46px',
                              height: '24px',
                              borderRadius: '12px',
                              backgroundColor: isAvailable ? '#10b981' : '#cbd5e1',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease',
                              padding: 0,
                              outline: 'none'
                            }}
                          >
                            <span
                              style={{
                                position: 'absolute',
                                top: '2px',
                                left: isAvailable ? '24px' : '2px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                backgroundColor: '#ffffff',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                transition: 'left 0.2s ease'
                              }}
                            />
                          </button>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: '800',
                              color: isAvailable ? '#059669' : '#94a3b8'
                            }}
                          >
                            {isAvailable ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      </td>

                      {/* Quick Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(product)}
                            className="touch-target-44"
                            style={{
                              padding: '7px 12px',
                              borderRadius: '10px',
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              color: '#334155',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                            title={`Edit ${product.name}`}
                          >
                            <Edit3 size={14} />
                            <span className="hidden-mobile">Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(product)}
                            disabled={isDeleting === prodId}
                            className="touch-target-44"
                            style={{
                              padding: '7px 10px',
                              borderRadius: '10px',
                              backgroundColor: '#fee2e2',
                              border: '1px solid #fecaca',
                              color: '#dc2626',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'all 0.15s ease'
                            }}
                            title={`Delete ${product.name}`}
                          >
                            {isDeleting === prodId ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ─── CARD GRID VIEW ──────────────────────────────────────────── */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '18px'
          }}
        >
          {filteredProducts.map((product) => {
            const prodId = product._id || product.id;
            const isAvailable = product.is_available !== false;
            const qty = product.available_quantity !== undefined ? product.available_quantity : (product.availableStock || 0);

            return (
              <div
                key={prodId}
                className="vs-card"
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '20px',
                  border: isAvailable ? '1.5px solid #e2e8f0' : '1.5px solid #fee2e2',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  opacity: product.isOptimistic ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Thumbnail Header */}
                <div style={{ position: 'relative', width: '100%', height: '150px', backgroundColor: '#f1f5f9' }}>
                  <img
                    src={product.image_url || product.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80'}
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80';
                    }}
                  />

                  {/* Category badge */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      backdropFilter: 'blur(4px)',
                      color: '#0f172a',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: '800'
                    }}
                  >
                    {product.category || 'General'}
                  </span>

                  {/* Stock status badge */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: isAvailable ? '#059669' : '#dc2626',
                      color: '#ffffff',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: '800',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                    }}
                  >
                    {isAvailable ? '🟢 In Stock' : '🔴 Out of Stock'}
                  </span>
                </div>

                {/* Content */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <strong style={{ fontSize: '15px', color: '#0f172a', lineHeight: 1.3 }}>
                      {product.name}
                    </strong>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '16px', fontWeight: '900', color: '#059669' }}>
                        ₹{product.price}
                      </span>
                      <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600', display: 'block' }}>
                        / {product.unit}
                      </span>
                    </div>
                  </div>

                  {product.description && (
                    <p
                      style={{
                        fontSize: '12.5px',
                        color: '#64748b',
                        margin: '8px 0 12px 0',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {product.description}
                    </p>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    {/* Stock level info */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                        fontSize: '12.5px'
                      }}
                    >
                      <span style={{ color: '#64748b' }}>Available Stock:</span>
                      <strong style={{ color: qty === 0 ? '#dc2626' : '#0f172a' }}>
                        {qty} {product.unit}
                      </strong>
                    </div>

                    {/* Toggle Switch & Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      {/* Availability toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(product)}
                        className="touch-target-44"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: '800',
                          border: isAvailable ? '1.5px solid #a7f3d0' : '1.5px solid #fecaca',
                          backgroundColor: isAvailable ? '#ecfdf5' : '#fee2e2',
                          color: isAvailable ? '#065f46' : '#991b1b',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isAvailable ? 'Toggle: Out' : 'Toggle: In'}
                      </button>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="touch-target-44"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '10px',
                            backgroundColor: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            color: '#334155',
                            cursor: 'pointer'
                          }}
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          disabled={isDeleting === prodId}
                          className="touch-target-44"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '10px',
                            backgroundColor: '#fee2e2',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            cursor: 'pointer'
                          }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 5. "Add / Edit Product" Modal ──────────────────────────────── */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="vs-card animate-scale-up"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25)',
              border: '1.5px solid #e2e8f0',
              padding: '28px'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px',
                borderBottom: '1px solid #f1f5f9',
                paddingBottom: '14px'
              }}
            >
              <div>
                <h3
                  id="product-modal-title"
                  style={{
                    fontSize: '19px',
                    fontWeight: '900',
                    color: '#0f172a',
                    margin: 0,
                    letterSpacing: '-0.01em'
                  }}
                >
                  {editingProduct ? 'Edit Product Details' : 'Add New Produce to Catalog'}
                </h3>
                <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                  {editingProduct
                    ? `Updating item ID #${(editingProduct._id || editingProduct.id).slice(-6)}`
                    : 'List fresh produce, vegetables, flowers, or dairy for instant orders'}
                </span>
              </div>

              <button
                type="button"
                onClick={closeModal}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick 1-Click Templates (Create Mode Only) */}
            {!editingProduct && (
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  marginBottom: '18px'
                }}
              >
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: '800',
                    color: '#475569',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginBottom: '8px'
                  }}
                >
                  <Sparkles size={14} color="#059669" /> Quick Produce Presets:
                </span>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                  {QUICK_PRODUCT_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.name}
                      type="button"
                      onClick={() => applyTemplate(tmpl)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '10px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        color: '#0f172a',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      + {tmpl.name.split(' ')[0]} ({tmpl.category})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={editingProduct ? handleUpdate : handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Product Name */}
              <FormField
                label="Product Name"
                name="name"
                required
                placeholder="e.g. Fresh Farm Red Tomatoes"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                error={formErrors.name}
                maxLength={100}
              />

              {/* Category & Unit Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Category <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: formErrors.category ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                      fontSize: '13.5px',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      color: '#0f172a'
                    }}
                  >
                    {PRODUCT_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {formErrors.category && (
                    <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '700', display: 'block', marginTop: '2px' }}>
                      {formErrors.category}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Unit of Measure <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => handleFormChange('unit', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: formErrors.unit ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                      fontSize: '13.5px',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      color: '#0f172a'
                    }}
                  >
                    {PRODUCT_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & Available Quantity Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <FormField
                  label={`Price per ${formData.unit || 'unit'} (₹)`}
                  name="price"
                  type="currency"
                  required
                  placeholder="25.00"
                  value={formData.price}
                  onChange={(e) => handleFormChange('price', e.target.value)}
                  error={formErrors.price}
                  maxLength={8}
                />

                <FormField
                  label={`Available Stock Quantity (${formData.unit || 'units'})`}
                  name="available_quantity"
                  type="number"
                  placeholder="10"
                  value={formData.available_quantity}
                  onChange={(e) => handleFormChange('available_quantity', e.target.value)}
                  error={formErrors.available_quantity}
                  min={0}
                />
              </div>

              {/* Availability In-Stock Toggle Switch */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '16px',
                  border: '1.5px solid #e2e8f0'
                }}
              >
                <div>
                  <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>
                    Publish as In-Stock
                  </strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    When toggled on, customers can immediately add this to their basket
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleFormChange('is_available', !formData.is_available)}
                  style={{
                    position: 'relative',
                    width: '50px',
                    height: '26px',
                    borderRadius: '13px',
                    backgroundColor: formData.is_available ? '#10b981' : '#cbd5e1',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    padding: 0
                  }}
                  aria-label="Toggle product availability"
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: formData.is_available ? '26px' : '2px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      transition: 'left 0.2s ease'
                    }}
                  />
                </button>
              </div>

              {/* Product Image Section */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '16px',
                  border: formErrors.image_url ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#334155' }}>
                  Product Photo / Image
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '14px',
                        objectFit: 'cover',
                        border: '1.5px solid #cbd5e1'
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80';
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '14px',
                        backgroundColor: '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8'
                      }}
                    >
                      <ImageIcon size={26} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Paste Image URL or pick file below..."
                      value={formData.image_url}
                      onChange={(e) => handleFormChange('image_url', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12.5px',
                        outline: 'none',
                        backgroundColor: '#ffffff'
                      }}
                    />

                    <div>
                      <input
                        type="file"
                        id="prod-file-upload"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleImageFileUpload}
                        style={{ display: 'none' }}
                      />
                      <label
                        htmlFor="prod-file-upload"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        <Upload size={13} />
                        <span>Upload photo from device (≤ 5MB)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {formErrors.image_url && (
                  <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '700' }}>
                    {formErrors.image_url}
                  </span>
                )}
              </div>

              {/* Description (Optional) */}
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Crisp organic harvest fresh from farm this morning."
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Form Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '10px',
                  paddingTop: '16px',
                  borderTop: '1px solid #f1f5f9'
                }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '14px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary"
                  style={{
                    padding: '12px 28px',
                    borderRadius: '14px',
                    fontSize: '14px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isSaving ? 0.7 : 1
                  }}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Saving Catalog...</span>
                    </>
                  ) : editingProduct ? (
                    <>
                      <Check size={16} />
                      <span>Update Product</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Publish to Store 🚀</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorProductsTab;
