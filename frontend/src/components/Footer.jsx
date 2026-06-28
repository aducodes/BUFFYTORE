import React from 'react'
import { assets } from '../assets/assets/assets'

const Footer = () => {
  return (
    <div>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>

        <div>
            <img src={assets.logo} className='mb-5 w-32' alt="" />
            <p className='w-full md:w-2/3 text-green-100'>
            Buffy Tore is a fashion and lifestyle store offering trendy clothing and carefully curated accessories. The brand focuses on stylish, affordable pieces that blend everyday comfort with modern aesthetics.
            </p>
        </div>

        <div>
            <p className='text-xl font-medium mb-5 text-green-600'>COMPANY</p>
            <ul className='flex flex-col gap-1 text-white'>
                <li><a href="/">Home</a></li>
                <li><a href="/about">About us</a></li>
                <li><a href="/delivery">Delivery</a></li>
                <li><a href="/privacy-policy">Privacy policy</a></li>
            </ul>
        </div>

        <div>
            <p className='text-xl font-medium mb-5 text-green-600'>GET IN TOUCH</p>
            <ul className='flex flex-col gap-1 text-white'>
                <li>+91 7592097220</li>
                <li>cybersalu@gmail.com</li>
            </ul>
        </div>


      </div>

      <div>
        <hr className='border-white' />
        <p className='py-5 text-sm text-center text-white'>Copyright 2026@ <a href="https://buffytore.in/">buffytore.in</a> - All Right Reserved, Crafted by Adnan from Webzlore.</p>
      </div>

    </div>
  )
}

export default Footer
