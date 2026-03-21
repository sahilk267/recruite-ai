import { Search, Bell, Sun, Menu, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  title: string;
  onMenuToggle: () => void;
}

export function Header({ title, onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifications] = useState([
    { id: 1, title: 'New lead captured', message: 'React Developer from Bangalore', time: '2 min ago', unread: true },
    { id: 2, title: 'Deal closed', message: 'TCS - ₹45,000 revenue', time: '15 min ago', unread: true },
    { id: 3, title: 'Payment received', message: 'Infosys - ₹32,000', time: '1 hour ago', unread: false },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  // Get user initials
  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <header className="h-16 bg-[#1a1a1a]/80 backdrop-blur-md border-b border-white/6 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left: Title & Breadcrumb */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onMenuToggle}
          className="lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-xs text-zinc-500 hidden sm:block">AI Recruitment SaaS + Sales Automation</p>
        </div>
      </div>

      {/* Center: Search */}
      <div className={`flex-1 max-w-md mx-8 transition-all duration-300 ${searchFocused ? 'max-w-lg' : ''}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search jobs, leads, recruiters..."
            className="pl-10 bg-black/50 border-white/10 focus:border-violet-500/50 transition-all"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
          <Sun className="w-5 h-5" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-zinc-400 hover:text-white">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-violet-600 rounded-full text-xs flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-[#1a1a1a] border-white/10">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <Badge variant="secondary" className="bg-violet-600/20 text-violet-400">
                {unreadCount} new
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            {notifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id} 
                className="flex flex-col items-start py-3 px-4 cursor-pointer hover:bg-white/5"
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-medium text-sm">{notification.title}</span>
                  {notification.unread && (
                    <span className="w-2 h-2 bg-violet-500 rounded-full" />
                  )}
                </div>
                <span className="text-xs text-zinc-400">{notification.message}</span>
                <span className="text-xs text-zinc-500 mt-1">{notification.time}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full gradient-primary">
              <span className="font-semibold text-sm">{getUserInitials()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] border-white/10">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-semibold">{user?.name || 'User'}</span>
                <span className="text-xs text-zinc-400">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="cursor-pointer hover:bg-white/5">Profile</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-white/5">Settings</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-white/5">API Keys</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem 
              onClick={logout}
              className="cursor-pointer hover:bg-white/5 text-red-400 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
