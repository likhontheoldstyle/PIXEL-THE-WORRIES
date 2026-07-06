/**
 * public/main.js
 * ----------------------------------------------------------------
 * Front-end orchestration for the PIXEL site. Everything personal
 * (name, nickname, phone, telegram...) is fetched from /api/profile
 * — never hardcoded here. Tools are fetched from /api/tools (which
 * mirrors public/tools-manifest.json), so new tools appear with
 * zero changes to this file.
 * ----------------------------------------------------------------
 */

/* ------------------------------ Toasts ------------------------------ */
const toastContainer = document.getElementById("toastContainer");
function toast(message, type = "info", ttl = 3000) {
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.textContent = message;
  toastContainer.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, ttl);
}

function copyText(text, label) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast(`${label} copied`, "success"))
    .catch(() => toast("Copy failed", "error"));
}

/* ------------------------------ Data loading ------------------------------ */
async function safeFetch(url, fallback) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch (err) {
    console.warn(`[PIXEL] Failed to load ${url}:`, err.message);
    return fallback;
  }
}

function populateProfile(profile) {
  document.title = profile.seo?.title || `${profile.siteName} — ${profile.name}`;

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  ["navSiteName", "footerBrand"].forEach((id) => setText(id, profile.siteName));
  setText("heroName", profile.name);
  setText("heroNickname", profile.nickname);
  setText("heroTagline", profile.description);
  setText("aboutName", profile.name);
  setText("aboutNick", profile.nickname);
  setText("aboutDescription", profile.description);
  setText("aboutPhone", profile.phone);
  setText("aboutTelegram", profile.telegram);
  setText("footerName", profile.name);
  setText("footerNick", profile.nickname);
  setText("footerContact", `${profile.phone} · ${profile.telegram}`);
  setText("footerYear", profile.year);

  ["navLogo", "heroAvatar"].forEach((id) => {
    const el = document.getElementById(id);
    if (el && profile.logo) el.src = profile.logo;
  });

  renderSkills(profile.skills);
  renderContactCards(profile);
  startTypingEffect(profile.tagline || profile.description);
}

function renderSkills(skills) {
  const block = document.getElementById("skillsBlock");
  if (!block || !skills) return;
  const groups = [
    ["Frontend", skills.frontend],
    ["Backend", skills.backend],
    ["Tools", skills.tools],
  ];
  block.innerHTML = groups
    .filter(([, list]) => list && list.length)
    .map(
      ([label, list]) => `
        <h4>${label}</h4>
        <div class="pill-row">
          ${list.map((s) => `<span class="pill">${s}</span>`).join("")}
        </div>`
    )
    .join("");
}

function renderContactCards(profile) {
  const grid = document.getElementById("contactGrid");
  if (!grid) return;
  const cards = [
    { label: "Name", value: profile.name, copy: profile.name },
    { label: "Phone", value: profile.phone, copy: profile.phone },
    { label: "Telegram", value: profile.telegram, copy: profile.telegramUrl || profile.telegram },
  ];
  grid.innerHTML = cards
    .map(
      (c) => `
      <div class="contact-card glass reveal">
        <span class="label">${c.label}</span>
        <span class="value">${c.value}</span>
        <button class="btn btn-ghost copy-btn" data-copy="${c.copy}">Copy</button>
      </div>`
    )
    .join("");

  grid.querySelectorAll(".copy-btn").forEach((btn) =>
    btn.addEventListener("click", () => copyText(btn.dataset.copy, "Value"))
  );

  observeReveals();
}

function renderProjects(projects) {
  const grid = document.getElementById("projectsGrid");
  if (!grid) return;
  if (!projects || !projects.length) {
    grid.innerHTML = `<p class="tools-empty">No projects listed yet.</p>`;
    return;
  }
  grid.innerHTML = projects
    .map(
      (p) => `
      <a href="${p.link || "#"}" class="glass glass-card project-card reveal">
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <div class="tag-row">
          ${(p.tags || []).map((t) => `<span class="tag">${t}</span>`).join("")}
        </div>
      </a>`
    )
    .join("");
  observeReveals();
}

function renderTools(tools) {
  const grid = document.getElementById("toolsGrid");
  if (!grid) return;
  const enabled = (tools || []).filter((t) => t.enabled);
  if (!enabled.length) {
    grid.innerHTML = `<p class="tools-empty">No tools available yet — add one to <code>src/tools</code>.</p>`;
    return;
  }
  grid.innerHTML = enabled
    .map(
      (t) => `
      <a href="${t.entry}" class="glass glass-card tool-card reveal">
        <span class="tool-emoji">🧰</span>
        <h3>${t.name}</h3>
        <p>${t.description}</p>
        <span class="btn btn-neon">Open Tool</span>
      </a>`
    )
    .join("");
  populateDropdownTools(enabled);
  observeReveals();
}

