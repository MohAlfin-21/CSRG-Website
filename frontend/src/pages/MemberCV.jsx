import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CVView, { hasCVContent } from '@/components/cv/CVView';
import { BACKEND_URL } from '@/config';

const MemberCV = () => {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    window.scrollTo(0, 0);
    axios.get(`${BACKEND_URL}/api/members/${id}`)
      .then((res) => setMember(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (member?.name) document.title = `CV ${member.name} - CSRG`;
  }, [member]);

  // Fit the A4 page to narrow screens (A4 is ~794px wide at 96dpi)
  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerWidth - 24) / 794));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-28">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !member || !hasCVContent(member.cv_data)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-28 px-4 text-center gap-4">
        <h1 className="text-xl font-bold text-foreground">CV belum tersedia</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          {error ? 'Anggota tidak ditemukan.' : 'Anggota ini belum mengisi CV online.'}
        </p>
        <Link to={error ? '/team' : `/team/${id}`}>
          <Button variant="outline">Kembali</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 pt-24 pb-16 px-3" data-testid="member-cv-page">
      <div className="max-w-[794px] mx-auto mb-4 flex items-center justify-between print:hidden" style={{ width: 794 * scale }}>
        <Link to={`/team/${id}`} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke profil
        </Link>
        <Button size="sm" onClick={() => window.print()} data-testid="cv-download-button">
          <Printer className="w-4 h-4 mr-2" /> Unduh PDF
        </Button>
      </div>
      <div style={{ width: 794 * scale, margin: '0 auto' }}>
        <CVView member={member} cvData={member.cv_data} printable style={{ zoom: scale }} />
      </div>
      <p className="text-center text-xs text-muted-foreground mt-4 print:hidden">
        Di jendela cetak, pilih &quot;Simpan sebagai PDF&quot; dan matikan opsi header/footer.
      </p>
    </div>
  );
};

export default MemberCV;
