import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  ShoppingCart, 
  Truck, 
  BarChart3, 
  Settings as SettingsIcon,
  Menu,
  X,
  Bell,
  User,
  Shield,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users
} from 'lucide-react';
import { UserRole } from '../types';
import skyLogo from './Sky.jpeg';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, setCurrentUserRole, products, logout, authenticatedRole } = useApp();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [bstTime, setBstTime] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const cached = localStorage.getItem('sky_v2_sidebar_collapsed');
      return cached === 'true';
    } catch {
      return false;
    }
  });
  const location = useLocation();

  // Tick the clock in Bangladesh Standard Time (BST) / Asia/Dhaka
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Dhaka',
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        
        const parts = formatter.formatToParts(now);
        const weekday = parts.find(p => p.type === 'weekday')?.value || '';
        const day = parts.find(p => p.type === 'day')?.value || '';
        const month = parts.find(p => p.type === 'month')?.value || '';
        const year = parts.find(p => p.type === 'year')?.value || '';
        const hour = parts.find(p => p.type === 'hour')?.value || '';
        const minute = parts.find(p => p.type === 'minute')?.value || '';
        const second = parts.find(p => p.type === 'second')?.value || '';
        const dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value || '';

        setBstTime(`${weekday}, ${day} ${month} ${year} • ${hour}:${minute}:${second} ${dayPeriod}`);
      } catch (e) {
        setBstTime(now.toLocaleTimeString());
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile menu on transition
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  // Count low stock items (below 5) for top badge alerts
  const lowStockCount = products.filter(p => p.stock < 5).length;

  const baseMenuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Inventory', path: '/inventory', icon: Boxes },
    { name: 'Sales', path: '/sales', icon: ShoppingCart },
    { name: 'Customers', path: '/customers', icon: User },
    { name: 'Suppliers', path: '/suppliers', icon: Truck },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Users', path: '/users', icon: Users },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  const menuItems = baseMenuItems.filter(item => {
    if (currentUser.role === 'Warehouse Staff') {
      return item.name === 'Dashboard' || item.name === 'Products' || item.name === 'Inventory';
    }
    if (currentUser.role === 'Staff' || currentUser.role === 'Admin') {
      return item.name !== 'Users' && item.name !== 'Settings';
    }
    return true;
  });

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sky_v2_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'Admin':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Staff':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Warehouse Staff':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* Sidebar for Desktop - Ultra modern Deep Navy */}
      <aside 
        id="sidebar-desktop" 
        className={`hidden lg:flex flex-col h-screen sticky top-0 bg-[#090d16] text-slate-300 shrink-0 shadow-2xl border-r border-slate-900/60 relative overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Subtle background glass reflection inside the navy sidebar */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-br from-teal-500/5 to-transparent pointer-events-none"></div>

        {/* Brand Header */}
        <div className={`h-25 flex items-center border-b border-slate-900/60 transition-all duration-300 ease-in-out relative z-10 ${
          isCollapsed ? 'px-4 justify-center gap-0' : 'px-6 justify-between gap-3'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-700/50 shadow-md p-0.5 shrink-0 overflow-hidden">
              <img 
                src={skyLogo} 
                alt="Sky Automation Tech" 
                className="w-full h-full object-cover rounded-lg" 
                referrerPolicy="no-referrer"
              />
            </div>
            {!isCollapsed && (
              <div className="animate-in fade-in duration-300">
                <h1 className="font-display font-bold text-sm leading-tight text-white tracking-wide whitespace-nowrap">Sky Inventory Pro</h1>
                <p className="text-[10px] text-teal-400/90 tracking-widest uppercase font-mono font-bold whitespace-nowrap">AUTOMATION DESK</p>
              </div>
            )}
          </div>
          
          {/* Collapse Toggle trigger */}
          <button
            id="sidebar-collapse-trigger"
            onClick={toggleSidebar}
            className={`p-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer ${
              isCollapsed ? 'absolute -bottom-8 rounded-full shadow border border-slate-800' : ''
            }`}
            title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto relative z-10">
          {menuItems.map((item) => (
            <NavLink
              id={`sidebar-link-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center transition-all duration-200 group rounded-xl ${
                  isCollapsed ? 'justify-center p-3.5 mx-1' : 'gap-3 px-4 py-3 mx-0 text-xs font-semibold tracking-wide'
                } ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-300 border-l-4 border-teal-500 shadow-lg shadow-teal-950/40 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/30 font-medium'
                }`
              }
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className={`w-4 h-4 transition-colors group-hover:text-teal-400 shrink-0 ${isCollapsed ? 'scale-110' : ''}`} />
              {!isCollapsed && (
                <span className="truncate animate-in fade-in duration-300">{item.name}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Brand Info */}
        <div className={`p-5 border-t border-slate-900/60 text-center bg-[#06090f]/80 relative z-10 transition-all duration-300 ${
          isCollapsed ? 'px-1 py-4' : 'px-5 py-5'
        }`}>
          {!isCollapsed ? (
            <div className="animate-in fade-in duration-300">
              <p className="text-[10px] text-slate-500 font-mono font-medium">Sky Automation Tech © 2026</p>
              <p className="text-[9px] text-teal-500 font-mono mt-0.5 font-bold tracking-wider">V1.0.4 PREMIUM</p>
            </div>
          ) : (
            <div className="text-[9px] text-teal-500 font-mono font-bold">V1.0.4</div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar - Glassy design */}
        <header id="topbar" className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 sm:px-8 z-20 sticky top-0 shadow-sm shadow-slate-100/20">
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Toggle */}
            <button
              id="mobile-sidebar-toggle"
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-50/80 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Live Bangladesh Standard Time Clock */}
            <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[11.5px] font-semibold text-slate-600 shadow-inner">
              <Clock className="w-3.5 h-3.5 text-teal-600 stroke-[2.5px] animate-pulse" />
              <span className="font-mono tracking-tight">{bstTime || 'Loading clock...'}</span>
              <span className="text-[9px] uppercase font-extrabold text-teal-700 bg-teal-50 border border-teal-100/40 px-1.5 py-0.5 rounded-full tracking-wider font-sans shrink-0">BST</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Role Badge Indicator */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
              <span className="text-[9px] text-slate-400 font-mono hidden sm:inline uppercase tracking-wider font-bold">Role:</span>
              <div className={`text-xs px-2.5 py-0.5 rounded-lg font-bold border flex items-center gap-1 ${getRoleBadgeColor(currentUser.role)}`}>
                {currentUser.role === 'Warehouse Staff' && <span className="text-xs">📦</span>}
                <span>{currentUser.role}</span>
              </div>
            </div>

            {/* Low stock alert flag */}
            {lowStockCount > 0 && (
              <div 
                id="low-stock-topbar-alert"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs animate-pulse font-medium shadow-sm"
                title={`${lowStockCount} items running low on stock`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="font-mono font-bold hidden xs:inline">{lowStockCount} Action Alerts</span>
              </div>
            )}

            {/* Profile Dropdown Menu */}
            <div className="relative">
              <button
                id="user-profile-button"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-colors text-left"
              >
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="w-9 h-9 rounded-full border border-teal-500/35 object-cover shadow-sm bg-slate-50"
                  referrerPolicy="no-referrer"
                />
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500 leading-none">{currentUser.email}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isUserDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsUserDropdownOpen(false)}></div>
                  <div id="user-role-menu" className="absolute right-0 mt-2.5 w-60 bg-white border border-slate-150/90 rounded-2xl shadow-2xl p-2.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                    <p className="text-[9px] px-3.5 py-1.5 text-slate-400 uppercase font-mono tracking-widest font-bold">Account Profile</p>
                    <div className="px-3.5 py-1.5">
                      <p className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-500 leading-none mt-1">{currentUser.email}</p>
                    </div>
                    <div className="border-t border-slate-100 my-1.5"></div>
                    <button
                      id="btn-user-logout"
                      type="button"
                      onClick={() => {
                        logout();
                        setIsUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between text-left text-xs px-3.5 py-2.5 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50/75 transition-all duration-150 font-bold cursor-pointer"
                    >
                      <span>Sign Out from ERP</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Body Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-5">
            {children}
          </div>
        </main>
      </div>

      {/* Slide-out Mobile Sidebar Component */}
      {isMobileOpen && (
        <>
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileOpen(false)}></div>
          <aside className="fixed top-0 bottom-0 left-0 w-64 bg-[#090d16] text-slate-300 z-50 flex flex-col p-5 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-6 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-slate-700/50 shadow-md p-0.5 overflow-hidden">
                  <img 
                    src={skyLogo} 
                    alt="Sky Automation Tech" 
                    className="w-full h-full object-cover rounded-lg" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h1 className="font-display font-bold text-xs text-white leading-none">Sky Inventory Pro</h1>
                  <span className="text-[9px] text-teal-400 font-mono font-bold">AUTOMATION TECH</span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 py-8 space-y-1 overflow-y-auto">
              {menuItems.map((item) => (
                <NavLink
                  id={`mobile-sidebar-link-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group ${
                      isActive
                        ? 'bg-slate-800 text-white border-l-4 border-teal-400'
                        : 'text-slate-400 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 text-slate-400 group-hover:text-teal-400 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>

            <div className="pt-4 border-t border-slate-900 text-center text-[10px] text-slate-500 font-mono">
              Sky Automation Tech © 2026
            </div>
          </aside>
        </>
      )}
    </div>
  );
};
