// node  --experimental-modules demo02.mjs

'use strict';
import SizedBigInt from '../SizedBigInt.mjs'; // change to Opt1

console.log("[l,n]\tBase4h\tBase16h\tBase32")
const reuse = new SizedBigInt(0)
var lst = []
showBase4hValues(10)

function showBase4hValues(maxBits, cur = ''){
  if (cur.length >= maxBits) return; // stop recurrence.
  for (let i=0; i<2; i++) {
    let bits  = cur.length+1
    let next  = cur + i
    let strB4  = reuse.fromString(next,2).toString('4h')
    let strB16 = reuse.toString('16h')
    let strB32 = reuse.toString(32)
    console.log(`${reuse.toString()}\t'${strB4}\t'${strB16}\t'${strB32}`)
    showBase4hValues(maxBits, next)
  } // \for
} // \func
