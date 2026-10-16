// Component callback checks without audio, provider, network, or browser execution.
// Run: node scripts/verify-ui.mjs [--source <baseline-directory>] [--baseline <snapshot-directory>]
// This small DOM double checks event wiring; browser rendering/accessibility QA is separate.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const option = name => { const index = process.argv.indexOf(name); return index < 0 ? null : process.argv[index + 1]; };
const source = path.resolve(option('--source') || repo);
const baseline = option('--baseline');
const results = [];
function check(name, action) { action(); results.push(name); console.log(`PASS ${name}`); }
const dataKey = name => name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

class TestNode {
  constructor(tag = '') {
    this.tagName = tag.toUpperCase(); this.children = []; this.parentNode = null;
    this.attrs = {}; this.dataset = {}; this.listeners = {}; this._text = ''; this.className = '';
    this.style = { setProperty(name, value) { this[name] = String(value); }, getPropertyValue(name) { return this[name] || ''; }, removeProperty(name) { delete this[name]; } };
    this.classList = {
      contains: value => this.className.split(/\s+/).includes(value),
      add: (...values) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...values])].join(' '); },
      remove: (...values) => { this.className = this.className.split(/\s+/).filter(value => !values.includes(value)).join(' '); },
      toggle: (value, force) => { const enabled = force ?? !this.classList.contains(value); this.classList[enabled ? 'add' : 'remove'](value); return enabled; }
    };
  }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map(node => node.textContent).join(''); }
  setAttribute(name, value) {
    this.attrs[name] = String(value);
    if (name === 'class') this.className = String(value);
    if (name === 'id') this.id = String(value);
    if (name.startsWith('data-')) this.dataset[dataKey(name)] = String(value);
    if (name === 'disabled') this.disabled = true;
    if (name === 'tabindex') this.tabIndex = Number(value);
  }
  getAttribute(name) { if (name === 'class') return this.className; if (name === 'id') return this.id || null; return name.startsWith('data-') ? this.dataset[dataKey(name)] ?? null : this.attrs[name] ?? null; }
  hasAttribute(name) { return this.getAttribute(name) !== null; }
  removeAttribute(name) { delete this.attrs[name]; if (name === 'disabled') this.disabled = false; }
  appendChild(node) { if (node.parentNode) node.remove(); node.parentNode = this; this.children.push(node); return node; }
  append(...nodes) { nodes.forEach(node => this.appendChild(typeof node === 'string' ? document.createTextNode(node) : node)); }
  replaceChildren(...nodes) { this.children.forEach(node => { node.parentNode = null; }); this.children = []; this._text = ''; this.append(...nodes); }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(node => node !== this); this.parentNode = null; }
  addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); }
  removeEventListener(type, handler) { this.listeners[type] = (this.listeners[type] || []).filter(item => item !== handler); }
  dispatch(type, init = {}) {
    const event = { type, bubbles: true, cancelable: true, target: this, currentTarget: this, defaultPrevented: false, propagationStopped: false,
      preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this.propagationStopped = true; }, stopImmediatePropagation() { this.propagationStopped = true; this.immediateStopped = true; }, ...init };
    for (let node = this; node; node = event.bubbles && !event.propagationStopped ? node.parentNode : null) {
      event.currentTarget = node;
      for (const handler of node.listeners[type] || []) { handler(event); if (event.immediateStopped) break; }
    }
    return event;
  }
  click() { if (!this.disabled) this.dispatch('click', { clientX: 250, clientY: 25, detail: 1 }); }
  focus() { document.activeElement = this; }
  contains(other) { return other === this || this.children.some(child => child.contains(other)); }
  closest(selector) { for (let node = this; node; node = node.parentNode) if (node.matches(selector)) return node; return null; }
  matches(selector) {
    return selector.split(',').some(part => {
      const item = part.trim();
      const tag = item.match(/^[a-z][\w-]*/i)?.[0];
      if (tag && this.tagName !== tag.toUpperCase()) return false;
      if ([...item.matchAll(/\.([\w-]+)/g)].some(match => !this.classList.contains(match[1]))) return false;
      if ([...item.matchAll(/#([\w-]+)/g)].some(match => this.id !== match[1])) return false;
      for (const match of item.matchAll(/\[([^\]=~^$*|]+)(?:=["']?([^\]"']*)["']?)?\]/g)) {
        const value = this.getAttribute(match[1]); if (value === null || (match[2] !== undefined && value !== match[2])) return false;
      }
      return true;
    });
  }
  querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 1000, height: 100, right: 1000, bottom: 100 }; }
  setPointerCapture() {} releasePointerCapture() {} hasPointerCapture() { return true; }
  get firstChild() { return this.children[0] || null; }
}
globalThis.Node = TestNode;
globalThis.HTMLElement = TestNode;
globalThis.document = new TestNode('document');
document.createElement = tag => new TestNode(tag);
document.createElementNS = (_, tag) => new TestNode(tag);
document.createTextNode = text => { const node = new TestNode(); node.textContent = text; return node; };
document.body = document.appendChild(new TestNode('body'));
document.head = document.appendChild(new TestNode('head'));
document.getElementById = id => document.querySelector(`#${id}`);
globalThis.window = new TestNode('window');
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
window.requestAnimationFrame = callback => callback(0);
globalThis.requestAnimationFrame = window.requestAnimationFrame;
const mount = node => { document.body.replaceChildren(node); return node; };
const load = relative => import(pathToFileURL(path.join(source, relative)).href);
const { RECORDS } = await load('src/data.js');
const { createHeroSection } = await load('src/components/sections/hero-section.js');
const { createMasterModal } = await load('src/components/player/master-modal.js');
const { createMiniDock } = await load('src/components/player/mini-dock.js');
const { createHeader } = await load('src/components/layout/header.js');
const { createMobileNav } = await load('src/components/layout/mobile-nav.js');

