import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Calendar, ArrowLeft, Share, Check } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { API_URL as API, resolveMediaUrl } from '@/config';


const NewsDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Reading progress bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await axios.get(`${API}/news/${id}`);
      setArticle(response.data);
    } catch (error) {
      console.error('Error fetching article:', error);
      toast.error('Gagal memuat artikel');
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
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Link artikel berhasil disalin ke clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="pt-20 min-h-screen flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Artikel tidak ditemukan</p>
        <Link to="/news">
          <Button variant="outline">Kembali ke Berita</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="news-detail-page">
      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 h-1 origin-left bg-gradient-to-r from-primary via-blue-500 to-secondary"
        style={{ scaleX }}
      />

      {/* Hero Header Section */}
      <section className="pt-28 pb-12 relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 dark:from-primary/5 dark:to-secondary/5 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/news">
            <Button variant="ghost" className="group mb-6 -ml-3" data-testid="back-to-news-button">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Kembali ke Berita
            </Button>
          </Link>

          {/* Date + Share */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-xs font-mono text-muted-foreground bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-md" data-testid="article-date">
              <Calendar className="w-3.5 h-3.5 text-primary dark:text-secondary" />
              <span>{formatDate(article.published_date)}</span>
            </div>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background/80 hover:bg-primary/10 dark:hover:bg-secondary/10 text-xs font-medium text-muted-foreground hover:text-primary dark:hover:text-secondary transition-colors shadow-sm"
              data-testid="share-button"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share className="w-3.5 h-3.5" />}
              <span>{copied ? 'Disalin!' : 'Bagikan'}</span>
            </button>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground" data-testid="article-title">
            {article.title}
          </h1>
        </div>
      </section>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Featured Image */}
          <div className="aspect-video rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-primary/10 to-secondary/10 border border-border shadow-md">
            <img
              src={resolveMediaUrl(article.thumbnail_url)}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none" data-testid="article-content">
            <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
              {article.content}
            </p>
          </div>
        </motion.div>
      </article>
    </div>
  );
};

export default NewsDetail;
