import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import AuthModalDirect from '@/components/auth-modal-direct';

// Auth modal context
interface AuthModalContextType {
  openAuthModal: (defaultTab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
}

export const AuthModalContext = createContext<AuthModalContextType>({
  openAuthModal: () => {},
  closeAuthModal: () => {},
  isAuthModalOpen: false,
});

export const useAuthModal = () => useContext(AuthModalContext);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  // Debug log for auth modal state changes
  useEffect(() => {
    console.log("Auth modal state changed:", isAuthModalOpen);
  }, [isAuthModalOpen]);

  const openAuthModal = (defaultTab: 'login' | 'register' = 'login') => {
    console.log("openAuthModal called with tab:", defaultTab);
    setAuthModalTab(defaultTab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    console.log("closeAuthModal called");
    setIsAuthModalOpen(false);
  };

  return (
    <AuthModalContext.Provider 
      value={{ 
        openAuthModal, 
        closeAuthModal, 
        isAuthModalOpen 
      }}
    >
      {children}
      <AuthModalDirect 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal} 
        defaultTab={authModalTab} 
      />
    </AuthModalContext.Provider>
  );
}