const calls = [];
const handlerNames = ['onSelectTrack','onTogglePlay','onNext','onPrev','onSeek','onOpenPlayer','onStartRoom','onExploreRecords','onClose','onVolumeChange','onToggleMute','onSelectPlaylist','onInviteFriends','onCopyLink','onJoinCode','onShareWhatsapp','onShareTelegram','onShareNative','onLeaveRoom','onExpand','onNavigate','onInstall'];
const handlers = Object.fromEntries(handlerNames.map(name => [name, (...args) => calls.push([name, ...args])]));
function oneClick(node, name, ...args) { assert.ok(node, `Missing ${name} control`); calls.length = 0; node.click(); assert.deepEqual(calls, [[name, ...args]]); }
const hero = mount(createHeroSection(handlers));
check('mount does not invoke playback', () => assert.deepEqual(calls, []));
check('five track rows retain their exact existing selection actions', () => {
  const rows = hero.querySelectorAll('.spotify-queue-row');
  assert.equal(rows.length, 5);
  const expected = [['awarapan-2', 0], ['love', 0], ['imagination', 0], ['dreamer', 0], ['awarapan-2', 1]];
  rows.forEach((row, index) => oneClick(row, 'onSelectTrack', ...expected[index]));
});
const cards = hero.querySelectorAll('.playlist-card');
if (source === repo || cards.length) {
  check('carousel uses four existing record covers and native accessible buttons', () => {
    assert.equal(cards.length, RECORDS.length);
    cards.forEach((card, index) => {
      assert.equal(card.tagName, 'BUTTON'); assert.ok(card.getAttribute('aria-label'));
      assert.equal(card.querySelector('img').getAttribute('src'), RECORDS[index].cover);
    });
  });
  check('each carousel card invokes its existing action exactly once', () => cards.forEach((card, index) => oneClick(card, 'onSelectTrack', RECORDS[index].id, 0)));
  check('arrows, pagination, and arrow keys browse without playback', () => {
    calls.length = 0;
    const navigation = [...hero.querySelectorAll('.carousel-prev'), ...hero.querySelectorAll('.carousel-next'), ...hero.querySelectorAll('[data-carousel-page]')];
    assert.ok(navigation.length >= 6);
    navigation.forEach(button => button.click());
    cards[0].dispatch('keydown', { key: 'ArrowRight', code: 'ArrowRight' });
    cards[0].dispatch('keydown', { key: 'ArrowLeft', code: 'ArrowLeft' });
    assert.deepEqual(calls, []);
    assert.equal(cards.filter(card => card.classList.contains('is-selected')).length || cards.filter(card => card.classList.contains('active')).length, 1);
  });
  check('horizontal dragging browses and suppresses its trailing click', () => {
    const stage = hero.querySelector('.playlist-carousel-stage');
    const before = cards.findIndex(card => card.classList.contains('is-selected'));
    calls.length = 0;
    const pointer = { isPrimary: true, button: 0, pointerId: 1, clientX: 200, clientY: 50 };
    stage.dispatch('pointerdown', pointer);
    stage.dispatch('pointermove', { ...pointer, clientX: 120 });
    stage.dispatch('pointerup', { ...pointer, clientX: 120 });
    assert.equal(cards.findIndex(card => card.classList.contains('is-selected')), (before + 1) % cards.length);
    cards[0].click();
    assert.deepEqual(calls, []);
    stage.dispatch('pointerdown', pointer); stage.dispatch('pointerup', pointer);
    oneClick(cards[0], 'onSelectTrack', RECORDS[0].id, 0);
  });
  check('vertical gestures remain available for page scrolling', () => {
    const stage = hero.querySelector('.playlist-carousel-stage');
    const before = cards.findIndex(card => card.classList.contains('is-selected'));
    calls.length = 0;
    const pointer = { isPrimary: true, button: 0, pointerId: 2, clientX: 200, clientY: 50 };
    assert.equal(stage.dispatch('pointerdown', pointer).defaultPrevented, false);
    assert.equal(stage.dispatch('pointermove', { ...pointer, clientX: 205, clientY: 150 }).defaultPrevented, false);
    stage.dispatch('pointercancel', pointer);
    assert.equal(cards.findIndex(card => card.classList.contains('is-selected')), before);
    assert.deepEqual(calls, []);
  });
  check('carousel Home/End focus a card without selecting music', () => {
    calls.length = 0;
    cards[0].dispatch('keydown', { key: 'End', code: 'End' }); assert.equal(document.activeElement, cards.at(-1));
    cards.at(-1).dispatch('keydown', { key: 'Home', code: 'Home' }); assert.equal(document.activeElement, cards[0]);
    assert.deepEqual(calls, []);
  });
  check('home transport and keyboard seeking preserve existing callbacks', () => {
    oneClick(hero.querySelector('#hero-play-pause-btn'), 'onTogglePlay');
    oneClick(hero.querySelector('[aria-label="Previous Track"]'), 'onPrev');
    oneClick(hero.querySelector('[aria-label="Next Track"]'), 'onNext');
    const seek = hero.querySelector('#hero-progress-bar'); oneClick(seek, 'onSeek', 0.25);
    for (const [key, value] of [['ArrowRight', 0.05], ['Home', 0], ['End', 1]]) {
      calls.length = 0; seek.dispatch('keydown', { key }); assert.deepEqual(calls, [['onSeek', value]]);
    }
    for (const name of ['Shuffle', 'Repeat']) assert.equal(hero.querySelector(`[aria-label="${name} unavailable"]`).disabled, true);
  });
}
const modal = mount(createMasterModal(handlers));
check('player transport, mute, and local volume reuse callbacks', () => {
  oneClick(modal.querySelector('#modal-play-btn'), 'onTogglePlay');
  oneClick(modal.querySelector('#modal-prev-btn'), 'onPrev');
  oneClick(modal.querySelector('#modal-next-btn'), 'onNext');
  oneClick(modal.querySelector('#modal-volume-mute-btn'), 'onToggleMute');
  const slider = modal.querySelector('#modal-volume-slider'); slider.value = '37'; calls.length = 0; slider.dispatch('input'); assert.deepEqual(calls, [['onVolumeChange', 37]]);
  oneClick(modal.querySelector('#modal-progress-bar'), 'onSeek', 0.25);
});
check('all five curated playlist selection callbacks remain exact', () => {
  const buttons = modal.querySelectorAll('[data-play-playlist]'); assert.equal(buttons.length, 5);
  buttons.forEach(button => oneClick(button, 'onSelectPlaylist', button.dataset.playPlaylist));
});
if (source === repo) check('studio keyboard seeking and room-code Enter invoke callbacks once', () => {
  const seek = modal.querySelector('#modal-progress-bar'); modal.querySelector('#modal-progress-fill').style.width = '50%';
  for (const [key, value] of [['ArrowRight', 0.52], ['Home', 0], ['End', 1]]) {
    calls.length = 0; seek.dispatch('keydown', { key }); assert.deepEqual(calls, [['onSeek', value]]);
  }
  const input = modal.querySelector('#join-code-input'); input.value = 'MEL-8K9X'; calls.length = 0;
  input.dispatch('keydown', { key: 'Enter' }); assert.deepEqual(calls, [['onJoinCode', 'MEL-8K9X']]);
});
check('room entry, invitation sharing, and leave callbacks remain exact', () => {
  const input = modal.querySelector('#join-code-input'); input.value = 'MEL-8K9X';
  oneClick(modal.querySelector('#btn-join-code-submit'), 'onJoinCode', 'MEL-8K9X');
  const controls = [['#copy-room-link-btn','onInviteFriends'], ['#copy-room-link-direct','onCopyLink'], ['#btn-share-whatsapp','onShareWhatsapp'], ['#btn-share-telegram','onShareTelegram'], ['#btn-share-native','onShareNative'], ['#leave-room-btn','onLeaveRoom']];
  controls.forEach(([selector, handler]) => oneClick(modal.querySelector(selector), handler));
});
const dock = mount(createMiniDock(handlers));
check('persistent dock transport and mute preserve callbacks', () => {
  oneClick(dock.querySelector('#dock-play-btn'), 'onTogglePlay'); oneClick(dock.querySelector('#dock-prev-btn'), 'onPrev');
  oneClick(dock.querySelector('#dock-next-btn'), 'onNext'); oneClick(dock.querySelector('#dock-volume-btn'), 'onToggleMute');
});
check('desktop and mobile retain all four navigation destinations', () => {
  for (const factory of [createHeader, createMobileNav]) {
    const navigation = mount(factory(handlers));
    const links = navigation.querySelectorAll('[data-goto]');
    for (const id of ['hero','records','artists','contact']) {
      const link = links.find(item => item.dataset.goto === id); assert.ok(link, `Missing ${id}`);
      calls.length = 0; link.click(); assert.equal(calls.length, 1); assert.equal(calls[0][0], 'onNavigate'); assert.equal(calls[0][1], id);
    }
  }
});
if (baseline) {
  check('protected data, services, state, bootstrap, router, and package files are unchanged', () => {
    const paths = ['src/data.js','src/main.js','src/app/router.js','src/services/audio-service.js','src/services/realtime-sync.js','src/services/spotify-service.js','src/state/audio-state.js','src/state/room-state.js','package.json'];
    for (const relative of paths) {
      const snapshot = path.join(path.resolve(baseline), relative); assert.ok(existsSync(snapshot), `Missing baseline ${relative}`);
      const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
      assert.equal(hash(path.join(repo, relative)), hash(snapshot), `Protected file changed: ${relative}`);
    }
  });
}
console.log(`\n${results.length} UI callback/scope checks passed. This harness does not verify browser layout or external playback/room connectivity.`);
