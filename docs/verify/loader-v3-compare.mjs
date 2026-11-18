// Reference frames are read-only inputs, never site assets.
// REFERENCE_FRAMES=/tmp/rec2 node docs/verify/loader-v3-compare.mjs
import { createRequire } from 'node:module';
const require=createRequire(`${process.env.VERIFY_DEPS || '/tmp/kaistudio-verify'}/package.json`);
const sharp=require('sharp');
const ref=process.env.REFERENCE_FRAMES || '/tmp/rec2';
const pairs=[[21,32,'Resolve'],[26,37,'Clean hold'],[31,44,'Hard white wipe'],[37,50,'Empty centred box'],[43,55,'Mark arrives'],[47,58,'Links stagger'],[51,62,'Box moves left'],[54,67,'Box settled'],[60,72,'Final lockup']];
const composite=[];
for(const [i,[r,n,label]] of pairs.entries()) {
  for(const [col,file] of [[0,`${ref}/f12_${String(r).padStart(3,'0')}.jpg`],[1,`docs/verify/loader-v3-${String(n).padStart(3,'0')}.jpg`]]) {
    let src=sharp(file);
    if(col===0) src=src.extract({left:0,top:78,width:960,height:545});
    const input=await src.resize(480,300,{fit:'contain',background:'#fff'}).toBuffer();
    composite.push({input,left:col*480,top:i*326+26});
    const text=`${col===0?'Reference':'KAI STUDIO'} | ${label} | ${((col===0?r-1:n-1)/12).toFixed(2)}s`;
    composite.push({input:Buffer.from(`<svg width="480" height="26"><rect width="480" height="26" fill="#ddd"/><text x="8" y="18" font-size="13" font-family="sans-serif">${text}</text></svg>`),left:col*480,top:i*326});
  }
}
await sharp({create:{width:960,height:pairs.length*326,channels:3,background:'#fff'}}).composite(composite).jpeg({quality:90}).toFile('docs/verify/loader-v3-reference-comparison.jpg');
