import { Promotion } from "@shared/schema";

/**
 * Checks if a promotion is available on the current day (based on the promotion's timezone)
 * @param promotion The promotion to check
 * @returns boolean indicating if the promotion is available today
 */
export function isPromotionAvailableToday(promotion: Promotion): boolean {
  // If promotion is not active, it's not available
  if (!promotion.active) {
    return false;
  }

  // Get current date in the promotion's timezone
  const today = new Date();
  
  try {
    const options = { timeZone: promotion.timezone };
    const timeString = today.toLocaleString('en-US', options);
    const localDate = new Date(timeString);
    
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = localDate.getDay();
    
    // Check if the current day is in the daysOfWeek array
    return Array.isArray(promotion.daysOfWeek) && promotion.daysOfWeek.includes(dayOfWeek);
  } catch (error) {
    // If there's an error with the timezone, fall back to default behavior
    console.error(`Error checking promotion availability: ${error}`);
    return true;
  }
}

/**
 * Checks if a user has exceeded the daily usage limit for a promotion
 * @param promotion The promotion to check
 * @param userId The user ID
 * @returns boolean indicating if the user can use the promotion today
 */
export async function canUserUsePromotion(promotion: Promotion, userId: number): Promise<boolean> {
  // First check if the promotion is available today
  if (!isPromotionAvailableToday(promotion)) {
    return false;
  }
  
  // Check if user has reached the daily usage limit
  // This is a placeholder for actual implementation
  // In a real implementation, you would check against a database of promotion usage records
  
  // For now, we'll simulate the check by always returning true
  // In a production environment, you would:
  // 1. Get today's date in the promotion's timezone
  // 2. Query the database for count of times this user used this promotion today
  // 3. Compare that count to the promotion's maxUsagePerDay limit
  
  // Simulation of usage check
  const currentUsageCount = 0; // Placeholder - would come from database
  const maxUsage = promotion.maxUsagePerDay || 1; // Default to 1 if not specified
  
  return currentUsageCount < maxUsage;
}

/**
 * Gets a formatted display of days when a promotion is available
 * @param daysOfWeek Array of days (0-6) when promotion is available
 * @returns String representation of days (e.g., "Monday, Wednesday, Friday")
 */
export function getAvailableDaysDisplay(daysOfWeek: number[]): string {
  if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
    return "No days selected";
  }
  
  // If all days are selected
  if (daysOfWeek.length === 7 && 
      daysOfWeek.includes(0) && 
      daysOfWeek.includes(1) && 
      daysOfWeek.includes(2) && 
      daysOfWeek.includes(3) && 
      daysOfWeek.includes(4) && 
      daysOfWeek.includes(5) && 
      daysOfWeek.includes(6)) {
    return "Every day";
  }
  
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const selectedDays = daysOfWeek.map(day => dayNames[day]);
  
  return selectedDays.join(", ");
}