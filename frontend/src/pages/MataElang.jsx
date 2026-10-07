import React from 'react';

const MataElang = () => {
  return (
    <div className="max-w-3xl mx-auto py-20 px-4">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-6">
        <img
          src="/MataElang.png"
          alt="Logo Mata Elang"
          className="w-32 h-32 object-contain rounded-xl shadow border border-border bg-white"
          style={{ background: '#fff' }}
        />
        <div>
          <h1 className="text-4xl font-bold mb-4 text-primary dark:text-secondary">Mata Elang</h1>
          <p className="text-lg mb-6 text-muted-foreground">
            Mata Elang adalah produk open source pertama dari CSRG, berupa software untuk monitoring keamanan jaringan secara real-time. Dengan Mata Elang, Anda dapat mendeteksi anomali, serangan, dan aktivitas mencurigakan di jaringan Anda secara efisien dan mudah.
          </p>
        </div>
      </div>
      <a
        href="https://mataelang.net"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-6 py-3 bg-primary text-white dark:bg-secondary dark:text-slate-900 rounded-lg font-semibold shadow hover:bg-primary/90 dark:hover:bg-secondary/80 transition"
      >
        Kunjungi Website Mata Elang
      </a>
    </div>
  );
};

export default MataElang;
