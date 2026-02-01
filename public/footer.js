/* footer.js
   Loads footer.json and footer.html (template), populates the template,
   and injects it into the page element with id="footer".

   Usage (example in each page):
   1) Add a placeholder where the footer should appear: <div id="footer"></div>
   2) Include the script near the end of the page (after the placeholder):
      <script src="/footer.js"></script>

   This keeps your existing CSS and HTML untouched. Editing footer.json
   will update all pages that include this script.
*/

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
    // find template inside fetched HTML
    const tpl = wrapper.querySelector('#footer-template');
    if (!tpl) throw new Error('Template #footer-template not found in ' + path);
    return tpl;
  }

  function createNavList(listEl, items) {
    listEl.innerHTML = '';
    items.forEach(item => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = item.url || '#';
      a.textContent = item.label || item.url || '';
      li.appendChild(a);
      listEl.appendChild(li);
    });
  }

  function createSocialList(listEl, items) {
    listEl.innerHTML = '';
    items.forEach(item => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = item.url || '#';
      a.setAttribute('aria-label', item.label || 'social');
      a.rel = 'noopener noreferrer';
      a.target = '_blank';
      // use visible text for accessibility; CSS can style it or replace with icons
      a.textContent = item.label;
      // match existing site styles
      a.className = 'social-link';
      li.appendChild(a);
      listEl.appendChild(li);
    });
  }

  async function renderFooter() {
    try {
      const [data, tpl] = await Promise.all([
        fetchJSON('footer.json'),
        fetchTemplate('footer.html')
      ]);

      const footerPlaceholder = document.getElementById('footer');
      if (!footerPlaceholder) return; // nothing to do on pages without placeholder

      const clone = document.importNode(tpl.content, true);

      // Populate simple text nodes
      const brandNameEl = clone.querySelector('[data-text="brand-name"]');
      const brandTagEl = clone.querySelector('[data-text="brand-tagline"]');
      const copyrightEl = clone.querySelector('[data-text="copyright"]');
      if (brandNameEl && data.brand && data.brand.name) brandNameEl.textContent = data.brand.name;
      if (brandTagEl && data.brand && data.brand.tagline) brandTagEl.textContent = data.brand.tagline;
      if (copyrightEl && data.copyright) copyrightEl.textContent = data.copyright;

      // Populate navigation
      const navList = clone.querySelector('[data-list="navigation"]');
      if (navList && Array.isArray(data.navigation)) createNavList(navList, data.navigation);

      // Populate social
      const socialList = clone.querySelector('[data-list="social"]');
      if (socialList && Array.isArray(data.social)) createSocialList(socialList, data.social);

      // Inject into page
      footerPlaceholder.innerHTML = ''; // clear placeholder
      footerPlaceholder.appendChild(clone);

      // Optional: dispatch an event so pages can react
      window.dispatchEvent(new CustomEvent('footer:loaded', { detail: data }));
    } catch (err) {
      // Fail silently but log error; provide minimal fallback UI
      console.error('Footer load error:', err);
      const footerPlaceholder = document.getElementById('footer');
      if (!footerPlaceholder) return;
      const fallback = document.createElement('footer');
      fallback.className = 'site-footer';
      fallback.textContent = 'Footer unavailable.';
      footerPlaceholder.innerHTML = '';
      footerPlaceholder.appendChild(fallback);
    }
  }

  // Run on DOMContentLoaded if document already loading
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderFooter);
  } else {
    renderFooter();
  }

})();
