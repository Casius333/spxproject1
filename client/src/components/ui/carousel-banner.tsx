import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const bannerColors = [
  'bg-gradient-to-r from-orange-600 to-amber-400',
  'bg-gradient-to-r from-indigo-600 to-violet-500',
  'bg-gradient-to-r from-primary-dark to-primary-light',
  'bg-gradient-to-r from-rose-600 to-secondary',
];

const bannerContent = [
  {
    title: "Welcome Bonus",
    subtitle: "Get 100% bonus up to $500 on your first deposit",
    cta: "Claim Now"
  },
  {
    title: "Daily Jackpots",
    subtitle: "Win big with our progressive jackpot games",
    cta: "Play Now"
  },
  {
    title: "Free Spins",
    subtitle: "50 Free Spins on our most popular slots",
    cta: "Spin Now"
  },
  {
    title: "VIP Program",
    subtitle: "Exclusive rewards and bonuses for our loyal players",
    cta: "Join VIP"
  }
];

export function CarouselBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerColors.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerColors.length);
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerColors.length) % bannerColors.length);
  };
  
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };
  
  return (
    <div className="relative w-full h-52 md:h-64 lg:h-80 overflow-hidden">
      {/* Slides */}
      <div className="flex h-full transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
        {bannerColors.map((color, index) => (
          <div key={index} className={`flex-shrink-0 w-full h-full ${color}`}>
            <div className="container mx-auto px-4 h-full flex flex-col justify-center">
              <div className="max-w-2xl">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-2 animate-pulse-glow">
                  {bannerContent[index].title}
                </h2>
                <p className="text-lg md:text-xl text-white/90 mb-6">
                  {bannerContent[index].subtitle}
                </p>
                <button className="bg-white hover:bg-gray-100 text-primary font-bold py-2 px-6 rounded-full shadow-lg transition-all hover:scale-105 animate-neon-glow">
                  {bannerContent[index].cta}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Navigation arrows removed as requested */}
      
      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {bannerColors.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors duration-300 ${
              index === currentSlide ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}