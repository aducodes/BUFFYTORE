import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App.jsx'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets/assets.js'

const statusColors = {
  'Order Placed': 'bg-blue-100 text-blue-700',
  'Packing': 'bg-yellow-100 text-yellow-700',
  'Shipped': 'bg-orange-100 text-orange-700',
  'Out for delivery': 'bg-purple-100 text-purple-700',
  'Delivered': 'bg-green-100 text-green-700',
};

const courierLabels = {
  india_post: 'India Post',
  dtdc: 'DTDC',
  speed: 'Speed',
  safe: 'Safe',
};

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('all') // 'all' | 'regular' | 'combo'

  const fetchAllOrders = async () => {
    if (!token) return null;
    try {
      const response = await axios.post(backendUrl + '/api/order/list', {}, { headers: { token } })
      if (response.data.success) {
        setOrders(response.data.orders)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(
        backendUrl + '/api/order/status',
        { orderId, status: event.target.value },
        { headers: { token } }
      )
      if (response.data.success) await fetchAllOrders()
    } catch (error) {
      console.log(error);
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchAllOrders();
  }, [token])

  const filteredOrders = orders.filter(o => {
    if (filter === 'combo') return o.orderType === 'combo';
    if (filter === 'regular') return !o.orderType || o.orderType === 'regular';
    return true;
  });

  return (
    <div className='p-4'>
      <div className='flex items-center justify-between mb-6'>
        <h3 className='text-2xl font-bold text-gray-800'>All Orders</h3>
        <div className='flex gap-2'>
          {['all', 'regular', 'combo'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition ${
                filter === f
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? `All (${orders.length})` :
               f === 'combo' ? `Combo (${orders.filter(o => o.orderType === 'combo').length})` :
               `Regular (${orders.filter(o => !o.orderType || o.orderType === 'regular').length})`}
            </button>
          ))}
        </div>
      </div>

      <div className='flex flex-col gap-4'>
        {filteredOrders.length === 0 ? (
          <div className='text-center py-20 text-gray-400'>No orders found</div>
        ) : (
          filteredOrders.map((order, index) => (
            <div
              key={index}
              className='grid grid-cols-1 sm:grid-cols-[auto_2fr_1fr_1fr_1fr] gap-4 items-start border border-gray-200 rounded-xl p-5 bg-white shadow-sm'
            >
              {/* Icon */}
              <div className='flex flex-col items-center gap-2'>
                <img className='w-10 h-10' src={assets.parcel_icon} alt="" />
                {order.orderType === 'combo' && (
                  <span className='bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full'>COMBO</span>
                )}
              </div>

              {/* Items & Address */}
              <div>
                <div className='mb-2'>
                  {order.orderType === 'combo' && order.comboDetails && (
                    <p className='text-purple-700 font-semibold text-sm mb-1'>
                     {order.comboDetails.label} — {order.comboDetails.discount}% off
                    </p>
                  )}
                  {order.items.map((item, i) => (
                    <p className='py-0.5 text-sm text-gray-700' key={i}>
                      {item.name} × {item.quantity}
                      <span className='ml-1 bg-gray-100 px-1.5 py-0.5 rounded text-xs'>{item.size}</span>
                      {i < order.items.length - 1 ? ',' : ''}
                    </p>
                  ))}
                </div>
                <div className='text-xs text-gray-500 mt-2 space-y-0.5'>
                  <p className='font-medium text-gray-700 text-sm'>{order.address.firstName} {order.address.lastName}</p>
                  <p>{order.address.street}</p>
                  <p>{order.address.city}, {order.address.state} — {order.address.pincode}</p>
                  <p className='font-medium'>{order.address.phone}</p>
                  {order.courier && (
                    <p className='mt-1'>
                      <span className='inline-block bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide'>
                        🚚 {courierLabels[order.courier] || order.courier}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Order Info */}
              <div className='text-sm text-gray-600 space-y-1'>
                <p><span className='font-medium text-gray-800'>Items:</span> {order.items.length}</p>
                <p>
                  <span className='font-medium text-gray-800'>Payment:</span>{' '}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    order.payment ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {order.payment ? 'Paid ✓' : 'Pending'}
                  </span>
                </p>
                <p><span className='font-medium text-gray-800'>Method:</span> {order.paymentMethod}</p>
                <p><span className='font-medium text-gray-800'>Date:</span> {new Date(order.date).toLocaleDateString()}</p>
              </div>

              {/* Amount */}
              <p className='text-lg font-bold text-gray-800'>{currency}{order.amount}</p>

              {/* Status */}
              <select
                onChange={(e) => statusHandler(e, order._id)}
                value={order.status}
                className='p-2 rounded-lg border border-gray-200 text-sm font-medium cursor-pointer bg-white focus:outline-none focus:ring-2 focus:ring-green-400'
              >
                <option value="Order Placed">Order Placed</option>
                <option value="Packing">Packing</option>
                <option value="Shipped">Shipped</option>
                <option value="Out for delivery">Out for delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Orders