import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, Map, FileText, Bell, LayoutDashboard } from 'lucide-react';
import useAuthStore from '../../lib/authStore';

const navItems = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/new-report', label: 'New Report', icon: PlusCircle },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/my-reports', label: 'My Reports', icon: FileText },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export default function Sidebar() {
  const { user } = useAuthStore();
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <aside className="w-[240px] h-screen bg-surface border-r border-line flex flex-col fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-line">
        <span className="font-display text-xl font-bold text-crimson">CrowdFix</span>
        <span className="font-np text-xl text-indigo ml-1">नेपाल</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center