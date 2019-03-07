'use strict';
import SizedBigInt from './SizedBigInt.mjs'; // change to Opt1

const h = new SizedBigInt("aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d",'16js')
console.log("original:",h.toString(16))
console.log("bits base16h base16:")
for(let i=10;i<40; i=i+1){
  var x = h.createSplitAt(i)
  let q = parseInt(x[0].toString(2),2).toString(16)
  console.log("\t",i,x[0].toString('16h'),q,x[1].toString('16h'))
}
