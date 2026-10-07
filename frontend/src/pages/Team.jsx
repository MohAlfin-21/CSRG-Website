import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Linkedin, GraduationCap, ArrowUpRight, Users, Share, Check } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { API_URL as API, resolveMediaUrl } from '@/config';

const Team = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const pageSize = 6;

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchMembers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [members.length]);

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${API}/members`);
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Gagal memuat data anggota');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link halaman tim berhasil disalin ke clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin tautan');
    }
  };

  return (
    <div className="min-h-screen" data-testid="team-page">
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
                <Users className="w-3.5 h-3.5" />
                Peneliti &amp; Anggota Riset
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6" data-testid="team-title">
              Anggota Tim CSRG
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Bertemu dengan para dosen peneliti, perekayasa sistem, dan mahasiswa bertalenta yang mendedikasikan risetnya di bidang keamanan siber PENS.
            </p>

            {/* Share Team Button */}
            <div className="flex justify-center">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-border bg-background/80 backdrop-blur-sm text-foreground/80 hover:text-primary dark:hover:text-secondary hover:border-primary/40 dark:hover:border-secondary/40 transition-all shadow-sm"
                data-testid="share-team-button"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share className="w-4 h-4" />}
                <span>{copied ? 'Tautan Disalin!' : 'Bagikan Halaman Tim'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-20 border-t border-border/50" data-testid="team-members-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-2xl mb-4" />
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3 mb-2" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {members.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ y: -8 }}
                    className="group bg-white dark:bg-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-border hover:border-primary/40 dark:hover:border-secondary/40 flex flex-col justify-between"
                    data-testid={`team-member-${index}`}
                  >
                    <div>
                      {/* Photo */}
                      <div className="aspect-square overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 relative">
                        <img
                          src={resolveMediaUrl(member.photo_url)}
                          alt={member.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {/* Info */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary dark:group-hover:text-secondary transition-colors">
                          {member.name}
                        </h3>
                        <p className="text-sm font-medium text-primary dark:text-secondary mb-3">
                          {member.position}
                        </p>

                        {/* Research Area Badge if available */}
                        {member.research_area && (
                          <div className="mb-3">
                            <span className="inline-block text-xs font-mono bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary px-2.5 py-0.5 rounded-full">
                              #{member.research_area}
                            </span>
                          </div>
                        )}

                        {/* Social Links */}
                        <div className="flex items-center space-x-2 mb-4">
                          {member.linkedin_url && (
                            <a
                              href={member.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 dark:bg-secondary/10 dark:hover:bg-secondary/20 transition-colors"
                              data-testid={`member-linkedin-${index}`}
                              aria-label="LinkedIn"
                            >
                              <Linkedin className="w-4 h-4 text-primary dark:text-secondary" />
                            </a>
                          )}
                          {member.scholar_url && (
                            <a
                              href={member.scholar_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 dark:bg-secondary/10 dark:hover:bg-secondary/20 transition-colors"
                              data-testid={`member-scholar-${index}`}
                              aria-label="Google Scholar"
                            >
                              <GraduationCap className="w-4 h-4 text-primary dark:text-secondary" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* View Profile Button with ArrowUpRight */}
                    <div className="px-6 pb-6">
                      <Link to={`/team/${member.id}`}>
                        <Button 
                          variant="outline" 
                          className="w-full group/btn hover:border-primary dark:hover:border-secondary hover:text-primary dark:hover:text-secondary"
                          data-testid={`view-profile-${index}`}
                        >
                          Lihat Profil Lengkap
                          <ArrowUpRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination Controls */}
              {members.length > pageSize && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <nav className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800/80 border border-border" aria-label="Pagination">
                    {Array.from({ length: Math.ceil(members.length / pageSize) }).map((_, i) => {
                      const pageNum = i + 1;
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                            isActive 
                              ? 'bg-primary text-white dark:bg-secondary dark:text-slate-900 shadow-sm' 
                              : 'text-foreground/70 hover:text-foreground hover:bg-primary/10 dark:hover:bg-secondary/10'
                          }`}
                          aria-current={isActive ? 'page' : undefined}
                          aria-label={`Halaman ${pageNum}`}
                          data-testid={`team-page-${pageNum}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Team;