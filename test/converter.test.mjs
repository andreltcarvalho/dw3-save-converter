import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, unlinkSync, rmdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CARD_SIZE, BLOCK_SIZE, FLAG_GROUPS, xor, inspectCard, convertCard, convertFile } from '../src/converter.mjs';

const US_NAME = 'BASLUS-01436DMW3-USA';
const EU_NAME = 'BESLES-03936DMW3-EUR';
const INFO = 0x200;
const BASE = 0x300;
const STRIDE = 0x2700;
const opt = { experimental: true };

function entry(card, block, status, size, next, name = '') {
  const frame = card.subarray(block * 128, (block + 1) * 128);
  frame[0] = status;
  frame.writeUInt32LE(size, 4);
  frame.writeUInt16LE(next === null ? 0xffff : next - 1, 8);
  frame.write(name, 10, 20, 'ascii');
  frame[127] = xor(frame.subarray(0, 127));
}

function gather(card, chain) {
  return Buffer.concat(chain.map(b => card.subarray(b * BLOCK_SIZE, (b + 1) * BLOCK_SIZE)));
}

function scatter(card, chain, data) {
  chain.forEach((b, i) => data.copy(card, b * BLOCK_SIZE, i * BLOCK_SIZE, (i + 1) * BLOCK_SIZE));
}

function slot(file, i, size = 0x26bc) {
  return file.subarray(BASE + STRIDE * i, BASE + STRIDE * i + size);
}

function fixture({ chain = [1, 2, 3, 4], occupied = [0], extra = false } = {}) {
  const card = Buffer.alloc(CARD_SIZE);
  card.write('MC');
  for (let b = 1; b <= 15; b++) entry(card, b, 0xa0, 0, null);
  chain.forEach((b, i) => entry(card, b, [0x51, 0x52, 0x52, 0x53][i], i ? 0 : 0x8000, chain[i + 1] ?? null, i ? '' : US_NAME));
  if (extra) {
    entry(card, 15, 0x51, BLOCK_SIZE, null, 'OTHER-GAME');
    card.fill(0xab, 15 * BLOCK_SIZE);
  }
  const file = Buffer.alloc(0x8000);
  file.write('SC'); file[2] = 0x13; file[3] = 4;
  file.fill(0x67, 4, INFO);
  file[INFO + 1] = occupied.at(-1);
  file[INFO + 2] = 3;
  file.write('DMW3', INFO + 4);
  for (const i of occupied) {
    file[INFO + 8 + 0x44 * i] = 0x41;
    const state = slot(file, i);
    for (let j = 4; j < 0x2644; j++) state[j] = (j * 17 + i) & 0xff;
    FLAG_GROUPS.forEach(([g, from, oldLen, , newLen]) => state.fill(g + i, from, from + Math.min(oldLen, newLen)));
    state[2] = 3;
    state[0] = xor(state.subarray(4));
  }
  file[INFO] = xor(file.subarray(INFO + 4, INFO + 0xd4));
  scatter(card, chain, file);
  return card;
}

test('R01–R06: convert every occupied slot and preserve common fields, index, icon, empty slots and unrelated blocks', () => {
  const chain = [7, 2, 11, 4];
  const source = fixture({ chain, occupied: [0, 2], extra: true });
  const before = Buffer.from(source);
  assert.deepEqual(inspectCard(source).occupiedSlots, [true, false, true]);
  const output = convertCard(source, opt);
  assert.deepEqual(source, before);
  assert.equal(inspectCard(output).region, 'EUR');
  assert.deepEqual(inspectCard(output).occupiedSlots, [true, false, true]);
  const old = gather(source, chain), next = gather(output, chain);
  assert.deepEqual(old.subarray(0, INFO), next.subarray(0, INFO));
  assert.deepEqual(old.subarray(INFO + 3, INFO + 0x100), next.subarray(INFO + 3, INFO + 0x100));
  assert.deepEqual(old.subarray(BASE + STRIDE, BASE + STRIDE * 2), next.subarray(BASE + STRIDE, BASE + STRIDE * 2));
  for (const i of [0, 2]) {
    const a = slot(old, i), b = slot(next, i, 0x26c4);
    assert.equal(b[2], 4);
    assert.equal(b[0], xor(b.subarray(4)));
    assert.deepEqual(a.subarray(4, 0x2644), b.subarray(4, 0x2644));
    assert.equal(b[0x2656], 0x04 + i); // independently known shifted offset
    assert.equal(b[0x26aa], 0x40 + i);
    assert.deepEqual(b.subarray(0x2651, 0x2656), Buffer.alloc(5));
    for (const [, us, n, eu, m] of FLAG_GROUPS) {
      const length = Math.min(n, m);
      assert.deepEqual(a.subarray(us, us + length), b.subarray(eu, eu + length));
      assert.deepEqual(b.subarray(eu + length, eu + m), Buffer.alloc(m - length));
    }
  }
  for (let b = 1; b <= 15; b++) if (!chain.includes(b)) {
    assert.deepEqual(output.subarray(b * BLOCK_SIZE, (b + 1) * BLOCK_SIZE), source.subarray(b * BLOCK_SIZE, (b + 1) * BLOCK_SIZE));
  }
  for (let d = 0; d < 16; d++) if (d !== chain[0]) {
    assert.deepEqual(output.subarray(d * 128, (d + 1) * 128), source.subarray(d * 128, (d + 1) * 128));
  }
});

