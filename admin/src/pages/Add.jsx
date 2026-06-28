import React, { useState, useEffect } from 'react';
import { assets } from '../assets/assets/assets';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

const Add = ({ token }) => {
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [image3, setImage3] = useState(null);
  const [image4, setImage4] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [subCategory, setSubCategory] = useState('Topwear');
  const [bestseller, setBestseller] = useState(false);
  const [sizes, setSizes] = useState([]);
  const [stock, setStock] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Existing products ──
  const [products, setProducts] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const fetchProducts = async () => {
    setFetching(true);
    try {
      const res = await axios.get(`${backendUrl}/api/product/list`, { headers: { token } });
      if (res.data.success) setProducts(res.data.products || []);
    } catch {}
    finally { setFetching(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setSubCategory('Topwear');
    setBestseller(false);
    setSizes([]);
    setStock('');
    setImage1(null);
    setImage2(null);
    setImage3(null);
    setImage4(null);
    setEditingId(null);
  };

  const startEdit = (product) => {
    setEditingId(product._id || product.id);
    setName(product.name || '');
    setDescription(product.description || '');
    setPrice(String(product.price || ''));
    setSubCategory(product.subCategory || 'Topwear');
    setBestseller(product.bestseller || false);
    setSizes(product.sizes || []);
    setStock(product.stock !== undefined && product.stock !== null ? String(product.stock) : '');
    // Clear image slots (existing images shown separately)
    setImage1(null); setImage2(null); setImage3(null); setImage4(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!editingId && !image1) {
      return toast.error('Please upload at least one product image.');
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('subCategory', subCategory);
      formData.append('bestseller', bestseller);
      formData.append('sizes', JSON.stringify(sizes));
      if (stock !== '') formData.append('stock', stock);

      if (image1) formData.append('image1', image1);
      if (image2) formData.append('image2', image2);
      if (image3) formData.append('image3', image3);
      if (image4) formData.append('image4', image4);

      let response;
      if (editingId) {
        response = await axios.put(
          `${backendUrl}/api/product/${editingId}`,
          formData,
          { headers: { token, 'Content-Type': 'multipart/form-data' } }
        );
      } else {
        response = await axios.post(
          `${backendUrl}/api/product/add`,
          formData,
          { headers: { token } }
        );
      }

      if (response.data.success) {
        toast.success(editingId ? 'Product updated!' : response.data.message);
        resetForm();
        fetchProducts();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      const res = await axios.delete(`${backendUrl}/api/product/remove`, {
        headers: { token },
        data: { id },
      });
      if (res.data.success) { toast.success('Product deleted'); fetchProducts(); }
      else toast.error(res.data.message);
    } catch { toast.error('Failed to delete'); }
  };

  const toggleBestseller = async (product) => {
    try {
      await axios.patch(
        `${backendUrl}/api/product/${product._id || product.id}`,
        { bestseller: !product.bestseller },
        { headers: { token } }
      );
      fetchProducts();
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">

      {/* ── Form ── */}
      <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg text-gray-800">
            {editingId ? '✏️ Edit Product' : '➕ Add New Product'}
          </h2>
          {editingId && (
            <button onClick={resetForm} className="text-xs text-gray-400 hover:text-gray-700 underline">
              Cancel edit
            </button>
          )}
        </div>

        <form onSubmit={onSubmitHandler} className="flex flex-col gap-4">

          {/* Image Upload */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block">
              Product Images{' '}
              <span className="font-normal text-gray-400">
                (up to 4 — first image is the main card image{editingId ? '; leave blank to keep existing' : ''})
              </span>
            </label>
            <div className="flex gap-3">
              {[image1, image2, image3, image4].map((img, idx) => {
                const setters = [setImage1, setImage2, setImage3, setImage4];
                const display = img instanceof File ? URL.createObjectURL(img) : null;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <label className="cursor-pointer" htmlFor={`image${idx + 1}`}>
                      <div className={`w-24 h-24 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition hover:border-green-400 ${
                        display ? 'border-green-300' : 'border-gray-300'
                      }`}>
                        {display ? (
                          <img src={display} alt={`product img ${idx + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-gray-400">
                            <span className="text-2xl">📷</span>
                            <span className="text-[10px] text-center leading-tight">
                              {idx === 0 ? 'Main' : `Image ${idx + 1}`}
                            </span>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        id={`image${idx + 1}`}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setters[idx](e.target.files[0])}
                      />
                    </label>
                    {!display && (
                      <span className="text-[10px] text-gray-400">{idx === 0 && !editingId ? 'Required' : 'Optional'}</span>
                    )}
                    {display && (
                      <button type="button" onClick={() => setters[idx](null)} className="text-[10px] text-red-400 hover:text-red-600">
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Product Name *</label>
            <input
              onChange={(e) => setName(e.target.value)}
              value={name}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm"
              type="text"
              placeholder="e.g. Dri-Fit Jersey"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Description *</label>
            <textarea
              onChange={(e) => setDescription(e.target.value)}
              value={description}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm"
              placeholder="Write content here"
              rows={3}
              required
            />
          </div>

          {/* Type + Price */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Product Type</label>
              <select
                onChange={(e) => setSubCategory(e.target.value)}
                value={subCategory}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm text-gray-700"
              >
                <option value="Topwear">Topwear</option>
                <option value="Bottomwear">Bottomwear</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Price (₹) *</label>
              <input
                onChange={(e) => setPrice(e.target.value)}
                value={price}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm"
                type="number"
                min="1"
                step="any"
                placeholder="250"
                required
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Stock <span className="font-normal text-gray-400">(blank = unlimited)</span>
              </label>
              <input
                onChange={(e) => setStock(e.target.value)}
                value={stock}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 50"
              />
            </div>
          </div>

          {/* Sizes */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Sizes</label>
            <div className="flex gap-2 flex-wrap">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'FREE SIZE', '28', '30', '32', '34', '36', '38', '40'].map((size) => (
                <div
                  key={size}
                  onClick={() =>
                    setSizes((prev) =>
                      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
                    )
                  }
                  className={`px-3 py-1 rounded-lg border cursor-pointer text-xs font-medium transition select-none ${
                    sizes.includes(size)
                      ? 'bg-green-100 border-green-400 text-green-800'
                      : 'bg-gray-100 border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {size}
                </div>
              ))}
            </div>
          </div>

          {/* Bestseller */}
          <div className="flex items-center gap-2">
            <input
              onChange={() => setBestseller((prev) => !prev)}
              checked={bestseller}
              type="checkbox"
              id="bestseller"
              className="accent-green-500"
            />
            <label className="cursor-pointer text-sm text-gray-700" htmlFor="bestseller">
              Add to bestseller
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-gray-800 transition"
            >
              {loading ? 'Saving…' : editingId ? 'Update Product' : 'Add Product'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-200 transition"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* ── Existing Products ── */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3">
          Existing Products
          {products.length > 0 && (
            <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-normal">
              {products.length}
            </span>
          )}
        </h3>

        {fetching ? (
          <div className="text-gray-400 text-sm py-8 text-center border border-dashed border-gray-200 rounded-xl">
            Loading…
          </div>
        ) : products.length === 0 ? (
          <div className="text-gray-400 text-sm py-8 text-center border border-dashed border-gray-200 rounded-xl">
            No products yet — add one above.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {products.map((product) => {
              const allImages = [product.image1, product.image2, product.image3, product.image4]
                .filter(Boolean);
              // Also support array-style images field
              const thumbs = allImages.length
                ? allImages
                : Array.isArray(product.images) ? product.images : [];

              return (
                <div
                  key={product._id || product.id}
                  className="border border-gray-200 rounded-xl p-4 flex items-center gap-4 transition hover:border-gray-300"
                >
                  {/* Up to 3 thumbnails stacked */}
                  <div className="relative flex-shrink-0" style={{ width: '52px', height: '44px' }}>
                    {thumbs.length === 0 ? (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xl">📷</div>
                    ) : (
                      thumbs.slice(0, 3).map((url, i) => (
                        <div
                          key={i}
                          className="absolute rounded overflow-hidden border border-gray-200"
                          style={{ width: 36, height: 36, left: `${i * 10}px`, top: `${i * 2}px`, zIndex: i }}
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-gray-800 truncate">{product.name}</p>
                      {product.bestseller && (
                        <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Bestseller
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{product.description}</p>
                    <div className="flex gap-3 mt-1 flex-wrap text-xs">
                      <span className="text-gray-800 font-bold">₹{product.price}</span>
                      <span className="text-gray-400">{product.subCategory}</span>
                      {product.sizes?.length > 0 && (
                        <span className="text-gray-400">{product.sizes.join(', ')}</span>
                      )}
                      {product.stock !== undefined && product.stock !== null && (
                        <span className="text-gray-400">Stock: {product.stock}</span>
                      )}
                      {thumbs.length > 0 && (
                        <span className="text-gray-400">{thumbs.length} photo{thumbs.length > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleBestseller(product)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-500 hover:border-yellow-400 hover:text-yellow-600 transition"
                      title={product.bestseller ? 'Remove from bestseller' : 'Mark as bestseller'}
                    >
                      {product.bestseller ? '⭐ Best' : '☆ Best'}
                    </button>
                    <button
                      onClick={() => startEdit(product)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteProduct(product._id || product.id)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-400 hover:border-red-400 hover:text-red-500 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Add;