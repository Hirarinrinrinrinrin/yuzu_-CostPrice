import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Utensils, Calculator, Settings, Menu, X } from 'lucide-react';

const MainLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navigation = [
        { name: '原価管理', to: '/menus', icon: Calculator },
        { name: '食材管理', to: '/ingredients', icon: Utensils },
        { name: '設定', to: '/settings', icon: Settings },
    ];

    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="flex h-screen bg-theme-main font-sans text-stone-800">
            {/* Mobile sidebar overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-stone-900/50 lg:hidden"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-theme-sidebar shadow-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex h-16 items-center justify-between px-6 border-b border-stone-200/50">
                    <span className="text-xl font-bold tracking-tight text-stone-800">Cost Manage</span>
                    <button onClick={closeSidebar} className="lg:hidden text-stone-500 hover:text-stone-800">
                        <X size={24} />
                    </button>
                </div>

                <nav className="mt-6 px-4 space-y-2">
                    {navigation.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.to}
                            onClick={closeSidebar}
                            className={({ isActive }) =>
                                `flex items-center px-4 py-3 rounded-xl transition-colors ${isActive
                                    ? 'bg-white/60 text-stone-900 font-medium shadow-sm'
                                    : 'text-stone-600 hover:bg-white/40 hover:text-stone-900'
                                }`
                            }
                        >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Mobile Header */}
                <header className="flex h-16 items-center justify-between bg-theme-sidebar px-4 shadow-sm lg:hidden z-10">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-stone-500 hover:text-stone-800 focus:outline-none"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="text-lg font-bold text-stone-800">Cost Manage</span>
                    <div className="w-6" /> {/* Spacer for centering */}
                </header>

                {/* Main View */}
                <main className="flex-1 overflow-y-auto h-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
