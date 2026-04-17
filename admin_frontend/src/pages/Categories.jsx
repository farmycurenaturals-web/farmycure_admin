import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Edit2, FolderPlus, Search, Trash2, X } from 'lucide-react';
import { Table } from '../components/Table';
import { api, resolveApiImageUrl } from '../services/api';

const slugify = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const Categories = () => {
  const getErrorText = (err, fallback) => {
    const raw = err?.response?.data;
    if (typeof raw === 'string') {
      return fallback;
    }
    return err?.response?.data?.message || err?.message || fallback;
  };

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesData, productsData] = await Promise.all([
        api.getCategories(),
        api.getProducts().catch(() => []),
      ]);
      setCategories(Array.isArray(categoriesData) ? categoriesData : categoriesData.categories || []);
      setProducts(Array.isArray(productsData) ? productsData : productsData.products || []);
      setError('');
    } catch (err) {
      setError(getErrorText(err, 'Failed to fetch categories'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const productsByCategory = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      const key = p.category;
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [products]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((cat) =>
      `${cat.name || ''} ${cat.slug || ''} ${cat.categoryCode || ''}`.toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setFormError('');

    const name = formData.name.trim();
    if (!name) return setFormError('Category name is required');

    const slug = slugify(name);
    if (!slug) return setFormError('Invalid category name');
    if (!selectedFile && !formData.imageUrl.trim()) {
      return setFormError('Please upload an image or provide an image URL');
    }

    try {
      setCreateLoading(true);
      const payload = new FormData();
      payload.append('name', name);
      payload.append('slug', slug);
      payload.append('categoryCode', slug);
      payload.append('description', formData.description.trim());
      if (selectedFile) {
        payload.append('image', selectedFile);
      } else {
        payload.append('imageUrl', formData.imageUrl.trim());
      }
      await api.createCategory(payload);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', imageUrl: '' });
      setSelectedFile(null);
      setPreviewUrl('');
      await fetchData();
      setSuccess('Category created successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setFormError(getErrorText(err, 'Failed to create category'));
    } finally {
      setCreateLoading(false);
    }
  };

  const columns = [
    {
      title: 'Category',
      dataIndex: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.image ? (
            <img src={resolveApiImageUrl(row.image)} alt={row.name} className="w-10 h-10 rounded-md object-cover border border-gray-100" />
          ) : (
            <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-100" />
          )}
          <div>
            <span className="font-medium text-gray-900 block">{row.name}</span>
            <span className="text-xs text-gray-500">{row.slug}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Code',
      dataIndex: 'categoryCode',
      render: (row) => <span className="text-gray-600 text-sm">{row.categoryCode || row.slug}</span>,
    },
    {
      title: 'Products',
      dataIndex: 'products',
      render: (row) => (
        <span className="text-gray-700 font-medium">
          {productsByCategory.get(row.categoryCode || row.slug) || 0}
        </span>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      render: (row) => <span className="text-gray-500 text-sm">{row.description || '-'}</span>,
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      render: () => (
        <div className="flex items-center gap-2">
          <button
            disabled
            title="Edit needs backend update endpoint"
            className="p-1.5 text-gray-300 rounded-md cursor-not-allowed"
          >
            <Edit2 size={16} />
          </button>
          <button
            disabled
            title="Delete needs backend delete endpoint"
            className="p-1.5 text-gray-300 rounded-md cursor-not-allowed"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('Only image files are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFormError('Image must be 2MB or smaller');
      return;
    }
    setFormError('');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-6">
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage category groups used by products and user-side filters.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={16} className="text-gray-400" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="w-full bg-white text-sm rounded-lg border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 py-2 pl-9 pr-4 transition-colors outline-none"
            />
          </div>
          <button
            onClick={() => {
              setShowCreateModal(true);
              setFormError('');
              setSelectedFile(null);
              setPreviewUrl('');
            }}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            <FolderPlus size={16} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
        </div>
      ) : (
        <Table
          columns={columns}
          data={filteredCategories}
          keyExtractor={(row) => row._id || row.slug || row.name}
        />
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Create Category</h2>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedFile(null);
                  setPreviewUrl('');
                }}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Code/slug preview: <span className="font-medium">{slugify(formData.name) || '-'}</span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Max size: 2MB. Supported: jpg, png, webp, gif.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData((p) => ({ ...p, imageUrl: e.target.value }))}
                  placeholder="https://example.com/category.jpg"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                />
              </div>
              {(previewUrl || formData.imageUrl.trim()) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
                  <img
                    src={previewUrl || formData.imageUrl.trim()}
                    alt="Category preview"
                    className="w-20 h-20 rounded-md object-cover border border-gray-100"
                    onError={() => setFormError('Invalid image preview URL')}
                  />
                </div>
              )}

              <div className="pt-1 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedFile(null);
                    setPreviewUrl('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {createLoading ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
