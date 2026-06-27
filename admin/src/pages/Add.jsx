import React, { useState } from 'react';
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
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!image1) {
      return toast.error("Please upload at least one product image.");
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

      const response = await axios.post(
        backendUrl + '/api/product/add',
        formData,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        resetForm();
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

  return (
    <form onSubmit={onSubmitHandler} className="flex flex-col w-full items-start gap-3">
      <div>
        <p className="mb-2">Upload Image</p>
        <div className="flex gap-2">
          {[image1, image2, image3, image4].map((img, idx) => {
            const imageSetter = [setImage1, setImage2, setImage3, setImage4][idx];
            return (
              <label key={idx} htmlFor={`image${idx + 1}`}>
                <img
                  className="w-20 h-20 object-cover border border-gray-300"
                  src={img instanceof File ? URL.createObjectURL(img) : assets.upload_area}
                  alt={`upload ${idx + 1}`}
                />
                <input onChange={(e) => imageSetter(e.target.files[0])} type="file" id={`image${idx + 1}`} hidden />
              </label>
            );
          })}
        </div>
      </div>

      <div className="w-full">
        <p className="mb">Product name</p>
        <input
          onChange={(e) => setName(e.target.value)}
          value={name}
          className="w-full max-w-[500px] px-3 py-2 border"
          type="text"
          placeholder="Type here"
          required
        />
      </div>

      <div className="w-full">
        <p className="mb">Product description</p>
        <textarea
          onChange={(e) => setDescription(e.target.value)}
          value={description}
          className="w-full max-w-[500px] px-3 py-2 border"
          placeholder="Write content here"
          required
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:gap-8">
        <div>
          <p className="mb-2">Product type</p>
          <select
            onChange={(e) => setSubCategory(e.target.value)}
            value={subCategory}
            className="w-full px-3 py-2 border"
          >
            <option value="Topwear">Topwear</option>
            <option value="Bottomwear">Bottomwear</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <p className="mb-2">Product Price</p>
          <input
            onChange={(e) => setPrice(e.target.value)}
            value={price}
            className="w-full px-3 py-2 sm:w-[120px] border"
            type="number"
            min="1"
            step="any"
            placeholder="250"
            required
          />
        </div>
      </div>

      <div className="w-full max-w-[500px]">
        <p className="mb-2">Stock Quantity <span className="text-gray-400 text-xs font-normal">(leave blank for unlimited)</span></p>
        <input
          onChange={(e) => setStock(e.target.value)}
          value={stock}
          className="w-full max-w-[160px] px-3 py-2 border"
          type="number"
          min="1"
          step="1"
          placeholder="e.g. 50"
        />
      </div>

      <div>
        <p className="mb-2">Product Sizes</p>
        <div className="flex gap-3 flex-wrap">
          {["S", "M", "L", "XL", "XXL"].map((size) => (
            <div
              key={size}
              onClick={() =>
                setSizes((prev) =>
                  prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
                )
              }
            >
              <p className={`px-3 py-1 cursor-pointer border ${sizes.includes(size) ? 'bg-green-300' : 'bg-slate-200'}`}>
                {size}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <input onChange={() => setBestseller((prev) => !prev)} checked={bestseller} type="checkbox" id="bestseller" />
        <label className="cursor-pointer" htmlFor="bestseller">Add to bestseller</label>
      </div>

      <div className="flex gap-4 mt-4">
        <button
          type="submit"
          className="w-28 py-3 bg-black text-white disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Adding..." : "ADD"}
        </button>
        <button
          type="button"
          onClick={resetForm}
          className="w-28 py-3 bg-gray-300 text-black"
        >
          Clear All
        </button>
      </div>
    </form>
  );
};

export default Add;