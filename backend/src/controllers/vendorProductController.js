import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { memoryStore } from '../store/memoryStore.js';

// Allowed units for produce & grocery items
const ALLOWED_UNITS = ['kg', 'g', '250 g', '500 g', 'bunch', 'litre', 'ml', 'piece', 'packet', 'box', 'dozen'];

/**
 * POST /api/vendor/products
 * Create a new product belonging to authenticated vendor
 */
export const createVendorProduct = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const {
      name,
      category,
      price,
      originalPrice,
      unit,
      available_quantity,
      availableStock,
      is_available,
      image_url,
      image,
      description
    } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        field: 'name',
        message: 'Product name is required (minimum 2 characters).'
      });
    }

    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        field: 'price',
        message: 'A valid positive price per unit is required.'
      });
    }

    if (!unit || typeof unit !== 'string' || !unit.trim()) {
      return res.status(400).json({
        success: false,
        field: 'unit',
        message: 'Unit is required (e.g., kg, g, bunch, litre, piece, packet).'
      });
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({
        success: false,
        field: 'category',
        message: 'Product category is required (e.g., Vegetable, Fruit, Flower, Dairy, Snacks).'
      });
    }

    const effectiveQty = available_quantity !== undefined 
      ? Number(available_quantity) 
      : (availableStock !== undefined ? Number(availableStock) : 10);

    const effectiveIsAvailable = is_available !== undefined 
      ? Boolean(is_available) 
      : (effectiveQty > 0);

    const effectiveImg = image_url || image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80';

    const productPayload = {
      vendor_id: vendorId,
      vendorId: vendorId,
      vendorName: req.user.businessName || req.user.name || 'Local Merchant',
      name: name.trim(),
      shortName: name.trim().split(' ')[0],
      category: category.trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      unit: unit.trim().toLowerCase(),
      available_quantity: Math.max(0, effectiveQty),
      availableStock: Math.max(0, effectiveQty),
      is_available: effectiveIsAvailable,
      stockStatus: effectiveIsAvailable ? (effectiveQty <= 2 && effectiveQty > 0 ? 'low-stock' : 'in-stock') : 'out-of-stock',
      image_url: effectiveImg,
      image: effectiveImg,
      description: (description || '').trim()
    };

    let createdProduct = null;

    if (mongoose.connection.readyState === 1) {
      createdProduct = await Product.create(productPayload);
    } else {
      createdProduct = memoryStore.createProduct(productPayload);
    }

    return res.status(201).json({
      success: true,
      message: 'Product published to store catalog successfully.',
      product: createdProduct
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create product: ' + error.message
    });
  }
};

/**
 * GET /api/vendor/products
 * List all products for logged-in vendor, with filtering & search
 */
export const getVendorProducts = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { category, search, q } = req.query;
    const querySearch = search || q;

    let products = [];

    if (mongoose.connection.readyState === 1) {
      const filter = {
        $or: [{ vendor_id: vendorId }, { vendorId }]
      };

      if (category && category !== 'all') {
        filter.category = new RegExp(`^${category}$`, 'i');
      }

      if (querySearch) {
        const searchRegex = new RegExp(querySearch.trim(), 'i');
        filter.$and = [
          {
            $or: [
              { name: searchRegex },
              { shortName: searchRegex },
              { category: searchRegex }
            ]
          }
        ];
      }

      products = await Product.find(filter).sort({ updated_at: -1, createdAt: -1 });
    } else {
      products = memoryStore.findProductsByVendor(vendorId, {
        category,
        search: querySearch
      });
    }

    return res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve vendor products: ' + error.message
    });
  }
};

/**
 * GET /api/vendor/products/:id
 * Retrieve details of a single vendor product (ownership checked)
 */
export const getVendorProductById = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const productId = req.params.id;

    let product = null;

    if (mongoose.connection.readyState === 1) {
      product = await Product.findById(productId);
    }

    if (!product) {
      product = memoryStore.findProductById(productId);
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    const prodVendorId = product.vendor_id || product.vendorId;
    if (prodVendorId !== vendorId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_OWNERSHIP',
        message: 'Access denied: You do not have permission to view or manage another vendor’s product.'
      });
    }

    return res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve product: ' + error.message
    });
  }
};

/**
 * PUT /api/vendor/products/:id
 * Update product details (ownership checked)
 */
