// // // // // // //
// Generates a complete JSON cache for SQL or other uses.
//  node  --experimental-modules kx_baseLabel_generate.mjs > kx.js
//

'use strict';
import SizedBigInt from './SizedBigInt.mjs'; // change to Opt1
let sb = new SizedBigInt(1);
// cache refresh:
// for (let i of Object.keys(SizedBigInt.kx_baseLabel)) {let v = sb.toString(i)}
// Show all base definitions (dataset), without loss of regexes:
let x = JSON.parse(JSON.stringify(SizedBigInt.kx_baseLabel))
for (var i of Object.keys(x)) if (SizedBigInt.kx_baseLabel[i].regex) {
 x[i].regex    = String(SizedBigInt.kx_baseLabel[i].regex)
 x[i].regex_b2 = String(SizedBigInt.kx_baseLabel[i].regex_b2)
}
console.log (JSON.stringify(x,null,2));


/*
// Using array position as translator. See SQL.

let fromBin = {}
let toBin ={}
for (let k of Object.keys(SizedBigInt.kx_tr))  {
  let useFrom = (k.slice(0,4) == '2-to')
  let kk = useFrom? k.slice(5): k.slice(0,-5)
  if (useFrom) {fromBin[kk]={};} else toBin[kk]={};
  for (let v of Object.keys(SizedBigInt.kx_tr[k]))
    if (useFrom)
      fromBin[kk][String.fromCharCode(64+parseInt(v,2))] = SizedBigInt.kx_tr[k][v]
    else
      toBin[kk][v] = String.fromCharCode(64+parseInt(SizedBigInt.kx_tr[k][v],2))
}
console.log( "fromBin:", JSON.stringify(fromBin) )
console.log( "toBin:" ,  JSON.stringify(toBin) )
*/
