import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

export const CARD_SIZE = 0x20000;
export const BLOCK_SIZE = 0x2000;
const DIRECTORY_FRAME = 0x80;
const US = { name: 'BASLUS-01436DMW3-USA', version: 3, size: 0x26bc, region: 'USA' };
const EU = { name: 'BESLES-03936DMW3-EUR', version: 4, size: 0x26c4, region: 'EUR' };
const INFO_SIZE = 0xd4;
const INFO_RESERVED = 0x100;
const SLOT_STRIDE = 0x2700;
const COMMON_END = 0x2644;

// [group, US offset, US length, EU offset, EU length]; see docs/FORMAT.md.
export const FLAG_GROUPS = Object.freeze([
  [0x02, 0x2644, 0x0d, 0x2644, 0x12],
  [0x04, 0x2651, 0x02, 0x2656, 0x02],
  [0x06, 0x2653, 0x01, 0x2658, 0x01],
  [0x08, 0x2654, 0x01, 0x2659, 0x01],
  [0x0a, 0x2655, 0x02, 0x265a, 0x04],
  [0x0c, 0x2657, 0x08, 0x265e, 0x08],
  [0x0e, 0x265f, 0x0c, 0x2666, 0x0c],
  [0x10, 0x266b, 0x02, 0x2672, 0x04],
  [0x18, 0x266d, 0x01, 0x2676, 0x02],
  [0x1a, 0x266e, 0x09, 0x2678, 0x09],
  [0x1c, 0x2677, 0x0b, 0x2681, 0x0b],
  [0x20, 0x2682, 0x1e, 0x268c, 0x1e],
  [0x40, 0x26a0, 0x1c, 0x26aa, 0x1a],
].map(Object.freeze));

export function xor(bytes) {
  return bytes.reduce((result, byte) => result ^ byte, 0);
}

function requireThat(condition, message) {
  if (!condition) throw new Error(message);
}

function directoryEntries(card) {
  requireThat(Buffer.isBuffer(card) && card.length === CARD_SIZE, 'Expected a raw 128 KiB PS1 memory card');
  requireThat(card.toString('ascii', 0, 2) === 'MC', 'Invalid memory-card header');
  const entries = [];
  const owned = new Set();
  for (let block = 1; block <= 15; block++) {
    const offset = block * DIRECTORY_FRAME;
    if (card[offset] !== 0x51) continue;
    const size = card.readUInt32LE(offset + 4);
    const name = card.toString('ascii', offset + 10, offset + 30).split('\0')[0];
    const count = Math.ceil(size / BLOCK_SIZE);
    requireThat(count >= 1 && count <= 15, 'Invalid allocated file size');
    const chain = [];
    let next = block;
    for (let i = 0; i < count; i++) {
      requireThat(next >= 1 && next <= 15 && !owned.has(next), 'Invalid or overlapping directory chain');
      owned.add(next);
      chain.push(next);
      const frame = card.subarray(next * DIRECTORY_FRAME, (next + 1) * DIRECTORY_FRAME);
      requireThat(frame[127] === xor(frame.subarray(0, 127)), 'Invalid directory checksum');
      const expected = i === 0 ? 0x51 : i === count - 1 ? 0x53 : 0x52;
      requireThat(frame[0] === expected, 'Invalid directory block status');
      const pointer = frame.readUInt16LE(8);
      if (i === count - 1) requireThat(pointer === 0xffff, 'Directory chain has extra blocks');
      else requireThat(pointer < 15, 'Directory chain ended early or has bad pointer');
      next = pointer + 1;
    }
    entries.push({ name, offset, chain, size });
  }
  for (let block = 1; block <= 15; block++) {
    if ([0x51, 0x52, 0x53].includes(card[block * DIRECTORY_FRAME])) {
      requireThat(owned.has(block), 'Orphan active directory block');
    }
  }
  return entries;
}

