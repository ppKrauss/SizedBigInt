// node  --experimental-modules demo01.mjs
// node  --experimental-modules demo01.mjs opt2

'use strict';

import SizedBigInt from './SizedBigInt-didacticOpt2.mjs'; // change to Opt1

let x = [
  new SizedBigInt(1n),  new SizedBigInt(),  new SizedBigInt(0n),
  new SizedBigInt(881n), new SizedBigInt("1001"),
  new SizedBigInt(900997199254740991n), new SizedBigInt(90099719925474099999991n),
];
console.log(  x.map(i => i+'')  )

console.log("bits\tBinary\tBase4")
const b4h = new SizedBigInt(0)
var lst = []
showBase4hValues(8) // change to any number of bits... take care with output overflow.

function showBase4hValues(maxBits, cur = ''){
  // see also https://stackoverflow.com/a/54506574/287948
  if (cur.length >= maxBits) return
  for (let i=0; i<2; i++) {
    let bits  = cur.length+1
    let next  = cur + i
    let strB4 = b4h.fromString(next,2).toString(4)
    console.log(`${bits}\t'${next}\t'${strB4}`)
    lst.push( b4h.clone() )
    showBase4hValues(maxBits, next)
  } // \for
} // \func

console.log("\t--- DEBUG1 SORT lexicographic:")
SizedBigInt.sort(lst,true) // false is default
for(let i of lst) console.log(i.toString(4))

console.log("\t--- DEBUG2 SORT numeric revert:")
SizedBigInt.sort(lst,false,true)
for(let i of lst) console.log(i.toString(4))
