import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { useNavigate } from 'react-router-dom';
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';

const indianStates = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir",
  "Ladakh","Chandigarh","Puducherry","Andaman & Nicobar Islands",
  "Dadra & Nagar Haveli and Daman & Diu","Lakshadweep"
];

const COURIER_OPTIONS = [
  {
    id: 'india_post',
    name: 'India Post',
    tagline: 'Government postal service',
    days: '5–8 days',
    icon: '📮',
  },
  {
    id: 'dtdc',
    name: 'DTDC',
    tagline: 'Reliable express delivery',
    days: '3–5 days',
    icon: '📦',
  },
  {
    id: 'speed',
    name: 'Speed and Safe',
    tagline: 'Fast delivery guaranteed',
    days: '2–3 days',
    icon: '⚡',
  },
];

const PlaceOrder = () => {
  const [couponInput, setCouponInput] = useState('');
  const [invalidCoupon, setInvalidCoupon] = useState(false);
  const [localDiscount, setLocalDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState('');

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '',
    street: '', city: '', state: '', pincode: '', phone: '',
  });

  const navigate = useNavigate();

  const {
    backendUrl, token, cartItems, setCartItems,
    getCartAmount, delivery_fee, products, applyCoupon, coupon,
  } = useContext(ShopContext);

  const isKerala = formData.state === 'Kerala';

  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  // Clear courier selection if state changes away from Kerala
  useEffect(() => {
    if (!isKerala) setSelectedCourier('');
  }, [formData.state]);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    if (name === 'phone' && value.length > 10) return;
    if (name === 'pincode' && value.length > 6) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyCoupon = () => {
    const result = applyCoupon(couponInput.trim());
    if (result.success) {
      setInvalidCoupon(false);
      setLocalDiscount(10);
    } else {
      setInvalidCoupon(true);
      setLocalDiscount(0);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) { resolve(true); return; }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    const hasItems = Object.values(cartItems).some((sizes) =>
      Object.values(sizes).some((qty) => qty > 0)
    );
    if (!hasItems) {
      alert('Your cart is empty. Please add items before placing an order.');
      return;
    }
    if (formData.phone.length !== 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }
    if (formData.pincode.length !== 6) {
      alert('Please enter a valid 6-digit pincode');
      return;
    }
    // Require courier selection for Kerala customers
    if (isKerala && !selectedCourier) {
      alert('Please select a courier option for delivery within Kerala');
      return;
    }

    setIsProcessing(true);

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert('Failed to load payment gateway. Please try again.');
      setIsProcessing(false);
      return;
    }

    const cartAmount = getCartAmount();
    const discountAmount = (cartAmount * localDiscount) / 100;
    const finalAmount = parseFloat((cartAmount - discountAmount + delivery_fee).toFixed(2));

    try {
      const res = await fetch(`${backendUrl}/api/order/razorpay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: finalAmount }),
      });
      const data = await res.json();
      if (!data.success) {
        alert('Failed to create payment order. Please try again.');
        setIsProcessing(false);
        return;
      }

      const orderItems = [];
      for (const productId in cartItems) {
        for (const size in cartItems[productId]) {
          const qty = cartItems[productId][size];
          if (qty > 0) {
            const product = products.find((p) => p._id === productId);
            if (product) orderItems.push({ ...structuredClone(product), size, quantity: qty });
          }
        }
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: 'INR',
        name: 'Buffy',
        description: 'Order Payment',
        order_id: data.order.id,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${backendUrl}/api/order`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                items: orderItems,
                address: formData,
                amount: finalAmount,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderType: 'regular',
                // Send courier only if Kerala
                courier: isKerala ? selectedCourier : null,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setCartItems({});
              navigate('/order-success');
            } else {
              alert('Payment verified but order placement failed. Contact support.');
            }
          } catch (err) {
            console.error('Order save error:', err);
          }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: '#006400' },
        modal: { ondismiss: () => setIsProcessing(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      alert('Something went wrong. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <form
      onSubmit={handlePlaceOrder}
      className='flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t'
    >
      {/* ── Delivery Information ── */}
      <div className='flex flex-col gap-4 w-full sm:max-w-[480px]'>
        <div className='text-xl sm:text-2xl my-3'>
          <Title text1={'DELIVERY'} text2={'INFORMATION'} />
        </div>

        <div className='flex gap-3'>
          <input required name='firstName' value={formData.firstName} onChange={onChangeHandler}
            className='border border-white rounded py-1.5 px-3.5 w-full text-white bg-transparent' type='text' placeholder='First Name' />
          <input required name='lastName' value={formData.lastName} onChange={onChangeHandler}
            className='border border-white rounded py-1.5 px-3.5 w-full text-white bg-transparent' type='text' placeholder='Last Name' />
        </div>

        <input required name='email' value={formData.email} onChange={onChangeHandler}
          className='border border-white rounded py-1.5 px-3.5 w-full text-white bg-transparent' type='email' placeholder='Email Address' />

        <input required name='street' value={formData.street} onChange={onChangeHandler}
          className='border border-white rounded py-1.5 px-3.5 w-full text-white bg-transparent' type='text' placeholder='Street Address, City' />

        <div className='flex gap-3'>
          <input required name='city' value={formData.city} onChange={onChangeHandler}
            className='border border-white rounded py-1.5 px-3.5 w-full text-white bg-transparent' type='text' placeholder='District' />
          <select required name='state' value={formData.state} onChange={onChangeHandler}
            className='border border-white rounded py-1.5 px-3.5 w-full text-white bg-transparent'>
            <option value=''>Select State</option>
            {indianStates.map((state) => (
              <option key={state} value={state} className='text-black'>{state}</option>
            ))}
          </select>
          <input readOnly value='India'
            className='border border-white rounded py-1.5 px-3.5 w-full bg-green-900 cursor-not-allowed text-white' />
        </div>

        <input required name='pincode' value={formData.pincode} onChange={onChangeHandler}
          className='border border-white rounded py-1.5 px-3.5 w-full text-white bg-transparent' type='text' placeholder='Pincode' />

        <input required name='phone' value={formData.phone} onChange={onChangeHandler}
          className='border border-white rounded py-1.5 px-3.5 w-full text-white bg-transparent' type='tel' placeholder='Phone Number' />

        {/* ── Courier Selection — only shown for Kerala ── */}
        {isKerala && (
          <div className='mt-2'>
            <p className='text-white text-sm font-semibold mb-3 flex items-center gap-2'>
              <span>🚚</span> Select Courier Partner
              <span className='text-green-400 text-xs font-normal'>(required for Kerala)</span>
            </p>
            <div className='grid grid-cols-2 gap-3'>
              {COURIER_OPTIONS.map((courier) => (
                <div
                  key={courier.id}
                  onClick={() => setSelectedCourier(courier.id)}
                  className={`cursor-pointer border rounded-xl p-3 transition-all duration-200 ${
                    selectedCourier === courier.id
                      ? 'border-green-400 bg-green-950 shadow-lg shadow-green-900/30'
                      : 'border-gray-700 hover:border-green-700 bg-transparent'
                  }`}
                >
                  <div className='flex items-center gap-2 mb-1'>
                    <span className='text-lg'>{courier.icon}</span>
                    <span className={`font-semibold text-sm ${selectedCourier === courier.id ? 'text-green-300' : 'text-white'}`}>
                      {courier.name}
                    </span>
                    {selectedCourier === courier.id && (
                      <span className='ml-auto text-green-400 text-xs'>✓</span>
                    )}
                  </div>
                  <p className='text-gray-400 text-[11px]'>{courier.tagline}</p>
                  <p className={`text-[11px] mt-1 font-medium ${selectedCourier === courier.id ? 'text-green-400' : 'text-gray-500'}`}>
                    {courier.days}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Right Side ── */}
      <div className='mt-8 w-full sm:max-w-[400px]'>
        <div className='mt-8 min-w-80'>
          <CartTotal overrideDiscount={localDiscount} overrideCoupon={coupon} isCouponApplied={localDiscount > 0} />
        </div>

        {/* Coupon */}
        <div className='mt-6'>
          {localDiscount === 0 ? (
            <div className='flex flex-col gap-2'>
              <input type='text' value={couponInput} onChange={(e) => setCouponInput(e.target.value)}
                placeholder='Enter Coupon Code'
                className='border p-2 rounded outline-none text-sm text-white bg-transparent border-white' />
              <button type='button' onClick={handleApplyCoupon}
                className='bg-white text-black px-4 py-2 rounded hover:bg-gray-200 text-sm'>
                Apply Coupon
              </button>
              {invalidCoupon && <p className='text-red-400 text-xs'>Invalid coupon code</p>}
            </div>
          ) : (
            <p className='text-green-400 text-sm'>Coupon "{coupon}" applied — 10% off!</p>
          )}
        </div>

        {/* Selected courier summary (shown on right side too) */}
        {isKerala && selectedCourier && (() => {
          const c = COURIER_OPTIONS.find(o => o.id === selectedCourier);
          return (
            <div className='mt-6 border border-green-800 rounded-xl p-3 flex items-center gap-3 bg-green-950'>
              <span className='text-2xl'>{c.icon}</span>
              <div>
                <p className='text-green-300 text-sm font-semibold'>{c.name}</p>
                <p className='text-gray-400 text-xs'>{c.days} · {c.tagline}</p>
              </div>
              <span className='ml-auto text-green-400 text-xs border border-green-700 rounded-full px-2 py-0.5'>Selected</span>
            </div>
          );
        })()}

        {/* Payment Method */}
        <div className='mt-12'>
          <Title text1={'PAYMENT'} text2={'METHOD'} />

          <div className='flex items-center gap-3 border border-white p-3 px-4 rounded mt-4 bg-green-950'>
            <div className='w-4 h-4 border-2 border-green-400 rounded-full bg-green-400'></div>
            <div className='flex items-center gap-2'>
              <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="8" fill="#072654"/>
                <path d="M14 34L22 14H30L24 26H34L20 34H14Z" fill="#3395FF"/>
              </svg>
              <span className='text-white font-medium text-sm'>Razorpay</span>
              <span className='text-xs text-green-300 ml-1'>(Cards, UPI, Netbanking & more)</span>
            </div>
          </div>

          <div className='w-full text-center mt-8'>
            <button
              type='submit'
              disabled={isProcessing}
              className='bg-green-700 text-white px-16 py-3 text-sm hover:bg-green-600 transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed rounded'
            >
              {isProcessing ? 'PROCESSING...' : 'PLACE ORDER'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;