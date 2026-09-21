import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
const clips = [{name:'idle',count:8,duration:1.6},{name:'walk',count:12,duration:0.8},{name:'sprint',count:12,duration:0.6},{name:'stop',count:8,duration:0.45}];
const output='public/character-lab';
await mkdir(output,{recursive:true});
const layers=[];
for(const [row,clip] of clips.entries()) {
  for(let i=0;i<clip.count;i++) {
    const input=await sharp(`assets/characters/cole/renders/${clip.name}-${String(i).padStart(2,'0')}.png`).resize(64,96,{kernel:'lanczos3'}).png().toBuffer();
    layers.push({input,left:i*64,top:row*96});
  }
}
await sharp({create:{width:768,height:384,channels:4,background:'#00000000'}}).composite(layers).png().toFile(`${output}/cole.png`);
await writeFile(`${output}/clips.json`,JSON.stringify({width:64,height:96,clips},null,2));
console.log('Packed Cole study: 40 frames, 64×96 cells.');
