// CartTotal.jsx
import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from './Title';

const CartTotal = ({
  overrideDiscount = null,
  overrideCoupon = null,
  isCouponApplied = false,
}) => {
  const {
    currency,
    delivery_fee = 0,
    getCartAmount,
  } = useContext(ShopContext);

  const subtotal = getCartAmount?.() || 0;

  const discount = isCouponApplied && overrideDiscount ? overrideDiscount : 0;
  const discountAmount = (subtotal * discount) / 100;
  const totalAfterDiscount = subtotal - discountAmount;
  const total = subtotal === 0 ? 0 : totalAfterDiscount + delivery_fee;

  return (
    <div className='w-full'>
      <div className='text-2xl'>
        <Title text1='CART' text2='TOTALS' />
      </div>

      <div className='flex flex-col gap-2 mt-4 text-sm'>
        <div className='flex justify-between text-white'>
          <p>Subtotal</p>
          <p>{currency} {subtotal.toFixed(2)}</p>
        </div>

        {isCouponApplied && discountAmount > 0 && (
          <div className='flex justify-between text-green-700'>
            <p>Coupon Discount</p>
            <p>-{currency} {discountAmount.toFixed(2)}</p>
          </div>
        )}

        <hr />

        <div className='flex justify-between text-white'>
          <p>Shipping Fee</p>
          <p>{currency} {subtotal === 0 ? '0.00' : delivery_fee.toFixed(2)}</p>
        </div>

        <hr />

        <div className='flex justify-between text-white font-semibold'>
          <b>Total</b>
          <b>{currency} {total.toFixed(2)}</b>
        </div>
      </div>
    </div>
  );
};

export default CartTotal;
