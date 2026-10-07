import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Github, Linkedin, Twitter, ArrowUp, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import CsrgMark from './CsrgMark';

const quickLinks = [
  { name: 'Home', path: '/', testId: 'footer-link-home' },
  { name: 'Profil', path: '/profile', testId: 'footer-link-profile' },
  { name: 'Tim Riset', path: '/team', testId: 'footer-link-team' },
  { name: 'Berita', path: '/news', testId: 'footer-link-news' },
  { name: 'Produk & Inovasi', path: '/products', testId: 'footer-link-products' },
  { name: 'Kontak', path: '/contact', testId: 'footer-link-contact' },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-slate-50 dark:bg-slate-900/90 border-t border-border mt-20" data-testid="footer">
      {/* Top subtle cyber accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 dark:via-secondary/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* About Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <motion.div
                whileHover="hover"
                className="w-12 h-12 text-primary dark:text-secondary flex-shrink-0"
              >
                <CsrgMark className="w-full h-full" />
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-foreground leading-none">CSRG</h3>
                  <span className="text-xs font-mono font-semibold bg-primary/10 dark:bg-secondary/20 text-primary dark:text-secondary border border-primary/20 dark:border-secondary/30 rounded px-1.5 py-0.5 leading-tight">
                    PENS
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-mono">Cyber Security Research Group</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4 max-w-md leading-relaxed">
              Laboratorium riset keamanan siber terapan di Politeknik Elektronika Negeri Surabaya (PENS).
              Fokus pada penelitian, pengembangan sistem pertahanan jaringan, dan transfer teknologi di bidang keamanan siber.
            </p>

            {/* Official Lab Motto */}
            <p className="text-xs font-mono italic text-primary dark:text-secondary/90 font-medium">
              "Exploring Connectivity, Sharing Knowledge."
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider font-mono">
              Navigasi Cepat
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-primary dark:hover:text-secondary transition-colors inline-flex items-center gap-1.5"
                    data-testid={link.testId}
                  >
                    <span>•</span> {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info & Socials */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider font-mono">
              Hubungi Kami
            </h4>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-primary dark:text-secondary mt-0.5 flex-shrink-0" />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Politeknik Elektronika Negeri Surabaya<br />
                  Lab Jarkom &amp; Cyber Defense, Gedung D4 Lt. 3<br />
                  Jl. Raya ITS, Sukolilo, Surabaya 60111
                </span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-primary dark:text-secondary flex-shrink-0" />
                <a
                  href="mailto:csrg@eepis.ac.id"
                  className="text-xs text-muted-foreground hover:text-primary dark:hover:text-secondary transition-colors font-mono"
                  data-testid="footer-email"
                >
                  csrg@eepis.ac.id
                </a>
              </li>
            </ul>

            {/* Social Media Pills */}
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/mata-elang-stable"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg border border-border bg-background hover:bg-primary/10 dark:hover:bg-secondary/10 flex items-center justify-center text-muted-foreground hover:text-primary dark:hover:text-secondary transition-colors"
                title="GitHub"
                data-testid="social-github"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://id.linkedin.com/school/politeknik-elektronika-negeri-surabaya/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg border border-border bg-background hover:bg-primary/10 dark:hover:bg-secondary/10 flex items-center justify-center text-muted-foreground hover:text-primary dark:hover:text-secondary transition-colors"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com/penseepis"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg border border-border bg-background hover:bg-primary/10 dark:hover:bg-secondary/10 flex items-center justify-center text-muted-foreground hover:text-primary dark:hover:text-secondary transition-colors"
                title="Twitter / X"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar — Institutional & Clean */}
        <div className="mt-10 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Institutional Copyright */}
            <div className="text-center md:text-left">
              <p className="text-xs sm:text-sm text-foreground font-medium" data-testid="footer-copyright">
                © 2026 CSRG PENS. All rights reserved.
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cyber Security Research Group • Politeknik Elektronika Negeri Surabaya
              </p>
            </div>

            {/* Telemetry Indicator + Back to Top */}
            <div className="flex items-center gap-4">
              {/* Telemetry Live Badge */}
              <div className="hidden sm:inline-flex items-center gap-2 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 border border-border px-3 py-1 rounded-full text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-foreground/80 font-medium">LAB SYSTEMS: OPERATIONAL</span>
                <span className="text-border">|</span>
                <span className="inline-flex items-center gap-1 text-primary dark:text-secondary">
                  <ShieldCheck className="w-3 h-3" /> TLS 1.3
                </span>
              </div>

              {/* Back to top button */}
              <button
                onClick={scrollToTop}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border bg-background hover:bg-primary/10 dark:hover:bg-secondary/10 text-xs font-mono text-muted-foreground hover:text-primary dark:hover:text-secondary transition-colors shadow-sm"
                title="Kembali ke atas"
              >
                <span>Ke Atas</span>
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
