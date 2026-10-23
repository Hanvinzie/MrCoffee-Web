/**
 * animations.js — MR.COFFEE
 * Anime.js v4 (ES Module via CDN)
 *
 * Fixes applied vs previous version:
 *  - Coffee glass SVG removed entirely
 *  - Scroll reveals use IntersectionObserver (not onScroll) — never blocks interactivity
 *  - Elements given .will-animate class in JS *before* first paint via requestAnimationFrame
 *    to avoid the "visible → hidden → animate in" flash/glitch
 *  - Entrance animations (hero, ceo, page-hero) only run after a short defer
 *    so they don't race with the browser render
 */

import { animate, stagger } from 'https://esm.sh/animejs';

// ============================================================
// REDUCED MOTION GUARD
// ============================================================
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ============================================================
// 1. HAMBURGER MENU
// ============================================================
const hamburgerBtn = document.getElementById('hamburgerBtn');
const navLinks     = document.querySelector('.navbar__links');

if (hamburgerBtn && navLinks) {
  hamburgerBtn.addEventListener('click', () => {
    hamburgerBtn.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburgerBtn.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });
}

// ============================================================
// 2. NAVBAR SCROLL SHADOW
// ============================================================
const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  window.addEventListener('scroll', () => {
    siteHeader.style.boxShadow = window.scrollY > 20
      ? '0 4px 20px rgba(16, 44, 87, 0.15)'
      : '';
  }, { passive: true });
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Mark elements as will-animate BEFORE their first paint.
 * Uses a synchronous loop so the class is applied in the same
 * frame the module executes, preventing the visible→hidden flash.
 */
function markForAnimation(selector) {
  if (reducedMotion) return [];
  const els = Array.from(document.querySelectorAll(selector));
  els.forEach(el => el.classList.add('will-animate'));
  return els;
}

/**
 * Animate an element in (remove .will-animate, tween to final state).
 */
function revealEl(el, props = {}) {
  el.classList.remove('will-animate');
  animate(el, {
    opacity:    [0, 1],
    translateY: [32, 0],
    duration: 700,
    ease: 'outCubic',
    ...props,
  });
}

/**
 * Set up IntersectionObserver scroll reveal for a NodeList/Array.
 * Fires once per element (unobserve after triggering).
 */
function scrollReveal(elements, getProps = () => ({}), rootMargin = '-60px') {
  if (reducedMotion || elements.length === 0) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      obs.unobserve(entry.target);
      revealEl(entry.target, getProps(entry.target));
    });
  }, { threshold: 0.1, rootMargin });

  elements.forEach(el => observer.observe(el));
}

/**
 * Staggered scroll reveal for a group of child elements.
 * When the parent enters the viewport, animates all children
 * with a stagger delay.
 */
function scrollRevealGroup(parent, childSelector, extraProps = {}) {
  if (reducedMotion) return;

  const children = Array.from(parent.querySelectorAll(childSelector));
  if (children.length === 0) return;

  // Mark children hidden immediately
  children.forEach(c => c.classList.add('will-animate'));

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      obs.unobserve(entry.target);

      // Remove will-animate and animate all children together
      children.forEach(c => c.classList.remove('will-animate'));
      animate(children, {
        opacity:    [0, 1],
        translateY: [40, 0],
        duration: 680,
        delay:    stagger(80),
        ease:     'outCubic',
        ...extraProps,
      });
    });
  }, { threshold: 0.08 });

  observer.observe(parent);
}

// ============================================================
// 3. SCROLL REVEAL — Generic section headers & reveal elements
// ============================================================
const sectionHeaders = markForAnimation('.section-header');
scrollReveal(sectionHeaders);

// ============================================================
// 7. SCROLL REVEAL — Product Cards (staggered per group)
// ============================================================
if (!reducedMotion) {
  const seenGroups = new Set();

  document.querySelectorAll('.product-list, .menu-items').forEach(group => {
    if (seenGroups.has(group)) return;
    seenGroups.add(group);
    scrollRevealGroup(group, '.product-card');
  });
}

// ============================================================
// 8. SCROLL REVEAL — Timeline Blocks (directional)
// ============================================================
if (!reducedMotion) {
  const leftBlocks  = markForAnimation('.timeline-block.left');
  const rightBlocks = markForAnimation('.timeline-block.right');

  scrollReveal(leftBlocks, () => ({
    opacity:    [0, 1],
    translateX: [-48, 0],
    translateY: [0, 0],
    duration:   750,
    ease:       'outCubic',
  }));

  scrollReveal(rightBlocks, () => ({
    opacity:    [0, 1],
    translateX: [48, 0],
    translateY: [0, 0],
    duration:   750,
    ease:       'outCubic',
  }));
}

// ============================================================
// 9. SCROLL REVEAL — Mission/Vision Cards
// ============================================================
if (!reducedMotion) {
  const mvCards = markForAnimation('.mv-card');
  scrollReveal(mvCards);
}

// ============================================================
// 10. SCROLL REVEAL — Rewards Highlight & CEO Teaser (homepage)
// ============================================================
if (!reducedMotion) {
  const highlightEls = markForAnimation(
    '.rewards-highlight__image, .rewards-highlight__content, .ceo-teaser__inner'
  );
  scrollReveal(highlightEls);
}

// ============================================================
// 11. SCROLL REVEAL — Reward Items (staggered)
// ============================================================
if (!reducedMotion) {
  document.querySelectorAll('.rewards-list, .reward-items-container').forEach(container => {
    scrollRevealGroup(container, '.reward-item', {
      scale: [0.97, 1],
      delay: stagger(100),
    });
  });
}

// ============================================================
// 12. SCROLL REVEAL — Download Section content
// ============================================================
if (!reducedMotion) {
  const dlEls = markForAnimation(
    '.download-section__image, .download-section__content'
  );
  scrollReveal(dlEls);
}

// ============================================================
// 13. SCROLL REVEAL — Order Form & Cart
// (These are NOT given will-animate — they must always be visible
//  and interactive. Animation is purely cosmetic lift-in.)
// ============================================================
if (!reducedMotion) {
  const orderFormCard = document.querySelector('.order-form-card');
  const cartSection   = document.querySelector('#cart-section');

  if (orderFormCard) {
    const observer = new IntersectionObserver((entries, obs) => {
      if (!entries[0].isIntersecting) return;
      obs.unobserve(orderFormCard);
      animate(orderFormCard, {
        opacity: [0.4, 1], translateY: [24, 0], duration: 600, ease: 'outCubic',
      });
    }, { threshold: 0.1 });
    observer.observe(orderFormCard);
  }

  if (cartSection) {
    const observer = new IntersectionObserver((entries, obs) => {
      if (!entries[0].isIntersecting) return;
      obs.unobserve(cartSection);
      animate(cartSection, {
        opacity: [0.4, 1], translateY: [24, 0], duration: 600, delay: 120, ease: 'outCubic',
      });
    }, { threshold: 0.1 });
    observer.observe(cartSection);
  }
}

// Filter buttons are always visible — no entrance animation
