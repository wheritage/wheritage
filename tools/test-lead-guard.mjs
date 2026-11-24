// Pure LeadGuard rules (no network, no DNS). Real prospects must pass; fakes must stay blocked.
// Usage: node --test tools/test-lead-guard.mjs
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const G = require(join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'lead-guard.js'));

describe('real prospects are accepted (review 2026-11-24, HIGH)', () => {
  for (const e of ['jean.michel@gmail.com', 'jean-michel72@hotmail.com', 'jeanmichel.roy@videotron.ca']) {
    it(`accepts ${e}`, () => assert.equal(G.email(e).ok, true));
  }

  it('treats admin@ at a business domain as a role account, not a fake', () => {
    const r = G.email('admin@plomberieroy.ca');
    assert.equal(r.ok, true);
    assert.ok(r.score < 50, `score ${r.score}`);
  });

  for (const e of ['marc@roy.ai', 'paul@acme.dev', 'eve@studio.design', 'li@cabinet.pro', 'max@groupe.tech',
    'sam@boutique.shop', 'ana@agence.agency', 'jo@outil.app']) {
    it(`accepts the business ending of ${e}`, () => assert.equal(G.email(e).ok, true));
  }

  for (const n of ['Ewert', 'Schwertz', 'Na']) {
    it(`accepts the real surname ${n}`, () => assert.equal(G.name(n).ok, true));
  }
});

describe('fakes stay blocked', () => {
  for (const e of ['test@gmail.com', 'fake-email@gmail.com', 'asdf@hotmail.com', 'x.roy@site.xyz', 'luc.roy@mail.ru',
    'ana.roy@promo.top', 'jean@yopmail.com']) {
    it(`blocks ${e}`, () => assert.equal(G.email(e).ok, false));
  }

  for (const n of ['qwerty', 'asdf', 'Test', 'n/a']) {
    it(`blocks the fake name ${n}`, () => assert.equal(G.name(n).ok, false));
  }
});
