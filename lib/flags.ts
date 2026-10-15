// أعلام SVG مبسّطة لكل الدول العربية (إيموجي الأعلام لا يظهر على ويندوز). المدخل محصور بالرموز المعروفة.
const r2 = (n: number) => Math.round(n * 100) / 100;
function star(cx: number, cy: number, r: number, fill: string): string {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.42 : r; p.push(r2(cx + rr * Math.cos(a)) + ',' + r2(cy + rr * Math.sin(a))); }
  return `<polygon points="${p.join(' ')}" fill="${fill}"/>`;
}
const tri = (f: string, w = 12) => `<path d="M0 0L${w} 10L0 20Z" fill="${f}"/>`;
const h3 = (a: string, b: string, d: string) => `<rect width="30" height="6.7" fill="${a}"/><rect y="6.7" width="30" height="6.7" fill="${b}"/><rect y="13.4" width="30" height="6.6" fill="${d}"/>`;
function shapes(c: string): string {
  switch (c) {
    case 'ps': return h3('#111', '#fff', '#0a8f3c') + tri('#d6262d');
    case 'eg': return h3('#ce1126', '#fff', '#111') + '<path d="M12.5 12.6c0-2.2.9-3.7 2.5-3.7s2.5 1.5 2.5 3.7M13.6 8.2h2.8M15 8.2V6.6" stroke="#c09300" stroke-width="1.4" fill="none" stroke-linecap="round"/>';
    case 'ye': return h3('#ce1126', '#fff', '#111');
    case 'sa': return '<rect width="30" height="20" fill="#0b7a3b"/><path d="M8 7h14M10 9.5h10M12 12h6" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/><path d="M8 15.4h13.5" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/><path d="M21.5 14.2v2.4" stroke="#fff" stroke-width="1.1"/>';
    case 'jo': return h3('#111', '#fff', '#0a7a3a') + tri('#ce1126', 13) + star(4.2, 10, 2, '#fff');
    case 'lb': return '<rect width="30" height="20" fill="#fff"/><rect width="30" height="5" fill="#e0242c"/><rect y="15" width="30" height="5" fill="#e0242c"/><polygon points="15,5 17.8,9.8 16.4,9.8 18.8,13.2 15.8,13.2 15.8,15 14.2,15 14.2,13.2 11.2,13.2 13.6,9.8 12.2,9.8" fill="#0a8a3a"/>';
    case 'sy': return h3('#0a8a3a', '#fff', '#111') + star(9, 10, 2, '#ce1126') + star(15, 10, 2, '#ce1126') + star(21, 10, 2, '#ce1126');
    case 'iq': return h3('#ce1126', '#fff', '#111') + '<path d="M9 10h3m2 0h2.5m2 0h3.5" stroke="#0a8a3a" stroke-width="1.6" stroke-linecap="round"/>';
    case 'kw': return h3('#0a8a3a', '#fff', '#ce1126') + '<path d="M0 0L8 6.7V13.3L0 20Z" fill="#111"/>';
    case 'bh': return '<rect width="30" height="20" fill="#fff"/><path d="M30 0H10L14 2L10 4L14 6L10 8L14 10L10 12L14 14L10 16L14 18L10 20H30Z" fill="#ce1126"/>';
    case 'qa': return '<rect width="30" height="20" fill="#8a1538"/><path d="M0 0H9L13 1.8L9 3.6L13 5.4L9 7.2L13 9L9 10.8L13 12.6L9 14.4L13 16.2L9 18L13 19.2L9 20H0Z" fill="#fff"/>';
    case 'ae': return '<rect width="30" height="20" fill="#fff"/><rect x="7.5" width="22.5" height="6.7" fill="#00732f"/><rect x="7.5" y="13.4" width="22.5" height="6.6" fill="#111"/><rect width="7.5" height="20" fill="#ff0000"/>';
    case 'om': return '<rect width="30" height="20" fill="#fff"/><rect x="8" y="6.7" width="22" height="6.7" fill="#db161b"/><rect x="8" y="13.4" width="22" height="6.6" fill="#008000"/><rect width="8" height="20" fill="#db161b"/><circle cx="4" cy="4.5" r="1.8" fill="#fff"/>';
    case 'ly': return '<rect width="30" height="5" fill="#e70013"/><rect y="5" width="30" height="10" fill="#111"/><rect y="15" width="30" height="5" fill="#239e46"/><circle cx="14.4" cy="10" r="3.1" fill="#fff"/><circle cx="15.3" cy="10" r="2.6" fill="#111"/>' + star(17.4, 10, 1.6, '#fff');
    case 'tn': return '<rect width="30" height="20" fill="#e70013"/><circle cx="15" cy="10" r="5.6" fill="#fff"/><circle cx="14.6" cy="10" r="3.6" fill="#e70013"/><circle cx="15.5" cy="10" r="3" fill="#fff"/>' + star(15.8, 10, 1.7, '#e70013');
    case 'dz': return '<rect width="15" height="20" fill="#006233"/><rect x="15" width="15" height="20" fill="#fff"/><circle cx="15" cy="10" r="4.6" fill="#d21034"/><circle cx="16.2" cy="10" r="3.7" fill="#fff"/>' + star(16.8, 10, 2, '#d21034');
    case 'ma': return '<rect width="30" height="20" fill="#c1272d"/><polygon points="15,5.4 16.5,9.4 20.7,9.4 17.3,11.9 18.6,15.8 15,13.4 11.4,15.8 12.7,11.9 9.3,9.4 13.5,9.4" fill="none" stroke="#006233" stroke-width="1"/>';
    case 'mr': return '<rect width="30" height="20" fill="#006233"/><rect width="30" height="2.4" fill="#d01c1f"/><rect y="17.6" width="30" height="2.4" fill="#d01c1f"/><circle cx="15" cy="10.6" r="5" fill="#ffc400"/><circle cx="15" cy="8.8" r="5" fill="#006233"/>' + star(15, 7.4, 1.5, '#ffc400');
    case 'sd': return h3('#d21034', '#fff', '#111') + tri('#007229', 11);
    case 'so': return '<rect width="30" height="20" fill="#4189dd"/>' + star(15, 10.4, 4.8, '#fff');
    case 'dj': return '<rect width="30" height="10" fill="#6ab2e7"/><rect y="10" width="30" height="10" fill="#12ad2b"/><path d="M0 0L14 10L0 20Z" fill="#fff"/>' + star(4.2, 10, 2, '#d7141a');
    case 'km': return '<rect width="30" height="5" fill="#ffc61e"/><rect y="5" width="30" height="5" fill="#fff"/><rect y="10" width="30" height="5" fill="#ce1126"/><rect y="15" width="30" height="5" fill="#3a75c4"/><path d="M0 0L13 10L0 20Z" fill="#3d8e33"/><circle cx="4" cy="10" r="2.6" fill="#fff"/><circle cx="4.8" cy="10" r="2.2" fill="#3d8e33"/>';
  }
  return '';
}
export function flagSvg(code: string, w = 28): string {
  const s = shapes(String(code).trim());
  if (!s) return '';
  return `<svg class="flag" width="${w}" height="${Math.round((w * 2) / 3)}" viewBox="0 0 30 20" role="img" aria-hidden="true">${s}</svg>`;
}
