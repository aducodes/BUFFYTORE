import React, { useContext, useMemo } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import { assets } from '../assets/assets/assets';
import CartTotal from '../components/CartTotal.jsx';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Cart = () => {
  const { products, currency, cartItems, updateQuantity, user } = useContext(ShopContext);
  const navigate = useNavigate();

  const cartData = useMemo(() => {
    if (products.length === 0) return [];
    return Object.entries(cartItems).flatMap(([itemId, sizes]) =>
      Object.entries(sizes)
        .filter(([, qty]) => qty > 0)
        .map(([size, quantity]) => ({ _id: itemId, size, quantity }))
    );
  }, [cartItems, products]);

  const handleCheckout = () => {
    if (!user) {
      toast.info("Please log in to proceed to checkout.");
      navigate('/login');
    } else {
      navigate('/place-order');
    }
  };

  return (
    <div className='border-t pt-14'>
      <div className='text-2xl mb-3'>
        <Title text1="YOUR" text2="CART" />
      </div>

      <div>
        {cartData.length === 0 ? (
          <p className='text-center text-white mt-10'>Your cart is empty.</p>
        ) : (
          cartData.map((item, index) => {
            const productData = products.find(product => product._id === item._id);
            if (!productData) return null;

            return (
              <div
                key={index}
                className='py-4 border-t border-b text-white grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4'
              >
                <div className='flex items-start gap-6'>
                  <img
                    className='w-16 sm:w-20'
                    src={productData.image?.[0] || assets.default_image}
                    alt={productData.name || 'Product Image'}
                  />
                  <div>
                    <p className='text-xs sm:text-lg font-medium'>{productData.name}</p>
                    <div className='flex items-center gap-5 mt-2'>
                      <p className='text-white'>{currency}{productData.price}</p>
                      <p className='px-2 sm:px-3 sm:py-1 border bg-white text-green-700'>{item.size}</p>
                    </div>
                  </div>
                </div>
                <input
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      updateQuantity(item._id, item.size, value);
                    }
                  }}
                  className='border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1 text-green-600 bg-white'
                  type='number'
                  min={1}
                  value={item.quantity}
                />
                <img
                  onClick={() => updateQuantity(item._id, item.size, 0)}
                  className='w-4 mr-4 sm:w-5 cursor-pointer'
                  src={assets.bin_icon}
                  alt='Delete'
                />
              </div>
            );
          })
        )}
      </div>

      <div className='flex justify-end my-20'>
        <div className='w-full sm:w-[450px]'>
          <CartTotal />
          <div className='w-full text-end'>
            <button
              disabled={cartData.length === 0}
              onClick={handleCheckout}
              className={`bg-green-700 text-white text-sm my-8 px-8 py-3 active:bg-gray-700 transition-opacity hover:text-black hover:border-1 hover:bg-green-100 hover:transition duration-300 ${
                cartData.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              PROCEED TO CHECKOUT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
