'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  subItems?: NavItem[]
}

// Modern Navigation Icons
const MenuIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1 7.5C1 7.22386 1.22386 7 1.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H1.5C1.22386 8 1 7.77614 1 7.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </svg>
)

const ChartIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.5 1C11.7761 1 12 1.22386 12 1.5V13.5C12 13.7761 11.7761 14 11.5 14C11.2239 14 11 13.7761 11 13.5V1.5C11 1.22386 11.2239 1 11.5 1ZM7.5 4C7.77614 4 8 4.22386 8 4.5V13.5C8 13.7761 7.77614 14 7.5 14C7.22386 14 7 13.7761 7 13.5V4.5C7 4.22386 7.22386 4 7.5 4ZM4 8.5C4 8.22386 3.77614 8 3.5 8C3.22386 8 3 8.22386 3 8.5V13.5C3 13.7761 3.22386 14 3.5 14C3.77614 14 4 13.7761 4 13.5V8.5Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </svg>
)

const SearchIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </svg>
)

const BellIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8.60124 1.25086C8.60124 1.25086 8.60124 1.25086 8.60124 1.25086L8.60124 1.25086L8.60124 1.25086C7.76457 0.984472 6.87678 0.98447 6.04012 1.25085C5.20345 1.51724 4.49414 2.03717 4.00341 2.73734C3.51267 3.43751 3.26526 4.28098 3.29617 5.13999C3.32708 5.999 3.63486 6.8236 4.17277 7.48723C4.37375 7.75872 4.47751 8.09171 4.46703 8.43133L4.46701 8.43303L4.46701 8.43473C4.46691 8.50935 4.47626 8.58364 4.49478 8.65563L4.50841 8.70563L4.51091 8.71632C4.53375 8.79633 4.57336 8.87125 4.62764 8.93743C4.68192 9.00361 4.75002 9.05984 4.82786 9.10302C4.9057 9.14621 4.99187 9.17557 5.08185 9.18955C5.17183 9.20353 5.26397 9.20185 5.35319 9.18459L5.36307 9.18252L5.37287 9.17997L5.42286 9.16634C5.49486 9.14782 5.56915 9.13847 5.64376 9.13857L5.64546 9.13857L5.64716 9.13857C5.98678 9.14905 6.31977 9.04529 6.59126 8.84431C7.25489 8.3064 8.07949 7.99862 8.9385 7.96771C9.79751 7.9368 10.641 8.18421 11.3412 8.67494C12.0413 9.16568 12.5613 9.87498 12.8277 10.7116C13.094 11.5483 13.094 12.4361 12.8277 13.2728C12.5613 14.1095 12.0413 14.8188 11.3412 15.3095C10.641 15.8002 9.79751 16.0476 8.9385 16.0167C8.07949 15.9858 7.25489 15.678 6.59126 15.1401C6.31977 14.9391 5.98678 14.8354 5.64716 14.8459L5.64546 14.8459L5.64376 14.8459C5.56915 14.846 5.49486 14.8366 5.42286 14.8181L5.37287 14.8045L5.36307 14.8019L5.35319 14.7998C5.26397 14.7826 5.17183 14.7809 5.08185 14.7949C4.99187 14.8089 4.9057 14.8382 4.82786 14.8814C4.75002 14.9246 4.68192 14.9808 4.62764 15.047C4.57336 15.1132 4.53375 15.1881 4.51091 15.2681L4.50841 15.2788L4.49478 15.3288C4.47626 15.4008 4.46691 15.4751 4.46701 15.5497L4.46701 15.5514L4.46703 15.5531C4.47751 15.8927 4.37375 16.2257 4.17277 16.4972C3.63486 17.1608 3.32708 17.9854 3.29617 18.8444C3.26526 19.7034 3.51267 20.5469 4.00341 21.2471C4.49414 21.9472 5.20345 22.4672 6.04012 22.7336C6.87678 22.9999 7.76457 22.9999 8.60124 22.7336C9.4379 22.4672 10.1472 21.9472 10.638 21.2471C11.1287 20.5469 11.3761 19.7034 11.3452 18.8444C11.3143 17.9854 11.0065 17.1608 10.4686 16.4972C10.2676 16.2257 10.1639 15.8927 10.1744 15.5531L10.1744 15.5514L10.1744 15.5497C10.1745 15.4751 10.1651 15.4008 10.1466 15.3288L10.133 15.2788L10.1305 15.2681C10.1076 15.1881 10.068 15.1132 10.0138 15.047C9.95947 14.9808 9.89137 14.9246 9.81353 14.8814C9.73569 14.8382 9.64952 14.8089 9.55954 14.7949C9.46956 14.7809 9.37742 14.7826 9.2882 14.7998L9.27832 14.8019L9.26852 14.8045L9.21853 14.8181C9.14653 14.8366 9.07224 14.846 8.99763 14.8459L8.99593 14.8459L8.99423 14.8459C8.65461 14.8354 8.32162 14.9391 8.05013 15.1401C7.3865 15.678 6.5619 15.9858 5.70289 16.0167C4.84388 16.0476 4.00041 15.8002 3.30024 15.3095C2.60007 14.8188 2.08014 14.1095 1.81375 13.2728C1.54736 12.4361 1.54736 11.5483 1.81375 10.7116C2.08014 9.87498 2.60007 9.16568 3.30024 8.67494C4.00041 8.18421 4.84388 7.9368 5.70289 7.96771C6.5619 7.99862 7.3865 8.3064 8.05013 8.84431C8.32162 9.04529 8.65461 9.14905 8.99423 9.13857L8.99593 9.13857L8.99763 9.13857C9.07224 9.13847 9.14653 9.14782 9.21853 9.16634L9.26852 9.17997L9.27832 9.18252L9.2882 9.18459C9.37742 9.20185 9.46956 9.20353 9.55954 9.18955C9.64952 9.17557 9.73569 9.14621 9.81353 9.10302C9.89137 9.05984 9.95947 9.00361 10.0138 8.93743C10.068 8.87125 10.1076 8.79633 10.1305 8.71632L10.133 8.70563L10.1466 8.65563C10.1651 8.58364 10.1745 8.50935 10.1744 8.43473L10.1744 8.43303L10.1744 8.43133C10.1639 8.09171 10.2676 7.75872 10.4686 7.48723C11.0065 6.82361 11.3143 5.999 11.3452 5.13999C11.3761 4.28098 11.1287 3.43751 10.638 2.73734C10.1472 2.03717 9.4379 1.51724 8.60124 1.25086ZM7.32068 2.18315C7.93401 1.99539 8.58738 1.99539 9.20071 2.18315C9.81404 2.37091 10.3491 2.73731 10.7391 3.23776C11.1292 3.73822 11.3572 4.35064 11.3937 4.98851C11.4303 5.62639 11.2736 6.26014 10.9431 6.80653C10.5697 7.41349 10.4085 8.13282 10.4873 8.84431C10.5662 9.55581 10.8799 10.2197 11.3829 10.7391C11.8834 11.1292 12.2498 11.6643 12.4375 12.2776C12.6253 12.8909 12.6253 13.5443 12.4375 14.1576C12.2498 14.7709 11.8834 15.306 11.3829 15.6961C10.8825 16.0862 10.2701 16.3142 9.63221 16.3507C8.99433 16.3873 8.36058 16.2306 7.81419 15.9001C7.20723 15.5267 6.4879 15.3655 5.77641 15.4443C5.06491 15.5232 4.40103 15.8369 3.88161 16.3399C3.39152 16.8404 2.85641 17.2068 2.24308 17.3945C1.62975 17.5823 0.976376 17.5823 0.363047 17.3945C-0.250283 17.2068 -0.785392 16.8404 -1.17549 16.3399C-1.56558 15.8394 -1.79358 15.227 -1.83012 14.5892C-1.86665 13.9513 -1.70994 13.3175 -1.37944 12.7712C-1.00604 12.1642 -0.844868 11.4449 -0.923726 10.7334C-1.00258 10.0219 -1.31634 9.35801 -1.81932 8.83867C-2.31977 8.44858 -2.68617 7.91347 -2.87393 7.30014C-3.06169 6.68681 -3.06169 6.03344 -2.87393 5.42011C-2.68617 4.80678 -2.31977 4.27167 -1.81932 3.88158C-1.31887 3.49149 -0.706453 3.26349 -0.0685768 3.22695C0.569299 3.19042 1.20305 3.34713 1.74944 3.67763C2.3564 4.05103 3.07573 4.2122 3.78722 4.13334C4.49872 4.05448 5.1626 3.74072 5.68194 3.23774C6.07203 2.73729 6.60714 2.37089 7.22047 2.18313L7.32068 2.18315Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </svg>
)

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.07095 0.650238C6.67391 0.650238 6.32977 0.925096 6.24198 1.31231L6.0039 2.36247C5.6249 2.47269 5.26335 2.62363 4.92436 2.81013L4.01335 2.23585C3.67748 2.02413 3.23978 2.07312 2.95903 2.35386L2.35294 2.95996C2.0722 3.2407 2.0232 3.6784 2.23493 4.01427L2.80942 4.92561C2.62307 5.2645 2.47227 5.62594 2.36216 6.00481L1.31209 6.24287C0.924883 6.33065 0.650024 6.6748 0.650024 7.07183V7.92897C0.650024 8.32601 0.924883 8.67015 1.31209 8.75794L2.36228 8.99603C2.47246 9.375 2.62335 9.73652 2.80979 10.0755L2.23546 10.9867C2.02374 11.3225 2.07273 11.7602 2.35347 12.041L2.95957 12.6471C3.24031 12.9278 3.67801 12.9768 4.01388 12.7651L4.92507 12.1907C5.26398 12.377 5.62535 12.5278 6.00414 12.6379L6.24221 13.688C6.33 14.0754 6.67414 14.3503 7.07118 14.3503H7.92832C8.32535 14.3503 8.6695 14.0754 8.75728 13.688L8.99537 12.6379C9.37434 12.5277 9.73587 12.3767 10.0749 12.1902L10.986 12.7645C11.3218 12.9762 11.7595 12.9272 12.0403 12.6465L12.6464 12.0404C12.9271 11.7597 12.9761 11.322 12.7644 10.9861L12.1899 10.0749C12.3762 9.73602 12.5271 9.37458 12.6372 8.99575L13.6873 8.75767C14.0745 8.66989 14.3494 8.32574 14.3494 7.92871V7.07157C14.3494 6.67453 14.0745 6.33039 13.6873 6.2426L12.6371 6.00453C12.527 5.62556 12.376 5.26402 12.1897 4.92502L12.764 4.01389C12.9757 3.67802 12.9267 3.24032 12.646 2.95958L12.0399 2.35348C11.7592 2.07274 11.3215 2.02375 10.9856 2.23547L10.0744 2.80989C9.73555 2.62355 9.37414 2.47278 8.99529 2.36269L8.75721 1.31231C8.66943 0.925096 8.32528 0.650238 7.92824 0.650238H7.07095ZM7.49973 5.13574C8.81306 5.13574 9.88322 6.20591 9.88322 7.51924C9.88322 8.83257 8.81306 9.90274 7.49973 9.90274C6.1864 9.90274 5.11623 8.83257 5.11623 7.51924C5.11623 6.20591 6.1864 5.13574 7.49973 5.13574Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </svg>
)

