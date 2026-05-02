import React, { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../../lib/firebase"; // Assuming firebase is configured in lib/firebase.ts
import Sidebar from "./Sidebar";
import MainContent from "./MainContent";
import AuthButton from "../auth/AuthButton"; // Assuming AuthButton is in ../auth/AuthButton.tsx

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D0E11]">
        <div className="text-[#E6E8EC]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] h-screen circuit-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="bg-[#1A1D23] border-b border-gray-800 p-4 flex justify-end">
          <AuthButton user={user} onAuthChange={setUser} />
        </div>
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
};

export default AppLayout;