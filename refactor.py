import re

filepath = r"c:\FKD-sambong\desa-sambong-publik.html"
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# Change title
text = text.replace('<h1>SIMPADES Kader</h1>', '<h1>SIMPADES Publik</h1>')
text = text.replace('<title>SIMPADES Kader — Desa Sambong</title>', '<title>SIMPADES Publik — Desa Sambong</title>')
text = text.replace('<title>SIMPADES — Desa Sambong</title>', '<title>SIMPADES Publik — Desa Sambong</title>')

# Remove ODGJ side nav item
text = re.sub(r'<button class="nav-item"\s+onclick="showPage\(\'odgj\'\)".*?</button>\s*', '', text, flags=re.DOTALL)

# Remove ODGJ page block
text = re.sub(r'<!-- ==================== ODGJ ==================== -->.*?<!-- ==================== IMUNISASI ==================== -->', '<!-- ==================== IMUNISASI ==================== -->', text, flags=re.DOTALL)

# Remove MODALS block
text = re.sub(r'<!-- ==================== MODALS ==================== -->.*?<script>', '<script>', text, flags=re.DOTALL)

# Remove "Tambah Data" buttons
text = re.sub(r'<button class="btn btn-primary" onclick="openModal[^>]+>\+.*?</button>\s*', '', text, flags=re.DOTALL)
text = re.sub(r'<div class="section-hd" style="margin-bottom:14px;">\s*<span></span>\s*</div>', '', text, flags=re.DOTALL)

# Remove PSN specific input form
text = re.sub(r'<div class="card">\s*<div class="card-body">\s*<div class="section-hd">\s*<span class="section-title">Input Kegiatan PSN</span>.*?</div>\s*</div>\s*</div>\s*(?=<div class="card">\s*<div class="card-body">\s*<div class="section-hd">\s*<span class="section-title">Peta)', '', text, flags=re.DOTALL)
text = text.replace('<div class="grid2" style="margin-bottom:20px;">\n        <div class="card">\n          <div class="card-body">\n            <div class="section-hd">\n              <span class="section-title">Peta', '<div class="grid1" style="margin-bottom:20px;">\n        <div class="card">\n          <div class="card-body">\n            <div class="section-hd">\n              <span class="section-title">Peta')

# Remove table "Aksi" column headers
text = re.sub(r'<th>Aksi</th>\s*', '', text)

# Remove table Hapus from JS templates
text = re.sub(r'<td><button class="btn btn-danger btn-sm" onclick="delRow.*?Hapus</button></td>', '', text)
text = re.sub(r'<td><button class="btn btn-danger btn-sm" onclick="this.*?Hapus</button></td>', '', text)

# Remove ODGJ from Dashboard top summary tables
text = re.sub(r'<div class="stat-card">\s*<div class="stat-icon">🧠</div>\s*<div class="stat-label">ODGJ</div>\s*<div class="stat-num" id="dash-odgj">\d+</div>\s*<div class="stat-sub">Terpantau</div>\s*</div>', '', text)
text = text.replace('<div class="grid4" style="margin-bottom:20px;">', '<div class="grid3" style="margin-bottom:20px;">')
text = text.replace('<th>ODGJ</th>', '')
text = text.replace('<td>${d.odgj}</td>', '')

# Remove save functions
text = re.sub(r'async function save[A-Za-z]+\(\)\s*\{.*?\}\s*(?=function|// ---)', '', text, flags=re.DOTALL)

# Fix empty colspan to match new column count
text = re.sub(r'(colspan=")(\d+)(")', lambda m: m.group(1) + str(int(m.group(2))-1) + m.group(3), text)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
print("Done")
