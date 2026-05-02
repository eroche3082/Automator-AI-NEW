
import React from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Button } from '../ui/button';
import { LogIn, LogOut } from 'lucide-react';

interface AuthButtonProps {
  user: User | null;
  onAuthChange: (user: User | null) => void;
}

const AuthButton: React.FC<AuthButtonProps> = ({ user, onAuthChange }) => {
  const handleSignIn = async () => {
    if (!auth) { console.warn('Firebase auth not configured'); return; }
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      onAuthChange(result.user);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      onAuthChange(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (user) {
    return (
      <div className="flex items-center space-x-3">
        <span className="text-sm text-[#E6E8EC]">
          Welcome, {user.displayName || user.email}
        </span>
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          className="bg-gray-800 border-gray-700 hover:bg-gray-700"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleSignIn}
      variant="default"
      size="sm"
      className="bg-blue-600 hover:bg-blue-700"
    >
      <LogIn className="w-4 h-4 mr-2" />
      Sign In with Google
    </Button>
  );
};

export default AuthButton;
