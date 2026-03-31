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
const API_URL = 'ISI_URL_GOOGLE_APPS_SCRIPT_ANDA_DISINI';

let data = {
  balita: [], hamil: [], lansia: [], odgj: [], imun: [], psn: [], jamban: []
};

async function fetchAwal() {
  if(API_URL === 'ISI_URL_GOOGLE_APPS_SCRIPT_ANDA_DISINI') {
    alert('PERHATIAN: Anda belum memasukkan URL Google Apps Script pada variabel API_URL di dalam kode.');
    document.getElementById('global-loader').style.display = 'none';
    renderDashboard();
    return;
  }
  try {
    const res = await fetch(API_URL);
    const json = await res.json();
    // Google Sheets mengembalikan balita, hamil, lansia dll.
    data = json;
    document.getElementById('global-loader').style.display = 'none';
    renderDashboard();
  } catch (err) {
    alert('Gagal mengambil data dari Google Sheets: ' + err.message);
    document.getElementById('global-loader').style.display = 'none';
    renderDashboard();
  }
}

async function postData(type, payload) {
  if(API_URL === 'ISI_URL_GOOGLE_APPS_SCRIPT_ANDA_DISINI') return; // Skip post if no api
  try {
    document.getElementById('global-loader').querySelector('div:nth-child(2)').textContent = 'Menyimpan data...';
    document.getElementById('global-loader').style.display = 'flex';
    
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ type, payload }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });
    
    document.getElementById('global-loader').style.display = 'none';
    document.getElementById('global-loader').querySelector('div:nth-child(2)').textContent = 'Memuat data dari server...';
  } catch(err) {
    document.getElementById('global-loader').style.display = 'none';
    alert('Gagal menyimpan ke server: ' + err.message);
  }
}\n\n`;

content = content.replace(dataStoresRegex, newDataStores);

// 3. Make save functions async and call postData.
const replaces = [
  { func: 'saveBalita()', name: 'balita' },
  { func: 'saveHamil()', name: 'hamil' },
  { func: 'saveLansia()', name: 'lansia' },
  { func: 'saveODGJ()', name: 'odgj' },
  { func: 'saveImun()', name: 'imun' },
  { func: 'saveJamban()', name: 'jamban' }
];

replaces.forEach(r => {
  const funcRegex = new RegExp(`function ${r.func}\\s*\\{\\s*([\\s\\S]*?)(data\.${r.name}\.unshift\\(d\\);\\s*closeModal\\(.*?\\);\\s*render.*?\\(\\);)\\s*\\}`, 'g');
  
  content = content.replace(funcRegex, `async function ${r.func} {\n  $1\n  data.${r.name}.unshift(d);\n  closeModal('modal-${r.name === 'hamil' ? 'hamil' : r.name === 'jamban' ? 'jamban' : r.name === 'imun' ? 'imun' : r.name === 'lansia' ? 'lansia' : r.name === 'odgj' ? 'odgj' : 'balita'}');\n  render${r.name.charAt(0).toUpperCase() + r.name.slice(1)}();\n  await postData('${r.name}', d);\n}`);
});

// Fix special rendering names
content = content.replace(/renderHamil\(\)/g, "renderHamil()");
content = content.replace(/renderOdgj\(\)/g, "renderODGJ()");
content = content.replace(/renderImun\(\)/g, "renderImunisasi()");

// For PSN (it uses unshift/push and marker logic)
const psnRegex = /data\.psn\.push\((d)\);([\s\S]*?)alert\('✅ Data PSN berhasil disimpan!'\);/g;
content = content.replace(psnRegex, `data.psn.push($1);\n$2\n  await postData('psn', $1);\n  alert('✅ Data PSN berhasil disimpan!');`);
content = content.replace('function savePSN()', 'async function savePSN()');

// 4. Update INIT to fetchAwal() -> no wait, just call fetchAwal()
content = content.replace('renderDashboard();\nsetTimeout(drawTren, 100);', 'fetchAwal();\nsetTimeout(drawTren, 500);');

// Change Title
content = content.replace('<title>SIMPADES — Desa Sambong</title>', '<title>SIMPADES (Kader) — Desa Sambong</title>');
content = content.replace('<h1>SIMPADES Desa Sambong</h1>', '<h1>SIMPADES Kader</h1>');

fs.writeFileSync('c:\\FKD-sambong\\desa-sambong-kader.html', content, 'utf8');
console.log('done');
