const menuToggle = document.getElementById("menu-toggle");
const siteNav = document.getElementById("site-nav");
const printBtn = document.getElementById("print-btn");
const progress = document.getElementById("scroll-progress");
const revealNodes = document.querySelectorAll(".reveal");
const navLinks = document.querySelectorAll('.site-nav a[href^="#"]');

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const open = siteNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

if (printBtn) {
  printBtn.addEventListener("click", () => window.print());
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

revealNodes.forEach((node) => revealObserver.observe(node));

const updateScrollProgress = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const value = max > 0 ? (window.scrollY / max) * 100 : 0;
  progress.style.width = `${value}%`;
};

window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("load", updateScrollProgress);

const sections = Array.from(document.querySelectorAll("main section[id]"));

const setActiveNav = () => {
  const offset = window.scrollY + 120;
  let active = "";

  sections.forEach((section) => {
    if (offset >= section.offsetTop) {
      active = section.id;
    }
  });

  navLinks.forEach((link) => {
    const target = link.getAttribute("href")?.replace("#", "");
    link.classList.toggle("active", target === active);
  });
};

window.addEventListener("scroll", setActiveNav, { passive: true });
window.addEventListener("load", setActiveNav);
