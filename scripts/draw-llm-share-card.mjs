import fs from 'node:fs';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import {workshop} from '../src/lib/llm-art.mjs';
const art=workshop();
const scene=art.replace(/<svg[^>]*>/,'').replace('</svg>','');
const cover=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><clipPath id="scene-crop"><rect x="80" y="145" width="1040" height="480"/></clipPath></defs><rect width="1200" height="630" fill="#f6f1e6"/><text x="55" y="45" font-family="monospace" font-size="13" fill="#73766a">PRANEETH PAIKRAY / AN INTERACTIVE FIELD GUIDE</text><text x="55" y="118" font-family="serif" font-size="63" fill="#343c38">How a language model is <tspan fill="#b15e46" font-style="italic">made.</tspan></text><g clip-path="url(#scene-crop)"><g transform="translate(160 145) scale(.72)">${scene}</g></g></svg>`;
await sharp(Buffer.from(cover)).png().toFile(fileURLToPath(new URL('../public/llm/og.png',import.meta.url)));
fs.writeFileSync(new URL('../public/llm/workshop.svg',import.meta.url),art);
