"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
  { label: "賽季紀錄", href: "/seasons/2025" },
  { label: "季後賽", href: "/postseason/2025" },
];

export default function Navigation({
  siteTitle = "新和週六野球聯盟",
  items = defaultItems,
}: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string): boolean => {
    // 錨點連結不參與高亮（它們是首頁內的導航）
    if (href.startsWith("/#")) {
      return false;
    }
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const getLinkClasses = (href: string): string => {
    const baseClasses =
      "px-3 py-2 rounded-md text-sm transition-colors duration-200";
    if (isActive(href)) {
      return `${baseClasses} text-white font-bold bg-primary-800`;
    }
    return `${baseClasses} text-primary-100 hover:text-white hover:bg-primary-600`;
  };

  const getMobileLinkClasses = (href: string): string => {
    const baseClasses =
      "block px-4 py-3 text-base transition-colors duration-200";
    if (isActive(href)) {
      return `${baseClasses} text-white font-bold bg-primary-800`;
    }
    return `${baseClasses} text-primary-100 hover:text-white hover:bg-primary-600`;
  };

  // 處理錨點連結滾動
  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      // 處理錨點連結（如 /#schedule）
      if (href.startsWith("/#")) {
        const targetId = href.substring(2); // 移除 /#
        const targetElement = document.getElementById(targetId);

        if (pathname === "/" && targetElement) {
          // 已在首頁，直接滾動
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: "smooth" });
        } else if (pathname !== "/") {
          // 不在首頁，先導航再滾動
          e.preventDefault();
          router.push("/");
          // 等待頁面載入後再滾動
          setTimeout(() => {
            const element = document.getElementById(targetId);
            element?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      }
    },
    [pathname, router]
  );

  const handleMobileLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    handleLinkClick(e, href);
    setIsMenuOpen(false);
  };

  return (
    <nav
      className={`sticky top-0 z-50 bg-gradient-to-r from-primary-600 to-primary-700 transition-shadow duration-300 ${isScrolled ? 'shadow-md' : 'shadow-none'}`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
      aria-label="主要導航"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Site Title */}
          <Link
            href="/"
            className="text-xl font-bold text-white hover:text-primary-200 transition-colors"
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
                onClick={(e) => handleLinkClick(e, item.href)}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-md text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
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
          isMenuOpen ? "max-h-80" : "max-h-0"
        }`}
      >
        <div className="border-t border-primary-600 bg-primary-700 bg-gradient-to-r from-primary-600 to-primary-700">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={getMobileLinkClasses(item.href)}
              onClick={(e) => handleMobileLinkClick(e, item.href)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
