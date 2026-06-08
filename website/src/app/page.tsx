import Header from '../components/navigation/Header'
import Hero from '../components/sections/Hero'
import TechStrip from '../components/sections/TechStrip'
import BentoFeatures from '../components/sections/BentoFeatures'
import Comparison from '../components/sections/Comparison'
import HowItWorks from '../components/sections/HowItWorks'
import AppShowcase from '../components/sections/AppShowcase'
import Testimonials from '../components/sections/Testimonials'
import PricingTier from '../components/sections/PricingTier'
import FeedbackSection from '../components/sections/FeedbackSection'
import DownloadCTA from '../components/sections/DownloadCTA'
import Footer from '../components/sections/Footer'
import { getLatestRelease } from '../lib/githubRelease'

export default async function Home() {
  const latestRelease = await getLatestRelease()

  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <TechStrip />
        <BentoFeatures />
        <Comparison />
        <HowItWorks />
        <AppShowcase />
        <Testimonials />
        <PricingTier />
        <FeedbackSection />
        <DownloadCTA release={latestRelease} />
      </main>
      <Footer />
    </>
  )
}
