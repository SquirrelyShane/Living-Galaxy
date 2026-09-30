import assert from 'node:assert/strict';
import {load} from '../host/three-loader.mjs';
const url=new URL('../js/sim/sim.js',import.meta.url).href;
const value=await load(url,{format:'commonjs'},async(u,c)=>({url:u,format:c.format}));
assert.equal(value.format,'module');
const external=await load('node:fs',{format:'builtin'},async(u,c)=>c.format);
assert.equal(external,'builtin');
console.log('Sol loader: PASS — game .js explicitly uses ESM without service flags or package.json');
