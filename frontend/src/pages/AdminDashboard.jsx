import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LogOut,
  Plus,
  Edit,
  Trash2,
  Users,
  Newspaper,
  FileText,
  Mail,
  Search,
  ExternalLink,
  Calendar,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Inbox,
  Send,
  Linkedin,
  GraduationCap,
  Package,
  Globe,
  Github,
  Monitor,
  Lock,
  Shield,
  Zap,
  Check,
  X,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CVEditor, { emptyCV, normalizeCV, prepareCVForSave } from '@/components/cv/CVEditor';
import { hasCVContent } from '@/components/cv/CVView';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { API_URL as API, resolveMediaUrl } from '@/config';

// ─── Icon map for product icon picker ────────────────────────────────────────
const ICON_OPTIONS = ['Shield', 'Globe', 'Zap', 'Monitor'];
const ICON_MAP = { Shield, Globe, Zap, Monitor };

// ─── Status & Category presets ────────────────────────────────────────────────
const STATUS_OPTIONS = ['Active Stable', 'Beta', 'In Development', 'Deprecated'];
const GRADIENT_OPTIONS = [
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-purple-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-red-500',
  'from-yellow-500 to-amber-500',
  'from-pink-500 to-rose-500',
];

// ─── Helper ───────────────────────────────────────────────────────────────────
const resolveImageUrl = (url, filename) => {
  return resolveMediaUrl(url || filename);
};

// ─── Mini Browser Mockup (Product card preview) ───────────────────────────────
const BrowserMockup = ({ product }) => {
  const IconComp = ICON_MAP[product.icon_name] || Shield;
  const logoUrl = resolveImageUrl(product.image_url, product.image_filename);
  const previewImg = resolveImageUrl(product.preview_light_url, product.preview_light_filename);
  const websiteHost = (() => {
    try { return new URL(product.website || '').hostname; } catch { return product.website || product.name; }
  })();

  return (
    <div className="rounded-xl overflow-hidden border border-border shadow-lg">
      {/* Browser bar */}
      <div className="bg-slate-100 dark:bg-slate-800 border-b border-border px-3 py-2 flex items-center gap-2">
        <div className="flex gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white dark:bg-slate-700 rounded px-2 py-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground border border-border truncate">
          <Lock className="w-2.5 h-2.5 text-green-500 flex-shrink-0" />
          <span className="truncate">{websiteHost || product.name}</span>
        </div>
      </div>
      {/* Preview body */}
      {previewImg ? (
        <img src={previewImg} alt={`${product.name} preview`} className="w-full object-cover max-h-44" />
      ) : (
        <div className={`h-36 bg-gradient-to-br ${product.color || 'from-blue-500 to-cyan-500'} flex items-center justify-center`}>
          {logoUrl
            ? <img src={logoUrl} alt={product.name} className="w-16 h-16 object-contain opacity-70" />
            : <IconComp className="w-14 h-14 text-white/40" />
          }
        </div>
      )}
      {/* Product name strip */}
      <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-border">
        <p className="text-xs font-semibold text-foreground truncate">{product.name || '—'}</p>
        <p className="text-[10px] text-muted-foreground truncate">{product.tagline || 'Tagline produk'}</p>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [news, setNews] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [memberSearch, setMemberSearch] = useState('');
  const [newsSearch, setNewsSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Pagination state for members
  const [memberCurrentPage, setMemberCurrentPage] = useState(1);
  const memberPageSize = 9;

  // Dialog states
  const [memberDialog, setMemberDialog] = useState(false);
  const [newsDialog, setNewsDialog] = useState(false);
  const [productDialog, setProductDialog] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editingNews, setEditingNews] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form states
  const [memberForm, setMemberForm] = useState({
    name: '',
    position: '',
    research_area: '',
    photo_url: '',
    linkedin_url: '',
    scholar_url: '',
    cv_url: '',
    cv_data: emptyCV(),
    photo_filename: '',
    cv_filename: '',
  });

  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    thumbnail_url: '',
    thumbnail_filename: '',
  });

  const defaultProductForm = {
    name: '',
    tagline: '',
    description: '',
    tags: '',           // comma-separated string; converted to array on submit
    features: '',       // newline-separated; converted to array on submit
    icon_name: 'Shield',
    image_url: '',
    image_filename: '',
    preview_light_url: '',
    preview_light_filename: '',
    preview_dark_url: '',
    preview_dark_filename: '',
    website: '',
    github: '',
    live_preview_url: '',
    status: 'Active Stable',
    category: 'Security Monitoring',
    color: 'from-blue-500 to-cyan-500',
  };
  const [productForm, setProductForm] = useState(defaultProductForm);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get(`${API}/auth/me`, { withCredentials: true });
        fetchData();
      } catch {
        navigate('/admin/login', { replace: true });
      }
    };
    checkAuth();
  }, [navigate]);

  /**
   * All protected axios calls use withCredentials: true.
   * The browser automatically sends the httpOnly 'admin_token' cookie.
   */
  const getAuthHeader = () => ({ withCredentials: true, headers: {} });

  const fetchData = async () => {
    try {
      const [membersRes, newsRes, contactsRes, productsRes] = await Promise.all([
        axios.get(`${API}/members`),
        axios.get(`${API}/news`),
        axios.get(`${API}/contact`, getAuthHeader()).catch((err) => {
          console.warn('Failed to fetch contact inquiries:', err);
          return { data: [] };
        }),
        axios.get(`${API}/products`).catch((err) => {
          console.warn('Failed to fetch products:', err);
          return { data: [] };
        }),
      ]);
      setMembers(membersRes.data || []);
      setNews(newsRes.data || []);
      setContacts(contactsRes.data || []);
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch {
      // Ignore network errors on logout
    }
    navigate('/admin/login');
    toast.success('Logged out successfully');
  };

  // ── Member CRUD ──────────────────────────────────────────────────────────────
  const openMemberDialog = (member = null) => {
    if (member) {
      setEditingMember(member);
      setMemberForm({
        name: member.name || '',
        position: member.position || '',
        research_area: member.research_area || '',
        photo_url: member.photo_url || '',
        linkedin_url: member.linkedin_url || '',
        scholar_url: member.scholar_url || '',
        cv_url: member.cv_url || '',
        cv_data: normalizeCV(member.cv_data),
        photo_filename: member.photo_filename || '',
        cv_filename: member.cv_filename || '',
      });
    } else {
      setEditingMember(null);
      setMemberForm({
        name: '',
        position: '',
        research_area: '',
        photo_url: '',
        linkedin_url: '',
        scholar_url: '',
        cv_url: '',
        cv_data: emptyCV(),
        photo_filename: '',
        cv_filename: '',
      });
    }
    setMemberDialog(true);
  };

  const handleMemberSubmit = async (e) => {
    e.preventDefault();
    if (!memberForm.name || !memberForm.name.trim()) {
      toast.error('Nama Lengkap & Gelar wajib diisi (cek tab Profil)');
      return;
    }
    if (!memberForm.position || !memberForm.position.trim()) {
      toast.error('Posisi / Peran di CSRG wajib diisi (cek tab Profil)');
      return;
    }
    if (!memberForm.photo_url || !memberForm.photo_url.trim()) {
      toast.error('Foto profil wajib diisi atau diunggah (cek tab Profil)');
      return;
    }
    try {
      const payload = { ...memberForm, cv_data: prepareCVForSave(normalizeCV(memberForm.cv_data)) };
      if (editingMember) {
        await axios.put(`${API}/members/${editingMember.id}`, payload, getAuthHeader());
        toast.success('Member updated successfully');
      } else {
        await axios.post(`${API}/members`, payload, getAuthHeader());
        toast.success('Member added successfully');
      }
      setMemberDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error saving member:', error);
      const detail = error.response?.data?.detail;
      toast.error(Array.isArray(detail) ? `Data tidak valid: ${detail[0]?.msg || ''}` : 'Failed to save member');
    }
  };

  const handleDeleteMember = async (id) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      await axios.delete(`${API}/members/${id}`, getAuthHeader());
      toast.success('Member deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Failed to delete member');
    }
  };

  // ── News CRUD ────────────────────────────────────────────────────────────────
  const openNewsDialog = (article = null) => {
    if (article) {
      setEditingNews(article);
      setNewsForm({
        title: article.title || '',
        content: article.content || '',
        excerpt: article.excerpt || '',
        thumbnail_url: article.thumbnail_url || '',
        thumbnail_filename: article.thumbnail_filename || '',
      });
    } else {
      setEditingNews(null);
      setNewsForm({
        title: '',
        content: '',
        excerpt: '',
        thumbnail_url: '',
        thumbnail_filename: '',
      });
    }
    setNewsDialog(true);
  };

  const handleNewsSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNews) {
        await axios.put(`${API}/news/${editingNews.id}`, newsForm, getAuthHeader());
        toast.success('News updated successfully');
      } else {
        await axios.post(`${API}/news`, newsForm, getAuthHeader());
        toast.success('News added successfully');
      }
      setNewsDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error saving news:', error);
      toast.error('Failed to save news');
    }
  };

  const handleDeleteNews = async (id) => {
    if (!window.confirm('Are you sure you want to delete this news?')) return;
    try {
      await axios.delete(`${API}/news/${id}`, getAuthHeader());
      toast.success('News deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting news:', error);
      toast.error('Failed to delete news');
    }
  };

  // ── Contact Inquiries ────────────────────────────────────────────────────────
  const handleDeleteContact = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pesan kontak ini?')) return;
    try {
      await axios.delete(`${API}/contact/${id}`, getAuthHeader());
      toast.success('Pesan kontak berhasil dihapus');
      fetchData();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Gagal menghapus pesan kontak');
    }
  };

  // ── Product CRUD ─────────────────────────────────────────────────────────────
  const openProductDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name || '',
        tagline: product.tagline || '',
        description: product.description || '',
        tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || ''),
        features: Array.isArray(product.features) ? product.features.join('\n') : (product.features || ''),
        icon_name: product.icon_name || 'Shield',
        image_url: product.image_url || '',
        image_filename: product.image_filename || '',
        preview_light_url: product.preview_light_url || '',
        preview_light_filename: product.preview_light_filename || '',
        preview_dark_url: product.preview_dark_url || '',
        preview_dark_filename: product.preview_dark_filename || '',
        website: product.website || '',
        github: product.github || '',
        live_preview_url: product.live_preview_url || '',
        status: product.status || 'Active Stable',
        category: product.category || 'Security Monitoring',
        color: product.color || 'from-blue-500 to-cyan-500',
      });
    } else {
      setEditingProduct(null);
      setProductForm(defaultProductForm);
    }
    setProductDialog(true);
  };

  /** Convert form's string fields → arrays for API */
  const buildProductPayload = (form) => ({
    ...form,
    tags: form.tags
      ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [],
    features: form.features
      ? form.features.split('\n').map((f) => f.trim()).filter(Boolean)
      : [],
  });

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const payload = buildProductPayload(productForm);
    try {
      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, payload, getAuthHeader());
        toast.success('Produk berhasil diperbarui');
      } else {
        await axios.post(`${API}/products`, payload, getAuthHeader());
        toast.success('Produk berhasil ditambahkan');
      }
      setProductDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Gagal menyimpan produk');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    try {
      await axios.delete(`${API}/products/${id}`, getAuthHeader());
      toast.success('Produk berhasil dihapus');
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Gagal menghapus produk');
    }
  };

  /** Upload helper reused across all image fields */
  const uploadImage = async (file, onSuccess) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post(`${API}/upload/image`, formData, {
        ...getAuthHeader(),
        headers: { ...getAuthHeader().headers, 'Content-Type': 'multipart/form-data' },
      });
      onSuccess(response.data);
      toast.success('Gambar berhasil diunggah!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Gagal mengunggah gambar');
    }
  };

  // ── Filtered lists ────────────────────────────────────────────────────────────
  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase();
    return (
      (m.name || '').toLowerCase().includes(q) ||
      (m.position || '').toLowerCase().includes(q) ||
      (m.research_area || '').toLowerCase().includes(q)
    );
  });

  const filteredNews = news.filter((n) => {
    const q = newsSearch.toLowerCase();
    return (
      (n.title || '').toLowerCase().includes(q) ||
      (n.excerpt || '').toLowerCase().includes(q)
    );
  });

  const filteredContacts = contacts.filter((c) => {
    const q = contactSearch.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.message || '').toLowerCase().includes(q)
    );
  });

  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.tagline || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  });

  // ── Live preview product (from form, for dialog sidebar) ──────────────────────
  const livePreviewProduct = {
    ...buildProductPayload(productForm),
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm font-mono text-muted-foreground">Memuat Admin Dashboard CSRG...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950" data-testid="admin-dashboard">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mt-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">CSRG Control Panel</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground mt-0.5" data-testid="dashboard-title">
                Dashboard Manajemen Lab
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleLogout} data-testid="logout-button" className="rounded-xl border-border">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 border border-border/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Anggota Riset</p>
              <h3 className="text-3xl font-bold text-foreground mt-1">{members.length}</h3>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Peneliti, Dosen &amp; Mahasiswa
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-secondary/10 flex items-center justify-center text-primary dark:text-secondary">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-border/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Artikel Berita</p>
              <h3 className="text-3xl font-bold text-foreground mt-1">{news.length}</h3>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                Publikasi &amp; Agenda Riset
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Newspaper className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-border/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Produk</p>
              <h3 className="text-3xl font-bold text-foreground mt-1">{products.length}</h3>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                Inovasi &amp; Open Source
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
              <Package className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-border/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Pesan Masuk</p>
              <h3 className="text-3xl font-bold text-foreground mt-1">{contacts.length}</h3>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                Inquiry Formulir Kontak
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Mail className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-xl h-11 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl mb-6">
            <TabsTrigger value="members" data-testid="tab-members" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm text-xs sm:text-sm">
              <Users className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Anggota </span>({members.length})
            </TabsTrigger>
            <TabsTrigger value="news" data-testid="tab-news" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm text-xs sm:text-sm">
              <Newspaper className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Berita </span>({news.length})
            </TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm text-xs sm:text-sm">
              <Package className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Produk </span>({products.length})
            </TabsTrigger>
            <TabsTrigger value="contacts" data-testid="tab-contacts" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm text-xs sm:text-sm">
              <Mail className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Pesan </span>({contacts.length})
            </TabsTrigger>
          </TabsList>

          {/* ── Members Tab ── */}
          <TabsContent value="members">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, posisi, atau bidang riset..."
                  value={memberSearch}
                  onChange={(e) => {
                    setMemberSearch(e.target.value);
                    setMemberCurrentPage(1);
                  }}
                  className="pl-9 bg-white dark:bg-slate-900 rounded-xl border-border"
                />
              </div>
              <Button onClick={() => openMemberDialog()} data-testid="add-member-button" className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Anggota
              </Button>
            </div>

            {/* Members Grid */}
            {(() => {
              const totalPages = Math.ceil(filteredMembers.length / memberPageSize);
              const startIndex = (memberCurrentPage - 1) * memberPageSize;
              const paginatedMembers = filteredMembers.slice(startIndex, startIndex + memberPageSize);

              if (filteredMembers.length === 0) {
                return (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-border">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <h3 className="font-semibold text-foreground">Tidak ada anggota ditemukan</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {memberSearch ? 'Coba ubah kata kunci pencarian Anda.' : 'Belum ada data anggota yang ditambahkan.'}
                    </p>
                  </div>
                );
              }

              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                    {paginatedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-border shadow-sm flex flex-col justify-between hover:border-primary/40 dark:hover:border-secondary/40 transition-colors"
                        data-testid={`member-item-${member.id}`}
                      >
                        <div>
                          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3">
                            <img
                              src={resolveMediaUrl(member.photo_url)}
                              alt={member.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=0284c7&color=fff&size=256`;
                              }}
                            />
                            {member.research_area && (
                              <div className="absolute bottom-2 left-2 right-2">
                                <span className="inline-block max-w-full truncate font-mono text-[10px] bg-black/70 backdrop-blur-md text-secondary border border-secondary/30 px-2 py-0.5 rounded-md">
                                  #{member.research_area}
                                </span>
                              </div>
                            )}
                          </div>
                          <h3 className="font-semibold text-foreground truncate">{member.name}</h3>
                          <p className="text-xs text-muted-foreground truncate mb-2">{member.position}</p>

                          {/* Profile Asset Badges */}
                          <div className="flex items-center gap-2 mb-3">
                            {member.scholar_url ? (
                              <span className="inline-flex items-center text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                <GraduationCap className="w-3 h-3 mr-1" /> Scholar
                              </span>
                            ) : null}
                            {member.cv_url ? (
                              <span className="inline-flex items-center text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                                <FileText className="w-3 h-3 mr-1" /> CV
                              </span>
                            ) : null}
                            {member.linkedin_url ? (
                              <span className="inline-flex items-center text-[10px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                                <Linkedin className="w-3 h-3 mr-1" /> LinkedIn
                              </span>
                            ) : null}
                            {hasCVContent(member.cv_data) ? (
                              <a
                                href={`/team/${member.id}/cv`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-1.5 py-0.5 rounded transition-colors"
                                title="Lihat CV Online"
                              >
                                <FileText className="w-3 h-3 mr-1" /> CV Online
                              </a>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border/60">
                          <Button size="sm" variant="outline" onClick={() => openMemberDialog(member)} data-testid={`edit-member-${member.id}`} className="rounded-lg h-8 px-2.5">
                            <Edit className="w-3.5 h-3.5 mr-1.5" />
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteMember(member.id)} data-testid={`delete-member-${member.id}`} className="rounded-lg h-8 px-2.5">
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMemberCurrentPage(Math.max(1, memberCurrentPage - 1))}
                        disabled={memberCurrentPage === 1}
                        className="rounded-lg"
                        data-testid="prev-page-button"
                      >
                        Previous
                      </Button>

                      {Array.from({ length: totalPages }).map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setMemberCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                              memberCurrentPage === pageNum
                                ? 'bg-primary text-white dark:bg-secondary dark:text-slate-900'
                                : 'border border-border hover:bg-primary/10'
                            }`}
                            data-testid={`member-page-${pageNum}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMemberCurrentPage(Math.min(totalPages, memberCurrentPage + 1))}
                        disabled={memberCurrentPage === totalPages}
                        className="rounded-lg"
                        data-testid="next-page-button"
                      >
                        Next
                      </Button>

                      <span className="text-xs text-muted-foreground ml-2">
                        Halaman {memberCurrentPage} dari {totalPages} ({filteredMembers.length} anggota)
                      </span>
                    </div>
                  )}
                </>
              );
            })()}
          </TabsContent>

          {/* ── News Tab ── */}
          <TabsContent value="news">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari judul atau ringkasan berita..."
                  value={newsSearch}
                  onChange={(e) => setNewsSearch(e.target.value)}
                  className="pl-9 bg-white dark:bg-slate-900 rounded-xl border-border"
                />
              </div>
              <Button onClick={() => openNewsDialog()} data-testid="add-news-button" className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Berita
              </Button>
            </div>

            {filteredNews.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-border">
                <Newspaper className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <h3 className="font-semibold text-foreground">Tidak ada berita ditemukan</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {newsSearch ? 'Coba ubah kata kunci pencarian berita Anda.' : 'Belum ada artikel berita yang dipublikasikan.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNews.map((article) => (
                  <div
                    key={article.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:border-primary/40 dark:hover:border-secondary/40 transition-colors"
                    data-testid={`news-item-${article.id}`}
                  >
                    <div className="w-full sm:w-36 h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                      <img
                        src={resolveMediaUrl(article.thumbnail_url)}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&q=80';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {article.published_date
                            ? new Date(article.published_date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Tanggal tidak tersedia'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{article.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{article.excerpt}</p>
                    </div>
                    <div className="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => openNewsDialog(article)} data-testid={`edit-news-${article.id}`} className="rounded-lg h-8 px-2.5">
                        <Edit className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteNews(article.id)} data-testid={`delete-news-${article.id}`} className="rounded-lg h-8 px-2.5">
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Hapus
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Products Tab ── */}
          <TabsContent value="products">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, tagline, atau kategori..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9 bg-white dark:bg-slate-900 rounded-xl border-border"
                />
              </div>
              <Button onClick={() => openProductDialog()} data-testid="add-product-button" className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Produk
              </Button>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-border">
                <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <h3 className="font-semibold text-foreground">Tidak ada produk ditemukan</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {productSearch ? 'Coba ubah kata kunci pencarian.' : 'Belum ada produk yang ditambahkan.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProducts.map((product) => {
                  const IconComp = ICON_MAP[product.icon_name] || Shield;
                  const logoUrl = resolveImageUrl(product.image_url, product.image_filename);
                  const previewImg = resolveImageUrl(product.preview_light_url, product.preview_light_filename);

                  return (
                    <div
                      key={product.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-sm overflow-hidden hover:border-violet-400/50 transition-colors"
                      data-testid={`product-item-${product.id}`}
                    >
                      {/* Mini browser mockup */}
                      <div className="border-b border-border">
                        <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                            <span className="w-2 h-2 rounded-full bg-yellow-400" />
                            <span className="w-2 h-2 rounded-full bg-green-400" />
                          </div>
                          <div className="flex-1 bg-white dark:bg-slate-700 rounded px-2 py-0.5 flex items-center gap-1 text-[10px] text-muted-foreground border border-border truncate">
                            <Lock className="w-2 h-2 text-green-500 flex-shrink-0" />
                            <span className="truncate">
                              {(() => { try { return new URL(product.website || '').hostname; } catch { return product.website || product.name; } })()}
                            </span>
                          </div>
                        </div>
                        {previewImg ? (
                          <img src={previewImg} alt={product.name} className="w-full h-36 object-cover" />
                        ) : (
                          <div className={`h-28 bg-gradient-to-br ${product.color} flex items-center justify-center`}>
                            {logoUrl
                              ? <img src={logoUrl} alt={product.name} className="w-14 h-14 object-contain opacity-60" />
                              : <IconComp className="w-12 h-12 text-white/40" />
                            }
                          </div>
                        )}
                      </div>

                      {/* Card info */}
                      <div className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          {logoUrl ? (
                            <img src={logoUrl} alt={product.name} className="w-9 h-9 rounded-lg object-contain bg-slate-100 dark:bg-slate-800 p-1 flex-shrink-0" />
                          ) : (
                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${product.color} flex items-center justify-center flex-shrink-0`}>
                              <IconComp className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                            <p className="text-[11px] text-muted-foreground truncate">{product.tagline}</p>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                            product.status === 'Active Stable'
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                              : product.status === 'Beta'
                              ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
                              : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                          }`}>
                            {product.status}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20">
                            {product.category}
                          </span>
                          {product.live_preview_url && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                              Live Preview
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                          <Button size="sm" variant="outline" onClick={() => openProductDialog(product)} data-testid={`edit-product-${product.id}`} className="rounded-lg h-8 px-2.5">
                            <Edit className="w-3.5 h-3.5 mr-1.5" />
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(product.id)} data-testid={`delete-product-${product.id}`} className="rounded-lg h-8 px-2.5">
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Contact Inquiries Tab ── */}
          <TabsContent value="contacts">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari pengirim, email, atau pesan..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="pl-9 bg-white dark:bg-slate-900 rounded-xl border-border"
                />
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                Total pesan: {filteredContacts.length}
              </div>
            </div>

            {filteredContacts.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-border">
                <Inbox className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <h3 className="font-semibold text-foreground">Kotak Masuk Kosong</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {contactSearch
                    ? 'Tidak ada pesan yang cocok dengan kata kunci pencarian.'
                    : 'Belum ada pesan inquiry baru yang dikirim melalui formulir kontak publik.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-border shadow-sm flex flex-col gap-3 hover:border-primary/40 dark:hover:border-secondary/40 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground text-sm">{contact.name}</h3>
                          <span className="font-mono text-xs text-muted-foreground">({contact.email})</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Dikirim pada:{' '}
                          {contact.created_at
                            ? new Date(contact.created_at).toLocaleString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }) + ' WIB'
                            : 'Waktu tidak tersedia'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`mailto:${contact.email}?subject=Tanggapan Inquiry CSRG PENS`}
                          className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-primary/30 text-primary dark:text-secondary hover:bg-primary/10 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Balas Email
                        </a>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteContact(contact.id)}
                          className="rounded-lg h-8 px-2.5"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Hapus
                        </Button>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 text-sm text-foreground whitespace-pre-wrap font-sans border border-border/40">
                      {contact.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ══════════════════════════════════════════════════
          Member Dialog
      ══════════════════════════════════════════════════ */}
      <Dialog open={memberDialog} onOpenChange={setMemberDialog}>
        <DialogContent data-testid="member-dialog" className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMember ? 'Edit Anggota Riset' : 'Tambah Anggota Riset'}</DialogTitle>
            <DialogDescription>Lengkapi informasi peneliti, dosen, atau mahasiswa CSRG di bawah ini.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMemberSubmit} noValidate className="space-y-4">
            <Tabs defaultValue="profil" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profil" data-testid="member-tab-profil">Profil</TabsTrigger>
                <TabsTrigger value="cv" data-testid="member-tab-cv">CV Online</TabsTrigger>
              </TabsList>
              <TabsContent value="profil" className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nama Lengkap &amp; Gelar *</label>
              <Input
                placeholder="Contoh: Dr. Ferry Astika Hermawati, S.T., M.Sc."
                value={memberForm.name}
                onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                required
                data-testid="member-form-name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Posisi / Peran di CSRG *</label>
              <Input
                placeholder="Contoh: Principal Researcher / Peneliti Utama / Student Researcher"
                value={memberForm.position}
                onChange={(e) => setMemberForm({ ...memberForm, position: e.target.value })}
                required
                data-testid="member-form-position"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Bidang Riset / Research Area (Opsional)</label>
              <Input
                placeholder="Contoh: Network Security, AI Forensics, Cryptography, Cloud Security"
                value={memberForm.research_area}
                onChange={(e) => setMemberForm({ ...memberForm, research_area: e.target.value })}
                data-testid="member-form-research-area"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Foto Profil *</label>
              <div className="flex gap-2">
                <Input
                  placeholder="URL Foto atau Unggah File"
                  value={memberForm.photo_url}
                  onChange={(e) => setMemberForm({ ...memberForm, photo_url: e.target.value })}
                  required
                  data-testid="member-form-photo"
                />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      await uploadImage(file, (data) => {
                        setMemberForm((prev) => ({ ...prev, photo_url: data.url, photo_filename: data.filename }));
                      });
                    }
                  }}
                  className="max-w-[150px]"
                  data-testid="member-form-photo-upload"
                />
              </div>
              {memberForm.photo_url && (
                <img
                  src={resolveMediaUrl(memberForm.photo_url)}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-xl border border-border"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">URL LinkedIn (Opsional)</label>
              <Input
                placeholder="https://linkedin.com/in/username"
                value={memberForm.linkedin_url}
                onChange={(e) => setMemberForm({ ...memberForm, linkedin_url: e.target.value })}
                data-testid="member-form-linkedin"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">URL Google Scholar (Opsional)</label>
              <Input
                placeholder="https://scholar.google.com/citations?user=..."
                value={memberForm.scholar_url}
                onChange={(e) => setMemberForm({ ...memberForm, scholar_url: e.target.value })}
                data-testid="member-form-scholar"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Curriculum Vitae / CV (Opsional)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="URL Dokumen CV atau Unggah Dokumen"
                  value={memberForm.cv_url}
                  onChange={(e) => setMemberForm({ ...memberForm, cv_url: e.target.value })}
                  data-testid="member-form-cv"
                />
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.odt,.rtf,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text,application/rtf,text/plain"
                  onClick={(e) => { e.target.value = null; }}
                  onChange={async (e) => {
                    e.preventDefault();
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const maxSize = 10 * 1024 * 1024;
                    if (file.size > maxSize) {
                      toast.error('Ukuran file melebihi batas 10MB');
                      return;
                    }

                    const formData = new FormData();
                    formData.append('file', file);
                    toast.loading('Mengunggah CV...');

                    setMemberForm((prev) => ({ ...prev, cv_url: '', cv_filename: '' }));

                    try {
                      const response = await axios.post(`${API}/upload/cv`, formData, {
                        ...getAuthHeader(),
                        headers: { ...getAuthHeader().headers, 'Content-Type': 'multipart/form-data' },
                      });

                      const cvKey = response.data?.key || response.data?.url;
                      if (cvKey) {
                        setMemberForm((prev) => ({ ...prev, cv_url: cvKey, cv_filename: response.data.filename }));
                        toast.dismiss();
                        toast.success('CV berhasil diunggah!');
                      } else {
                        throw new Error('Invalid response from server');
                      }
                    } catch (error) {
                      console.error('Error uploading CV:', error);
                      toast.dismiss();
                      toast.error(
                        error.response?.data?.detail ||
                          'Gagal mengunggah CV. Pastikan format file didukung (PDF, DOC, DOCX).'
                      );
                      setMemberForm((prev) => ({ ...prev, cv_url: '', cv_filename: '' }));
                      e.target.value = null;
                    }
                  }}
                  className="max-w-[150px]"
                  data-testid="member-form-cv-upload"
                />
              </div>
              {memberForm.cv_url && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="w-3.5 h-3.5 text-primary dark:text-secondary" />
                  <a
                    href={(() => {
                      const trimmed = memberForm.cv_url.trim();
                      const MANAGED_KEY_REGEX = /^cv\/([0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_.*)\.(pdf|doc|docx)$/i;
                      const isManaged =
                        MANAGED_KEY_REGEX.test(trimmed) ||
                        trimmed.startsWith('/uploads/cv/') ||
                        trimmed.includes('/csrg-media/cv/');

                      if (isManaged) {
                        const cleanKey = trimmed.includes('cv/')
                          ? 'cv/' + trimmed.split('cv/').pop().split('?')[0]
                          : trimmed.split('/').pop().split('?')[0];
                        return `${API}/preview/cv/${cleanKey}`;
                      }

                      if (trimmed.startsWith('https://')) {
                        return trimmed;
                      }

                      return '#';
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline font-mono"
                  >
                    Lihat Dokumen CV Terunggah
                  </a>
                </div>
              )}
            </div>
              </TabsContent>

              <TabsContent value="cv" className="mt-4">
                <CVEditor
                  value={memberForm.cv_data}
                  onChange={(cv_data) => setMemberForm((prev) => ({ ...prev, cv_data }))}
                  member={{ name: memberForm.name, photo_url: memberForm.photo_url }}
                  uploadImage={uploadImage}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter className="pt-2">
              <Button type="submit" data-testid="member-form-submit" className="rounded-xl">
                {editingMember ? 'Simpan Perubahan' : 'Tambah Anggota'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════
          News Dialog
      ══════════════════════════════════════════════════ */}
      <Dialog open={newsDialog} onOpenChange={setNewsDialog}>
        <DialogContent data-testid="news-dialog" className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNews ? 'Edit Berita' : 'Tambah Berita Riset'}</DialogTitle>
            <DialogDescription>Tulis pengumuman riset, liputan kegiatan, atau artikel laboratorium.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNewsSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Judul Berita *</label>
              <Input
                placeholder="Judul artikel atau berita"
                value={newsForm.title}
                onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                required
                data-testid="news-form-title"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Ringkasan / Excerpt *</label>
              <Textarea
                placeholder="Ringkasan singkat untuk tampilan kartu preview (1-2 kalimat)"
                value={newsForm.excerpt}
                onChange={(e) => setNewsForm({ ...newsForm, excerpt: e.target.value })}
                required
                rows={2}
                data-testid="news-form-excerpt"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Konten Lengkap Berita *</label>
              <Textarea
                placeholder="Tulis artikel berita selengkapnya di sini..."
                value={newsForm.content}
                onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                rows={6}
                required
                data-testid="news-form-content"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Gambar Thumbnail *</label>
              <div className="flex gap-2">
                <Input
                  placeholder="URL Gambar Thumbnail atau Unggah File"
                  value={newsForm.thumbnail_url}
                  onChange={(e) => setNewsForm({ ...newsForm, thumbnail_url: e.target.value })}
                  required
                  data-testid="news-form-thumbnail"
                />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      await uploadImage(file, (data) => {
                        setNewsForm((prev) => ({ ...prev, thumbnail_url: data.url, thumbnail_filename: data.filename }));
                      });
                    }
                  }}
                  className="max-w-[150px]"
                  data-testid="news-form-thumbnail-upload"
                />
              </div>
              {newsForm.thumbnail_url && (
                <img
                  src={resolveMediaUrl(newsForm.thumbnail_url)}
                  alt="Preview"
                  className="w-32 h-20 object-cover rounded-xl border border-border"
                />
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="submit" data-testid="news-form-submit" className="rounded-xl">
                {editingNews ? 'Simpan Perubahan' : 'Publikasikan Berita'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════
          Product Dialog  — form + live preview side-by-side
      ══════════════════════════════════════════════════ */}
      <Dialog open={productDialog} onOpenChange={setProductDialog}>
        <DialogContent
          data-testid="product-dialog"
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
            <DialogDescription>
              Isi detail produk di sebelah kiri. Preview browser mockup langsung muncul di sebelah kanan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProductSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ── Left: Form fields ── */}
              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Nama Produk *</label>
                  <Input
                    placeholder="Contoh: Mata Elang"
                    value={productForm.name}
                    onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                    required
                    data-testid="product-form-name"
                  />
                </div>

                {/* Tagline */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Tagline *</label>
                  <Input
                    placeholder="Contoh: Network Intrusion Detection System"
                    value={productForm.tagline}
                    onChange={(e) => setProductForm((p) => ({ ...p, tagline: e.target.value }))}
                    required
                    data-testid="product-form-tagline"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Deskripsi *</label>
                  <Textarea
                    placeholder="Deskripsi lengkap produk..."
                    value={productForm.description}
                    onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    required
                    data-testid="product-form-description"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Tags <span className="text-muted-foreground/60">(pisahkan dengan koma)</span>
                  </label>
                  <Input
                    placeholder="#NIDS, #Suricata, #Machine Learning, #Open Source"
                    value={productForm.tags}
                    onChange={(e) => setProductForm((p) => ({ ...p, tags: e.target.value }))}
                    data-testid="product-form-tags"
                  />
                </div>

                {/* Features */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Fitur <span className="text-muted-foreground/60">(satu baris = satu fitur)</span>
                  </label>
                  <Textarea
                    placeholder={"Real-time network monitoring\nAnomaly detection via ML\nOpen source & customizable"}
                    value={productForm.features}
                    onChange={(e) => setProductForm((p) => ({ ...p, features: e.target.value }))}
                    rows={4}
                    data-testid="product-form-features"
                  />
                </div>

                {/* Icon & Gradient row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Icon</label>
                    <select
                      value={productForm.icon_name}
                      onChange={(e) => setProductForm((p) => ({ ...p, icon_name: e.target.value }))}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {ICON_OPTIONS.map((icon) => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Warna Gradien</label>
                    <select
                      value={productForm.color}
                      onChange={(e) => setProductForm((p) => ({ ...p, color: e.target.value }))}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {GRADIENT_OPTIONS.map((g) => (
                        <option key={g} value={g}>{g.replace('from-', '').replace(' to-', ' → ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status & Category row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <select
                      value={productForm.status}
                      onChange={(e) => setProductForm((p) => ({ ...p, status: e.target.value }))}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Kategori</label>
                    <Input
                      placeholder="Security Monitoring"
                      value={productForm.category}
                      onChange={(e) => setProductForm((p) => ({ ...p, category: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Logo image upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Logo / Gambar Produk</label>
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="URL gambar logo"
                      value={productForm.image_url}
                      onChange={(e) => setProductForm((p) => ({ ...p, image_url: e.target.value }))}
                    />
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          await uploadImage(file, (data) =>
                            setProductForm((p) => ({ ...p, image_url: data.url, image_filename: data.filename }))
                          );
                        }
                      }}
                      className="max-w-[130px]"
                    />
                  </div>
                  {productForm.image_url && (
                    <img
                      src={resolveImageUrl(productForm.image_url, productForm.image_filename)}
                      alt="logo preview"
                      className="w-16 h-16 object-contain rounded-lg border border-border bg-slate-50 dark:bg-slate-800 p-1"
                    />
                  )}
                </div>

                {/* Preview Light image */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Screenshot Preview (Light mode)</label>
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="URL screenshot light"
                      value={productForm.preview_light_url}
                      onChange={(e) => setProductForm((p) => ({ ...p, preview_light_url: e.target.value }))}
                    />
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          await uploadImage(file, (data) =>
                            setProductForm((p) => ({ ...p, preview_light_url: data.url, preview_light_filename: data.filename }))
                          );
                        }
                      }}
                      className="max-w-[130px]"
                    />
                  </div>
                  {productForm.preview_light_url && (
                    <img
                      src={resolveImageUrl(productForm.preview_light_url, productForm.preview_light_filename)}
                      alt="light preview"
                      className="w-full max-h-28 object-cover rounded-lg border border-border"
                    />
                  )}
                </div>

                {/* Preview Dark image */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Screenshot Preview (Dark mode)</label>
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="URL screenshot dark"
                      value={productForm.preview_dark_url}
                      onChange={(e) => setProductForm((p) => ({ ...p, preview_dark_url: e.target.value }))}
                    />
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          await uploadImage(file, (data) =>
                            setProductForm((p) => ({ ...p, preview_dark_url: data.url, preview_dark_filename: data.filename }))
                          );
                        }
                      }}
                      className="max-w-[130px]"
                    />
                  </div>
                  {productForm.preview_dark_url && (
                    <img
                      src={resolveImageUrl(productForm.preview_dark_url, productForm.preview_dark_filename)}
                      alt="dark preview"
                      className="w-full max-h-28 object-cover rounded-lg border border-border"
                    />
                  )}
                </div>

                {/* URL fields */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">URL Website</label>
                  <Input
                    placeholder="https://mataelang.net"
                    value={productForm.website}
                    onChange={(e) => setProductForm((p) => ({ ...p, website: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">URL GitHub</label>
                  <Input
                    placeholder="https://github.com/org/repo"
                    value={productForm.github}
                    onChange={(e) => setProductForm((p) => ({ ...p, github: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Live Preview URL
                    <span className="ml-1 text-muted-foreground/60">(iframe — biarkan kosong jika tidak ada)</span>
                  </label>
                  <Input
                    placeholder="https://mataelang.net"
                    value={productForm.live_preview_url}
                    onChange={(e) => setProductForm((p) => ({ ...p, live_preview_url: e.target.value }))}
                  />
                </div>
              </div>

              {/* ── Right: Live preview ── */}
              <div className="lg:sticky lg:top-4 space-y-3 self-start">
                <div className="flex items-center gap-2 mb-1">
                  <Monitor className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Preview</span>
                  <span className="ml-auto text-[10px] font-mono text-muted-foreground/60 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">real-time</span>
                </div>

                {/* Browser Mockup Preview — updates as you type */}
                <BrowserMockup product={livePreviewProduct} />

                {/* Feature list preview */}
                {livePreviewProduct.features?.length > 0 && (
                  <div className="rounded-xl border border-border bg-white dark:bg-slate-900 p-3">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Fitur Produk</p>
                    <div className="grid grid-cols-1 gap-1">
                      {livePreviewProduct.features.slice(0, 6).map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags preview */}
                {livePreviewProduct.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {livePreviewProduct.tags.map((tag, i) => (
                      <span key={i} className="font-mono text-[10px] bg-primary/10 text-primary dark:bg-secondary/10 dark:text-secondary border border-primary/20 dark:border-secondary/20 rounded px-1.5 py-0.5">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground/60 text-center">
                  Tampilan ini mencerminkan card produk yang akan tampil di halaman /products
                </p>
              </div>
            </div>

            <DialogFooter className="pt-4 mt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setProductDialog(false)} className="rounded-xl">
                Batal
              </Button>
              <Button type="submit" data-testid="product-form-submit" className="rounded-xl">
                {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;