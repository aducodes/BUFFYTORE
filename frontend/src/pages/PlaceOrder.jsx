import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { useNavigate } from 'react-router-dom';
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';
import QRCode from 'react-qr-code';
import { assets } from '../assets/assets/assets';

const keralaDistricts = [
  "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha",
  "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad",
  "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
];

const PlaceOrder = () => {
  const [method, setMethod] = useState('googlepay');
  const [couponInput, setCouponInput] = useState('');
  const [invalidCoupon, setInvalidCoupon] = useState(false);
  const [localDiscount, setLocalDiscount] = useState(0);
  const [showQRCode, setShowQRCode] = useState(false);
  const [finalAmount, setFinalAmount] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    district: '',
    pincode: '',
    phone: '',
  });

  const navigate = useNavigate();
  const {
    backendUrl,
    token,
    cartItems,
    setCartItems,
    getCartAmount,
    delivery_fee,
    products,
    applyCoupon,
    coupon,
    currency
  } = useContext(ShopContext);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token]);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyCoupon = () => {
    const result = applyCoupon(couponInput.trim());
    if (result.success) {
      setInvalidCoupon(false);
      setLocalDiscount(result.discount || 10);
    } else {
      setInvalidCoupon(true);
      setLocalDiscount(0);
    }
  };

  const handleGenerateQR = (e) => {
    e.preventDefault();

    const hasItems = Object.values(cartItems).some((sizes) =>
      Object.values(sizes).some((quantity) => quantity > 0)
    );

    if (!hasItems) {
      alert("Your cart is empty. Please add items before placing an order.");
      return;
    }

    const cartAmount = getCartAmount();
    const discountAmount = (cartAmount * localDiscount) / 100;
    const finalAmt = (cartAmount - discountAmount + delivery_fee).toFixed(2);
    setFinalAmount(finalAmt);
    setShowQRCode(true);
  };

  const confirmPaymentAndSubmit = async () => {
    try {
      const orderItems = [];

      for (const productId in cartItems) {
        for (const size in cartItems[productId]) {
          const quantity = cartItems[productId][size];
          if (quantity > 0) {
            const product = products.find(p => p._id === productId);
            if (product) {
              orderItems.push({
                ...structuredClone(product),
                size,
                quantity,
              });
            }
          }
        }
      }

      const orderData = {
        address: formData,
        items: orderItems,
        amount: parseFloat(finalAmount),
        paymentInfo: {
          method,
          status: 'pending_confirmation',
        },
      };

      const response = await fetch(`${backendUrl}/api/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        setCartItems({});
        navigate('/order-success');
      } else {
        console.error('Order placement failed');
      }
    } catch (error) {
      console.error('Error placing order:', error);
    }
  };

  const upiString = `upi://pay?pa=noushahmed19@okicici&pn=Noushis%20Cakes&am=${finalAmount}&cu=INR`;

  return (
    <form onSubmit={handleGenerateQR} className='flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t'>
      {/* Delivery Info */}
      <div className='flex flex-col gap-4 w-full sm:max-w-[480px]'>
        <div className='text-xl sm:text-2xl my-3'>
          <Title text1={'DELIVERY'} text2={'INFORMATION'} />
        </div>
        <div className='flex gap-3'>
          <input required onChange={onChangeHandler} name='firstName' value={formData.firstName} className='border border-white rounded py-1.5 px-3.5 w-full text-white' type="text" placeholder='First name' />
          <input required onChange={onChangeHandler} name='lastName' value={formData.lastName} className='border border-white rounded py-1.5 px-3.5 w-full text-white' type="text" placeholder='Last name' />
        </div>
        <input required onChange={onChangeHandler} name='email' value={formData.email} className='border border-white rounded py-1.5 px-3.5 w-full text-white' type="email" placeholder='Email address' />
        <input required onChange={onChangeHandler} name='street' value={formData.street} className='border border-white rounded py-1.5 px-3.5 w-full text-white' type="text" placeholder='Street' />
        <div className='flex gap-3'>
          <select required onChange={onChangeHandler} name='district' value={formData.district} className='border border-white rounded py-1.3 px-2.5 w-full text-white'>
            <option value="">Select District</option>
            {keralaDistricts.map((district) => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
          <input readOnly value="Kerala" className='border border-white rounded py-1.5 px-3.5 w-full bg-gray-100 cursor-not-allowed text-black' />
        </div>
        <input required onChange={onChangeHandler} name='pincode' value={formData.pincode} className='border border-white rounded py-1.5 px-3.5 w-full text-white' type="number" placeholder='Pincode' />
        <input required onChange={onChangeHandler} name='phone' value={formData.phone} className='border border-white rounded py-1.5 px-3.5 w-full text-white ' type="number" placeholder='Phone' />
      </div>

      {/* Right: Cart total, coupon, QR code */}
      <div className='mt-8 w-full sm:max-w-[400px]'>
        <div className='mt-8 min-w-80'>
          <CartTotal
            overrideDiscount={localDiscount}
            overrideCoupon={coupon}
            isCouponApplied={localDiscount > 0}
          />
        </div>

        {/* Coupon Section */}
        <div className='mt-6'>
          {localDiscount === 0 ? (
            <div className='flex flex-col gap-2'>
              <input type='text' value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder='Enter coupon code' className='border p-2 rounded outline-none text-sm' />
              <button type='button' onClick={handleApplyCoupon} className='bg-black text-white px-4 py-2 rounded hover:bg-gray-800 text-sm'>
                Apply Coupon
              </button>
              {invalidCoupon && <p className='text-red-600 text-xs'>Invalid coupon code</p>}
            </div>
          ) : (
            <p className='text-green-600 text-sm'>Coupon "{coupon}" applied successfully!</p>
          )}
        </div>

        {/* Payment Method */}
        <div className='mt-12'>
          <Title text1={'PAYMENT'} text2={'METHOD'} />
          <div className='flex gap-3 flex-col lg:flex-row'>
            <div onClick={() => setMethod('googlepay')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'googlepay' ? 'bg-green-400' : ''}`}></p>
              <img className='h-5 mx-4' src={assets.googlepay_logo} alt="googlepay" />
            </div>
          </div>

          {!showQRCode ? (
            <div className='w-full text-center mt-8'>
              <button type='submit' className='bg-black text-white px-16 py-3 text-sm'>
                PLACE ORDER
              </button>
            </div>
          ) : (
            <div className='mt-8 text-center'>
              <QRCode value={upiString} size={200} />
              <p className='mt-2 text-sm text-gray-600'>Scan to pay ₹{finalAmount} to <b>Belacho</b></p>
              <button onClick={confirmPaymentAndSubmit} className='mt-5 bg-green-600 text-white px-4 py-2 rounded'>
                I HAVE PAID
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
