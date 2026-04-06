import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Route, 
  Lightbulb, 
  Wallet, 
  Settings as SettingsIcon,
  Menu,
  X,
  AlertCircle,
  LogOut,
  User,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { APP_NAME, APP_TAGLINE } from '../../config';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { toast } from 'sonner';

export const RootLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { conflicts } = useApp();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Travel Planner', href: '/travel', icon: Route },
    { name: 'Recommendations', href: '/recommendations', icon: Lightbulb },
    { name: 'Expenses', href: '/expenses', icon: Wallet },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const highPriorityConflicts = conflicts.filter(c => c.severity === 'high').length;

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 glass border-b z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <span className="font-heading font-bold text-lg tracking-tight">{APP_NAME}</span>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full p-0">
                <Avatar className="h-9 w-9 border-2 border-primary/10">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass rounded-2xl border-white/20 shadow-2xl">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold">My Account</p>
                  <p className="text-xs text-muted-foreground truncate font-medium">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive rounded-xl transition-all">
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-9 w-9 rounded-xl hover:bg-primary/5"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Sidebar - Desktop & Tablet */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 glass border-r border-white/20 z-40 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 flex flex-col`}
      >
        <div className="p-8 flex-1 overflow-y-auto hide-scrollbar">
          <div className="flex items-center gap-3 mb-10 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="p-2.5 bg-primary rounded-2xl shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-black text-2xl tracking-tighter leading-none">{APP_NAME}</h1>
            </div>
          </div>

          {highPriorityConflicts > 0 && (
            <div className="mb-6 p-4 bg-destructive/5 border border-destructive/10 rounded-2xl animate-pulse">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-destructive">
                    {highPriorityConflicts} Critical Alert{highPriorityConflicts > 1 ? 's' : ''}
                  </p>
                  <p className="text-[10px] text-destructive/70 font-semibold uppercase tracking-wider">
                    Immediate Action Required
                  </p>
                </div>
              </div>
            </div>
          )}

          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-300 group ${
                    active
                      ? 'bg-primary text-white shadow-lg shadow-primary/25'
                      : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-muted-foreground group-hover:text-primary'}`} />
                  <span className={`font-semibold tracking-tight ${active ? 'text-white' : 'text-inherit'}`}>{item.name}</span>
                  {item.name === 'Schedule' && highPriorityConflicts > 0 && (
                    <Badge variant="destructive" className="ml-auto rounded-lg px-1.5 py-0.5 text-[10px] font-black border-0">
                      {highPriorityConflicts}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Section - Desktop */}
        <div className="hidden lg:block p-6 mt-auto border-t border-white/10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-primary/5 transition-all outline-none border border-transparent hover:border-primary/10">
                <Avatar className="h-10 w-10 border-2 border-primary/10 shadow-sm">
                  <AvatarFallback className="bg-primary text-white font-bold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-sm font-bold text-foreground truncate tracking-tight">
                    {user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest truncate">
                    Premium Plan
                  </p>
                </div>
                <SettingsIcon className="h-4 w-4 text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 glass border-white/20 rounded-[1.5rem] shadow-3xl p-2 mb-2">
              <DropdownMenuLabel className="px-3 py-2">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">User Controls</p>
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-xl py-3 px-4 focus:bg-primary/5 cursor-pointer">
                <SettingsIcon className="h-4 w-4 mr-3 text-primary" />
                <span className="font-semibold text-sm">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10 my-1" />
              <DropdownMenuItem onClick={handleLogout} className="rounded-xl py-3 px-4 focus:bg-destructive/10 text-destructive cursor-pointer">
                <LogOut className="h-4 w-4 mr-3" />
                <span className="font-semibold text-sm">Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-72 pt-20 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};