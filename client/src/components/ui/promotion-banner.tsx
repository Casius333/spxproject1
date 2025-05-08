import { Button } from "@/components/ui/button";

interface PromotionBannerProps {
  title: string;
  description: string;
  actionText: string;
  onClick?: () => void;
}

export function PromotionBanner({ 
  title = "Deposit Bonus", 
  description = "Get 100% bonus on your next deposit!", 
  actionText = "View Promotions",
  onClick 
}: PromotionBannerProps) {
  return (
    <div className="w-full bg-indigo-900/90 rounded-lg shadow-lg overflow-hidden mb-6">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-4">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-heading font-bold text-white">{title}</h3>
            <p className="text-white/80 text-sm md:text-base">{description}</p>
          </div>
        </div>
        <Button 
          onClick={onClick} 
          variant="secondary" 
          className="bg-white hover:bg-white/90 text-indigo-800 font-medium whitespace-nowrap"
        >
          {actionText}
        </Button>
      </div>
    </div>
  );
}