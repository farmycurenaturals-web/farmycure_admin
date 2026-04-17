import React, { useMemo, useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, AlertCircle, FolderPlus, ImagePlus } from 'lucide-react';
import { Table } from '../components/Table';
import { api } from '../services/api';
import { formatINR } from '../utils/currency';

const blankOption = () => ({
  quantity: '',
  price: '',
  stock: '',
});

const blankVariant = () => ({
  name: '',
  image: '',
  imageFile: null,
  options: [blankOption()],
});

const blankForm = () => ({
  name: '',
  category: '',
  description: '',
  isFeatured: false,
  variants: [blankVariant()],
});

const slugify = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState(blankForm);
  const [formError, setFormError] = useState('');
  const [categoryData, setCategoryData] = useState({ name: '', description: '' });
  const [categoryError, setCategoryError] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))),
    [categories]
  );

  const fetchProductsAndCategories = async () => {
    try {
      setLoading(true);
      const [productsData, categoryDataResponse] = await Promise.all([
        api.getProducts(),
        api.getCategories().catch(() => []),
      ]);
      setProducts(Array.isArray(productsData) ? productsData : productsData.products || []);
      setCategories(Array.isArray(categoryDataResponse) ? categoryDataResponse : categoryDataResponse.categories || []);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch products/categories.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  const filteredProducts = products.filter((p) =>
    `${p.name || ''} ${p.title || ''}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (product = null) => {
    setFormError('');
    if (product) {
      const productVariants = Array.isArray(product.variants)
        ? product.variants.map((variant) => ({
            name: variant?.name || 'default',
            image: variant?.image || '',
            imageFile: null,
            options: Array.isArray(variant?.options) && variant.options.length
              ? variant.options.map((opt) => ({
                  quantity: opt?.quantity || '',
                  price: opt?.price ?? '',
                  stock: opt?.stock ?? '',
                }))
              : variant?.quantity
                ? [{
                    quantity: variant.quantity || '',
                    price: variant.price ?? '',
                    stock: variant.stock ?? '',
                  }]
              : [blankOption()],
          }))
        : [];
      setCurrentProduct(product);
      setFormData({
        name: product.name || product.title || '',
        category: product.category || '',
        description: product.description || '',
        isFeatured: Boolean(product.isFeatured),
        variants: productVariants.length ? productVariants : [blankVariant()],
      });
    } else {
      setCurrentProduct(null);
      setFormData(blankForm());
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentProduct(null);
  };

  const updateVariant = (index, key, value) => {
    setFormData((prev) => {
      const nextVariants = [...prev.variants];
      nextVariants[index] = { ...nextVariants[index], [key]: value };
      return { ...prev, variants: nextVariants };
    });
  };

  const updateVariantOption = (variantIndex, optionIndex, key, value) => {
    setFormData((prev) => {
      const nextVariants = [...prev.variants];
      const nextOptions = [...(nextVariants[variantIndex]?.options || [])];
      nextOptions[optionIndex] = { ...nextOptions[optionIndex], [key]: value };
      nextVariants[variantIndex] = { ...nextVariants[variantIndex], options: nextOptions };
      return { ...prev, variants: nextVariants };
    });
  };

  const addVariant = () => {
    setFormData((prev) => ({ ...prev, variants: [...prev.variants, blankVariant()] }));
  };

  const removeVariant = (index) => {
    setFormData((prev) => {
      if (prev.variants.length <= 1) return prev;
      return { ...prev, variants: prev.variants.filter((_, i) => i !== index) };
    });
  };

  const addVariantOption = (variantIndex) => {
    setFormData((prev) => {
      const nextVariants = [...prev.variants];
      nextVariants[variantIndex] = {
        ...nextVariants[variantIndex],
        options: [...(nextVariants[variantIndex]?.options || []), blankOption()],
      };
      return { ...prev, variants: nextVariants };
    });
  };

  const removeVariantOption = (variantIndex, optionIndex) => {
    setFormData((prev) => {
      const nextVariants = [...prev.variants];
      const options = [...(nextVariants[variantIndex]?.options || [])];
      if (options.length <= 1) return prev;
      nextVariants[variantIndex] = {
        ...nextVariants[variantIndex],
        options: options.filter((_, idx) => idx !== optionIndex),
      };
      return { ...prev, variants: nextVariants };
    });
  };

  const isLikelyDirectImageUrl = (value) =>
    /^https?:\/\/.+\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(String(value || '').trim());

  const handleVariantImageUpload = (index, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('Only image files are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFormError('Image must be 2MB or smaller');
      return;
    }
    const preview = URL.createObjectURL(file);
    updateVariant(index, 'imageFile', file);
    updateVariant(index, 'image', preview);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name) return setFormError('Name is required');
    if (!formData.category) return setFormError('Category is required');
    if (!formData.variants?.length) return setFormError('At least one variant is required');

    const normalizedVariants = formData.variants
      .map((variant, variantIndex) => ({
        name: String(variant.name || '').trim(),
        image: String(variant.image || '').trim(),
        imageFile: variant.imageFile || null,
        imageField: `variantImage-${variantIndex}`,
        options: Array.isArray(variant.options)
          ? variant.options
              .map((option) => ({
                quantity: String(option.quantity || '').trim(),
                price: Number(option.price),
                stock: option.stock === '' ? 0 : Number(option.stock),
              }))
              .filter((option) => option.quantity && Number.isFinite(option.price))
          : [],
      }))
      .filter((variant) => variant.name || variant.options.length || variant.image || variant.imageFile);

    if (!normalizedVariants.length) {
      return setFormError('Add at least one variant with name, image and quantity options');
    }
    for (const variant of normalizedVariants) {
      if (!variant.name) return setFormError('Each variant needs a name (e.g. fresh, flakes, powder)');
      if (!variant.imageFile && !variant.image) return setFormError('Each variant needs an image URL or uploaded image');
      if (!variant.imageFile && !isLikelyDirectImageUrl(variant.image)) {
        return setFormError('Use a direct image URL ending with .jpg, .jpeg, .png, .webp, or .gif');
      }
      if (!variant.options.length) return setFormError('Each variant needs at least one quantity option');
    }

    try {
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('title', formData.name.trim());
      payload.append('category', formData.category);
      payload.append('description', formData.description?.trim() || '');
      payload.append('isFeatured', formData.isFeatured ? 'true' : 'false');
      payload.append(
        'variants',
        JSON.stringify(
          normalizedVariants.map((variant) => ({
            name: variant.name,
            image: variant.imageFile ? '' : variant.image,
            imageFileKey: variant.imageFile ? variant.imageField : '',
            options: variant.options.map((option) => ({
              quantity: option.quantity,
              price: option.price,
              stock: Number(option.stock) || 0,
            })),
          }))
        )
      );
      normalizedVariants.forEach((variant) => {
        if (variant.imageFile) {
          payload.append(variant.imageField, variant.imageFile);
        }
      });

      if (currentProduct) {
        await api.updateProduct(currentProduct._id || currentProduct.id, payload);
        setSuccess('Product updated successfully!');
      } else {
        await api.createProduct(payload);
        setSuccess('Product added successfully!');
      }
      
      setShowModal(false);
      await fetchProductsAndCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || 'Error saving product');
    }
  };

  // Delete product
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.deleteProduct(id);
        setSuccess('Product deleted successfully!');
        fetchProductsAndCategories();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Error deleting product');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setCategoryError('');
    const name = categoryData.name.trim();
    if (!name) {
      setCategoryError('Category name is required');
      return;
    }
    const slug = slugify(name);
    if (!slug) {
      setCategoryError('Category name must include letters or numbers');
      return;
    }

    try {
      setCategoryLoading(true);
      await api.createCategory({
        name,
        slug,
        categoryCode: slug,
        description: categoryData.description.trim(),
      });
      const categoriesData = await api.getCategories();
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setFormData((prev) => ({ ...prev, category: slug }));
      setCategoryData({ name: '', description: '' });
      setShowCategoryModal(false);
      setSuccess('Category created successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setCategoryError(err?.response?.data?.message || err?.message || 'Failed to create category');
    } finally {
      setCategoryLoading(false);
    }
  };

  const resolveMinPrice = (row) => {
    if (Array.isArray(row.variants) && row.variants.length) {
      const prices = row.variants
        .flatMap((variant) => (Array.isArray(variant?.options) ? variant.options : []))
        .map((opt) => Number(opt?.price))
        .filter((n) => Number.isFinite(n));
      if (prices.length) return Math.min(...prices);
    }
    return Number(row.price || 0);
  };

  const resolveStock = (row) => {
    if (Array.isArray(row.variants) && row.variants.length) {
      return row.variants
        .flatMap((variant) => (Array.isArray(variant?.options) ? variant.options : []))
        .reduce((sum, opt) => sum + (Number(opt?.stock) || 0), 0);
    }
    return Number(row.stock || 0);
  };

  const columns = [
    { 
      title: 'Product', 
      dataIndex: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.image ? (
            <div className="w-10 h-10 rounded overflow-hidden border border-gray-100 shrink-0">
              <img
                src={row.image}
                alt={row.name}
                className="w-full h-full object-cover rounded"
              />
            </div>
          ) : (
            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded text-gray-400 text-sm border border-gray-100 shrink-0">
              No Image
            </div>
          )}
          <div>
            <span className="font-medium text-gray-900 block">{row.name || row.title}</span>
            <span className="text-xs text-gray-500">{formatINR(resolveMinPrice(row))}</span>
          </div>
        </div>
      )
    },
    { 
      title: 'Category', 
      dataIndex: 'category',
      render: (row) => <span className="text-gray-500">{row.category}</span>
    },
    { 
      title: 'Stock', 
      dataIndex: 'stock',
      render: (row) => (
        <span className={`${resolveStock(row) === 0 ? 'text-red-500 font-medium' : 'text-gray-900'}`}>
          {resolveStock(row)}
        </span>
      )
    },
    { 
      title: 'Status', 
      dataIndex: 'status',
      render: (row) => (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
          resolveStock(row) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {resolveStock(row) > 0 ? 'In Stock' : 'Out of Stock'}
        </span>
      )
    },
    {
      title: 'Variants',
      dataIndex: 'variants',
      render: (row) => (
        <span className="text-gray-500">
          {Array.isArray(row.variants) ? row.variants.length : 0}
        </span>
      ),
    },
    { 
      title: 'Actions', 
      dataIndex: 'actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleOpenModal(row)}
            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => handleDelete(row._id || row.id)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm border border-red-100">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 text-sm border border-green-100">
          <AlertCircle size={16} /> {success}
        </div>
      )}

      {/* Page Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage categories, products, and variant-wise pricing/images.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={16} className="text-gray-400" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-white text-sm rounded-lg border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 py-2 pl-9 pr-4 transition-colors outline-none"
            />
          </div>
          
          <button
            onClick={() => {
              setCategoryError('');
              setCategoryData({ name: '', description: '' });
              setShowCategoryModal(true);
            }}
            className="flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            <FolderPlus size={16} />
            <span>Add Category</span>
          </button>

          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <Table 
          columns={columns} 
          data={filteredProducts} 
          keyExtractor={(row) => row._id || row.id || Math.random()} 
        />
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">
                {currentProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button type="button" onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {formError && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                  {formError}
                </div>
              )}

              <form id="productForm" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <div className="flex gap-2">
                    <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                  >
                    <option value="">Select category</option>
                    {sortedCategories.map((cat) => (
                      <option key={cat._id || cat.slug} value={cat.categoryCode || cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryError('');
                        setCategoryData({ name: '', description: '' });
                        setShowCategoryModal(true);
                      }}
                      className="px-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      title="Create category"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                  <textarea 
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors resize-none"
                  ></textarea>
                </div>

                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Featured Product</span>
                </label>

                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-gray-800">Variants *</h3>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-800"
                    >
                      <Plus size={14} />
                      Add variant
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.variants.map((variant, idx) => (
                      <div key={`variant-${idx}`} className="border border-gray-200 rounded-lg p-3 bg-gray-50/40">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Variant Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. fresh, flakes, powder"
                            value={variant.name}
                            onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Image URL (or upload below)</label>
                            <input
                              type="text"
                              value={variant.image}
                              onChange={(e) => updateVariant(idx, 'image', e.target.value)}
                              placeholder="https://example.com/variant.jpg"
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                          <label className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 cursor-pointer">
                            <ImagePlus size={14} />
                            Upload
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleVariantImageUpload(idx, e.target.files?.[0])}
                            />
                          </label>
                        </div>

                        {variant.image && (
                          <div className="mt-3">
                            <img
                              src={variant.image}
                              alt={`Variant ${idx + 1}`}
                              className="w-20 h-20 object-cover rounded-md border border-gray-200 bg-white"
                            />
                          </div>
                        )}

                        <div className="mt-4 border-t border-gray-200 pt-3">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-xs font-semibold text-gray-700">Quantity Options</p>
                            <button
                              type="button"
                              onClick={() => addVariantOption(idx)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-800"
                            >
                              <Plus size={14} />
                              Add Quantity Option
                            </button>
                          </div>

                          <div className="space-y-2">
                            {variant.options.map((option, optionIdx) => (
                              <div key={`variant-${idx}-option-${optionIdx}`} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                                <div>
                                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Quantity *</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. 100g, 500g"
                                    value={option.quantity}
                                    onChange={(e) => updateVariantOption(idx, optionIdx, 'quantity', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Price (INR) *</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0"
                                    value={option.price}
                                    onChange={(e) => updateVariantOption(idx, optionIdx, 'price', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Stock</label>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={option.stock}
                                    onChange={(e) => updateVariantOption(idx, optionIdx, 'stock', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
                                  />
                                </div>
                                <div className="md:text-right">
                                  <button
                                    type="button"
                                    onClick={() => removeVariantOption(idx, optionIdx)}
                                    disabled={variant.options.length === 1}
                                    className="text-xs text-red-600 hover:text-red-700 disabled:text-gray-300"
                                  >
                                    Remove Option
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeVariant(idx)}
                            disabled={formData.variants.length === 1}
                            className="text-xs text-red-600 hover:text-red-700 disabled:text-gray-300"
                          >
                            Remove variant
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button 
                type="button" 
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="productForm"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
              >
                {currentProduct ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Create Category</h3>
              <button type="button" onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="p-5 space-y-4">
              {categoryError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{categoryError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={categoryData.name}
                  onChange={(e) => setCategoryData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Bulk Order"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  rows={3}
                  value={categoryData.description}
                  onChange={(e) => setCategoryData((p) => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={categoryLoading} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60">
                  {categoryLoading ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
