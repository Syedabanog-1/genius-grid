'use client'

import { useState, createElement } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Trophy, Gem, ChevronRight } from 'lucide-react'

const slides = [
  {
    id: 1,
    title: 'Agent Factory Ready',
    description: 'Practice with real exam questions from the GIAIC Agent Factory and AI-Native Development curriculum.',
    icon: Brain,
    color: 'bg-violet-100 text-violet-600',
  },
  {
    id: 2,
    title: 'Compete with Peers',
    description: 'Climb the leaderboard alongside fellow GIAIC students and prove your knowledge.',
    icon: Trophy,
    color: 'bg-pink-100 text-pink-600',
  },
  {
    id: 3,
    title: 'Track Your Progress',
    description: 'Earn points for every correct answer and measure how well you understand AI-Native development.',
    icon: Gem,
    color: 'bg-blue-100 text-blue-600',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = () => {
    if (currentSlide === slides.length - 1) {
      router.push('/login')
    } else {
      setCurrentSlide((prev) => prev + 1)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-appbg px-8 py-12 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-16 left-8 text-primary/10 rotate-12 pointer-events-none select-none">
        <span className="text-6xl font-bold">?</span>
      </div>
      <div className="absolute top-32 right-10 text-primary/10 -rotate-12 pointer-events-none select-none">
        <span className="text-7xl font-bold">?</span>
      </div>

      {/* Skip — absolute so it doesn't disturb vertical centering */}
      <button
        onClick={() => router.push('/login')}
        className="absolute top-6 right-6 text-slate-500 font-medium text-sm hover:text-primary transition-colors z-10"
      >
        Skip
      </button>

      {/* Centered content block */}
      <div className="w-full max-w-sm z-10 flex flex-col items-center">
        {/* Slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center mb-12"
          >
            <div
              className={`w-36 h-36 rounded-full ${slides[currentSlide].color} flex items-center justify-center mb-10 shadow-lg`}
            >
              {createElement(slides[currentSlide].icon, { className: 'w-16 h-16' })}
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-3">
              {slides[currentSlide].title}
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed">
              {slides[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="flex space-x-2 mb-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'w-8 bg-primary' : 'w-2.5 bg-primary/20'
              }`}
            />
          ))}
        </div>

        {/* Button */}
        <button
          onClick={nextSlide}
          className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-lg flex items-center justify-center shadow-soft hover:bg-primaryHover transition-colors active:scale-[0.98]"
        >
          {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          {currentSlide !== slides.length - 1 && <ChevronRight className="w-5 h-5 ml-2" />}
        </button>
      </div>
    </div>
  )
}
