import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import axios from 'axios';

const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [orderData, setOrderData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrderData = async () => {
    try {
      if (!token) return;
      setLoading(true);
      const response = await axios.post(
        backendUrl + '/api/order/userorders',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        const all = [];
        response.data.orders.forEach((order) => {
          // Handle combo orders differently
          if (order.orderType === 'combo' && order.comboDetails) {
            all.push({
              isCombo: true,
              comboLabel: order.comboDetails.label || 'Combo Order',
              items: order.items,
              status: order.status,
              payment: order.payment,
              paymentMethod: order.paymentMethod,
              date: order.date,
              amount: order.amount,
              orderId: order._id,
            });
          } else {
            order.items.forEach((item) => {
              all.push({
                ...item,
                status: order.status,
                payment: order.payment,
                paymentMethod: order.paymentMethod,
                date: order.date,
                isCombo: false,
              });
            });
          }
        });
        setOrderData(all.reverse());
      }
    } catch (error) {
      console.error('Orders load error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderData();
  }, [token]);

  const statusColor = (status) => {
    const map = {
      'Order Placed': 'bg-blue-500',
      'Packing': 'bg-yellow-500',
      'Shipped': 'bg-orange-500',
      'Out for delivery': 'bg-purple-500',
      'Delivered': 'bg-green-500',
    };
    return map[status] || 'bg-gray-400';
  };

  return (
    <div className='border-t pt-16 min-h-[70vh]'>
      <div className='text-2xl mb-6'>
        <Title text1={'MY'} text2={'ORDERS'} />
      </div>

      {loading ? (
        <div className='text-center text-white py-20 text-lg'>Loading orders...</div>
      ) : orderData.length === 0 ? (
        <div className='text-center text-gray-400 py-20'>
          <p className='text-xl'>No orders yet</p>
          <p className='text-sm mt-2'>Start shopping to see your orders here</p>
        </div>
      ) : (
        <div className='flex flex-col gap-4'>
          {orderData.map((item, index) => (
            <div
              key={index}
              className='border border-green-800 rounded-lg p-4 md:p-5 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-green-950 bg-opacity-30'
            >
              {item.isCombo ? (
                /* Combo Order Card */
                <div className='flex items-start gap-4 flex-1'>
                  <div className='w-16 h-16 sm:w-20 sm:h-20 bg-green-800 rounded-lg flex items-center justify-center flex-shrink-0'>
                    <span className='text-2xl'>🎽</span>
                  </div>
                  <div className='flex-1'>
                    <p className='font-semibold text-green-300 text-sm mb-1'>COMBO ORDER</p>
                    <p className='font-bold text-base'>{item.comboLabel}</p>
                    <div className='text-sm text-gray-300 mt-1'>
                      {item.items.map((i, idx) => (
                        <span key={idx}>{i.name} (Size: {i.size}){idx < item.items.length - 1 ? ' + ' : ''}</span>
                      ))}
                    </div>
                    <div className='flex flex-wrap gap-4 mt-2 text-sm text-gray-300'>
                      <p>Total: <span className='text-white font-medium'>{currency}{item.amount}</span></p>
                      <p>Date: <span className='text-gray-400'>{new Date(item.date).toDateString()}</span></p>
                      <p>Payment: <span className='text-green-400'>Razorpay ✓</span></p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Regular Order Card */
                <div className='flex items-start gap-4 flex-1'>
                  <img className='w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0'
                    src={item.image?.[0]} alt={item.name} />
                  <div className='flex-1'>
                    <p className='font-semibold text-base'>{item.name}</p>
                    <div className='flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-300'>
                      <p className='text-white font-medium'>{currency}{item.price}</p>
                      <p>Qty: {item.quantity}</p>
                      <p>Size: <span className='bg-green-800 px-2 py-0.5 rounded text-xs'>{item.size}</span></p>
                    </div>
                    <div className='flex flex-wrap gap-4 mt-2 text-sm text-gray-300'>
                      <p>Date: <span className='text-gray-400'>{new Date(item.date).toDateString()}</span></p>
                      <p>Payment: <span className='text-green-400'>
                        {item.payment ? `Razorpay ✓` : 'Pending'}
                      </span></p>
                    </div>
                  </div>
                </div>
              )}

              <div className='flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 md:min-w-[160px]'>
                <div className='flex items-center gap-2'>
                  <span className={`w-2.5 h-2.5 rounded-full ${statusColor(item.status)}`}></span>
                  <span className='text-sm font-medium'>{item.status}</span>
                </div>
                <button
                  onClick={loadOrderData}
                  className='border border-green-600 text-green-400 px-4 py-1.5 text-xs rounded hover:bg-green-800 transition'
                >
                  Track Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
