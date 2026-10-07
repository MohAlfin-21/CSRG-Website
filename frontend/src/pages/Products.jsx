import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  Github,
  Globe,
  Zap,
  Shield,
  Check,
  Monitor,
  Lock,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useTheme } from 'next-themes';
import { API_URL as API, resolveMediaUrl } from '@/config';
import axios from 'axios';

// Icon map: stored icon_name string → Lucide component
const ICON_MAP = {
  Shield,
  Globe,
  Zap,
  Monitor,
};

const Products = () => {
  const { theme } = useTheme();

  // Product data from API
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Category filter
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Preview dialog: tracks which product is being previewed
  const [activeProduct, setActiveProduct] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTheme, setPreviewTheme] = useState(theme);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch products from backend
  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/products`);
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Sync previewTheme when dialog opens
  useEffect(() => {
    if (showPreview) {
      setPreviewTheme(theme);
    }
  }, [showPreview, theme]);

  const openPreview = (product) => {
    setActiveProduct(product);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setActiveProduct(null);
  };

  // Helper: resolve image URL (MinIO full URL or fallback)
  const resolveImageUrl = (url, filename) => {
    return resolveMediaUrl(url || filename);
  };

  const categories = ['All', ...new Set(products.map((p) => p.category))];

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const getCategoryCount = (cat) =>
    cat === 'All' ? products.length : products.filter((p) => p.category === cat).length;

  // Determine preview URL for active product.
  // SECURITY: hanya izinkan skema https — defence-in-depth di sisi klien
  // melengkapi validasi backend di models/product.py.
  const getPreviewSrc = (product, pTheme) => {
    if (!product) return '';
    const base = product.live_preview_url || product.website || '';
    if (!base) return '';
    try {
      const url = new URL(base);
      // Tolak semua skema selain https (http, javascript:, data:, dll.)
      if (url.protocol !== 'https:') return '';
      url.searchParams.set('docusaurus-theme', pTheme === 'dark' ? 'dark' : 'light');
      return url.toString();
    } catch {
      // URL tidak valid (bukan absolute URL) — jangan render iframe
      return '';
    }
  };

  // Determine current preview image (light/dark) for browser mockup
  const getPreviewImage = (product, currentTheme) => {
    if (!product) return null;
    if (currentTheme === 'dark') {
      return resolveImageUrl(product.preview_dark_url, product.preview_dark_filename)
        || resolveImageUrl(product.preview_light_url, product.preview_light_filename);
    }
    return resolveImageUrl(product.preview_light_url, product.preview_light_filename)
      || resolveImageUrl(product.preview_dark_url, product.preview_dark_filename);
  };

  return (
    <div className="min-h-screen" data-testid="products-page">
      {/* ── Hero Section ── */}
      <section className="pt-28 pb-20 relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 dark:from-primary/5 dark:to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-2 font-mono text-xs bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary border border-primary/20 dark:border-secondary/20 rounded-full px-3 py-1">
                <Zap className="w-3 h-3" />
                CSRG Open Source &amp; Innovations
              </span>
            </div>

            <h1
              className="text-4xl md:text-6xl font-bold text-foreground mb-6"
              data-testid="products-title"
            >
              Produk &amp; Inovasi CSRG
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Inovasi keamanan siber dari penelitian dan pengembangan berkelanjutan CSRG untuk
              melindungi infrastruktur digital. Dari monitoring real-time hingga threat intelligence.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Filter Tabs ── */}
      <section className="py-8 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="inline-flex items-center gap-1 rounded-2xl border border-border bg-background/50 backdrop-blur-sm p-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-primary dark:bg-secondary text-white dark:text-slate-900 shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {cat} ({getCategoryCount(cat)})
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Products List ── */}
      <section className="py-20 bg-background" data-testid="products-section">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {loadingProducts ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-lg text-muted-foreground">Belum ada produk dalam kategori ini</p>
            </motion.div>
          ) : (
            filteredProducts.map((product, idx) => {
              const IconComp = ICON_MAP[product.icon_name] || Shield;
              const logoUrl = resolveImageUrl(product.image_url, product.image_filename);
              const previewImg = getPreviewImage(product, theme);
              const websiteHost = (() => {
                try { return new URL(product.website || '').hostname; } catch { return product.website || ''; }
              })();

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.1 }}
                  data-testid={`product-card-${product.id}`}
                  className="mb-16 last:mb-0"
                >
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    {/* ── Left: Product Info ── */}
                    <div className="relative rounded-3xl border border-border bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-8 shadow-xl">
                      {/* Status */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                        </span>
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                          {product.status}
                        </span>
                      </div>

                      {/* Logo + Name */}
                      <div className="flex items-center gap-4 mb-4">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={product.name}
                            className="w-14 h-14 object-contain rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-2"
                          />
                        ) : (
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center`}>
                            <IconComp className="w-7 h-7 text-white" />
                          </div>
                        )}
                        <div>
                          <h2 className="text-2xl font-bold text-foreground">{product.name}</h2>
                          <p className="text-sm text-primary dark:text-secondary font-medium">
                            {product.tagline}
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                        {product.description}
                      </p>

                      {/* Tags */}
                      {product.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {product.tags.map((tag) => (
                            <span
                              key={tag}
                              className="font-mono text-xs bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary border border-primary/20 dark:border-secondary/20 rounded-md px-2 py-0.5"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Feature Matrix */}
                      {product.features?.length > 0 && (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-7">
                          {product.features.map((feature) => (
                            <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="flex flex-wrap gap-3">
                        {product.website && (
                          <a href={product.website} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="gap-2" data-testid={`product-website-${product.id}`}>
                              <Globe className="w-4 h-4" />
                              Kunjungi Website
                            </Button>
                          </a>
                        )}
                        {(product.live_preview_url || product.preview_light_url) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => openPreview(product)}
                            data-testid={`product-preview-${product.id}`}
                          >
                            <Monitor className="w-4 h-4" />
                            Live Preview Web
                          </Button>
                        )}
                        {product.github && (
                          <a href={product.github} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost" className="gap-2" data-testid={`product-github-${product.id}`}>
                              <Github className="w-4 h-4" />
                              GitHub
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* ── Right: Browser Mockup ── */}
                    <div
                      className="rounded-2xl overflow-hidden border border-border shadow-2xl cursor-pointer group"
                      onClick={() => (product.live_preview_url || product.preview_light_url) && openPreview(product)}
                      data-testid={`product-mockup-${product.id}`}
                    >
                      {/* Browser Chrome */}
                      <div className="bg-slate-100 dark:bg-slate-800 border-b border-border px-4 py-3 flex items-center gap-3">
                        {/* Traffic lights */}
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-red-400" />
                          <span className="w-3 h-3 rounded-full bg-yellow-400" />
                          <span className="w-3 h-3 rounded-full bg-green-400" />
                        </div>
                        {/* URL bar */}
                        <div className="flex-1 bg-white dark:bg-slate-700 rounded-md px-3 py-1 flex items-center gap-2 text-xs text-muted-foreground border border-border">
                          <Lock className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span>{websiteHost || product.name}</span>
                        </div>
                      </div>
                      {/* Preview image */}
                      {previewImg ? (
                        <div className="relative overflow-hidden">
                          <img
                            src={previewImg}
                            alt={`${product.name} preview`}
                            className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {(product.live_preview_url || product.preview_light_url) && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
                                <Monitor className="w-3.5 h-3.5" /> Klik untuk Live Preview
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={`h-64 bg-gradient-to-br ${product.color} flex items-center justify-center`}>
                          <IconComp className="w-20 h-20 text-white/40" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-background to-secondary/10 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Tertarik dengan Produk Kami?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Hubungi kami untuk integrasi, partnership, atau kontribusi dalam pengembangan
              produk-produk CSRG
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/contact">
                <Button size="lg" className="group" data-testid="cta-contact">
                  Hubungi Kami
                  <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
              <a href="https://github.com/mata-elang-stable" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="group" data-testid="cta-github">
                  <Github className="w-4 h-4 mr-2" />
                  Lihat di GitHub
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Live Preview Dialog ── */}
      <Dialog open={showPreview} onOpenChange={(open) => { if (!open) closePreview(); }}>
        <DialogContent
          className="max-w-[95vw] w-[1200px] h-[90vh] p-0 overflow-hidden [&>button.absolute]:hidden"
          data-testid="preview-dialog"
        >
          {/* Dialog Browser Bar */}
          <div className="bg-slate-100 dark:bg-slate-800 border-b border-border px-4 py-3 flex items-center gap-3 flex-shrink-0">
            {/* Traffic lights */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={closePreview}
                className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-500 transition-colors"
                title="Close"
              />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
            </div>

            {/* URL bar */}
            <div className="flex-1 bg-white dark:bg-slate-700 rounded-md px-3 py-1.5 flex items-center gap-2 text-xs text-muted-foreground border border-border">
              <Lock className="w-3 h-3 text-green-500 flex-shrink-0" />
              <span className="flex-1 truncate">
                {activeProduct?.live_preview_url || activeProduct?.website || activeProduct?.name}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Theme switcher */}
              <button
                onClick={() => setPreviewTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                className="text-xs px-2 py-1 rounded border border-border bg-background hover:bg-muted transition-colors text-muted-foreground"
                title="Toggle preview theme"
              >
                {previewTheme === 'dark' ? '☀️ Light' : '🌙 Dark'}
              </button>
              {/* Reload */}
              <button
                onClick={() => {
                  const iframe = document.getElementById('product-preview-iframe');
                  if (iframe) iframe.src = iframe.src;
                }}
                className="p-1.5 rounded border border-border bg-background hover:bg-muted transition-colors"
                title="Reload"
              >
                <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              {/* External link */}
              {activeProduct?.live_preview_url && (
                <a
                  href={activeProduct.live_preview_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded border border-border bg-background hover:bg-muted transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
              )}
              {/* Close */}
              <button
                onClick={closePreview}
                className="p-1.5 rounded border border-border bg-background hover:bg-muted transition-colors text-muted-foreground text-sm font-medium"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Preview content: iframe if live_preview_url resolves to a valid https URL */}
          {/* SECURITY: getPreviewSrc hanya mengembalikan URL https — string kosong */}
          {/* menyebabkan kondisi falsy sehingga iframe tidak dirender sama sekali. */}
          {/* sandbox: allow-same-origin DIHAPUS — kombinasi allow-scripts + allow-same-origin */}
          {/* membatalkan sandbox karena iframe dapat mengakses window.parent. */}
          {(() => {
            const previewSrc = getPreviewSrc(activeProduct, previewTheme);
            return previewSrc ? (
              <iframe
                id="product-preview-iframe"
                src={previewSrc}
                className="w-full flex-1 border-0"
                style={{ height: 'calc(90vh - 52px)', colorScheme: previewTheme }}
                title={`${activeProduct?.name} Live Preview`}
                sandbox="allow-scripts allow-popups allow-forms"
                referrerPolicy="no-referrer"
              />
            ) : (
            /* Fallback: show full-size preview image */
            <div className="overflow-auto" style={{ height: 'calc(90vh - 52px)' }}>
              {getPreviewImage(activeProduct, previewTheme) ? (
                <img
                  src={getPreviewImage(activeProduct, previewTheme)}
                  alt={`${activeProduct?.name} preview`}
                  className="w-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Tidak ada preview tersedia
                </div>
              )}
            </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
