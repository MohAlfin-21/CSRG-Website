import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ExternalLink, 
  Book, 
  FileText, 
  ArrowLeft, 
  Share, 
  Check, 
  Award, 
  Building2, 
  ShieldCheck, 
  Terminal, 
  Layers, 
  Cpu, 
  ExternalLink as LinkIcon 
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious
} from "@/components/ui/pagination";
import { BACKEND_URL, resolveMediaUrl } from '@/config';
import { hasCVContent } from '@/components/cv/CVView';

const MemberDetail = () => {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [scholarPublications, setScholarPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPublications, setLoadingPublications] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const publicationsPerPage = 3;

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchMember = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${BACKEND_URL}/api/members/${id}`);
        
        if (!response.data) {
          throw new Error('Member not found');
        }
        
        setMember(response.data);
        
        // If member has a Google Scholar URL, fetch publications
        if (response.data.scholar_url) {
          setLoadingPublications(true);
          try {
            const scholarResponse = await axios.get(`${BACKEND_URL}/api/scholar/publications`, {
              params: { url: response.data.scholar_url }
            });
            setScholarPublications(scholarResponse.data);
          } catch (scholarErr) {
            console.error('Error fetching publications:', scholarErr);
          } finally {
            setLoadingPublications(false);
          }
        }
      } catch (err) {
        console.error('Error fetching member:', err);
        setError(err.response?.data?.detail || err.message || 'Gagal memuat detail anggota tim');
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link profil berhasil disalin ke clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin tautan');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-28">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-xs font-mono text-muted-foreground">Memuat data peneliti...</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-28 px-4 text-center">
        <p className="text-destructive font-medium mb-4">{error || 'Data anggota tidak ditemukan'}</p>
        <Link to="/team">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Daftar Tim
          </Button>
        </Link>
      </div>
    );
  }

  // Calculate current publications to display
  const indexOfLastPublication = currentPage * publicationsPerPage;
  const indexOfFirstPublication = indexOfLastPublication - publicationsPerPage;
  const currentPublications = scholarPublications.slice(indexOfFirstPublication, indexOfLastPublication);
  const totalPages = Math.ceil(scholarPublications.length / publicationsPerPage);

  // Inferred focus badges based on role
  const isFaculty = member.position.toLowerCase().includes('dosen') || member.position.toLowerCase().includes('ketua');
  const roleTags = isFaculty 
    ? ['Research Supervision', 'Network Security', 'Grant Management', 'System Defense']
    : ['Applied Cybersecurity', 'Network Defense', 'Threat Monitoring', 'Open Source Tooling'];

  const getCvDownloadHref = (cvUrl, memberId) => {
    if (!cvUrl) return null;
    const trimmed = cvUrl.trim();
    if (!trimmed) return null;

    const MANAGED_KEY_REGEX = /^cv\/([0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_.*)\.(pdf|doc|docx)$/i;

    const isManaged =
      MANAGED_KEY_REGEX.test(trimmed) ||
      trimmed.startsWith('/uploads/cv/') ||
      trimmed.includes('/csrg-media/cv/');

    if (isManaged) {
      return `${BACKEND_URL}/api/members/${memberId}/cv`;
    }

    if (trimmed.startsWith('https://')) {
      return trimmed;
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="member-detail-page">
      {/* Hero Header Section */}
      <section className="pt-28 pb-8 relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 dark:from-primary/5 dark:to-secondary/5 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              to="/team"
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary dark:hover:text-secondary group transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Kembali ke Daftar Tim
            </Link>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background/80 hover:bg-primary/10 dark:hover:bg-secondary/10 text-xs font-medium text-foreground/80 hover:text-primary dark:hover:text-secondary transition-colors shadow-sm"
              data-testid="share-member-button"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tautan Disalin!' : 'Salin Link Profil'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 border border-border bg-white dark:bg-slate-800/90 shadow-sm rounded-2xl">
              {/* Photo with status badge */}
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-5 bg-gradient-to-br from-primary/10 to-secondary/10 border border-border shadow-inner">
                <img
                  src={resolveMediaUrl(member.photo_url)}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>MEMBER AKTIF</span>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-foreground mb-1">{member.name}</h1>
              <p className="text-sm font-medium text-primary dark:text-secondary mb-4">{member.position}</p>

              {/* Research Area Tag */}
              {member.research_area && (
                <div className="mb-4">
                  <span className="inline-block text-xs font-mono bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary px-3 py-1 rounded-full font-semibold border border-primary/20 dark:border-secondary/30">
                    #{member.research_area}
                  </span>
                </div>
              )}

              {/* Institutional Details */}
              <div className="pt-4 border-t border-border space-y-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-primary dark:text-secondary flex-shrink-0" />
                  <span>Politeknik Elektronika Negeri Surabaya</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-primary dark:text-secondary flex-shrink-0" />
                  <span>Lab Jarkom &amp; Cyber Defense (CSRG)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-5 mt-4 border-t border-border">
                {member.linkedin_url && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-xs font-medium hover:border-primary dark:hover:border-secondary"
                    onClick={() => window.open(member.linkedin_url, '_blank')}
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-2 text-primary dark:text-secondary" />
                    Kunjungi LinkedIn
                  </Button>
                )}
                {member.scholar_url && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-xs font-medium hover:border-primary dark:hover:border-secondary"
                    onClick={() => window.open(member.scholar_url, '_blank')}
                  >
                    <Book className="w-3.5 h-3.5 mr-2 text-primary dark:text-secondary" />
                    Google Scholar Profile
                  </Button>
                )}
                {hasCVContent(member.cv_data) && (
                  <Link to={`/team/${member.id}/cv`} className="block w-full" data-testid="member-cv-online-link">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-xs font-medium hover:border-primary dark:hover:border-secondary"
                    >
                      <FileText className="w-3.5 h-3.5 mr-2 text-primary dark:text-secondary" />
                      Lihat CV Online
                    </Button>
                  </Link>
                )}
                {getCvDownloadHref(member.cv_url, member.id) && (
                  <a
                    href={getCvDownloadHref(member.cv_url, member.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button
                      variant="outline"
                      className="w-full justify-start text-xs font-medium hover:border-primary dark:hover:border-secondary"
                    >
                      <FileText className="w-3.5 h-3.5 mr-2 text-primary dark:text-secondary" />
                      Lihat Resume / CV
                    </Button>
                  </a>
                )}
                {!member.linkedin_url && !member.scholar_url && !member.cv_url && !hasCVContent(member.cv_data) && (
                  <Link to="/contact">
                    <Button variant="outline" className="w-full justify-start text-xs">
                      <Terminal className="w-3.5 h-3.5 mr-2 text-primary dark:text-secondary" />
                      Hubungi Melalui Lab CSRG
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Deep Profile, Projects & Publications */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Overview & Research Role Card */}
            <Card className="p-6 border border-border bg-white dark:bg-slate-800/90 shadow-sm rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-5 h-5 text-primary dark:text-secondary" />
                <h2 className="text-lg font-bold text-foreground">Peran Riset &amp; Bidang Keahlian</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                {isFaculty 
                  ? `${member.name} berperan sebagai pembina dan penasihat riset di CSRG PENS, membimbing proyek-proyek pertahanan siber terapan, arsitektur jaringan aman, dan publikasi ilmiah bertaraf internasional.`
                  : `${member.name} aktif berkontribusi dalam riset terapan laboratorium CSRG PENS, berfokus pada eksplorasi pertahanan siber, pengujian perangkat lunak keamanan jaringan, dan kolaborasi pengembangan ekosistem open-source.`}
              </p>

              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold block mb-2">
                  Domain Kompetensi:
                </span>
                <div className="flex flex-wrap gap-2">
                  {roleTags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="text-xs font-mono bg-slate-100 dark:bg-slate-700/60 text-foreground/80 px-2.5 py-1 rounded-lg border border-border"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Card>

            {/* Lab Project Involvement Card */}
            <Card className="p-6 border border-border bg-white dark:bg-slate-800/90 shadow-sm rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-primary dark:text-secondary" />
                  <h2 className="text-lg font-bold text-foreground">Keterlibatan Proyek Laboratorium</h2>
                </div>
                <span className="text-xs font-mono text-primary dark:text-secondary font-semibold">LAB INIT</span>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-900/40 flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Mata Elang — Platform NIDS Terdistribusi</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Monitoring lalu lintas jaringan real-time berbasis Suricata, sensor terdistribusi, dan visualisasi ancaman siber.
                    </p>
                  </div>
                  <Link to="/products">
                    <Button variant="ghost" size="sm" className="text-xs font-mono ml-3">
                      Detail <LinkIcon className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>

                <div className="p-4 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-900/40">
                  <h3 className="text-sm font-bold text-foreground">Infrastruktur Portal &amp; Riset Siber CSRG</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pengembangan platform portal riset, manajemen anggota, publikasi scholar terintegrasi, dan hardening keamanan web.
                  </p>
                </div>
              </div>
            </Card>

            {/* Scholar Publications Card */}
            <Card className="p-6 border border-border bg-white dark:bg-slate-800/90 shadow-sm rounded-2xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Publikasi Ilmiah Google Scholar</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {member.scholar_url 
                      ? 'Sinkronisasi riwayat artikel dan sitasi resmi Google Scholar'
                      : 'Arsip artikel ilmiah yang diterbitkan peneliti'}
                  </p>
                </div>
                {scholarPublications.length > 0 && (
                  <span className="font-mono text-xs bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary px-2.5 py-1 rounded-full font-semibold">
                    {scholarPublications.length} Publikasi Terindeks
                  </span>
                )}
              </div>

              {loadingPublications ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                  <p className="text-xs text-muted-foreground font-mono">Mengambil data Google Scholar...</p>
                </div>
              ) : scholarPublications.length > 0 ? (
                <>
                  <div className="space-y-4 mb-6">
                    {currentPublications.map((pub, index) => (
                      <Card key={index} className="p-5 hover:border-primary/40 dark:hover:border-secondary/40 transition-colors border border-border bg-slate-50/50 dark:bg-slate-900/40">
                        <h3 className="font-bold text-foreground mb-2 text-base leading-snug">{pub.title}</h3>
                        <p className="text-xs font-medium text-muted-foreground mb-1">{pub.authors}</p>
                        <p className="text-xs text-muted-foreground/80 mb-3 italic">{pub.publication}</p>
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
                          {pub.year && (
                            <span className="text-xs font-mono bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 rounded text-foreground/80">
                              Tahun: {pub.year}
                            </span>
                          )}
                          {pub.citations && (
                            <span className="text-xs font-mono bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary px-2 py-0.5 rounded font-semibold inline-flex items-center gap-1">
                              <Award className="w-3 h-3" /> Sitasi: {pub.citations}
                            </span>
                          )}
                          {pub.link && (
                            <a 
                              href={pub.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-auto inline-flex items-center text-xs font-semibold text-primary dark:text-secondary hover:underline"
                            >
                              Buka Paper <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  {totalPages > 1 && (
                    <Pagination className="justify-center">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage > 1) setCurrentPage(currentPage - 1);
                            }}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                        
                        {[...Array(totalPages)].map((_, i) => (
                          <PaginationItem key={i}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(i + 1);
                              }}
                              isActive={currentPage === i + 1}
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                            }}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              ) : (
                <div className="text-center py-10 px-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-dashed border-border">
                  <Book className="w-8 h-8 mx-auto mb-2 text-primary/60 dark:text-secondary/60" />
                  <h4 className="text-sm font-semibold text-foreground mb-1">Riset Terapan &amp; Pengembangan Aktif</h4>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    {member.scholar_url 
                      ? 'Belum ada publikasi terindeks di profil Google Scholar ini.'
                      : 'Fokus aktif pada perancangan sistem, pengujian keamanan terapan, dan pengembangan inovasi lab CSRG PENS.'}
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDetail;