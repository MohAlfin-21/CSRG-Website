import React, { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, ImagePlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import CVView from './CVView';

export const emptyCV = () => ({
  template: 'modern',
  accent: '#004C97',
  show_photo: true,
  headline: '',
  summary: '',
  email: '',
  phone: '',
  location: '',
  website: '',
  education: [],
  experience: [],
  skills: [],
  certifications: [],
  projects: [],
});

/** Normalise server data and make it safe to send back (numbers, nulls). */
export const normalizeCV = (cv) => ({ ...emptyCV(), ...(cv || {}) });

export const prepareCVForSave = (cv) => {
  const fixUrl = (u) => {
    if (!u || typeof u !== 'string') return null;
    const trimmed = u.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.includes('.') && !trimmed.startsWith('/')) return `https://${trimmed}`;
    return trimmed;
  };

  return {
    ...cv,
    headline: (cv.headline || '').trim(),
    summary: (cv.summary || '').trim(),
    email: (cv.email || '').trim(),
    phone: (cv.phone || '').trim(),
    location: (cv.location || '').trim(),
    website: fixUrl(cv.website),
    skills: (cv.skills || [])
      .filter((s) => s.name && s.name.trim())
      .map((s) => ({
        name: s.name.trim(),
        level: s.level === '' || s.level == null ? null : Math.max(0, Math.min(100, parseInt(s.level, 10) || 0)),
      })),
    education: (cv.education || []).filter((e) => e.institution || e.degree),
    experience: (cv.experience || []).filter((e) => e.role || e.organization),
    certifications: (cv.certifications || []).filter((c) => c.name),
    projects: (cv.projects || []).filter((p) => p.title).map((p) => ({
      ...p,
      link: fixUrl(p.link),
      image_url: p.image_url || null,
    })),
  };
};

const TEMPLATES = [
  { id: 'modern', label: 'Modern', hint: 'Sidebar berwarna' },
  { id: 'classic', label: 'Klasik', hint: 'Satu kolom, serif' },
  { id: 'minimal', label: 'Minimalis', hint: 'Bersih & ringan' },
];
const PRESETS = ['#004C97', '#0E7490', '#047857', '#B45309', '#9F1239', '#6D28D9', '#1F2937'];

const Field = ({ label, children, className = '' }) => (
  <div className={`space-y-1 ${className}`}>
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
    {children}
  </div>
);

const Group = ({ title, onAdd, addLabel, children, empty }) => (
  <section className="space-y-3 pt-4 border-t border-border">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {onAdd && (
        <Button type="button" variant="outline" size="sm" onClick={onAdd} className="h-7 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> {addLabel}
        </Button>
      )}
    </div>
    {empty ? <p className="text-xs text-muted-foreground">{empty}</p> : children}
  </section>
);

const Card = ({ onRemove, children }) => (
  <div className="relative rounded-lg border border-border p-3 pr-10 space-y-2 bg-muted/30">
    <button
      type="button"
      onClick={onRemove}
      aria-label="Hapus item"
      className="absolute top-2 right-2 p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
    >
      <Trash2 className="w-4 h-4" />
    </button>
    {children}
  </div>
);

