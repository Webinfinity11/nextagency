// Run after work-capture.cjs, from the repository root:
//   NODE_PATH=/tmp/<scratch>/node_modules node docs/research/scripts/work-keyframes.cjs
// Copies selected raw screenshots into docs/research/frames/work-NN-<description>.jpg (JPEG q70, width ≤ 1440).
const fs = require('node:fs');
const sharp = require('sharp');
const raw = 'docs/research/frames/raw/work';
const out = 'docs/research/frames';
const selections = [
  ['desktop/step-03-12465', '01-section-entry'],
  ['desktop/step-04-12690', '02-featured-pair'],
  ['desktop/step-07-13365', '03-wide-card'],
  ['desktop/hover-pair-left-mid', '04-hover-flip-mid'],
  ['desktop/hover-pair-right-settled', '05-hover-flip-settled'],
  ['desktop/hover-single-settled', '06-hover-wide-card'],
  ['desktop/hover-allwork', '07-hover-all-work'],
  ['desktop/reveal-Feeling_Vital-pre', '08-category-pre-reveal'],
  ['desktop/reveal-Feeling_Vital-mid', '09-category-reveal-mid'],
  ['desktop/reveal-Feeling_Vital-end', '10-category-reveal-end'],
  ['desktop/reveal-Feeling_Future_proof-mid', '11-category-dark-reveal-mid'],
  ['desktop/drag-category-settled', '12-category-hover-drag'],
  ['mobile/step-04-10278', '13-mobile-featured-stack'],
  ['mobile/step-14-12388', '14-mobile-category-carousel'],
];
(async () => {
  const index = [];
  for (const [from, to] of selections) {
    const file = `${out}/work-${to}.jpg`;
    await sharp(`${raw}/${from}.jpg`).resize({ width: 1440, withoutEnlargement: true }).jpeg({ quality: 70 }).toFile(file);
    const config = from.split('/')[0];
    const json = JSON.parse(fs.readFileSync(`${raw}/${config}/work.json`, 'utf8'));
    const shot = json.shots.find((s) => s.label === from.split('/')[1]);
    index.push({ file, from, before: shot?.before, after: shot?.after, scrollY: shot?.sample?.scrollY });
  }
  fs.writeFileSync(`${raw}/key-index.json`, JSON.stringify(index, null, 2));
  console.log(index.map((i) => `${i.file}\t${i.before}-${i.after}ms\tscroll ${i.scrollY}`).join('\n'));
})();
