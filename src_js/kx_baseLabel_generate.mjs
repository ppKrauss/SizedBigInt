// // // // // // //
// Generates a complete JSON cache for SQL or other uses.
//  node  --experimental-modules kx_baseLabel_generate.mjs > kx.js
//

'use strict';
import SizedBigInt from './SizedBigInt.mjs'; // change to Opt1
// see SizedBigInt.kx_baseLabel
let sb = new SizedBigInt(1);

for (let i of ["4h","16h","4js","8js","16js","32hex","32nvu","32rfc","32ghs"]) {
  let v = sb.toString(i) // cache refresh
}
console.log(SizedBigInt.kx_baseLabel)

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
