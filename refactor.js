const fs = require('fs');
 
let content = fs.readFileSync('c:\\FKD-sambong\\desa-sambong-kader.html', 'utf8');
 
// 1. Add Global Loader
const loaderHTML = `
<div id="global-loader" style="position:fixed;inset:0;background:var(--bg);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;">
  <div style="font-size:40px;margin-bottom:16px;animation:spin 1s linear infinite">⏳</div>
  <div style="font-weight:600;color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;">Memuat data dari server...</div>
  <style>@keyframes spin { 100% { transform:rotate(360deg); } }</style>
</div>
 
<div class="header">`;
content = content.replace('<div class="header">', loaderHTML);
 
// 2. Replace static data and add API functions
const dataStoresRegex = /\/\/ --- DATA STORES ---\s+let data = \{[\s\S]+?\]\n\};\n/g;
const newDataStores = `// --- DATA STORES & API ---
const API_URL = 'https://script.google.com/macros/s/AKfycbxlqlkxi2xR-XKm_PHm0HTh3mQwKW0NOclaUXwPJFGDNmum6yKLYjNAbW1bzOYgyUR1/exec';
 
let data = {
  balita: [], hamil: [], lansia: [], odgj: [], imun: [], psn: [], jamban: []
};
 
async function fetchAwal() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    data = json;
    document.getElementById('global-loader').style.display = 'none';
    renderDashboard();
  } catch (err) {
    console.error('Fetch error:', err);
    alert('Gagal mengambil data dari Google Sheets: ' + err.message);
    document.getElementById('global-loader').style.display = 'none';
    renderDashboard();
  }
}
 
async function postData(type, payload) {
  try {
    const loaderText = document.getElementById('global-loader').querySelector('div:nth-child(2)');
    loaderText.textContent = 'Menyimpan data...';
    document.getElementById('global-loader').style.display = 'flex';
 
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ type, payload }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });
 
    const json = await res.json();
    if (json.status === 'error') throw new Error(json.message);
 
    document.getElementById('global-loader').style.display = 'none';
    loaderText.textContent = 'Memuat data dari server...';
  } catch(err) {
    document.getElementById('global-loader').style.display = 'none';
    alert('Gagal menyimpan ke server: ' + err.message);
  }
}\n\n`;
 
content = content.replace(dataStoresRegex, newDataStores);
 
// 3. Make save functions async and call postData
const replaces = [
  { func: 'saveBalita', name: 'balita',  modal: 'modal-balita',  render: 'renderBalita' },
  { func: 'saveHamil',  name: 'hamil',   modal: 'modal-hamil',   render: 'renderHamil' },
  { func: 'saveLansia', name: 'lansia',  modal: 'modal-lansia',  render: 'renderLansia' },
  { func: 'saveODGJ',   name: 'odgj',   modal: 'modal-odgj',    render: 'renderODGJ' },
  { func: 'saveImun',   name: 'imun',   modal: 'modal-imun',    render: 'renderImunisasi' },
  { func: 'saveJamban', name: 'jamban', modal: 'modal-jamban',  render: 'renderJamban' },
];
 
replaces.forEach(r => {
  // Match: function saveFoo() { ... data.foo.unshift(d); closeModal(...); renderFoo(); }
  const funcRegex = new RegExp(
    `function ${r.func}\\(\\)\\s*\\{([\\s\\S]*?)data\\.${r.name}\\.unshift\\(d\\);[\\s\\S]*?closeModal\\([^)]*\\);[\\s\\S]*?${r.render}\\(\\);\\s*\\}`,
    'g'
  );
  content = content.replace(funcRegex, (match, body) => {
    // Strip old unshift/closeModal/render lines from body so we rebuild cleanly
    const cleanBody = body.replace(/\s*data\.\w+\.unshift\(d\);\s*/g, '')
                          .replace(/\s*closeModal\([^)]*\);\s*/g, '')
                          .replace(/\s*render\w+\(\);\s*/g, '');
    return `async function ${r.func}() {${cleanBody}
  data.${r.name}.unshift(d);
  closeModal('${r.modal}');
  ${r.render}();
  await postData('${r.name}', d);
}`;
  });
});
 
// 4. PSN — make async and inject postData after push
const psnRegex = /data\.psn\.push\((d)\);([\s\S]*?)alert\('✅ Data PSN berhasil disimpan!'\);/g;
content = content.replace(psnRegex, `data.psn.push($1);$2  await postData('psn', $1);\n  alert('✅ Data PSN berhasil disimpan!');`);
content = content.replace('function savePSN()', 'async function savePSN()');
 
// 5. Replace init call
content = content.replace(
  'renderDashboard();\nsetTimeout(drawTren, 100);',
  'fetchAwal();\nsetTimeout(drawTren, 500);'
);
// Fallback if above didn't match (whitespace variation)
content = content.replace(
  /renderDashboard\(\);\s*setTimeout\(drawTren,\s*100\);/,
  'fetchAwal();\nsetTimeout(drawTren, 500);'
);
 
// 6. Titles
content = content.replace('<title>SIMPADES — Desa Sambong</title>', '<title>SIMPADES (Kader) — Desa Sambong</title>');
content = content.replace('<h1>SIMPADES Desa Sambong</h1>', '<h1>SIMPADES Kader</h1>');
 
fs.writeFileSync('c:\\FKD-sambong\\desa-sambong-kader.html', content, 'utf8');
console.log('✅ Selesai! File desa-sambong-kader.html sudah diupdate.');
