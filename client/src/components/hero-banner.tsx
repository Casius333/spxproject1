import { Link } from 'wouter';
import { Dice5, Coins } from 'lucide-react';

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-primary-dark to-primary py-10 md:py-16">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-heading font-extrabold text-3xl md:text-5xl mb-4">
            Experience the Thrill of <span className="text-secondary">Online Slots</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Hundreds of exciting games with massive jackpots and incredible bonuses
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/game/featured">
              <button className="bg-secondary hover:bg-secondary-light transition-colors px-6 py-3 rounded-lg font-heading font-bold text-gray-900 w-full sm:w-auto">
                Play Now
              </button>
            </Link>
            <Link href="/#games">
              <button className="border-2 border-gray-400 hover:border-white transition-colors px-6 py-3 rounded-lg font-heading font-bold w-full sm:w-auto">
                Explore Games
              </button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Visual elements */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-20">
        <div className="absolute w-full h-full bg-secondary rounded-full blur-3xl"></div>
      </div>
      <div className="absolute bottom-0 left-0 w-48 h-48 opacity-20">
        <div className="absolute w-full h-full bg-accent rounded-full blur-3xl"></div>
      </div>
      
      {/* Floating casino elements */}
      <div className="hidden md:block absolute -right-16 top-10 opacity-20 rotate-12">
        <Dice5 className="text-white" size={120} />
      </div>
      <div className="hidden md:block absolute -left-8 bottom-5 opacity-20 -rotate-12">
        <Coins className="text-secondary" size={80} />
      </div>
    </section>
  );
}
