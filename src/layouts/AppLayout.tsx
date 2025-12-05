import { useState, useEffect } from 'react';
import { SidebarDesktop, SidebarMobile } from '../components/Sidebar.tsx';
import Topbar from '../components/Topbar.tsx';
import ToastContainer from '../components/Toast.tsx';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('mainSidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('mainSidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);
  return (
    <div className="flex">
      <SidebarDesktop isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <main className={`flex-1 bg-gray-50 min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'} overflow-x-hidden transition-all duration-300`}>
        <Topbar onOpenSidebar={() => setMobileOpen(true)} />
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
        <ToastContainer />
      </main>
      <SidebarMobile open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </div>
  );
}