const navigationData: NavItem[] = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: MenuIcon,
  },
  {
    name: 'Financial',
    href: '/dashboard/financial',
    icon: ChartIcon,
    subItems: [
      { name: 'Summary', href: '/dashboard/financial', icon: MenuIcon },
      { name: 'Investments', href: '/dashboard/financial/investments', icon: MenuIcon },
      { name: 'Banking', href: '/dashboard/financial/banking', icon: MenuIcon },
      { name: 'Research', href: '/dashboard/financial/research', icon: MenuIcon },
    ]
  },
]

const headerIcons = [
  {
    name: 'Search',
    icon: SearchIcon,
  },
  {
    name: 'Notifications',
    icon: BellIcon,
  },
  {
    name: 'Settings',
    icon: SettingsIcon,
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [openSection, setOpenSection] = useState<string | null>(null)

  useEffect(() => {
    if (pathname.startsWith('/dashboard/financial')) {
      setOpenSection('Financial')
    } else {
      // Optional: close other sections if a non-financial page is active
      // setOpenSection(null)
    }
  }, [pathname])

  const toggleSection = (sectionName: string) => {
    setOpenSection(openSection === sectionName ? null : sectionName)
  }

  return (
    <div className="min-h-screen bg-brand-stone font-sans text-brand-text">
      {/* Sidebar */}
      <motion.nav
        initial={false}
        animate={{ width: isSidebarOpen ? 256 : 80 }}
        className="fixed inset-y-0 left-0 z-30 flex flex-col border-r border-brand-stone/30 bg-brand-background shadow-lg"
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-brand-stone/20">
          <motion.span
            animate={{ opacity: isSidebarOpen ? 1 : 0 }}
            className="text-lg font-semibold text-brand-green"
          >
            Dashboard
          </motion.span>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-lg p-2 hover:bg-brand-stone/10 text-brand-green"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 15 15"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d={isSidebarOpen 
                  ? "M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.13508 7.84188C4.04586 7.74807 3.99597 7.62271 3.99597 7.49991C3.99597 7.37711 4.04586 7.25175 4.13508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z"
                  : "M6.15815 3.13514C5.95669 3.32401 5.94649 3.64042 6.13535 3.84188L9.56476 7.49991L6.13535 11.1579C5.94649 11.3594 5.95669 11.6758 6.15815 11.8647C6.35961 12.0535 6.67603 12.0433 6.86489 11.8419L10.8649 7.84188C10.9541 7.74807 11.004 7.62271 11.004 7.49991C11.004 7.37711 10.9541 7.25175 10.8649 7.15794L6.86489 3.15794C6.67603 2.95648 6.35961 2.94628 6.15815 3.13514Z"}
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-1 px-3 py-4">
          {navigationData.map((item) => {
            const isSectionActive = item.href && pathname.startsWith(item.href)
            const isExactActive = pathname === item.href

            if (item.subItems) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleSection(item.name)}
                    className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors justify-between ${
                      isSectionActive && !item.subItems.some(sub => pathname === sub.href)
                        ? 'bg-brand-green/10 text-brand-green' 
                        : 'text-brand-text hover:bg-brand-stone/20'
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-3 h-4 w-4" />
                      <motion.span
                        animate={{ opacity: isSidebarOpen ? 1 : 0 }}
                        className="truncate"
                      >
                        {item.name}
                      </motion.span>
                    </div>
                    {isSidebarOpen && (
                      openSection === item.name ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </button>
                  <AnimatePresence>
                    {openSection === item.name && isSidebarOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="ml-4 mt-1 space-y-1 border-l border-brand-stone/20 pl-3"
                      >
                        {item.subItems.map((subItem) => {
                          const isSubItemActive = pathname === subItem.href
                          return (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className={`flex items-center rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                                isSubItemActive
                                  ? 'bg-brand-green text-brand-background'
                                  : 'text-brand-text hover:bg-brand-stone/20'
                              }`}
                            >
                              <span className="truncate">{subItem.name}</span>
                            </Link>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            } else {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isExactActive
                      ? 'bg-brand-green text-brand-background'
                      : 'text-brand-text hover:bg-brand-stone/20'
                  }`}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  <motion.span
                    animate={{ opacity: isSidebarOpen ? 1 : 0 }}
                    className="truncate"
                  >
                    {item.name}
                  </motion.span>
                </Link>
              )
            }
          })}
        </div>
      </motion.nav>

      {/* Main Content */}
      <div
        className={`flex min-h-screen flex-col transition-all ${
          isSidebarOpen ? 'pl-64' : 'pl-20'
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-brand-stone/20 bg-brand-background px-4 shadow-sm">
          <h1 className="text-xl font-semibold text-brand-green">
            {navigationData.find((item) => item.href === pathname)?.name || 
             navigationData.flatMap(item => item.subItems || []).find(subItem => subItem.href === pathname)?.name ||
             'Dashboard'}
          </h1>
          
          <div className="flex items-center space-x-4">
            {headerIcons.map((item) => (
              <button
                key={item.name}
                className="rounded-lg p-2 text-brand-text hover:bg-brand-stone/10 hover:text-brand-green transition-colors"
                aria-label={item.name}
              >
                <item.icon className="h-4 w-4" />
              </button>
            ))}
            
            <div className="ml-4 h-8 w-8 rounded-full bg-brand-coral/10">
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-sm font-medium text-brand-coral">FD</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 bg-brand-stone/10 p-6">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 