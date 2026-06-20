import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  UserCog,
  Settings,
  User,
  ChevronDown,
  Menu,
  X,
  Building2,
  LogOut,
  Home,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { UserRole } from '@/types';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  { path: '/', label: '工作台', icon: LayoutDashboard, roles: ['admin', 'worker', 'owner'] },
  { path: '/orders', label: '报修工单', icon: ClipboardList, roles: ['admin', 'worker', 'owner'] },
  { path: '/workbench', label: '维修工工作台', icon: Wrench, roles: ['worker', 'admin'] },
  { path: '/repair/new', label: '报修登记', icon: Home, roles: ['owner', 'admin'] },
  { path: '/workers', label: '维修工管理', icon: UserCog, roles: ['admin'] },
];

const roleLabels: Record<UserRole, string> = {
  admin: '物业管理员',
  worker: '维修工人',
  owner: '小区业主',
};

const breadcrumbMap: Record<string, string> = {
  '/': '工作台',
  '/orders': '报修工单',
  '/workbench': '维修工工作台',
  '/repair/new': '报修登记',
  '/workers': '维修工管理',
  '/settings': '系统设置',
};

export default function Layout() {
  const { currentUser, switchRole } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const availableMenus = menuItems.filter((item) => item.roles.includes(currentUser.role));

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: { label: string; path: string }[] = [{ label: '首页', path: '/' }];
    let currentPath = '';
    for (const path of paths) {
      currentPath += `/${path}`;
      if (breadcrumbMap[currentPath]) {
        breadcrumbs.push({ label: breadcrumbMap[currentPath], path: currentPath });
      }
    }
    return breadcrumbs;
  };

  const handleSwitchRole = (role: UserRole) => {
    switchRole(role);
    setRoleDropdownOpen(false);
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setRoleDropdownOpen(false);
      setUserDropdownOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 侧边栏 */}
      <aside
        className={cn(
          'bg-primary-800 text-white transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-60' : 'w-16'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-primary-700">
          <Building2 className="w-8 h-8 flex-shrink-0" />
          {sidebarOpen && (
            <span className="ml-3 text-lg font-bold whitespace-nowrap">物业报修系统</span>
          )}
        </div>

        {/* 菜单 */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {availableMenus.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center mx-2 my-1 px-3 py-2.5 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-primary-100 hover:bg-primary-700 hover:text-white',
                  !sidebarOpen && 'justify-center'
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="ml-3 text-sm whitespace-nowrap">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* 折叠按钮 */}
        <div className="p-3 border-t border-primary-700">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部栏 */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm">
          {/* 面包屑 */}
          <div className="flex items-center text-sm text-gray-600">
            {getBreadcrumbs().map((crumb, index) => (
              <div key={crumb.path} className="flex items-center">
                {index > 0 && <ChevronDown className="w-4 h-4 mx-2 text-gray-400 -rotate-90" />}
                <span
                  className={cn(
                    index === getBreadcrumbs().length - 1
                      ? 'text-primary-800 font-medium'
                      : 'hover:text-primary-600 cursor-pointer'
                  )}
                  onClick={() => index < getBreadcrumbs().length - 1 && navigate(crumb.path)}
                >
                  {crumb.label}
                </span>
              </div>
            ))}
          </div>

          {/* 右侧操作区 */}
          <div className="flex items-center gap-4">
            {/* 角色切换 */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => {
                  setRoleDropdownOpen(!roleDropdownOpen);
                  setUserDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-800 hover:bg-primary-100 transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{roleLabels[currentUser.role]}</span>
                <ChevronDown className={cn('w-4 h-4 transition-transform', roleDropdownOpen && 'rotate-180')} />
              </button>
              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-fade-in-up">
                  {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => handleSwitchRole(role)}
                      className={cn(
                        'w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors',
                        currentUser.role === role && 'bg-primary-50 text-primary-800 font-medium'
                      )}
                    >
                      {roleLabels[role]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 用户信息 */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setRoleDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center text-white text-sm font-medium">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-700">{currentUser.name}</span>
                <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', userDropdownOpen && 'rotate-180')} />
              </button>
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50 animate-fade-in-up">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{roleLabels[currentUser.role]}</p>
                    {currentUser.roomNumber && (
                      <p className="text-xs text-gray-500 mt-0.5">房号：{currentUser.roomNumber}</p>
                    )}
                  </div>
                  <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    个人设置
                  </button>
                  <button className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 内容区 */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