export const updateVendorProduct = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const productId = req.params.id;
    const updates = req.body;

    let existingProduct = null;

    if (mongoose.connection.readyState === 1) {
      existingProduct = await Product.findById(productId);
    }
    if (!existingProduct) {
      existingProduct = memoryStore.findProductById(productId);
    }

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found to update.'
      });
    }

    const prodVendorId = existingProduct.vendor_id || existingProduct.vendorId;
    if (prodVendorId !== vendorId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_OWNERSHIP',
        message: 'Access denied: You cannot update products belonging to another vendor.'
      });
    }

    const allowedUpdates = {};
    if (updates.name !== undefined) {
      if (!updates.name.trim() || updates.name.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Product name must be at least 2 characters.' });
      }
      allowedUpdates.name = updates.name.trim();
      allowedUpdates.shortName = updates.name.trim().split(' ')[0];
    }
    if (updates.category !== undefined) allowedUpdates.category = updates.category.trim();
    if (updates.price !== undefined) {
      if (isNaN(Number(updates.price)) || Number(updates.price) <= 0) {
        return res.status(400).json({ success: false, message: 'Price must be a positive number.' });
      }
      allowedUpdates.price = Number(updates.price);
    }
    if (updates.originalPrice !== undefined) allowedUpdates.originalPrice = Number(updates.originalPrice);
    if (updates.unit !== undefined) allowedUpdates.unit = updates.unit.trim().toLowerCase();

    if (updates.available_quantity !== undefined || updates.availableStock !== undefined) {
      const qty = Number(updates.available_quantity !== undefined ? updates.available_quantity : updates.availableStock);
      allowedUpdates.available_quantity = Math.max(0, qty);
      allowedUpdates.availableStock = Math.max(0, qty);
      if (updates.is_available === undefined) {
        allowedUpdates.is_available = qty > 0;
        allowedUpdates.stockStatus = qty > 0 ? (qty <= 2 ? 'low-stock' : 'in-stock') : 'out-of-stock';
      }
    }

    if (updates.is_available !== undefined) {
      const isAvail = Boolean(updates.is_available);
      allowedUpdates.is_available = isAvail;
      allowedUpdates.stockStatus = isAvail 
        ? ((allowedUpdates.available_quantity || existingProduct.available_quantity) <= 2 ? 'low-stock' : 'in-stock') 
        : 'out-of-stock';
    }

    if (updates.image_url !== undefined || updates.image !== undefined) {
      const img = updates.image_url || updates.image;
      allowedUpdates.image_url = img;
      allowedUpdates.image = img;
    }
    if (updates.description !== undefined) allowedUpdates.description = updates.description.trim();

    let updatedProduct = null;

    if (mongoose.connection.readyState === 1) {
      updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $set: allowedUpdates },
        { new: true, runValidators: true }
      );
    } else {
      updatedProduct = memoryStore.updateProduct(productId, allowedUpdates);
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product: updatedProduct
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update product: ' + error.message
    });
  }
};

/**
 * PATCH /api/vendor/products/:id/toggle-availability
 * Quick toggle for in-stock or out-of-stock status (ownership checked)
 */
export const toggleProductAvailability = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const productId = req.params.id;
    const { is_available } = req.body;

    let existingProduct = null;

    if (mongoose.connection.readyState === 1) {
      existingProduct = await Product.findById(productId);
    }
    if (!existingProduct) {
      existingProduct = memoryStore.findProductById(productId);
    }

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    const prodVendorId = existingProduct.vendor_id || existingProduct.vendorId;
    if (prodVendorId !== vendorId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_OWNERSHIP',
        message: 'Access denied: You cannot toggle availability for another vendor’s product.'
      });
    }

    // Toggle value
    const newAvailability = is_available !== undefined 
      ? Boolean(is_available) 
      : !existingProduct.is_available;

    const newStockStatus = newAvailability ? 'in-stock' : 'out-of-stock';

    let updatedProduct = null;

    if (mongoose.connection.readyState === 1) {
      updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $set: { is_available: newAvailability, stockStatus: newStockStatus } },
        { new: true }
      );
    } else {
      updatedProduct = memoryStore.updateProduct(productId, {
        is_available: newAvailability,
        stockStatus: newStockStatus
      });
    }

    return res.status(200).json({
      success: true,
      message: `Product marked as ${newAvailability ? 'in-stock' : 'out-of-stock'}.`,
      is_available: newAvailability,
      stockStatus: newStockStatus,
      product: updatedProduct
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle availability: ' + error.message
    });
  }
};

/**
 * DELETE /api/vendor/products/:id
 * Remove product from vendor catalog (ownership checked)
 */
export const deleteVendorProduct = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const productId = req.params.id;

    let existingProduct = null;

    if (mongoose.connection.readyState === 1) {
      existingProduct = await Product.findById(productId);
    }
    if (!existingProduct) {
      existingProduct = memoryStore.findProductById(productId);
    }

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    const prodVendorId = existingProduct.vendor_id || existingProduct.vendorId;
    if (prodVendorId !== vendorId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_OWNERSHIP',
        message: 'Access denied: You cannot delete products belonging to another vendor.'
      });
    }

    let deleted = false;

    if (mongoose.connection.readyState === 1) {
      await Product.findByIdAndDelete(productId);
      deleted = true;
    } else {
      deleted = memoryStore.deleteProduct(productId);
    }

    return res.status(200).json({
      success: true,
      message: 'Product removed from store catalog successfully.',
      id: productId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete product: ' + error.message
    });
  }
};
