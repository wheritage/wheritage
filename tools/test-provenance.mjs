// Ad provenance (UTM / fbclid) kept for the whole visit and written into the Cal.com booking note.
// Usage: node --test tools/test-provenance.mjs
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const P = require(join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'provenance.js'));

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}
const AD = '?utm_source=meta&utm_medium=paid&utm_campaign=W%20H%C3%A9ritage%20%7C%20Leads&utm_content=AD2_v3';

describe('text: the line added to the booking note', () => {
  it('matches the #27 format for a Meta ad', () => {
    assert.equal(P.text(P.fromSearch(AD)), ' · Provenance : source meta, campagne W Héritage | Leads, pub AD2_v3');
  });
  it('writes "pub Meta" when only fbclid is present', () => {
    assert.equal(P.text(P.fromSearch('?fbclid=abc123')), ' · Provenance : pub Meta');
  });
  it('adds nothing for a direct visit', () => {
    assert.equal(P.text(P.fromSearch('')), '');
    assert.equal(P.text(null), '');
  });
  it('strips line breaks and caps each value', () => {
    const t = P.text(P.fromSearch('?utm_source=meta%0A%0ANotes:%20x&utm_campaign=' + 'c'.repeat(300)));
    assert.equal(/[\r\n]/.test(t), false);
    assert.ok(t.length < 200, `length ${t.length}`);
  });
});

describe('remember: provenance survives navigation within the visit', () => {
  it('keeps the ad UTMs when the visitor lands on / then opens /strategie-societe', () => {
    const s = memoryStorage();
    P.remember(s, AD);
    const later = P.remember(s, '');
    assert.equal(P.text(later), ' · Provenance : source meta, campagne W Héritage | Leads, pub AD2_v3');
  });
  it('a newer ad click in the same visit replaces the older one', () => {
    const s = memoryStorage();
    P.remember(s, AD);
    const later = P.remember(s, '?utm_source=meta&utm_content=AD3');
    assert.equal(P.text(later), ' · Provenance : source meta, pub AD3');
  });
  it('ignores unrelated query parameters', () => {
    const s = memoryStorage();
    P.remember(s, AD);
    assert.match(P.text(P.remember(s, '?profil=entrepreneur&lang=en')), /pub AD2_v3/);
  });
  it('survives broken or unavailable storage', () => {
    const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    assert.match(P.text(P.remember(broken, AD)), /pub AD2_v3/);
    assert.match(P.text(P.remember(null, AD)), /pub AD2_v3/);
    const junk = memoryStorage(); junk.setItem(P.KEY, '{not json');
    assert.equal(P.text(P.remember(junk, '')), '');
  });
});
