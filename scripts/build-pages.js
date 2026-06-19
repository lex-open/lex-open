const fs = require('fs');
const path = require('path');
const { parse } = require('marked');

const MD_FILES = [
  'MANIFESTO.md',
  'CONSTITUTION.md',
  'GOVERNANCE.md',
  'DISCLAIMER.md',
  'PRIVACY.md',
  'data/PRIORITY-ACTS.md',
  'data/SCHEMA.md'
];
const DATA_ROOT = './data/uk/england-wales';
const OUT = './docs';

const HEAD = function (t){
return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${t} ⚖️ LEX OPEN</title>
<style>
:root{--bg:#0b1020;--fg:#e8eefc;--a:#5cb8ff;--card:#121a33;--muted:#a9b4d4}
html,body{background:var(--bg);color:var(--fg);font-family:Segoe UI,system-ui,sans-serif;margin:0;padding:2rem 1rem;max-width:860px;margin:auto;line-height:1.7}
h1{font-size:1.6rem}a{color:var(--a)}.card{background:var(--card);padding:1rem 1.2rem;border-radius:12px;margin:1.2rem 0}
.note{color:var(--muted);font-size:.88rem;border-top:1px solid #1e2a52;padding-top:.8rem;margin-top:1.2rem}
pre,blockquote{overflow:auto;padding:.8rem 1rem;background:#070b18;border-radius:8px}
blockquote{border-left:4px solid #5cb8ff}
</style></head><body><p><a href="./">← Back to LEX OPEN</a></p>`;
};

const FOOT = function(r){
return `<div class="note">
${r ? `<a href="${r}" target="_blank" rel="noopener">📄 Raw source</a> · ` : ''}
Licensed <a href="https://www.gnu.org/licenses/agpl-3.0.html">GNU AGPL‑3.0</a>.
<strong>General information only — NOT legal advice.</strong>
</div></body></html>`;
};

for(const f of MD_FILES){
  if(!fs.existsSync(f)) continue;
  const name = path.basename(f,'.md').toLowerCase();
  const html = HEAD(path.basename(f)) + parse(fs.readFileSync(f,'utf8')) + FOOT(`https://raw.githubusercontent.com/lex-open/lex-open/main/${f}`);
  fs.writeFileSync(path.join(OUT,name+'.html'), html);
}

function walk(dir){
  const list = fs.readdirSync(dir,{withFileTypes:true});
  for(const e of list){
    const full = path.join(dir,e.name);
    if(e.isDirectory()){ walk(full); continue; }
    if(!e.name.endsWith('.json')) continue;
    if(e.name.includes('verification')) continue;
    if(e.name === 'TEMPLATE.json') continue;
    const j = JSON.parse(fs.readFileSync(full,'utf8'));
    const L = j.legislation || {};
    let h = `<h1>${L.title||''} · ${L.section||''}</h1>`;
    h += `<div class="card">
<strong>Jurisdiction:</strong> ${j.jurisdiction||''}<br>
<strong>In force:</strong> ${L.in_force ? '✅ YES':'❌ NO'} · <strong>Repealed:</strong> ${L.repealed?'YES':'NO'}<br>
<strong>Official:</strong> <a href="${L.citation_url||'#'}" target="_blank" rel="noopener">${L.citation_url||''}</a><br>
<strong>LEXOPEN:</strong> <code>LEXOPEN://${String(j.id||'').replaceAll('.','/')}</code>
</div>`;
    if(j.plain_language) h += `<h2>Plain language</h2><p>${j.plain_language}</p>`;
    if(j.official_text_excerpt) h += `<h2>Official text</h2><blockquote>${j.official_text_excerpt}</blockquote>`;
    for(const k of ['rights','duties','powers','offences','remedies','time_limits']){
      const arr = j.legal_concepts && Array.isArray(j.legal_concepts[k]) ? j.legal_concepts[k] : [];
      if(arr.length){
        h += `<h3>${k[0].toUpperCase()+k.slice(1).replace('_',' ')}</h3><ul>`;
        h += arr.map(x=>`<li>${x}</li>`).join('') + '</ul>';
      }
    }
    if(Array.isArray(j.case_law) && j.case_law.length){
      h += `<h3>Case law</h3><ul>` + j.case_law.map(c=>`<li><strong>${c.title}</strong>${c.note?' — '+c.note:''}</li>`).join('') + '</ul>';
    }
    const outName = String(j.id||e.name).replaceAll('.','-').replace(/-json$/,'') + '.html';
    fs.writeFileSync(path.join(OUT,outName), HEAD(`${L.title} ${L.section}`) + h + FOOT(`https://raw.githubusercontent.com/lex-open/lex-open/main/${full}`));
  }
}
if(fs.existsSync(DATA_ROOT)) walk(DATA_ROOT);
console.log('✅ LEX OPEN pages built OK');
