import React from 'react'
import Hero from '../components/Hero'
import LatestCollection from '../components/LatestCollection'
import BestSeller from '../components/BestSeller'
import OurPolicy from '../components/OurPolicy'
import NewsletterBox from '../components/NewsletterBox'
import ComboOffers from '../pages/ComboOffers'   // ← new

const Home = () => {
  return (
    <div>
      <Hero />
      <LatestCollection />
      <BestSeller />
      <ComboOffers />   {/* ← combo strip sits here, between BestSeller and Policy */}
      <OurPolicy />
      <NewsletterBox />
    </div>
  )
}

export default Home