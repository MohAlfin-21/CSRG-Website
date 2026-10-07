import React from 'react';
import { Mail, Phone, MapPin, Globe, Linkedin, GraduationCap } from 'lucide-react';
import { resolveMediaUrl } from '@/config';
import './cv.css';

const DEFAULT_ACCENT = '#004C97';
const isHttp = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);

export const resolvePhoto = (url) => {
  return resolveMediaUrl(url);
};

/** Black or white text, whichever reads better on the accent colour. */
export const readableOn = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const lum = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum > 165 ? '#111827' : '#ffffff';
};

export const hasCVContent = (cv) =>
  !!cv && !!(
    cv.summary || cv.headline ||
    (cv.education || []).length || (cv.experience || []).length ||
    (cv.skills || []).length || (cv.certifications || []).length || (cv.projects || []).length
  );

const toLines = (t) =>
  (t || '').split('\n').map((l) => l.replace(/^\s*[-•*]\s*/, '').trim()).filter(Boolean);

const dateRange = (start, end) => {
  if (start && end) return `${start} – ${end}`;
  if (start) return `${start} – Sekarang`;
  return end || '';
};

const Desc = ({ text }) => {
  const lines = toLines(text);
  if (!lines.length) return null;
  if (lines.length === 1) return <p className="cv-desc">{lines[0]}</p>;
  return <ul className="cv-list">{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>;
};

const Item = ({ title, sub, date, children }) => (
  <div className="cv-item">
    <div className="cv-item-head">
      <span className="cv-item-title">{title}</span>
      {date ? <span className="cv-item-date">{date}</span> : null}
    </div>
    {sub ? <div className="cv-item-sub">{sub}</div> : null}
    {children}
  </div>
);

const join = (...parts) => parts.filter(Boolean).join(', ');

/* ── Shared section bodies ───────────────────────────────────────── */
const ExperienceBody = ({ items }) => items.map((e, i) => (
  <Item key={i} title={e.role} sub={e.organization} date={dateRange(e.start, e.end)}>
    <Desc text={e.description} />
  </Item>
));

const EducationBody = ({ items }) => items.map((e, i) => (
  <Item key={i} title={e.institution} sub={e.degree} date={dateRange(e.start, e.end)}>
    <Desc text={e.description} />
  </Item>
));

const ProjectsBody = ({ items }) => items.map((p, i) => (
  <Item key={i} title={p.title}>
    <Desc text={p.description} />
    {isHttp(p.link) && <a className="cv-link" href={p.link} target="_blank" rel="noopener noreferrer">{p.link}</a>}
    {isHttp(p.image_url) && <img className="cv-project-img" src={p.image_url} alt={p.title || 'Proyek'} />}
  </Item>
));

const CertBody = ({ items }) => items.map((c, i) => (
  <Item key={i} title={c.name} sub={c.issuer} date={c.year} />
));

const ContactItems = ({ cv, member, Wrapper = 'div', iconColor }) => {
  const rows = [
    [Mail, cv.email, cv.email ? `mailto:${cv.email}` : null],
    [Phone, cv.phone, cv.phone ? `tel:${cv.phone}` : null],
    [MapPin, cv.location, null],
    [Globe, isHttp(cv.website) ? cv.website.replace(/^https?:\/\//i, '') : '', cv.website],
    [Linkedin, isHttp(member?.linkedin_url) ? 'LinkedIn Profil' : '', member?.linkedin_url],
    [GraduationCap, isHttp(member?.scholar_url) ? 'Google Scholar' : '', member?.scholar_url],
  ].filter(([, v]) => v);
  return rows.map(([Icon, v, href], i) => (
    <Wrapper key={i} className="cv-contact">
      <Icon size={13} color={iconColor} />
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">
          {v}
        </a>
      ) : (
        <span>{v}</span>
      )}
    </Wrapper>
  ));
};

/* ── Templates ───────────────────────────────────────────────────── */
const Modern = ({ member, cv, photo, on }) => {
  const skills = cv.skills.filter((s) => s.name);
  return (
    <div className="cv-modern">
      <aside>
        {photo && <img src={photo} alt={member.name} style={{ width: 112, height: 112, objectFit: 'cover', borderRadius: '50%', border: '3px solid var(--cv-track)', alignSelf: 'center' }} />}
        {(cv.email || cv.phone || cv.location || cv.website || member?.linkedin_url || member?.scholar_url) && (
          <div><h2>Kontak &amp; Tautan</h2><div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><ContactItems cv={cv} member={member} iconColor={on} /></div></div>
        )}
        {skills.length > 0 && (
          <div><h2>Keahlian</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.92em' }}>
              {skills.map((s, i) => (
                <div key={i}>{s.name}
                  {s.level != null && <div className="cv-skill-bar"><span style={{ width: `${s.level}%` }} /></div>}
                </div>
              ))}
            </div>
          </div>
        )}
        {cv.certifications.length > 0 && (
          <div><h2>Sertifikasi &amp; Paten</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9em' }}>
              {cv.certifications.map((c, i) => (
                <div key={i}><div style={{ fontWeight: 600 }}>{c.name}</div><div style={{ opacity: 0.85 }}>{join(c.issuer, c.year)}</div></div>
              ))}
            </div>
          </div>
        )}
      </aside>
      <main>
        <h1 className="cv-name">{member.name}</h1>
        {cv.headline && <p className="cv-headline">{cv.headline}</p>}
        {cv.summary && <section className="cv-section"><h2>Profil</h2><p className="cv-desc" style={{ marginTop: 0 }}>{cv.summary}</p></section>}
        {cv.experience.length > 0 && <section className="cv-section"><h2>Pengalaman</h2><ExperienceBody items={cv.experience} /></section>}
        {cv.education.length > 0 && <section className="cv-section"><h2>Pendidikan</h2><EducationBody items={cv.education} /></section>}
        {cv.projects.length > 0 && <section className="cv-section"><h2>Proyek</h2><ProjectsBody items={cv.projects} /></section>}
      </main>
    </div>
  );
};

const Classic = ({ member, cv, photo }) => {
  const skills = cv.skills.filter((s) => s.name).map((s) => s.name);
  return (
    <div className="cv-classic">
      <header>
        <div>
          <h1 className="cv-name">{member.name}</h1>
          {cv.headline && <p className="cv-headline">{cv.headline}</p>}
          <div className="cv-contact-row">
            <ContactItems cv={cv} member={member} Wrapper="span" iconColor="var(--cv-accent)" />
          </div>
        </div>
        {photo && <img src={photo} alt={member.name} style={{ width: 92, height: 92, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
      </header>
      {cv.summary && <section className="cv-section"><h2>Profil</h2><p className="cv-desc" style={{ marginTop: 0 }}>{cv.summary}</p></section>}
      {cv.experience.length > 0 && <section className="cv-section"><h2>Pengalaman</h2><ExperienceBody items={cv.experience} /></section>}
      {cv.education.length > 0 && <section className="cv-section"><h2>Pendidikan</h2><EducationBody items={cv.education} /></section>}
      {cv.projects.length > 0 && <section className="cv-section"><h2>Proyek</h2><ProjectsBody items={cv.projects} /></section>}
      {skills.length > 0 && <section className="cv-section"><h2>Keahlian</h2><p className="cv-desc" style={{ marginTop: 0 }}>{skills.join(', ')}</p></section>}
      {cv.certifications.length > 0 && <section className="cv-section"><h2>Sertifikasi &amp; Paten</h2><CertBody items={cv.certifications} /></section>}
    </div>
  );
};

const Minimal = ({ member, cv, photo }) => {
  const skills = cv.skills.filter((s) => s.name);
  return (
    <div className="cv-minimal">
      <header>
        <div>
          <h1 className="cv-name">{member.name}</h1>
          {cv.headline && <p className="cv-headline">{cv.headline}</p>}
          <div className="cv-contact-col"><ContactItems cv={cv} member={member} iconColor="#6b7280" /></div>
        </div>
        {photo && <img src={photo} alt={member.name} style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: '50%', flexShrink: 0 }} />}
      </header>
      {cv.summary && <section className="cv-section"><h2>Profil</h2><p className="cv-desc" style={{ marginTop: 0 }}>{cv.summary}</p></section>}
      {cv.experience.length > 0 && <section className="cv-section"><h2>Pengalaman</h2><div><ExperienceBody items={cv.experience} /></div></section>}
      {cv.education.length > 0 && <section className="cv-section"><h2>Pendidikan</h2><div><EducationBody items={cv.education} /></div></section>}
      {cv.projects.length > 0 && <section className="cv-section"><h2>Proyek</h2><div><ProjectsBody items={cv.projects} /></div></section>}
      {skills.length > 0 && <section className="cv-section"><h2>Keahlian</h2><div>{skills.map((s, i) => <span key={i} className="cv-chip">{s.name}</span>)}</div></section>}
      {cv.certifications.length > 0 && <section className="cv-section"><h2>Sertifikasi &amp; Paten</h2><div><CertBody items={cv.certifications} /></div></section>}
    </div>
  );
};

/* ── Public component ────────────────────────────────────────────── */
const CVView = ({ member, cvData, printable = false, style }) => {
  const cv = {
    template: 'modern', accent: DEFAULT_ACCENT, show_photo: true,
    headline: '', summary: '', email: '', phone: '', location: '', website: '',
    ...(cvData || {}),
  };
  cv.education = cv.education || [];
  cv.experience = cv.experience || [];
  cv.skills = cv.skills || [];
  cv.certifications = cv.certifications || [];
  cv.projects = cv.projects || [];

  const accent = /^#[0-9a-f]{6}$/i.test(cv.accent) ? cv.accent : DEFAULT_ACCENT;
  const on = readableOn(accent);
  const photo = cv.show_photo ? resolvePhoto(member.photo_url) : '';

  const vars = {
    '--cv-accent': accent,
    '--cv-on': on,
    '--cv-track': on === '#ffffff' ? 'rgba(255,255,255,0.28)' : 'rgba(17,24,39,0.22)',
    '--cv-fill': on,
  };
  const paperStyle = { ...vars, ...style };
  if (cv.template === 'modern') {
    paperStyle.background = `linear-gradient(to right, ${accent} 0, ${accent} 32%, #fff 32%)`;
  }

  const Template = { modern: Modern, classic: Classic, minimal: Minimal }[cv.template] || Modern;
  return (
    <article className={`cv-paper${printable ? ' cv-print-root' : ''}`} style={paperStyle} data-testid="cv-paper">
      <Template member={member} cv={cv} photo={photo} on={on} />
    </article>
  );
};

export default CVView;
