import { createContext, useContext, useState, ReactNode } from "react";
import { ProfileDialog } from "@/components/profile-dialog";

interface ProfileDialogContextType {
  isProfileOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
}

const ProfileDialogContext = createContext<ProfileDialogContextType>({
  isProfileOpen: false,
  openProfile: () => {},
  closeProfile: () => {},
});

export const useProfileDialog = () => useContext(ProfileDialogContext);

export function ProfileDialogProvider({ children }: { children: ReactNode }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const openProfile = () => setIsProfileOpen(true);
  const closeProfile = () => setIsProfileOpen(false);

  return (
    <ProfileDialogContext.Provider value={{ isProfileOpen, openProfile, closeProfile }}>
      {children}
      <ProfileDialog 
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />
    </ProfileDialogContext.Provider>
  );
}