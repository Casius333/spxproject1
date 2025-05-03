import { Link } from 'wouter';

export function CallToAction() {
  return (
    <section className="bg-gradient-to-r from-primary to-primary-dark py-12">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">Ready to Start Winning?</h2>
        <p className="text-gray-300 text-lg mb-6 max-w-2xl mx-auto">
          Join thousands of players enjoying the best online slots experience. Sign up today and claim your welcome bonus!
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/signup">
            <button className="bg-secondary hover:bg-secondary-light transition-colors text-gray-900 font-heading font-bold py-3 px-8 rounded-lg w-full sm:w-auto">
              Sign Up Now
            </button>
          </Link>
          <Link href="/about">
            <button className="bg-dark hover:bg-dark-light transition-colors font-heading font-bold py-3 px-8 rounded-lg w-full sm:w-auto">
              Learn More
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