const CVEditor = ({ value, onChange, member, uploadImage }) => {
  const [showPreview, setShowPreview] = useState(false);
  const cv = normalizeCV(value);
  const set = (patch) => onChange({ ...cv, ...patch });

  const listOps = (key, blank) => ({
    add: () => set({ [key]: [...cv[key], blank] }),
    update: (i, patch) => set({ [key]: cv[key].map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }),
    remove: (i) => set({ [key]: cv[key].filter((_, idx) => idx !== i) }),
  });

  const edu = listOps('education', { institution: '', degree: '', start: '', end: '', description: '' });
  const exp = listOps('experience', { role: '', organization: '', start: '', end: '', description: '' });
  const skl = listOps('skills', { name: '', level: '' });
  const cer = listOps('certifications', { name: '', issuer: '', year: '' });
  const prj = listOps('projects', { title: '', description: '', link: '', image_url: '' });

  const previewMember = { name: member?.name || 'Nama Anggota', photo_url: member?.photo_url || '' };

  return (
    <div className="space-y-4" data-testid="cv-editor">
      {/* Tampilan */}
      <Group title="Tampilan CV">
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => set({ template: t.id })}
              aria-pressed={cv.template === t.id}
              className={`rounded-lg border p-2.5 text-left transition-colors ${
                cv.template === t.id ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="text-xs font-semibold text-foreground">{t.label}</div>
              <div className="text-[11px] text-muted-foreground">{t.hint}</div>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Warna aksen</span>
          {PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Warna ${c}`}
              onClick={() => set({ accent: c })}
              className={`w-6 h-6 rounded-full border-2 ${cv.accent.toLowerCase() === c.toLowerCase() ? 'border-foreground' : 'border-transparent'}`}
              style={{ background: c }}
            />
          ))}
          <input
            type="color"
            value={cv.accent}
            onChange={(e) => set({ accent: e.target.value.toUpperCase() })}
            aria-label="Pilih warna sendiri"
            className="w-7 h-7 rounded cursor-pointer bg-transparent border border-border p-0.5"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
          <input type="checkbox" checked={cv.show_photo} onChange={(e) => set({ show_photo: e.target.checked })} />
          Tampilkan foto profil di CV
        </label>
      </Group>

      {/* Profil */}
      <Group title="Profil & Kontak">
        <Field label="Judul / posisi singkat">
          <Input value={cv.headline} maxLength={150} onChange={(e) => set({ headline: e.target.value })} placeholder="Contoh: Peneliti Keamanan Jaringan" />
        </Field>
        <Field label="Ringkasan diri">
          <Textarea value={cv.summary} maxLength={2500} rows={4} onChange={(e) => set({ summary: e.target.value })} placeholder="2-4 kalimat tentang latar belakang dan fokus riset." />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Email"><Input type="email" value={cv.email} onChange={(e) => set({ email: e.target.value })} /></Field>
          <Field label="Telepon"><Input value={cv.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
          <Field label="Lokasi"><Input value={cv.location} onChange={(e) => set({ location: e.target.value })} placeholder="Surabaya, Indonesia" /></Field>
          <Field label="Website"><Input value={cv.website || ''} onChange={(e) => set({ website: e.target.value })} placeholder="https://..." /></Field>
        </div>
      </Group>

      {/* Pengalaman */}
      <Group title="Pengalaman" onAdd={exp.add} addLabel="Tambah" empty={cv.experience.length ? null : 'Belum ada pengalaman.'}>
        {cv.experience.map((e, i) => (
          <Card key={i} onRemove={() => exp.remove(i)}>
            <div className="grid sm:grid-cols-2 gap-2">
              <Field label="Posisi"><Input value={e.role} onChange={(ev) => exp.update(i, { role: ev.target.value })} /></Field>
              <Field label="Instansi / perusahaan"><Input value={e.organization} onChange={(ev) => exp.update(i, { organization: ev.target.value })} /></Field>
              <Field label="Mulai"><Input value={e.start} onChange={(ev) => exp.update(i, { start: ev.target.value })} placeholder="2023" /></Field>
              <Field label="Selesai (kosong = sekarang)"><Input value={e.end} onChange={(ev) => exp.update(i, { end: ev.target.value })} placeholder="2025" /></Field>
            </div>
            <Field label="Deskripsi (satu poin per baris)">
              <Textarea rows={3} value={e.description} onChange={(ev) => exp.update(i, { description: ev.target.value })} />
            </Field>
          </Card>
        ))}
      </Group>

      {/* Pendidikan */}
      <Group title="Pendidikan" onAdd={edu.add} addLabel="Tambah" empty={cv.education.length ? null : 'Belum ada pendidikan.'}>
        {cv.education.map((e, i) => (
          <Card key={i} onRemove={() => edu.remove(i)}>
            <div className="grid sm:grid-cols-2 gap-2">
              <Field label="Institusi"><Input value={e.institution} onChange={(ev) => edu.update(i, { institution: ev.target.value })} /></Field>
              <Field label="Gelar / jurusan"><Input value={e.degree} onChange={(ev) => edu.update(i, { degree: ev.target.value })} /></Field>
              <Field label="Mulai"><Input value={e.start} onChange={(ev) => edu.update(i, { start: ev.target.value })} /></Field>
              <Field label="Selesai"><Input value={e.end} onChange={(ev) => edu.update(i, { end: ev.target.value })} /></Field>
            </div>
            <Field label="Keterangan (opsional)">
              <Textarea rows={2} value={e.description} onChange={(ev) => edu.update(i, { description: ev.target.value })} />
            </Field>
          </Card>
        ))}
      </Group>

      {/* Keahlian */}
      <Group title="Keahlian" onAdd={skl.add} addLabel="Tambah" empty={cv.skills.length ? null : 'Belum ada keahlian.'}>
        {cv.skills.map((s, i) => (
          <Card key={i} onRemove={() => skl.remove(i)}>
            <div className="grid grid-cols-[1fr_110px] gap-2">
              <Field label="Nama keahlian"><Input value={s.name} maxLength={60} onChange={(ev) => skl.update(i, { name: ev.target.value })} placeholder="Network Security" /></Field>
              <Field label="Level 0-100"><Input type="number" min={0} max={100} value={s.level ?? ''} onChange={(ev) => skl.update(i, { level: ev.target.value })} /></Field>
            </div>
          </Card>
        ))}
      </Group>

      {/* Sertifikasi */}
      <Group title="Sertifikasi" onAdd={cer.add} addLabel="Tambah" empty={cv.certifications.length ? null : 'Belum ada sertifikasi.'}>
        {cv.certifications.map((c, i) => (
          <Card key={i} onRemove={() => cer.remove(i)}>
            <div className="grid sm:grid-cols-[1fr_1fr_90px] gap-2">
              <Field label="Nama"><Input value={c.name} onChange={(ev) => cer.update(i, { name: ev.target.value })} /></Field>
              <Field label="Penerbit"><Input value={c.issuer} onChange={(ev) => cer.update(i, { issuer: ev.target.value })} /></Field>
              <Field label="Tahun"><Input value={c.year} onChange={(ev) => cer.update(i, { year: ev.target.value })} /></Field>
            </div>
          </Card>
        ))}
      </Group>

      {/* Proyek */}
      <Group title="Proyek" onAdd={prj.add} addLabel="Tambah" empty={cv.projects.length ? null : 'Belum ada proyek.'}>
        {cv.projects.map((p, i) => (
          <Card key={i} onRemove={() => prj.remove(i)}>
            <Field label="Nama proyek"><Input value={p.title} onChange={(ev) => prj.update(i, { title: ev.target.value })} /></Field>
            <Field label="Deskripsi"><Textarea rows={3} value={p.description} onChange={(ev) => prj.update(i, { description: ev.target.value })} /></Field>
            <Field label="Tautan (opsional)"><Input value={p.link || ''} onChange={(ev) => prj.update(i, { link: ev.target.value })} placeholder="https://github.com/..." /></Field>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><ImagePlus className="w-3.5 h-3.5" /> Gambar proyek (opsional)</label>
              <Input
                type="file"
                accept="image/*"
                onChange={async (ev) => {
                  const file = ev.target.files?.[0];
                  if (file && uploadImage) await uploadImage(file, (data) => prj.update(i, { image_url: data.url }));
                  ev.target.value = '';
                }}
              />
              {p.image_url && (
                <div className="flex items-end gap-2">
                  <img src={p.image_url} alt="" className="h-20 rounded border border-border" />
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-red-500" onClick={() => prj.update(i, { image_url: '' })}>Hapus gambar</Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </Group>

      {/* Pratinjau */}
      <section className="pt-4 border-t border-border space-y-3">
        <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview((v) => !v)}>
          {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showPreview ? 'Sembunyikan pratinjau' : 'Pratinjau CV'}
        </Button>
        {showPreview && (
          <div className="overflow-auto rounded-lg bg-slate-200 dark:bg-slate-800 p-3 max-h-[70vh]">
            <div style={{ width: 794 * 0.62, margin: '0 auto' }}>
              <CVView member={previewMember} cvData={cv} style={{ zoom: 0.62 }} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default CVEditor;
