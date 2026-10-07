import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, Newspaper, Share, Check } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { API_URL as API, resolveMediaUrl } from '@/config';

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await axios.get(`${API}/news`);
      setNews(response.data);
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('Gagal memuat berita');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy');
    } catch {
      return dateString;
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link halaman berita berhasil disalin ke clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin tautan');
    }
  };

  return (
    <div className="min-h-screen" data-testid="news-page">
      {/* Hero Section */}
      <section className="pt-28 pb-20 relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 dark:from-primary/5 dark:to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Cyber Badge */}
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-2 font-mono text-xs bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary border border-primary/20 dark:border-secondary/20 rounded-full px-3 py-1">
                <Newspaper className="w-3.5 h-3.5" />
                Publikasi &amp; Kabar Terkini
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6" data-testid="news-title">
              Berita &amp; Publikasi
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Ikuti perkembangan terkini inovasi riset, rilis open source, publikasi ilmiah, dan kegiatan komunitas Cyber Security Research Group PENS.
            </p>

            {/* Share Button */}
            <div className="flex justify-center">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-border bg-background/80 backdrop-blur-sm text-foreground/80 hover:text-primary dark:hover:text-secondary hover:border-primary/40 dark:hover:border-secondary/40 transition-all shadow-sm"
                data-testid="share-news-button"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share className="w-4 h-4" />}
                <span>{copied ? 'Tautan Disalin!' : 'Bagikan Halaman Berita'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* News Grid */}
      <section className="py-20 border-t border-border/50" data-testid="news-grid-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-2xl mb-4" />
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3 mb-2" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-800/50 rounded-2xl border border-dashed border-border max-w-md mx-auto">
              <Newspaper className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">Belum ada berita atau artikel tersedia</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {news.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  data-testid={`news-card-${index}`}
                >
                  <Link
                    to={`/news/${article.id}`}
                    className="group block bg-white dark:bg-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-border hover:border-primary/40 dark:hover:border-secondary/40 h-full flex flex-col justify-between"
                  >
                    <div>
                      {/* Thumbnail with overlay */}
                      <div className="aspect-video overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 relative">
                        <img
                          src={resolveMediaUrl(article.thumbnail_url)}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        {/* Date */}
                        <div className="flex items-center space-x-2 text-xs font-mono text-muted-foreground mb-3 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-md inline-flex">
                          <Calendar className="w-3.5 h-3.5 text-primary dark:text-secondary" />
                          <span>{formatDate(article.published_date)}</span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-2 group-hover:text-primary dark:group-hover:text-secondary transition-colors">
                          {article.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                          {article.excerpt}
                        </p>
                      </div>
                    </div>

                    {/* Read More Button */}
                    <div className="px-6 pb-6 pt-2">
                      <div className="flex items-center space-x-2 text-sm font-semibold text-primary dark:text-secondary">
                        <span>Baca Selengkapnya</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default News;