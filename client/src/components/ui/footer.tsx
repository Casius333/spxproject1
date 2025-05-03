import { Link } from 'wouter';
import { Dice5, Facebook, Twitter, Instagram, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-dark-light border-t border-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Dice5 className="text-secondary text-2xl mr-2" />
              <span className="font-heading font-bold text-xl bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                SpinVerse
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              The ultimate destination for online slots. Play the best games from top providers and win big!
            </p>
            <div className="flex space-x-3">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Games</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/" className="hover:text-white transition-colors">All Slots</Link></li>
              <li><Link href="/jackpots" className="hover:text-white transition-colors">Jackpot Games</Link></li>
              <li><Link href="/new-games" className="hover:text-white transition-colors">New Games</Link></li>
              <li><Link href="/popular" className="hover:text-white transition-colors">Popular Games</Link></li>
              <li><Link href="/providers" className="hover:text-white transition-colors">Game Providers</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/responsible-gaming" className="hover:text-white transition-colors">Responsible Gaming</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Payment Methods</h3>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-dark-card p-2 rounded flex items-center justify-center">
                  <div className="w-8 h-8 bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-sm text-gray-500 text-center">
          <p>© {new Date().getFullYear()} SpinVerse Casino. All rights reserved.</p>
          <p className="mt-2">
            SpinVerse is operated by Gaming Technologies LLC. Licensed and regulated by the Gaming Authority.
          </p>
          <div className="mt-4 flex justify-center space-x-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-6 w-12 bg-gray-800 rounded" />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
