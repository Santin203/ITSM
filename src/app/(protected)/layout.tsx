"use client";

import React from 'react';
import Link from 'next/link';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="flex min-h-screen font-sans bg-gray-100">
            <aside className="w-64 bg-white p-6 shadow-md border-r border-gray-200">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">ITSM</h1>
                </div>
                <nav>
                    <ul className="list-none p-0 m-0">
                        <li className="mb-4">
                            <Link href="/dashboard" className="text-gray-800 font-medium no-underline">
                                Dashboard
                            </Link>
                        </li>
                        <li className="mb-4">
                            <Link href="/tickets" className="text-gray-800 font-medium no-underline">
                                Tickets
                            </Link>
                        </li>
                        <li className="mb-4">
                            <Link href="/reports" className="text-gray-800 font-medium no-underline">
                                Reports
                            </Link>
                        </li>
                        <li className="mb-4">
                            <Link href="/settings" className="text-gray-800 font-medium no-underline">
                                Settings
                            </Link>
                        </li>
                    </ul>
                </nav>
            </aside>
            <main className="flex-1 flex flex-col bg-gray-50">
                {/* Top horizontal space */}
                <header className="flex justify-end items-center p-4 border-b border-gray-200 bg-white shadow-sm">
                    <button className="text-gray-800 font-medium">Sign Out</button>
                </header>
                <div className="p-8 flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
