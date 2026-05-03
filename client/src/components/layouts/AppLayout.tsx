import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "./Sidebar";
import MainContent from "./MainContent";
import type { User as DbUser } from "@shared/schema";

interface AppLayoutProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = ["/login", "/pricing", "/thank-you", "/cancelled"];

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [location, setLocation] = useLocation();

  const { data: profile, isLoading, isError } = useQuery<DbUser>({
    queryKey: ["/api/me"],
    retry: false,
  });

  const isPublic = PUBLIC_ROUTES.some((p) => location === p || location.startsWith(p + "/"));

  useEffect(() => {
    if (isLoading) return;
    if (!profile && !isPublic) {
      setLocation("/login");
    }
  }, [profile, isLoading, isPublic, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D0E11]">
        <div className="text-[#E6E8EC]">Loading...</div>
      </div>
    );
  }

  // Public routes (login/register/pricing) render full-bleed without sidebar.
  if (isPublic) {
    return <>{children}</>;
  }

  // If unauthenticated, the effect above will redirect; render nothing meanwhile.
  if (!profile || isError) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D0E11]">
        <div className="text-[#E6E8EC]">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] h-screen circuit-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
};

export default AppLayout;
