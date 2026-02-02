/* footer.js */
(function () {
  'use strict';

  async function fetchJSON(path) {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error('Failed to fetch ' + path);
    return res.json();
  }

  async function fetchTemplate(path) {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error('Failed to fetch ' + path);
    const text = await res.text();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = text.trim();
    return wrapper.querySelector('#footer-template');
  }

  function createList(el, items) {
    if (!el || !Array.isArray(items)) return;
    el.innerHTML = '';
    items.forEach(item => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = item.url || '#';
      a.textContent = item.label || '';
      a.className = el.dataset.list === 'social' ? 'social-link' : '';
      li.appendChild(a);
      el.appendChild(li);
    });
  }

  async function renderFooter() {
    const mount = document.getElementById('footer');
    if (!mount) return;

    const [data, tpl] = await Promise.all([
      fetchJSON('footer.json'),
      fetchTemplate('footer.html')
    ]);

    const clone = document.importNode(tpl.content, true);

    // Brand
    clone.querySelector('[data-text="brand-name"]').textContent = data.brand.name;
    clone.querySelector('[data-text="brand-tagline"]').textContent = data.brand.tagline;
    clone.querySelector('[data-img="brand-logo"]').src = data.brand.logo;

    // Lists
    createList(clone.querySelector('[data-list="navigation"]'), data.navigation);
    createList(clone.querySelector('[data-list="services"]'), data.services);
    createList(clone.querySelector('[data-list="extra"]'), data.extra);
    createList(clone.querySelector('[data-list="social"]'), data.social);

    // Bottom
    clone.querySelector('[data-text="copyright"]').textContent = data.copyright;
    clone.querySelector('[data-text="developer"]').textContent = data.developer;

    mount.innerHTML = '';
    mount.appendChild(clone);
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', renderFooter)
    : renderFooter();
})();
