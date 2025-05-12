import { createContext, useContext, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { ProfileDialog } from "@/components/profile-dialog";

interface ProfileDialogContextType {
  isProfileOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
  navigateToTransactionHistory: () => void;
}

const ProfileDialogContext = createContext<ProfileDialogContextType>({
  isProfileOpen: false,
  openProfile: () => {},
  closeProfile: () => {},
  navigateToTransactionHistory: () => {},
});

export const useProfileDialog = () => useContext(ProfileDialogContext);

export function ProfileDialogProvider({ children }: { children: ReactNode }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [, navigate] = useLocation();

  const openProfile = () => setIsProfileOpen(true);
  const closeProfile = () => setIsProfileOpen(false);
  
  const navigateToTransactionHistory = () => {
    navigate('/transaction-history');
    closeProfile();
  };

  return (
    <ProfileDialogContext.Provider value={{ 
      isProfileOpen, 
      openProfile, 
      closeProfile, 
      navigateToTransactionHistory 
    }}>
      {children}
      <ProfileDialog 
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />
    </ProfileDialogContext.Provider>
  );
}