function populateDropdownTools(tools) {
  // Refresh the "Tools" quick link inside the ⋮ menu with the first tool if present.
  const dropdown = document.getElementById("dropdownMenu");
  if (!dropdown || !tools.length) return;
  const toolsLink = dropdown.querySelector('a[href="#tools"]');
  if (toolsLink) toolsLink.href = "#tools";
}

/* ------------------------------ Typing effect ------------------------------ */
function startTypingEffect(text) {
  const el = document.getElementById("heroTyping");
  if (!el || !text) return;
  const phrases = [text, "Node.js • Automation", "Building PIXEL"];
  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const current = phrases[phraseIndex];
    if (!deleting) {
      charIndex++;
      el.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(tick, 1400);
        return;
      }
    } else {
      charIndex--;
      el.textContent = current.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }
    }
    setTimeout(tick, deleting ? 30 : 55);
  }
  tick();
}

/* ------------------------------ Scroll reveal ------------------------------ */
let revealObserver;
function observeReveals() {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("in-view");
        });
      },
      { threshold: 0.15 }
    );
  }
  document.querySelectorAll(".reveal:not(.in-view)").forEach((el) => revealObserver.observe(el));
}

/* ------------------------------ Nav dropdown + mobile menu ------------------------------ */
function setupNav() {
  const menuToggle = document.getElementById("menuToggle");
  const dropdown = document.getElementById("dropdownMenu");
  const navBurger = document.getElementById("navBurger");
  const mobileNav = document.getElementById("mobileNav");

  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", dropdown.classList.contains("open"));
  });

  navBurger.addEventListener("click", (e) => {
    e.stopPropagation();
    mobileNav.classList.toggle("open");
  });

  document.addEventListener("click", () => {
    dropdown.classList.remove("open");
    mobileNav.classList.remove("open");
  });

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      document.querySelectorAll(".nav-links a").forEach((a) => a.classList.remove("active"));
      link.classList.add("active");
    });
  });

  document.getElementById("btnSettings").addEventListener("click", () => {
    const reduced = document.documentElement.classList.toggle("force-reduced-motion");
    localStorage.setItem("pixel-reduced-motion", reduced ? "1" : "0");
    toast(reduced ? "Reduced motion enabled" : "Reduced motion disabled", "info");
  });

  document.getElementById("btnAboutDev").addEventListener("click", () => {
    document.getElementById("about").scrollIntoView({ behavior: "smooth" });
  });

  document.getElementById("btnFutureUpdates").addEventListener("click", () => {
    const tpl = document.getElementById("futureUpdatesTemplate");
    const panel = tpl.content.firstElementChild.cloneNode(true);
    panel.style.position = "fixed";
    panel.style.bottom = "5.5rem";
    panel.style.right = "1.5rem";
    panel.style.zIndex = "998";
    document.body.appendChild(panel);
    setTimeout(() => panel.remove(), 6000);
  });

  if (localStorage.getItem("pixel-reduced-motion") === "1") {
    document.documentElement.classList.add("force-reduced-motion");
  }
}

/* ------------------------------ Scroll-to-top ------------------------------ */
function setupScrollTop() {
  const btn = document.getElementById("scrollTop");
  window.addEventListener("scroll", () => {
    btn.classList.toggle("show", window.scrollY > 480);
  });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/* ------------------------------ Custom cursor ------------------------------ */
function setupCursor() {
  const dot = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");
  if (window.matchMedia("(pointer: coarse)").matches) return;

  window.addEventListener("mousemove", (e) => {
    dot.style.left = `${e.clientX}px`;
    dot.style.top = `${e.clientY}px`;
    ring.style.left = `${e.clientX}px`;
    ring.style.top = `${e.clientY}px`;
  });

  document.querySelectorAll("a, button").forEach((el) => {
    el.addEventListener("mouseenter", () => ring.classList.add("active"));
    el.addEventListener("mouseleave", () => ring.classList.remove("active"));
  });
}

/* ------------------------------ Particle background ------------------------------ */
function setupParticles() {
  const canvas = document.getElementById("particleCanvas");
  const ctx = canvas.getContext("2d");
  let particles = [];
  let width, height;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  const COUNT = Math.min(70, Math.floor((width * height) / 22000));
  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.6,
    });
  }

  function frame() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0, 212, 255, 0.8)";

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(0, 212, 255, 0.08)";
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 130) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    if (!reduceMotion) requestAnimationFrame(frame);
  }
  frame();
}

/* ------------------------------ Init ------------------------------ */
async function init() {
  setupNav();
  setupScrollTop();
  setupCursor();
  setupParticles();
  observeReveals();

  const [profile, tools, projects] = await Promise.all([
    safeFetch("/api/profile", null),
    safeFetch("/api/tools", []),
    safeFetch("/api/projects", []),
  ]);

  if (profile) populateProfile(profile);
  renderTools(tools);
  renderProjects(projects);

  window.addEventListener("load", () => {
    document.getElementById("loadingScreen").classList.add("hidden");
  });
  // Fallback in case 'load' already fired
  setTimeout(() => document.getElementById("loadingScreen").classList.add("hidden"), 1800);
}

init();
