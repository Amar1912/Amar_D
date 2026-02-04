/* data-loader.js
 * Loads /data/portfolio.json and injects content into the static HTML structure.
 * - Uses templates if present (<template id="...">) or creates elements safely
 * - Sets attributes (data-count, data-progress) so existing animations in main.js keep working
 * - Minimal use of innerHTML (only for small, trusted SVG icon strings)
 */

(function () {
  'use strict';

  // Try multiple paths to support different static server setups (root vs relative)
  const JSON_PATHS = ['/data/portfolio.json', 'data/portfolio.json', './data/portfolio.json', '../data/portfolio.json', window.location.origin + '/data/portfolio.json'];

  function fetchJson(paths) {
    // Attempt each path in order until one succeeds
    let p = Promise.reject();
    paths.forEach(path => {
      p = p.catch(() => fetch(path).then(r => {
        if (!r.ok) throw new Error('fetch failed: ' + path + ' (' + r.status + ')');
        return r.json();
      }));
    });
    return p.catch(err => {
      // final catch: try to fetch using a computed path (best-effort)
      const candidate = (window.location.pathname ? window.location.pathname.replace(/\/[^/]*$/, '') : '') + '/data/portfolio.json';
      return fetch(candidate).then(r => { if (!r.ok) throw err; return r.json(); }).catch(() => { throw err; });
    });
  }

  function q(sel, ctx = document) { return ctx.querySelector(sel); }
  function qAll(sel, ctx = document) { return Array.from(ctx.querySelectorAll(sel)); }

  function get(obj, path) {
    if (!path) return undefined;
    return path.split('.').reduce((acc, p) => (acc && acc[p] !== undefined) ? acc[p] : undefined, obj);
  }

  function setText(el, value) {
    if (!el) return;
    if (value === undefined || value === null) return;
    el.textContent = value;
  }

  function setLink(el, href) {
    if (!el || !href) return;
    el.setAttribute('href', href);
  }

  // Small helper for creating elements with class names quickly
  function el(tag, className) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    return e;
  }

  // Map small, known platform names -> inline SVG markup (keeps design identical)
  function socialIcon(platform) {
    const p = (platform || '').toLowerCase();
    switch (p) {
      case 'github':
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">\n                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>\n              </svg>';
      case 'linkedin':
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">\n                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>\n                </svg>';
      case 'twitter':
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">\n                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>\n                </svg>';
      case 'dribbble':
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">\n                <path d="M12 0C5.375 0 0 5.375 0 12s5.375 12 12 12 12-5.375 12-12S18.625 0 12 0zm7.938 5.563a10.185 10.185 0 0 1 2.313 6.375c-.344-.063-3.75-.75-7.219-.313-.063-.156-.125-.281-.188-.438-.219-.5-.438-1-.688-1.5 3.813-1.563 5.563-3.75 5.782-4.124zM12 1.781c2.625 0 5.031 1 6.844 2.625-.188.344-1.75 2.375-5.406 3.75C11.5 4.781 9.375 2.438 9.094 2.094c.938-.188 1.906-.313 2.906-.313zM7.156 2.813c.281.313 2.344 2.656 4.313 5.938-5.438 1.438-10.188 1.406-10.719 1.406.75-3.25 3.063-5.938 6.406-7.344zM1.781 12c0-.094 0-.188 0-.281.5.031 6.063.094 11.875-1.656.344.656.656 1.344.938 2.031-.125.031-.281.094-.438.125-6.094 1.969-9.313 7.344-9.563 7.781A10.255 10.255 0 0 1 1.781 12zm10.219 10.219c-2.313 0-4.438-.75-6.156-2.031.188-.406 2.563-5 9.25-7.313.031 0 .031-.031.063-.031 1.656 4.313 2.344 7.938 2.531 8.969a10.134 10.134 0 0 1-5.688 1.406zm7.406-2.781c-.125-.719-.75-4.188-2.313-8.438 3.313-.531 6.188.344 6.563.469-.469 3.125-2.156 5.844-4.25 7.969z"/>\n                </svg>';
      default:
        return '';
    }
  }

  function bindSimpleValues(data) {
    // All elements with data-bind that reference primitive values get populated
    qAll('[data-bind]').forEach(function (el) {
      const path = el.getAttribute('data-bind');
      // Skip list containers (we render lists with dedicated functions)
      if (/\.(featured|all|preview|progress|timeline|details|cards)$/.test(path)) return;

      const value = get(data, path);
      if (value !== undefined && typeof value !== 'object') {
        setText(el, value);
      }
    });

    // data-bind-link -> set href
    qAll('[data-bind-link]').forEach(function (el) {
      const path = el.getAttribute('data-bind-link');
      const value = get(data, path);
      if (value) setLink(el, value);
    });
  }

  // Helper: when we clone a <template>, we get a DocumentFragment. Many browsers don't
  // have querySelector on DocumentFragment, so resolve the actual Element root to use.
  function resolveRoot(nodeOrFragment) {
    if (!nodeOrFragment) return null;
    if (nodeOrFragment.nodeType === 11) {
      // return first element child if available; fall back to fragment itself
      return nodeOrFragment.firstElementChild || nodeOrFragment;
    }
    return nodeOrFragment;
  }

  // Projects renderer (featured or all)
  function renderProjects(data) {
    const featuredContainer = q('[data-bind="projects.featured"]');
    const allContainer = q('[data-bind="projects.all"]');
    const tpl = document.getElementById('project-template');
    const projects = Array.isArray(data.projects) ? data.projects : [];

    if (featuredContainer) {
      const featured = projects.filter(p => p.featured).slice(0, 3);
      featuredContainer.innerHTML = '';
      featured.forEach(project => {
        const node = tpl ? tpl.content.cloneNode(true) : createProjectNode(project);
        populateProjectNode(node, project);
        // If node is a DocumentFragment, appendChild will move its children — good.
        featuredContainer.appendChild(node);
      });
    }

    if (allContainer) {
      allContainer.innerHTML = '';
      projects.forEach(project => {
        const node = tpl ? tpl.content.cloneNode(true) : createProjectNode(project);
        populateProjectNode(node, project);
        allContainer.appendChild(node);
      });
    }
  }

  function createProjectNode(project) {
    const article = el('article', 'project-card reveal');
    const imgWrap = el('div', 'project-image');
    const img = el('img');

    // correct image source from images[]
    img.setAttribute('data-src', (project.images && project.images[0]) || '');
    img.alt = project.title || '';

    const overlay = el('div', 'project-overlay');
    const view = el('span', 'project-view');
    view.textContent = 'View Project';

    overlay.appendChild(view);
    imgWrap.appendChild(img);
    imgWrap.appendChild(overlay);

    const content = el('div', 'project-content');
    const cat = el('span', 'project-category');
    const title = el('h3', 'project-title');
    const desc = el('p', 'project-description');
    const tech = el('div', 'project-tech');

    content.appendChild(cat);
    content.appendChild(title);
    content.appendChild(desc);
    content.appendChild(tech);

    article.appendChild(imgWrap);
    article.appendChild(content);
    return article;
  }


  function populateProjectNode(fragmentOrNode, project) {
    const root = resolveRoot(fragmentOrNode);
    if (!root) return;

    /* IMAGE → first image from images[] */
    const img = root.querySelector('img');
    if (img && Array.isArray(project.images) && project.images.length > 0) {
      img.alt = project.title || '';
      img.setAttribute('data-src', project.images[0]);
    }

    /* GO TO PROJECT BUTTON → GitHub */
    const goBtn = root.querySelector('.go-project-btn');
    if (goBtn && project.repoUrl) {
      goBtn.href = project.repoUrl;
    }


    /* CATEGORY */
    const cat = root.querySelector('.project-category');
    if (cat) cat.textContent = project.category || '';

    /* TITLE */
    const title = root.querySelector('.project-title');
    if (title) title.textContent = project.title || '';

    /* SHORT DESCRIPTION */
    const desc = root.querySelector('.project-description');
    if (desc) desc.textContent = project.shortDescription || '';

    /* TECH STACK */
    const techWrap = root.querySelector('.project-tech');
    if (techWrap) {
      techWrap.innerHTML = '';
      (project.techStack || []).forEach(t => {
        const span = el('span', 'tech-tag');
        span.textContent = t;
        techWrap.appendChild(span);
      });
    }

    /* VIEW PROJECT LINK */
    /* VIEW PROJECT → GitHub Repo */
    const view = root.querySelector('.project-view');

    if (view && project.repoUrl) {
      const a = document.createElement('a');
      a.href = project.repoUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'project-view-link';

      // inherit styles from span
      a.style.color = 'inherit';
      a.style.textDecoration = 'none';
      a.style.display = 'inline-flex';
      a.style.alignItems = 'center';
      a.style.gap = '6px';

      // move text + svg inside anchor
      while (view.firstChild) {
        a.appendChild(view.firstChild);
      }

      view.appendChild(a);
    }



    /* REPO LINK (GitHub icon) */
    const linksWrap = root.querySelector('.project-links');
    if (linksWrap) {
      linksWrap.innerHTML = '';
      if (project.repoUrl) {
        const ra = document.createElement('a');
        ra.href = project.repoUrl;
        ra.className = 'project-repo';
        ra.target = '_blank';
        ra.rel = 'noopener noreferrer';
        ra.innerHTML = socialIcon('github');
        linksWrap.appendChild(ra);
      }
    }
  }


  function renderTestimonials(data) {
    // Support both preview and full lists. If a container uses 'testimonials.preview' it will
    // receive a limited number of items (default 3) — configurable via data.testimonialsPreviewCount
    const containers = qAll('[data-bind="testimonials.preview"], [data-bind="testimonials.all"]');
    if (!containers.length) return;
    const tpl = document.getElementById('testimonial-template');
    const allTestimonials = Array.isArray(data.testimonials) ? data.testimonials : [];
    const previewCount = Number(data.testimonialsPreviewCount || 3);

    containers.forEach(container => {
      container.innerHTML = '';
      const isPreview = container.getAttribute('data-bind') === 'testimonials.preview';
      const items = isPreview ? allTestimonials.slice(0, previewCount) : allTestimonials;

      items.forEach(t => {
        const node = tpl ? tpl.content.cloneNode(true) : createTestimonialNode(t);
        populateTestimonialNode(node, t);
        // If node is fragment, appendChild will move its children into the container
        container.appendChild(node);
      });
    });
  }

  function createTestimonialNode(t) {
    const card = el('div', 'testimonial-card reveal');
    const content = el('div', 'testimonial-content');
    const p = el('p', 'testimonial-text');
    const author = el('div', 'testimonial-author');
    const img = el('img');
    img.className = 'testimonial-avatar';
    const info = el('div', 'testimonial-info');
    const h4 = el('h4');
    const role = el('span');

    content.appendChild(p);
    info.appendChild(h4);
    info.appendChild(role);
    author.appendChild(img);
    author.appendChild(info);
    card.appendChild(content);
    card.appendChild(author);
    return card;
  }

  function populateTestimonialNode(fragmentOrNode, t) {
    const root = resolveRoot(fragmentOrNode);
    if (!root) return;
    const txt = root.querySelector('.testimonial-text');
    if (txt) txt.textContent = t.quote || '';
    const name = root.querySelector('.testimonial-name');
    if (name) name.textContent = t.name || '';
    const role = root.querySelector('.testimonial-role');
    if (role) role.textContent = t.role || '';
  }

  function renderStats(data) {
    const container = q('[data-bind="stats"]');
    if (!container || !Array.isArray(data.stats)) return;
    const tpl = document.getElementById('stat-template');
    container.innerHTML = '';
    data.stats.forEach(s => {
      let node;
      if (tpl) node = tpl.content.cloneNode(true);
      else {
        node = document.createDocumentFragment();
        const item = el('div', 'stat-item');
        const number = el('div', 'stat-number');
        const label = el('div', 'stat-label');
        number.textContent = '0' + (s.suffix || '');
        number.setAttribute('data-count', s.count);
        if (s.suffix) number.setAttribute('data-suffix', s.suffix);
        label.textContent = s.label;
        item.appendChild(number);
        item.appendChild(label);
        node.appendChild(item);
      }

      // Normalize fragment -> element root for querying
      const root = resolveRoot(node);
      if (root && root.querySelector) {
        const number = root.querySelector('.stat-number');
        if (number) {
          number.setAttribute('data-count', s.count);
          if (s.suffix) number.setAttribute('data-suffix', s.suffix);
          number.textContent = '0' + (s.suffix || '');
        }
        const label = root.querySelector('.stat-label');
        if (label) label.textContent = s.label;
      }

      container.appendChild(node);
    });
  }

  function renderSkillsCards(data) {
    const container = q('[data-bind="skills.cards"]');
    if (!container || !data.skills || !Array.isArray(data.skills.cards)) return;

    const tpl = document.getElementById('skill-card-template');
    container.innerHTML = '';

    data.skills.cards.forEach(s => {
      const node = tpl
        ? tpl.content.cloneNode(true)
        : createSkillCardNode(s);

      // title
      const title = node.querySelector('.skill-title');
      if (title) title.textContent = s.title || '';

      // description
      const desc = node.querySelector('.skill-desc');
      if (desc) desc.textContent = s.desc || '';

      // ICON (PNG from JSON path)
      const icon = node.querySelector('.skill-icon');
      if (icon && s.icon) {
        const img = document.createElement('img');
        img.src = s.icon;
        img.alt = s.title || 'skill icon';
        img.loading = 'lazy';

        icon.innerHTML = '';
        icon.appendChild(img);
      }

      container.appendChild(node);
    });
  }

  function createSkillCardNode(s) {
    const card = el('div', 'skill-card reveal');

    const icon = el('div', 'skill-icon');

    const h3 = el('h3');
    h3.className = 'skill-title';

    const p = el('p');
    p.className = 'skill-desc';

    card.appendChild(icon);
    card.appendChild(h3);
    card.appendChild(p);

    return card;
  }
  function renderSkillsProgress(data) {
    const container = q('[data-bind="skills.progress"]');
    if (!container || !data.skills || !Array.isArray(data.skills.progress)) return;

    container.innerHTML = '';

    const tpl = document.getElementById('skill-progress-template');
    const itemTpl = document.getElementById('skill-progress-item-template');

    data.skills.progress.forEach(category => {
      const frag = tpl
        ? tpl.content.cloneNode(true)
        : createSkillProgressNode(category);

      // 🔑 IMPORTANT: resolve fragment → element
      const root = resolveRoot(frag);
      if (!root) return;

      // TITLE
      const title = root.querySelector('.skills-category-title');
      if (title) title.textContent = category.category || category.title || '';

      // ICON
      const icon = root.querySelector('.skills-category-icon');
      if (icon && category.icon) {
        const img = document.createElement('img');
        img.src = category.icon;
        img.alt = title?.textContent || 'skill category icon';
        img.loading = 'lazy';
        icon.innerHTML = '';
        icon.appendChild(img);
      }

      // ITEMS
      const itemsWrap = root.querySelector('.skills-category-items');
      if (itemsWrap && Array.isArray(category.items)) {
        category.items.forEach(it => {
          const itFrag = itemTpl
            ? itemTpl.content.cloneNode(true)
            : createSkillProgressItemNode(it);

          const itRoot = resolveRoot(itFrag);
          if (!itRoot) return;

          const nameEl = itRoot.querySelector('.skill-progress-name');
          if (nameEl) nameEl.textContent = it.name || '';

          const pctEl = itRoot.querySelector('.skill-progress-percent');
          if (pctEl) pctEl.textContent = `${it.percent || 0}%`;

          const fill = itRoot.querySelector('.skill-progress-fill');
          if (fill) {
            fill.style.width = '0%';
            fill.dataset.progress = it.percent || 0;
            requestAnimationFrame(() => {
              fill.style.width = `${it.percent || 0}%`;
            });
          }

          itemsWrap.appendChild(itFrag);
          itRoot.classList.add('animated');

        });
      }

      container.appendChild(frag);
    });
  }



  function createSkillProgressNode(category) {
    const node = el('div', 'skills-category reveal');
    const header = el('div', 'skills-category-header');
    const icon = el('div', 'skills-category-icon');
    const h3 = el('h3');
    h3.className = 'skills-category-title';
    header.appendChild(icon);
    header.appendChild(h3);
    node.appendChild(header);
    const items = el('div', 'skills-category-items');
    node.appendChild(items);
    return node;
  }

  function createSkillProgressItemNode(it) {
    const wrap = el('div', 'skill-progress-item');
    const header = el('div', 'skill-progress-header');
    const name = el('span', 'skill-progress-name');
    const pct = el('span', 'skill-progress-percent');
    header.appendChild(name);
    header.appendChild(pct);
    const bar = el('div', 'skill-progress-bar');
    const fill = el('div', 'skill-progress-fill');
    fill.setAttribute('data-progress', it.percent || 0);
    bar.appendChild(fill);
    wrap.appendChild(header);
    wrap.appendChild(bar);
    return wrap;
  }

  function renderTimeline(data) {
    const container = q('[data-bind="timeline"]');
    if (!container || !Array.isArray(data.timeline)) return;
    const tpl = document.getElementById('timeline-item-template');
    container.innerHTML = '';
    // keep timeline-line-progress element if present
    const line = el('div', 'timeline-line-progress');
    container.appendChild(line);

    data.timeline.forEach(item => {
      const frag = tpl ? tpl.content.cloneNode(true) : createSkillCardNode(s);
      const node = resolveRoot(frag);
      const root = resolveRoot(node);
      if (!root) return;
      const year = root.querySelector('.timeline-year');
      if (year) year.textContent = item.year || '';
      const title = root.querySelector('.timeline-title');
      if (title) title.textContent = item.title || '';
      const desc = root.querySelector('.timeline-description');
      if (desc) desc.textContent = item.description || '';
      container.appendChild(node);
    });
  }

  // Certifications renderer
  function renderCertifications(data) {
    const container = q('[data-bind="certifications"]');
    if (!container) return;
    const tpl = document.getElementById('certification-template');

    // If there are no certifications, show a friendly placeholder
    if (!Array.isArray(data.certifications) || data.certifications.length === 0) {
      container.innerHTML = '<div class="empty-state reveal"><p>No certifications found. Add them to <code>data/portfolio.json</code>.</p></div>';
      return;
    }

    container.innerHTML = '';

    data.certifications.forEach(cert => {
      const node = tpl ? tpl.content.cloneNode(true) : createCertNode(cert);
      const root = resolveRoot(node);
      if (!root) return;
      const title = root.querySelector('.cert-title'); if (title) title.textContent = cert.title || '';
      const org = root.querySelector('.cert-org'); if (org) org.textContent = cert.issuingOrganization || '';
      const year = root.querySelector('.cert-year'); if (year) year.textContent = cert.year || '';
      const desc = root.querySelector('.cert-desc'); if (desc) desc.textContent = cert.description || '';
      const logoImg = root.querySelector('.cert-logo img'); if (logoImg && cert.logo) logoImg.setAttribute('data-src', cert.logo);
      const actions = root.querySelector('.cert-actions');
      if (actions) {
        actions.innerHTML = '';
        if (cert.credentialUrl) {
          const a = document.createElement('a');
          a.href = cert.credentialUrl;
          a.className = 'btn btn-secondary';
          a.textContent = 'View Credential';
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener noreferrer');
          actions.appendChild(a);
        }
      }
      container.appendChild(node);
    });
    console.info('[data-loader] rendered certifications:', container.children.length);
  }

  function createCertNode(cert) {
    const article = el('article', 'cert-card reveal');
    const logo = el('div', 'cert-logo');
    const img = el('img'); img.alt = cert.title || '';
    if (cert.logo) img.setAttribute('data-src', cert.logo);
    logo.appendChild(img);
    const content = el('div', 'cert-content');
    const h3 = el('h3'); h3.className = 'cert-title'; h3.textContent = cert.title || '';
    const meta = el('div', 'cert-meta'); const org = el('span'); org.className = 'cert-org'; org.textContent = cert.issuingOrganization || ''; const y = el('span'); y.className = 'cert-year'; y.textContent = cert.year || '';
    meta.appendChild(org); meta.appendChild(y);
    const p = el('p'); p.className = 'cert-desc'; p.textContent = cert.description || '';
    const actions = el('div', 'cert-actions');
    if (cert.credentialUrl) {
      const a = document.createElement('a'); a.className = 'btn btn-secondary'; a.href = cert.credentialUrl; a.textContent = 'View Credential'; a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener noreferrer'); actions.appendChild(a);
    }
    content.appendChild(h3); content.appendChild(meta); content.appendChild(p); content.appendChild(actions);
    article.appendChild(logo); article.appendChild(content);
    return article;
  }

  function createTimelineNode(item) {
    const t = el('div', 'timeline-item');
    t.innerHTML = '<div class="timeline-dot"></div><div class="timeline-content"><span class="timeline-year"></span><h3 class="timeline-title"></h3><p class="timeline-description"></p></div>';
    return t;
  }

  // Resume renderer
  function renderResume(data) {
    const resume = data && data.resume ? data.resume : {};
    const experience = Array.isArray(resume.experience) ? resume.experience : [];
    const education = Array.isArray(resume.education) ? resume.education : [];

    const cols = qAll('.resume-grid .resume-column');
    const expCol = cols[0];
    const eduCol = cols[1];
    if (!expCol || !eduCol) return;

    // Remove existing resume items (keep headers)
    expCol.querySelectorAll('.resume-item').forEach(n => n.remove());
    eduCol.querySelectorAll('.resume-item').forEach(n => n.remove());

    experience.forEach(item => {
      const node = createResumeItem(item, 'experience');
      expCol.appendChild(node);
    });

    education.forEach(item => {
      const node = createResumeItem(item, 'education');
      eduCol.appendChild(node);
    });
  }

  function createResumeItem(item, type) {
    const wrap = el('div', 'resume-item reveal');
    const period = el('span', 'resume-period');
    const from = item.from || item.year || '';
    const to = item.to || '';
    period.textContent = from && to ? (from + ' - ' + to) : (from || to || '');

    const title = el('h4', 'resume-title');
    const company = el('p', 'resume-company');
    const desc = el('p', 'resume-description');

    if (type === 'experience') {
      title.textContent = item.role || item.title || '';
      company.textContent = item.company || '';
      desc.textContent = item.desc || item.description || '';
    } else {
      title.textContent = item.degree || item.title || item.role || '';
      company.textContent = item.institution || item.company || '';
      desc.textContent = item.desc || item.description || '';
    }

    wrap.appendChild(period);
    wrap.appendChild(title);
    if (company.textContent) wrap.appendChild(company);
    if (desc.textContent) wrap.appendChild(desc);
    return wrap;
  }

  function renderContact(data) {
    const container = q('[data-bind="contact.details"]');
    if (!container || !data.contact) return;
    container.innerHTML = '';

    const items = [
      { label: 'Email', value: data.contact.email, link: data.contact.emailLink },
      { label: 'Location', value: data.contact.location },
      { label: 'Availability', value: data.contact.availability }
    ];

    items.forEach(it => {
      const row = el('div', 'contact-item');
      const icon = el('div', 'contact-icon');
      // keep icon blank (CSS handles visuals)
      const inner = el('div');
      const label = el('span', 'contact-label'); label.textContent = it.label;
      const valueWrap = el('div', 'contact-value');

      if (it.link) {
        const a = document.createElement('a');
        a.href = it.link;
        a.textContent = it.value;
        valueWrap.appendChild(a);
      } else {
        valueWrap.textContent = it.value || '';
      }

      inner.appendChild(label);
      inner.appendChild(valueWrap);
      row.appendChild(icon);
      row.appendChild(inner);
      container.appendChild(row);
    });
  }

  function renderSocialLinks(data) {
    const nodes = qAll('[data-bind="socialLinks"]');
    if (!nodes.length || !Array.isArray(data.socialLinks)) return;
    nodes.forEach(container => {
      container.innerHTML = '';
      data.socialLinks.forEach(link => {
        const a = el('a', 'social-link');
        a.setAttribute('aria-label', link.platform);
        a.href = link.url;
        a.innerHTML = socialIcon(link.platform) || (link.platform);
        container.appendChild(a);
      });
    });
  }

  // Render GitHub / work progress stats (optional object in portfolio.json)
 

  // Render project detail page when `project.html?id=...` is opened
  function renderProjectPage(data) {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('id');
    if (!pid) return;

    const project = Array.isArray(data.projects) ? data.projects.find(p => String(p.id) === pid) : undefined;

    const titleEl = q('[data-bind="project.title"]');
    const shortEl = q('[data-bind="project.shortDescription"]');
    const categoryEl = q('[data-bind="project.category"]');
    const problemEl = q('[data-bind="project.problem"]');
    const solutionEl = q('[data-bind="project.solution"]');
    const impactEl = q('[data-bind="project.impact"]');
    const techEl = q('[data-bind="project.techStack"]');
    const imagesEl = q('[data-bind="project.images"]');

    if (!project) {
      // show fallback
      const container = q('[data-bind="project.detail"]') || q('main');
      if (container) {
        const msg = el('div', 'not-found reveal');
        msg.textContent = 'Project not found.';
        container.innerHTML = '';
        container.appendChild(msg);
      }
      return;
    }

    if (titleEl) titleEl.textContent = project.title || '';
    if (shortEl) shortEl.textContent = project.shortDescription || '';
    if (categoryEl) categoryEl.textContent = project.category || '';
    if (problemEl) problemEl.textContent = project.problem || '';
    if (solutionEl) solutionEl.textContent = project.solution || '';

    // impact list
    if (impactEl) {
      impactEl.innerHTML = '';
      const tpl = document.getElementById('impact-item-template');
      (project.impact || []).forEach(it => {
        const node = tpl ? tpl.content.cloneNode(true) : (function () { const li = document.createElement('li'); li.className = 'impact-item'; li.textContent = it; return li; })();
        const root = resolveRoot(node);
        if (root) {
          const li = root.querySelector && root.querySelector('.impact-item');
          if (li) li.textContent = it;
        }
        impactEl.appendChild(node);
      });
    }

    // tech stack
    if (techEl) {
      techEl.innerHTML = '';
      const tpl = document.getElementById('tech-item-template');
      (project.techStack || []).forEach(t => {
        const node = tpl ? tpl.content.cloneNode(true) : (function () { const s = document.createElement('span'); s.className = 'tech-tag'; s.textContent = t; return s; })();
        const root = resolveRoot(node);
        if (root) {
          const tag = root.querySelector && root.querySelector('.tech-tag');
          if (tag) tag.textContent = t;
        }
        techEl.appendChild(node);
      });
    }

    // images
    if (imagesEl) {
      imagesEl.innerHTML = '';
      const tpl = document.getElementById('project-image-template');
      (project.images || []).forEach(src => {
        const node = tpl ? tpl.content.cloneNode(true) : (function () { const d = document.createElement('div'); d.className = 'project-image'; const i = document.createElement('img'); i.alt = project.title || ''; i.setAttribute('data-src', src); d.appendChild(i); return d; })();
        const root = resolveRoot(node);
        if (root) {
          const img = root.querySelector('img'); if (img) img.setAttribute('data-src', src);
        }
        imagesEl.appendChild(node);
      });
    }

    // links
    const live = q('[data-bind-link="project.liveUrl"]');
    const src = q('[data-bind-link="project.repoUrl"]');
    if (live) {
      if (project.liveUrl) live.setAttribute('href', project.liveUrl);
      else live.style.display = 'none';
    }
    if (src) {
      if (project.repoUrl) src.setAttribute('href', project.repoUrl);
      else src.style.display = 'none';
    }

    // set document title
    if (project.title && data.site && data.site.name) document.title = project.title + ' — ' + data.site.name;
  }




  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }

  // Use fetchJson helper to obtain the JSON and render
  function init() {
    fetchJson(JSON_PATHS).then(data => {
      // Bind simple text values
      bindSimpleValues(data);

      // Page-specific renders
      renderProjects(data);
      renderTestimonials(data);
      renderStats(data);
      renderSkillsCards(data);
      renderSkillsProgress(data);
      renderCertifications(data);
      renderTimeline(data);
      renderResume(data);
      renderContact(data);
      renderSocialLinks(data);

      // Page-specific: project detail
      renderProjectPage(data);

      // Update nav logo and metadata
      const navLogo = q('.nav-logo');
      if (navLogo && data.site && data.site.name) navLogo.textContent = data.site.name.split(' ').map(n => n[0]).join('').toUpperCase();

      if (data.site && data.site.meta) {
        if (data.site.meta.title) document.title = data.site.meta.title;
        if (data.site.meta.description) {
          const md = document.querySelector('meta[name="description"]');
          if (md) md.setAttribute('content', data.site.meta.description);
        }
      }

      // Fire a small event so other scripts may respond if they run earlier
      console.info('[data-loader] portfolio.json loaded');
      // eager-load images that are already visible (helps if observers attach slightly late)
      try {
        const imgs = document.querySelectorAll('img[data-src]');
        imgs.forEach(img => {
          try {
            const r = img.getBoundingClientRect();
            if (r.top < (window.innerHeight + 200) && r.bottom > -200) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
          } catch (e) { }
        });
      } catch (e) { }
      // signal to other scripts that data is present (helps avoid race conditions)
      window.__portfolioDataLoaded = true;
      document.dispatchEvent(new CustomEvent('portfolio-data-loaded', { detail: data }));
    }).catch(err => {
      console.error('[data-loader] failed to load', err);
    });
  

  }
})();
