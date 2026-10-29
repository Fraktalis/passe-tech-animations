// Usage : node scripts/render-sfx.mjs sfx/site-rsvp.json  →  sfx/site-rsvp.wav (mono 48 kHz, 16 bits)
// Les sons eux-mêmes vivent dans src/sfx/library.mjs.
import fs from 'node:fs';
import {renderMix, SAMPLE_RATE} from '../src/sfx/library.mjs';

const [, , inputPath] = process.argv;
const events = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const mix = renderMix(events);

const pcm = Buffer.alloc(mix.length * 2);
mix.forEach((value, i) => pcm.writeInt16LE(Math.max(-1, Math.min(1, value)) * 32767, i * 2));

const header = Buffer.alloc(44);
header.write('RIFF', 0); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVEfmt ', 8);
header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
header.writeUInt32LE(SAMPLE_RATE, 24); header.writeUInt32LE(SAMPLE_RATE * 2, 28);
header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(pcm.length, 40);

const outputPath = inputPath.replace(/\.json$/, '.wav');
fs.writeFileSync(outputPath, Buffer.concat([header, pcm]));
const peak = mix.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
console.log(`${events.length} sons → ${outputPath} (${(mix.length / SAMPLE_RATE).toFixed(1)} s, crête ${peak.toFixed(2)})`);
