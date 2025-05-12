import { createContext, useContext, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { ProfileDialog } from "@/components/profile-dialog";
import { LoyaltyDialog } from "@/components/loyalty-dialog";

interface ProfileDialogContextType {
  isProfileOpen: boolean;
  isLoyaltyOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
  openLoyalty: () => void;
  closeLoyalty: () => void;
  navigateToTransactionHistory: () => void;
}

const ProfileDialogContext = createContext<ProfileDialogContextType>({
  isProfileOpen: false,
  isLoyaltyOpen: false,
  openProfile: () => {},
  closeProfile: () => {},
  openLoyalty: () => {},
  closeLoyalty: () => {},
  navigateToTransactionHistory: () => {},
});

export const useProfileDialog = () => useContext(ProfileDialogContext);

export function ProfileDialogProvider({ children }: { children: ReactNode }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false);
  const [, navigate] = useLocation();

  const openProfile = () => {
    setIsLoyaltyOpen(false);
    setIsProfileOpen(true);
  };
  
  const closeProfile = () => setIsProfileOpen(false);
  
  const openLoyalty = () => {
    setIsProfileOpen(false);
    setIsLoyaltyOpen(true);
  };
  
  const closeLoyalty = () => setIsLoyaltyOpen(false);
  
  const navigateToTransactionHistory = () => {
    navigate('/transaction-history');
    closeProfile();
  };

  return (
    <ProfileDialogContext.Provider value={{ 
      isProfileOpen, 
      isLoyaltyOpen,
      openProfile, 
      closeProfile,
      openLoyalty,
      closeLoyalty,
      navigateToTransactionHistory 
    }}>
      {children}
      <ProfileDialog 
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />
      <LoyaltyDialog
        open={isLoyaltyOpen}
        onOpenChange={setIsLoyaltyOpen}
      />
    </ProfileDialogContext.Provider>
  );
}