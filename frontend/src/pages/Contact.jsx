import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Mail, Send, Clock, Check, Copy, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { API_URL as API } from '@/config';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('csrg@eepis.ac.id');
      setCopiedEmail(true);
      toast.success('Email csrg@eepis.ac.id berhasil disalin!');
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      toast.error('Gagal menyalin email');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Mohon lengkapi semua field');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/contact`, formData);
      toast.success('Pesan berhasil dikirim! Kami akan segera menghubungi Anda.');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error('Gagal mengirim pesan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" data-testid="contact-page">
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
                <MessageSquare className="w-3.5 h-3.5" />
                Hubungi &amp; Kolaborasi
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6" data-testid="contact-title">
              Hubungi Laboratorium CSRG
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Terbuka untuk kolaborasi riset, pengujian sistem keamanan, program magang mahasiswa, maupun kemitraan industri.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20 border-t border-border/50" data-testid="contact-content-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info Cards */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Informasi Operasional Lab</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  Silakan hubungi kami melalui saluran resmi berikut atau kunjungi laboratorium kami secara langsung di kampus PENS.
                </p>
              </div>

              {/* Address Card */}
              <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-border flex items-start space-x-4 shadow-sm" data-testid="contact-address">
                <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-secondary/10 flex items-center justify-center flex-shrink-0 text-primary dark:text-secondary">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-mono text-xs text-primary dark:text-secondary font-semibold uppercase">Lokasi Lab</span>
                  <h3 className="font-bold text-foreground text-base mb-1">Kampus Terpadu PENS</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Politeknik Elektronika Negeri Surabaya (EEPIS)<br />
                    Lab Jarkom &amp; Cyber Defense, Gedung D4 Lt. 3<br />
                    Jl. Raya ITS, Sukolilo, Surabaya 60111
                  </p>
                </div>
              </div>

              {/* Email Card with 1-click copy */}
              <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-border flex items-start justify-between shadow-sm" data-testid="contact-email">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-secondary/10 flex items-center justify-center flex-shrink-0 text-primary dark:text-secondary">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-mono text-xs text-primary dark:text-secondary font-semibold uppercase">Surat Elektronik</span>
                    <h3 className="font-bold text-foreground text-base mb-1">Email Resmi</h3>
                    <p className="text-sm font-mono text-foreground font-medium">csrg@eepis.ac.id</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Respons maksimal 1x24 jam kerja</p>
                  </div>
                </div>
                <button
                  onClick={handleCopyEmail}
                  className="px-3 py-1.5 rounded-lg border border-border bg-slate-50 dark:bg-slate-700/50 hover:bg-primary/10 dark:hover:bg-secondary/10 text-xs font-mono flex items-center gap-1.5 transition-colors"
                  title="Salin Email"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmail ? 'Disalin' : 'Salin'}</span>
                </button>
              </div>

              {/* Working Hours Card */}
              <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-border flex items-start space-x-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-secondary/10 flex items-center justify-center flex-shrink-0 text-primary dark:text-secondary">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-mono text-xs text-primary dark:text-secondary font-semibold uppercase">Jam Operasional</span>
                  <h3 className="font-bold text-foreground text-base mb-1">Jam Riset Laboratorium</h3>
                  <p className="text-sm text-muted-foreground">
                    Senin – Jumat: <span className="font-mono font-medium text-foreground">08:00 – 17:00 WIB</span><br />
                    Sabtu, Minggu &amp; Libur Nasional: <span className="text-muted-foreground italic">Tutup (Online Monitoring Aktif)</span>
                  </p>
                </div>
              </div>

            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-white dark:bg-slate-800/90 rounded-2xl p-8 border border-border shadow-sm flex flex-col justify-between"
            >

              <span className="font-mono text-xs text-primary dark:text-secondary font-semibold uppercase">Tinggalkan Pesan</span>
              <h2 className="text-2xl font-bold text-foreground mt-1 mb-6">Formulir Kontak</h2>
              <form onSubmit={handleSubmit} className="space-y-6" data-testid="contact-form">
                <div>
                  <label htmlFor="name" className="block text-xs font-mono uppercase tracking-wider text-foreground mb-2">
                    Nama Lengkap
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Masukkan nama lengkap Anda"
                    data-testid="contact-form-name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-mono uppercase tracking-wider text-foreground mb-2">
                    Email Kontak
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="nama@institusi.ac.id"
                    data-testid="contact-form-email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-mono uppercase tracking-wider text-foreground mb-2">
                    Pesan atau Usulan Kolaborasi
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Jelaskan kebutuhan riset, usulan kolaborasi, atau pertanyaan Anda..."
                    rows={5}
                    data-testid="contact-form-message"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full group"
                  disabled={loading}
                  data-testid="contact-form-submit"
                >
                  {loading ? (
                    'Mengirim...'
                  ) : (
                    <>
                      Kirim Pesan
                      <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          </div>

          {/* Location Map Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mt-12 bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-border shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary dark:text-secondary" />
                <h3 className="font-bold text-foreground text-base">Lokasi Geografis Laboratorium CSRG PENS</h3>
              </div>
              <span className="font-mono text-xs text-muted-foreground bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-md">
                Koordinat: -7.2769° S, 112.7947° E
              </span>
            </div>
            <div className="aspect-[21/9] min-h-[300px] rounded-xl overflow-hidden border border-border shadow-inner">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3957.3707!2d112.79467!3d-7.27692!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd7fa10ea2ae883%3A0xbe22c55d60ef09c7!2sPoliteknik%20Elektronika%20Negeri%20Surabaya!5e0!3m2!1sen!2sid!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="PENS Location Map"
              />
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default Contact;