import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  Eye, 
  Zap, 
  Award, 
  Shield, 
  Share, 
  Check, 
  Network, 
  Lock, 
  Cpu, 
  FileSearch,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const Profile = () => {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link profil lab berhasil disalin ke clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin tautan');
    }
  };

  const researchPillars = [
    {
      icon: Network,
      title: 'Network Defense & Threat Intelligence',
      badge: 'MONITORING & NIDS',
      description: 'Pengembangan sensor NIDS terdistribusi berbasis Suricata, deteksi anomali real-time, dan intelijen ancaman siber proaktif.',
    },
    {
      icon: Lock,
      title: 'Vulnerability Research & Reverse Engineering',
      badge: 'SECURITY AUDIT',
      description: 'Analisis mendalam kerentanan sistem, audit protokol, pembongkaran artefak biner (malware), dan mitigasi celah eksploitasi.',
    },
    {
      icon: Cpu,
      title: 'Cloud & IoT Security',
      badge: 'INFRASTRUCTURE',
      description: 'Pengamanan ekosistem komputasi awan, enkripsi transmisi data perangkat IoT, dan hardening infrastruktur sistem embedded.',
    },
    {
      icon: FileSearch,
      title: 'Digital Forensics & Incident Response',
      badge: 'DFIR',
      description: 'Investigasi digital pasca-insiden siber, analisis jejak log, rekonstruksi bukti digital, dan pemulihan integritas sistem.',
    },
  ];

  const achievements = [
    { icon: Award, title: '20+ Publikasi Ilmiah', description: 'Jurnal & konferensi internasional bereputasi' },
    { icon: Zap, title: '10+ Proyek Riset & Kolaborasi', description: 'Bekerja sama dengan industri dan universitas' },
    { icon: Target, title: '30+ Peneliti & Anggota', description: 'Dosen peneliti, asisten lab, dan mahasiswa aktif' },
  ];

  return (
    <div className="min-h-screen" data-testid="profile-page">
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
                <Shield className="w-3.5 h-3.5" />
                Profil &amp; Rekayasa Siber
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6" data-testid="profile-title">
              Profil Lab CSRG
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Laboratorium riset terapan di bawah naungan PENS yang menggabungkan keahlian teknis tingkat tinggi, rekayasa keamanan defensif, dan kolaborasi riset inklusif.
            </p>

            {/* Share Profile Button */}
            <div className="flex justify-center">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-border bg-background/80 backdrop-blur-sm text-foreground/80 hover:text-primary dark:hover:text-secondary hover:border-primary/40 dark:hover:border-secondary/40 transition-all shadow-sm"
                data-testid="share-profile-button"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share className="w-4 h-4" />}
                <span>{copied ? 'Tautan Disalin!' : 'Bagikan Profil Lab'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* History Section */}
      <section className="py-20 border-t border-border/50" data-testid="history-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden border border-border shadow-xl flex items-center justify-center relative group">
                {!imgError ? (
                  <img
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                    alt="Team Collaboration"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-900 to-slate-950 text-white w-full h-full">
                    <Shield className="w-16 h-16 text-secondary mb-3 animate-pulse" />
                    <h3 className="font-bold text-lg">Cyber Security Research Group</h3>
                    <p className="text-xs text-slate-400 font-mono mt-1">EEPIS Lab Jarkom &amp; Cyber Defense</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 text-white">
                  <span className="text-xs font-mono bg-primary/80 px-2 py-0.5 rounded text-white font-semibold">EST. 2018</span>
                  <p className="text-sm font-medium mt-1">Kolaborasi &amp; Riset Terbuka PENS</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-xs font-mono uppercase tracking-wider text-primary dark:text-secondary font-semibold">
                Perjalanan Kami
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-1 mb-6">Sejarah CSRG</h2>
              <p className="text-base text-muted-foreground mb-4 leading-relaxed">
                Cyber Security Research Group (CSRG) didirikan pada tahun 2018 sebagai inisiatif strategis untuk 
                menciptakan ekosistem riset keamanan jaringan komputer yang mandiri, adaptif, dan berstandar industri 
                di lingkungan Politeknik Elektronika Negeri Surabaya (PENS).
              </p>
              <p className="text-base text-muted-foreground mb-4 leading-relaxed">
                Berawal dari kelompok kecil dosen dan mahasiswa penggemar keamanan siber, CSRG berkembang pesat menjadi 
                salah satu laboratorium riset unggulan yang aktif memproduksi solusi keamanan terbuka (open source), 
                termasuk platform monitoring andalan kami, <strong>Mata Elang</strong>.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                Kini laboratorium kami terus aktif berkontribusi dalam publikasi internasional bereputasi, pelatihan talenta siber, 
                serta kemitraan riset terapan bersama industri dan lembaga nasional.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4 Research Pillars Section */}
      <section className="py-20 bg-slate-50/50 dark:bg-slate-900/30 border-y border-border/50" data-testid="research-areas-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-primary dark:text-secondary bg-primary/10 dark:bg-secondary/10 px-3 py-1 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Domain Kepakaran
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              4 Pilar Riset Inti CSRG
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Fokus penelitian kami mencakup spektrum keamanan siber terapan dari jaringan hingga forensik digital
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {researchPillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white dark:bg-slate-800/80 rounded-2xl p-8 border border-border hover:border-primary/50 dark:hover:border-secondary/50 transition-all shadow-sm hover:shadow-md group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary group-hover:to-secondary flex items-center justify-center transition-all duration-300">
                      <Icon className="w-7 h-7 text-primary dark:text-secondary group-hover:text-white transition-colors duration-300" />
                    </div>
                    <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-foreground/70 font-semibold">
                      {pillar.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary dark:group-hover:text-secondary transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20" data-testid="vision-mission-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-border hover:border-primary/40 transition-colors shadow-sm"
              data-testid="vision-card"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6">
                <Eye className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Visi Laboratorium</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Menjadi pusat unggulan riset keamanan siber terapan terdepan di Indonesia yang berdaya saing global, 
                menghasilkan karya inovatif open source, dan berkontribusi langsung pada ketahanan infrastruktur siber nasional.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-border hover:border-secondary/40 transition-colors shadow-sm"
              data-testid="mission-card"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Misi Riset</h3>
              <ul className="space-y-3 text-base text-muted-foreground">
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-primary dark:bg-secondary mt-2 mr-3 flex-shrink-0"></span>
                  Melaksanakan penelitian berstandar internasional di bidang pertahanan jaringan, IoT, dan analisis anomali siber.
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-primary dark:bg-secondary mt-2 mr-3 flex-shrink-0"></span>
                  Mengembangkan produk perangkat lunak open source yang dapat dimanfaatkan langsung oleh komunitas dan industri.
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-primary dark:bg-secondary mt-2 mr-3 flex-shrink-0"></span>
                  Membina talenta mahasiswa terampil untuk memenuhi kebutuhan praktisi pertahanan siber nasional.
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-primary dark:bg-secondary mt-2 mr-3 flex-shrink-0"></span>
                  Membangun jejaring kolaborasi lintas universitas, lembaga riset pemerintah, dan sektor industri strategis.
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-20 bg-slate-50/50 dark:bg-slate-900/50 border-t border-border" data-testid="achievements-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Pencapaian &amp; Dampak Riset
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center bg-white dark:bg-slate-800 p-8 rounded-2xl border border-border shadow-sm"
                  data-testid={`achievement-${index}`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;