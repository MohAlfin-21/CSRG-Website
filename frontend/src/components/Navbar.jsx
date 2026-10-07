import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import CsrgMark from './CsrgMark';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Profile', path: '/profile' },
  { name: 'Team', path: '/team' },
  { name: 'News', path: '/news' },
  { name: 'Products', path: '/products' },
  { name: 'Contact', path: '/contact' },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 ${
        isScrolled
          ? 'backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 shadow-lg border-b border-white/20'
          : 'bg-transparent'
      }`}
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group" data-testid="navbar-logo">
            <motion.div
              whileHover="hover"
              className="w-10 h-10 text-primary dark:text-secondary flex-shrink-0"
            >
              <CsrgMark className="w-full h-full" />
            </motion.div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold text-primary dark:text-white leading-none">CSRG</h1>
                <span className="text-xs font-mono bg-secondary/20 text-secondary rounded px-1 leading-tight">
                  PENS
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-none">
                  Cyber Security Research Group
                </p>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation — segmented pill container */}
          <div className="hidden md:flex items-center">
            <div className="bg-primary/5 dark:bg-white/5 rounded-full px-2 py-1.5 flex gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  data-testid={`nav-link-${link.name.toLowerCase()}`}
                  className="relative px-3 py-1.5 text-sm font-medium rounded-full z-10"
                >
                  {isActive(link.path) && (
                    <motion.div
                      layoutId="navbar-active-pill"
                      className="absolute inset-0 bg-primary dark:bg-secondary rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span
                    className={`relative z-10 ${
                      isActive(link.path)
                        ? 'text-white dark:text-slate-900'
                        : 'text-foreground/70 hover:text-primary dark:hover:text-secondary'
                    }`}
                  >
                    {link.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center space-x-2">
            {/* Theme toggle — no AnimatePresence to avoid lag */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg bg-primary/5 hover:bg-primary/15 dark:bg-secondary/10 dark:hover:bg-secondary/20 transition-colors"
                data-testid="theme-toggle-button"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-secondary" />
                ) : (
                  <Moon className="w-5 h-5 text-primary" />
                )}
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-primary/5 hover:bg-primary/15 dark:bg-secondary/10 dark:hover:bg-secondary/20 transition-colors"
              data-testid="mobile-menu-toggle"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-primary dark:text-secondary" />
              ) : (
                <Menu className="w-5 h-5 text-primary dark:text-secondary" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile glass drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-border overflow-hidden"
            data-testid="mobile-menu"
          >
            <div className="px-4 py-6 space-y-1">
              {/* Lab status in drawer */}
              <div className="flex items-center gap-2 px-4 pb-4 mb-2 border-b border-border/50">
                <motion.div
                  whileHover="hover"
                  className="w-7 h-7 text-primary dark:text-secondary flex-shrink-0"
                >
                  <CsrgMark className="w-full h-full" />
                </motion.div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
                  <span className="text-xs font-medium text-muted-foreground">Lab Online</span>
                </div>
              </div>

              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid={`mobile-nav-link-${link.name.toLowerCase()}`}
                  className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-primary text-white dark:bg-secondary dark:text-slate-900'
                      : 'text-foreground/70 hover:bg-primary/10 dark:hover:bg-secondary/10 hover:text-primary dark:hover:text-secondary'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
