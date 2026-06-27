import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

const CATEGORIES = ['Jersey', 'Tracks', 'T-Shirt', 'Shorts', 'Jacket', 'Other'];
const emptySlot = () => ({ label: '', category: 'Jersey' });

const AddCombo = ({ token }) => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [discount, setDiscount] = useState('');
  const [badge, setBadge] = useState('');

  // Up to 3 images: each slot = { file: File|null, preview: string, existingUrl: string }
  const emptyImgSlot = () => ({ file: null, preview: '', existingUrl: '' });
  const [images, setImages] = useState([emptyImgSlot(), emptyImgSlot(), emptyImgSlot()]);

  const [slots, setSlots] = useState([emptySlot(), emptySlot()]);
  const [editingId, setEditingId] = useState(null);

  const fetchCombos = async () => {
    setFetching(true);
    try {
      const res = await axios.get(`${backendUrl}/api/combos/all`, { headers: { token } });
      if (res.data.success) setCombos(res.data.combos || []);
    } catch {}
    finally { setFetching(false); }
  };

  useEffect(() => { fetchCombos(); }, []);

  const resetForm = () => {
    setLabel(''); setDescription(''); setDiscount(''); setBadge('');
    setImages([emptyImgSlot(), emptyImgSlot(), emptyImgSlot()]);
    setSlots([emptySlot(), emptySlot()]); setEditingId(null);
  };

  const startEdit = (combo) => {
    setEditingId(combo._id || combo.id);
    setLabel(combo.label); setDescription(combo.description || '');
    setDiscount(String(combo.discount)); setBadge(combo.badge || '');
    // Load existing images into slots
    const existing = Array.isArray(combo.images) ? combo.images : (combo.image ? [combo.image] : []);
    setImages([
      { file: null, preview: '', existingUrl: existing[0] || '' },
      { file: null, preview: '', existingUrl: existing[1] || '' },
      { file: null, preview: '', existingUrl: existing[2] || '' },
    ]);
    setSlots(combo.slots?.length ? combo.slots : [emptySlot(), emptySlot()]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageChange = (idx, e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file');
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');
    const updated = [...images];
    updated[idx] = { file, preview: URL.createObjectURL(file), existingUrl: updated[idx].existingUrl };
    setImages(updated);
  };

  const removeImage = (idx) => {
    const updated = [...images];
    updated[idx] = emptyImgSlot();
    setImages(updated);
  };

  const updateSlot = (idx, field, value) => {
    const updated = [...slots];
    updated[idx] = { ...updated[idx], [field]: value };
    setSlots(updated);
  };

  const addSlot = () => {
    if (slots.length >= 8) return toast.error('Maximum 8 items per combo');
    setSlots([...slots, emptySlot()]);
  };

  const removeSlot = (idx) => {
    if (slots.length <= 2) return toast.error('Minimum 2 items required');
    setSlots(slots.filter((_, i) => i !== idx));
  };

  // Upload a single image file, return its Cloudinary URL
  const uploadOne = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await axios.post(`${backendUrl}/api/combos/upload-image`, formData, {
      headers: { token, 'Content-Type': 'multipart/form-data' },
    });
    if (!res.data.success) throw new Error(res.data.message || 'Upload failed');
    return res.data.url;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!label.trim()) return toast.error('Combo name is required');

    // ── FIX: allow 0% discount ──
    if (discount === '' || isNaN(discount) || +discount < 0 || +discount > 60)
      return toast.error('Discount must be between 0 and 60');

    if (slots.some((s) => !s.label.trim()))
      return toast.error('All slot labels must be filled in');

    setLoading(true);
    try {
      // Upload any new files, keep existing URLs for unchanged slots
      const imageUrls = await Promise.all(
        images.map(async (img) => {
          if (img.file) return await uploadOne(img.file);
          return img.existingUrl || null;
        })
      );
      const filteredUrls = imageUrls.filter(Boolean);

      const payload = {
        label: label.trim(), description: description.trim(),
        discount: parseFloat(discount), badge: badge.trim() || null,
        images: filteredUrls,
        image: filteredUrls[0] || null, // backwards compat
        count: slots.length, slots,
      };

      let res;
      if (editingId) {
        res = await axios.put(`${backendUrl}/api/combos/${editingId}`, payload, { headers: { token } });
      } else {
        res = await axios.post(`${backendUrl}/api/combos`, payload, { headers: { token } });
      }
      if (res.data.success) {
        toast.success(editingId ? 'Combo updated!' : 'Combo added!');
        resetForm(); fetchCombos();
      } else {
        toast.error(res.data.message || 'Failed to save combo');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const deleteCombo = async (id) => {
    if (!window.confirm('Delete this combo offer?')) return;
    try {
      const res = await axios.delete(`${backendUrl}/api/combos/${id}`, { headers: { token } });
      if (res.data.success) { toast.success('Combo deleted'); fetchCombos(); }
      else toast.error(res.data.message);
    } catch { toast.error('Failed to delete'); }
  };

  const toggleActive = async (id, current) => {
    try {
      await axios.patch(`${backendUrl}/api/combos/${id}`, { active: !current }, { headers: { token } });
      fetchCombos();
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">

      {/* ── Form ── */}
      <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg text-gray-800">
            {editingId ? '✏️ Edit Combo Offer' : '➕ Add New Combo Offer'}
          </h2>
          {editingId && (
            <button onClick={resetForm} className="text-xs text-gray-400 hover:text-gray-700 underline">Cancel edit</button>
          )}
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">

          {/* ── 3-image upload row ── */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block">
              Combo Images <span className="font-normal text-gray-400">(up to 3 — first image is the main card image)</span>
            </label>
            <div className="flex gap-3">
              {images.map((img, idx) => {
                const display = img.preview || img.existingUrl;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => handleImageChange(idx, e)} />
                      <div className={`w-24 h-24 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition hover:border-green-400 ${
                        display ? 'border-green-300' : 'border-gray-300'
                      }`}>
                        {display ? (
                          <img src={display} alt={`combo img ${idx + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-gray-400">
                            <span className="text-2xl">📷</span>
                            <span className="text-[10px] text-center leading-tight">
                              {idx === 0 ? 'Main' : `Image ${idx + 1}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </label>
                    {display && (
                      <button type="button" onClick={() => removeImage(idx)}
                        className="text-[10px] text-red-400 hover:text-red-600">Remove</button>
                    )}
                    {!display && (
                      <span className="text-[10px] text-gray-400">{idx === 0 ? 'Required' : 'Optional'}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Combo Name */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Combo Name *</label>
            <input required placeholder="e.g. 3 Jerseys Combo" value={label} onChange={(e) => setLabel(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Description</label>
            <input placeholder="Short line shown on the card" value={description} onChange={(e) => setDescription(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm" />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              {/* ── FIX: min is now 0, not 1 ── */}
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Discount % *</label>
              <input required type="number" min="0" max="60" step="0.5" placeholder="0"
                value={discount} onChange={(e) => setDiscount(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Badge <span className="font-normal text-gray-400">(optional)</span></label>
              <input placeholder='e.g. "Best Value"' value={badge} onChange={(e) => setBadge(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500">Items in this combo *</label>
              <span className="text-xs text-gray-400">{slots.length} / 8 items</span>
            </div>
            <div className="flex flex-col gap-2">
              {slots.map((slot, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{idx + 1}.</span>
                  <input placeholder={`Slot label (e.g. "First Jersey")`} value={slot.label}
                    onChange={(e) => updateSlot(idx, 'label', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 flex-1 text-sm" />
                  <select value={slot.category} onChange={(e) => updateSlot(idx, 'category', e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-700 w-28 flex-shrink-0">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button type="button" onClick={() => removeSlot(idx)}
                    className="text-gray-400 hover:text-red-500 transition text-lg leading-none flex-shrink-0">×</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addSlot}
              className="mt-2 text-sm text-green-700 hover:text-green-900 font-semibold flex items-center gap-1">
              + Add item slot
            </button>
          </div>

          {/* Live preview */}
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Preview</p>
            <div className="flex items-center gap-4">
              {/* Stacked 3-image preview */}
              <div className="relative flex-shrink-0" style={{ width: '80px', height: '52px' }}>
                {images.slice(0, 3).map((img, i) => {
                  const display = img.preview || img.existingUrl;
                  return (
                    <div key={i}
                      className="absolute w-9 h-12 rounded border border-green-300 overflow-hidden bg-green-100"
                      style={{
                        left: `${i * 20}px`,
                        top: 0,
                        transform: `rotate(${(i - 1) * 5}deg)`,
                        zIndex: i,
                      }}>
                      {display
                        ? <img src={display} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-green-100 flex items-center justify-center text-green-400 text-xs">📷</div>
                      }
                    </div>
                  );
                })}
              </div>
              <div>
                <p className="font-bold text-sm text-gray-800">{label || 'Combo Name'}</p>
                <p className="text-xs text-gray-500">{description || 'Description'}</p>
                <div className="flex items-center gap-2 mt-1">
                  {badge && <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{badge}</span>}
                  <span className="text-green-600 text-sm font-black">
                    {discount !== '' ? discount : '0'}% OFF
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading}
              className="flex-1 bg-black text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-gray-800 transition">
              {loading ? 'Saving…' : editingId ? 'Update Combo' : 'Add Combo'}
            </button>
            <button type="button" onClick={resetForm}
              className="px-6 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-200 transition">Clear</button>
          </div>
        </form>
      </div>

      {/* ── Existing combos ── */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3">
          Existing Combo Offers
          {combos.length > 0 && (
            <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-normal">{combos.length}</span>
          )}
        </h3>
        {fetching ? (
          <div className="text-gray-400 text-sm py-8 text-center border border-dashed border-gray-200 rounded-xl">Loading…</div>
        ) : combos.length === 0 ? (
          <div className="text-gray-400 text-sm py-8 text-center border border-dashed border-gray-200 rounded-xl">
            No combos yet — add one above.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {combos.map((combo) => {
              const thumbs = Array.isArray(combo.images) && combo.images.length
                ? combo.images
                : combo.image ? [combo.image] : [];
              return (
                <div key={combo._id || combo.id}
                  className={`border rounded-xl p-4 flex items-center gap-4 transition ${combo.active === false ? 'border-gray-200 opacity-60' : 'border-gray-200'}`}>
                  {/* Up to 3 thumbnails stacked */}
                  <div className="relative flex-shrink-0" style={{ width: '52px', height: '44px' }}>
                    {thumbs.length === 0 ? (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xl">📷</div>
                    ) : (
                      thumbs.slice(0, 3).map((url, i) => (
                        <div key={i}
                          className="absolute rounded overflow-hidden border border-gray-200"
                          style={{ width: 36, height: 36, left: `${i * 10}px`, top: `${i * 2}px`, zIndex: i }}>
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-gray-800">{combo.label}</p>
                      {combo.badge && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{combo.badge}</span>}
                      {combo.active === false && <span className="bg-gray-100 text-gray-400 text-[10px] px-2 py-0.5 rounded-full">Inactive</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{combo.description}</p>
                    <div className="flex gap-3 mt-1 flex-wrap text-xs">
                      <span className="text-green-600 font-bold">{combo.discount}% OFF</span>
                      <span className="text-gray-400">{combo.slots?.length || 0} items</span>
                      {thumbs.length > 0 && <span className="text-gray-400">{thumbs.length} photo{thumbs.length > 1 ? 's' : ''}</span>}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => toggleActive(combo._id || combo.id, combo.active !== false)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-500 hover:border-gray-400 transition">
                      {combo.active === false ? '▶ On' : '⏸ Off'}
                    </button>
                    <button onClick={() => startEdit(combo)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition">Edit</button>
                    <button onClick={() => deleteCombo(combo._id || combo.id)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-400 hover:border-red-400 hover:text-red-500 transition">Delete</button>
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

export default AddCombo;