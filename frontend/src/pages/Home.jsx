import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Network, Lightbulb, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Home = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 100]);
  const y2 = useTransform(scrollY, [0, 300], [0, -50]);
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const features = [
    {
      icon: Network,
      title: 'Network Innovation',
      description: 'Riset terdepan dalam teknologi jaringan komputer, 5G, dan SDN',
    },
    {
      icon: Lightbulb,
      title: 'IoT & Edge Computing',
      description: 'Pengembangan solusi IoT dan edge computing untuk smart city',
    },
    {
      icon: Users,
      title: 'Collaborative Research',
      description: 'Kolaborasi dengan industri dan institusi akademik global',
    },
    {
      icon: TrendingUp,
      title: 'Industry Impact',
      description: 'Publikasi internasional dan implementasi teknologi di industri',
    },
  ];

  return (
    <div className="overflow-hidden" data-testid="home-page">
      {/* Hero Section with Parallax */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            style={{ y: y1 }}
            className="absolute top-20 right-10 w-72 h-72 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl"
          />
          <motion.div
            style={{ y: y2 }}
            className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/10 dark:bg-secondary/5 rounded-full blur-3xl"
          />
          
          {/* Network Pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="currentColor" className="text-primary" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Hero Content */}
        <motion.div
          style={{ opacity }}
          className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-secondary text-sm font-medium mb-6" data-testid="hero-badge">
              Cyber Security Research Group
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight"
            data-testid="hero-title"
          >
            <span className="bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
              Cyber Security
            </span>
            <br />
            <span className="text-foreground dark:text-white">Research Group</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-12"
            data-testid="hero-tagline"
          >
            Exploring Connectivity, Sharing Knowledge.
            <br />
            Laboratorium komputer untuk riset keamanan jaringan dan teknologi jaringan
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/news">
              <Button size="lg" className="group" data-testid="cta-explore-research">
                Jelajahi Riset Kami
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/team">
              <Button size="lg" variant="outline" data-testid="cta-meet-team">
                Meet Our Team
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-primary dark:border-secondary rounded-full flex items-start justify-center p-2"
          >
            <motion.div className="w-1 h-2 bg-primary dark:bg-secondary rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Fokus Penelitian Kami
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Mengembangkan solusi teknologi keamanan jaringan
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-border"
                  data-testid={`feature-card-${index}`}
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20" data-testid="about-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Tentang CSRG
              </h2>
              <p className="text-base text-muted-foreground mb-4">
                Cyber Security Research Group (CSRG) adalah laboratorium riset keamanan jaringan komputer di bawah 
                Politeknik Elektronika Negeri Surabaya (EEPIS). Kami menggabungkan suasana kolaboratif 
                yang hangat dengan riset teknikal yang mendalam.
              </p>
              <p className="text-base text-muted-foreground mb-6">
                Fokus riset kami meliputi network security, software-defined networking (SDN), Internet of Things (IoT), 
                menggunakan AI/ML.
              </p>
              <Link to="/profile">
                <Button variant="outline" className="group" data-testid="learn-more-button">
                  Pelajari Lebih Lanjut
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 dark:from-primary/10 dark:to-secondary/10 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80"
                  alt="CSRG Lab"
                  className="w-full h-full object-cover opacity-80"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-secondary rounded-2xl transform rotate-12 -z-10" />
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary rounded-2xl transform -rotate-12 -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden" data-testid="cta-section">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="relative rounded-3xl p-10 sm:p-14 overflow-hidden border border-border bg-gradient-to-br from-primary/10 via-background to-secondary/10 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-slate-900/90 backdrop-blur-xl shadow-xl">
            {/* Ambient subtle glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-primary/15 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-secondary/15 dark:bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative z-10 max-w-3xl mx-auto text-center"
            >
              {/* Badge */}
              <div className="flex justify-center mb-6">
                <span className="inline-flex items-center gap-2 font-mono text-xs bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary border border-primary/20 dark:border-secondary/20 rounded-full px-3 py-1">
                  Kemitraan &amp; Riset Terbuka
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Mari Berkolaborasi Bersama
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                Tertarik untuk berkolaborasi dalam riset keamanan siber, pengujian sistem keamanan, atau ingin berdiskusi lebih lanjut dengan tim CSRG PENS?
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link to="/contact">
                  <Button size="lg" className="group shadow-md" data-testid="cta-contact-button">
                    Hubungi Kami
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/products">
                  <Button size="lg" variant="outline" className="border-border hover:border-primary/40 dark:hover:border-secondary/40">
                    Eksplorasi Produk
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;