test('R02–R04: reject truncated, corrupt slot, bad directory and duplicate regional entry', () => {
  assert.throws(() => inspectCard(Buffer.alloc(12)), /128 KiB/);
  let card = fixture(); card[128 + 127] ^= 1;
  assert.throws(() => inspectCard(card), /directory checksum/);
  card = fixture(); card[BLOCK_SIZE + BASE + 100] ^= 1;
  assert.throws(() => inspectCard(card), /invalid checksum/);
  card = fixture(); entry(card, 10, 0x51, BLOCK_SIZE, null, EU_NAME);
  assert.throws(() => convertCard(card, opt), /exactly one/);
  card = fixture(); card[BLOCK_SIZE + INFO + 2] = 4;
  assert.throws(() => inspectCard(card), /version disagree/);
  card = fixture(); card[BLOCK_SIZE + INFO + 1] = 2;
  assert.throws(() => inspectCard(card), /Most recent slot is empty/);
});

test('R03: reject loop, status mismatch and orphan allocation', () => {
  let card = fixture(); entry(card, 2, 0x52, 0, 1);
  assert.throws(() => inspectCard(card), /overlapping/);
  card = fixture(); entry(card, 3, 0x53, 0, 4);
  assert.throws(() => inspectCard(card), /status/);
  card = fixture(); entry(card, 10, 0x52, 0, null);
  assert.throws(() => inspectCard(card), /Orphan/);
});

test('R05: refuse any nonzero unmapped flag bytes', () => {
  const card = fixture(); const chain = [1, 2, 3, 4];
  const file = gather(card, chain); const state = slot(file, 0);
  state[0x26ba] = 1; state[0] = xor(state.subarray(4));
  scatter(card, chain, file);
  assert.throws(() => convertCard(card, opt), /no mapped destination/);
});

test('R07–R09: require opt-in and refuse existing output; CLI inspection has no write side effect', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dw3-converter-test-'));
  try {
    const input = join(dir, 'source.mcd'), output = join(dir, 'output.mcd');
    const original = fixture(); writeFileSync(input, original);
    assert.throws(() => convertFile(input, output), /explicit opt-in/);
    assert.equal(existsSync(output), false);
    assert.throws(() => convertFile(input, input, opt), /EEXIST/);
    assert.deepEqual(readFileSync(input), original);
    const cli = fileURLToPath(new URL('../src/cli.mjs', import.meta.url));
    const check = spawnSync(process.execPath, [cli, 'inspect', input], { encoding: 'utf8' });
    assert.equal(check.status, 0); assert.equal(JSON.parse(check.stdout).region, 'USA');
    assert.equal(existsSync(output), false);
    const result = convertFile(input, output, opt);
    assert.equal(result.region, 'EUR');
    const converted = readFileSync(output);
    assert.throws(() => convertFile(input, output, opt), /EEXIST/);
    assert.deepEqual(readFileSync(output), converted);
    assert.deepEqual(readFileSync(input), original);
    assert.throws(() => convertCard(converted, opt), /USA format-3/);
  } finally {
    for (const name of ['source.mcd', 'output.mcd']) {
      const path = join(dir, name);
      if (existsSync(path)) unlinkSync(path);
    }
    rmdirSync(dir);
  }
});
