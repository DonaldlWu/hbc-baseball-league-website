"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
}

interface NavigationProps {
  siteTitle?: string;
  items?: NavItem[];
}

const defaultItems: NavItem[] = [
  { label: "首頁", href: "/" },
  { label: "球團", href: "/teams" },
  { label: "賽程", href: "/#schedule" },
  { label: "排行榜", href: "/#standings" },
];

export default function Navigation({
  siteTitle = "新和週六野球聯盟",
  items = defaultItems,
}: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === "/") {
      return pathname === "/";
    }
    if (href.startsWith("/#")) {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const getLinkClasses = (href: string): string => {
    const baseClasses =
      "px-3 py-2 rounded-md text-sm transition-colors duration-200";
    if (isActive(href)) {
      return `${baseClasses} text-primary-600 bg-primary-50 font-semibold`;
    }
    return `${baseClasses} text-gray-700 hover:text-primary-600 hover:bg-gray-50`;
  };

  const getMobileLinkClasses = (href: string): string => {
    const baseClasses =
      "block px-4 py-3 text-base transition-colors duration-200";
    if (isActive(href)) {
      return `${baseClasses} text-primary-600 bg-primary-50 font-semibold`;
    }
    return `${baseClasses} text-gray-700 hover:text-primary-600 hover:bg-gray-50`;
  };

  const handleMobileLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md" aria-label="主要導航">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Site Title */}
          <Link
            href="/"
            className="text-xl font-bold text-gray-900 hover:text-primary-600 transition-colors"
          >
            {siteTitle}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={getLinkClasses(item.href)}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "關閉選單" : "開啟選單"}
          >
            {isMenuOpen ? (
              // Close icon
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              // Hamburger icon
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        data-testid="mobile-menu"
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          isMenuOpen ? "max-h-64" : "max-h-0"
        }`}
      >
        <div className="border-t border-gray-200 bg-white">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={getMobileLinkClasses(item.href)}
              onClick={handleMobileLinkClick}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
