'use client'

import React, { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const sidebarNavigation = [
  { 
    name: 'Overview',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 13H10C10.55 13 11 12.55 11 12V4C11 3.45 10.55 3 10 3H4C3.45 3 3 3.45 3 4V12C3 12.55 3.45 13 4 13ZM4 21H10C10.55 21 11 20.55 11 20V16C11 15.45 10.55 15 10 15H4C3.45 15 3 15.45 3 16V20C3 20.55 3.45 21 4 21ZM14 21H20C20.55 21 21 20.55 21 20V12C21 11.45 20.55 11 20 11H14C13.45 11 13 11.45 13 12V20C13 20.55 13.45 21 14 21ZM13 4V8C13 8.55 13.45 9 14 9H20C20.55 9 21 8.55 21 8V4C21 3.45 20.55 3 20 3H14C13.45 3 13 3.45 13 4Z" fill="currentColor"/>
      </svg>
    )
  },
  { 
    name: 'Financial',
    href: '/dashboard/financial',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="currentColor"/>
      </svg>
    ),
    submenu: [
      { name: 'Summary', href: '/dashboard/financial' },
      { name: 'Investments', href: '/dashboard/financial/investments' },
      { name: 'Banking', href: '/dashboard/financial/banking' },
    ]
  },
  { 
    name: 'Health',
    href: '/dashboard/health',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
      </svg>
    ),
    submenu: [
      { name: 'Summary', href: '/dashboard/health' },
      { name: 'Fitness', href: '/dashboard/health/fitness' },
      { name: 'Sleep', href: '/dashboard/health/sleep' },
      { name: 'Body', href: '/dashboard/health/body' },
    ]
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [openSubmenu, setOpenSubmenu] = React.useState<string | null>(null)

  return (
    <div className="min-h-screen bg-brand-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-brand-text">
        <div className="flex h-16 items-center justify-between px-4">
          <span className="text-xl font-bold text-brand-background">Dashboard</span>
        </div>
        <nav className="mt-5 px-2 space-y-1">
          {sidebarNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <div key={item.name}>
                {item.submenu ? (
                  <>
                    <button
                      onClick={() => setOpenSubmenu(openSubmenu === item.name ? null : item.name)}
                      className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-brand-green text-brand-background'
                          : 'text-brand-background/70 hover:bg-brand-stone/10 hover:text-brand-background'
                      }`}
                    >
                      {item.icon}
                      <span className="ml-3">{item.name}</span>
                      <svg
                        className={`ml-auto h-5 w-5 transform transition-transform duration-200 ${
                          openSubmenu === item.name ? 'rotate-90' : ''
                        }`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {openSubmenu === item.name && (
                      <div className="mt-1 space-y-1">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`group flex items-center pl-10 pr-2 py-2 text-sm font-medium rounded-md ${
                              pathname === subItem.href
                                ? 'text-brand-green bg-brand-stone/10'
                                : 'text-brand-background/70 hover:text-brand-background hover:bg-brand-stone/10'
                            }`}
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-brand-green text-brand-background'
                        : 'text-brand-background/70 hover:bg-brand-stone/10 hover:text-brand-background'
                    }`}
                  >
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                  </Link>
                )}
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="pl-64">
        {children}
      </div>
    </div>
  )
} 