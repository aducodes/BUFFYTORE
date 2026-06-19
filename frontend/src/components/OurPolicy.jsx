import React from 'react'
import { assets } from '../assets/assets/assets'

const OurPolicy = () => {
  return (
    <div className='flex flex-col sm:flex-row justify-around gap-12 sm:gap-2 text-center py-20 text-xs sm:text-sm md:text-base text-white'>
      
      <div>
        <img src={assets.exchange_icon} className='w-12 m-auto mb-5' alt="" />
        <p className='font-semibold text-green-600'>No Refund Policy</p>
        <p className='text-white'>We don't currently have a refund policy</p>
      </div>
      <div>
        <img src={assets.quality_icon} className='w-12 m-auto mb-5' alt="" />
        <p className='font-semibold text-green-600'>No Return policy</p>
        <p className='text-white'>We don't currently have a return policy</p>
      </div>
      <div>
        <img src={assets.support_img} className='w-12 m-auto mb-5' alt="" />
        <p className='font-semibold text-green-600'>Best customer support</p>
        <p className='text-white'>We provide 24/7 customer support</p>
      </div>

    </div>
  )
}

export default OurPolicy
