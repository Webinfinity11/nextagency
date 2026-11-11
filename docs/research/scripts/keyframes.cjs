// NODE_PATH=/tmp/<scratch>/node_modules node docs/research/scripts/keyframes.cjs
const fs=require('node:fs'),sharp=require('sharp');
const raw='docs/research/frames/raw/live',key='docs/research/frames/key';
const selections=[['load-030','01-sequence-solid'],['load-040','02-sequence-distorted'],['load-050','03-clean-mark'],['load-055','04-white-wipe'],['load-060','05-nav-handoff'],['load-068','06-words-enter'],['settled','07-hero-settled'],['scroll-014','08-scroll-876'],['scroll-029','09-scroll-1777'],['scroll-044','10-scroll-2693']];
(async()=>{
 for(const [from,to] of selections) await sharp(`${raw}/${from}.jpg`).resize({width:720}).jpeg({quality:78}).toFile(`${key}/${to}.jpg`);
 const samples=JSON.parse(fs.readFileSync(`${raw}/samples.json`)).samples;
 fs.writeFileSync(`${raw}/key-index.json`,JSON.stringify(selections.map(([from,to])=>({file:`${to}.jpg`,sample:samples.find(s=>s.name===from)||{name:from,run:'probe'}})),null,2));
 console.log(`Exported ${selections.length} JPEGs at 720px width`);
})();
