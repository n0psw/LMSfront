import { useAuth } from '../contexts/AuthContext.tsx';
import { useEffect, useState } from 'react';
import { connectSocket } from '../services/socket';
import { Badge } from './ui/badge';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import StreakIcon from './StreakIcon';

interface TopbarProps {
  onOpenSidebar: () => void;
}

export default function Topbar({ onOpenSidebar }: TopbarProps) {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  
  const firstName = user?.name?.split(' ')[0] || 'User';
  
  useEffect(() => {
    if (!user) return;

    // Connect to socket and load unread count
    const socket = connectSocket();
    
    const loadUnreadCount = () => {
      if (socket.connected) {
        socket.emit('unread:count', (response: { unread_count: number }) => {
          setUnreadCount(response.unread_count || 0);
        });
      }
    };

    // Load initial count
    loadUnreadCount();

    // Listen for unread count updates
    const handleUnreadUpdate = () => {
      loadUnreadCount();
    };

    socket.on('unread:update', handleUnreadUpdate);
    
    return () => {
      socket.off('unread:update', handleUnreadUpdate);
    };
  }, [user]);
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur border-b px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 flex items-center justify-between">
      <div>
        <div className="text-sm sm:text-base text-gray-500">Welcome back</div>
        <div className="text-xl sm:text-2xl font-semibold text-gray-900">{firstName}!</div>
      </div>
      <div className="flex items-center gap-3">
        {/* Daily Streak */}
        <StreakIcon />
        <button className="lg:hidden w-10 h-10 rounded-lg bg-white border text-lg" onClick={onOpenSidebar} aria-label="Open menu">☰</button>
      </div>
    </div>
  );
}