function readGame(card) {
  const entries = directoryEntries(card);
  const matches = entries.filter(e => e.name === US.name || e.name === EU.name);
  requireThat(matches.length === 1, 'Expected exactly one supported regional save (no duplicate or existing target)');
  const entry = matches[0];
  requireThat(entry.size === 4 * BLOCK_SIZE && entry.chain.length === 4, 'Unexpected DW3 allocation');
  const file = Buffer.concat(entry.chain.map(block => card.subarray(block * BLOCK_SIZE, (block + 1) * BLOCK_SIZE)));
  requireThat(file.toString('ascii', 0, 2) === 'SC' && file[3] === 4, 'Invalid DW3 save header');
  const icons = file[2] & 0x0f;
  requireThat(icons >= 1 && icons <= 3 && (file[2] & 0xf0) === 0x10, 'Invalid icon header');
  const infoOffset = (icons + 1) * DIRECTORY_FRAME;
  const info = file.subarray(infoOffset, infoOffset + INFO_SIZE);
  requireThat(info.toString('ascii', 4, 8) === 'DMW3', 'Invalid save index magic');
  requireThat(info[0] === xor(info.subarray(4)), 'Invalid save index checksum');
  const format = entry.name === US.name ? US : EU;
  requireThat(info[2] === format.version, 'Region name and internal version disagree or unsupported alternate locale');
  requireThat(info[1] < 3, 'Invalid most recent slot index');
  const slots = [];
  for (let i = 0; i < 3; i++) {
    const occupied = info[8 + i * 0x44] !== 0;
    const offset = infoOffset + INFO_RESERVED + i * SLOT_STRIDE;
    const bytes = file.subarray(offset, offset + format.size);
    if (occupied) {
      requireThat(bytes[2] === format.version, `Slot ${i + 1}: invalid internal version`);
      requireThat(bytes[0] === xor(bytes.subarray(4)), `Slot ${i + 1}: invalid checksum`);
    }
    slots.push({ occupied, offset, bytes });
  }
  requireThat(slots.some(s => s.occupied), 'No occupied DW3 slots');
  requireThat(slots[info[1]].occupied, 'Most recent slot is empty');
  return { entry, file, infoOffset, format, slots };
}

export function inspectCard(card) {
  const { format, slots, entry } = readGame(card);
  return { region: format.region, version: format.version, size: card.length,
    directoryName: entry.name, occupiedSlots: slots.map(s => s.occupied), structurallyValid: true };
}

export function convertCard(card, { experimental = false } = {}) {
  requireThat(experimental, 'Conversion is experimental; explicit opt-in is required');
  const { entry, file, infoOffset, format, slots } = readGame(card);
  requireThat(format === US, 'Conversion requires a USA format-3 source');
  const converted = Buffer.from(file);
  for (const slot of slots) {
    if (!slot.occupied) continue;
    const payload = Buffer.alloc(EU.size);
    slot.bytes.copy(payload, 0, 0, COMMON_END);
    for (const [group, from, oldSize, to, newSize] of FLAG_GROUPS) {
      const common = Math.min(oldSize, newSize);
      requireThat(!slot.bytes.subarray(from + common, from + oldSize).some(Boolean),
        `Event group ${group.toString(16)} contains nonzero bytes with no mapped destination`);
      slot.bytes.copy(payload, to, from, from + common);
    }
    payload[2] = EU.version;
    payload[0] = xor(payload.subarray(4));
    payload.copy(converted, slot.offset);
  }
  const info = converted.subarray(infoOffset, infoOffset + INFO_SIZE);
  info[2] = EU.version;
  info[0] = xor(info.subarray(4));

  const output = Buffer.from(card);
  for (const [i, block] of entry.chain.entries()) {
    converted.copy(output, block * BLOCK_SIZE, i * BLOCK_SIZE, (i + 1) * BLOCK_SIZE);
  }
  const frame = output.subarray(entry.offset, entry.offset + DIRECTORY_FRAME);
  frame.fill(0, 10, 30);
  frame.write(EU.name, 10, 20, 'ascii');
  frame[127] = xor(frame.subarray(0, 127));
  const verified = readGame(output);
  requireThat(verified.format === EU, 'Internal converted-card verification failed');
  for (const [i, slot] of slots.entries()) {
    requireThat(verified.slots[i].occupied === slot.occupied, 'Internal slot-preservation check failed');
    if (slot.occupied) requireThat(slot.bytes.subarray(4, COMMON_END).equals(verified.slots[i].bytes.subarray(4, COMMON_END)), 'Internal common-data verification failed');
  }
  return output;
}

export function convertFile(inputPath, outputPath, options = {}) {
  const input = readFileSync(inputPath);
  const inputHash = createHash('sha256').update(input).digest('hex');
  const output = convertCard(input, options);
  // Exclusive creation protects all existing files, including the original and symlinks.
  writeFileSync(outputPath, output, { flag: 'wx' });
  return { ...inspectCard(output), inputUnmodifiedInMemory: inputHash === createHash('sha256').update(input).digest('hex') };
}
