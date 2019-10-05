// // // // // // //
// Benckmark for opt1 and opt2, sort performance.
// USE ON TERMINAL:
//  time node  --experimental-modules bench_sort1.mjs main
//  time node  --experimental-modules bench_sort1.mjs opt2
//  time node  --experimental-modules bench_sort1.mjs opt1
//

'use strict';

const fileOpts = {
   opt1: './SizedBigInt-didacticOpt1.mjs'
  ,opt2: './SizedBigInt-didacticOpt2.mjs'
  ,main: '../SizedBigInt.mjs'
};
var b4h;
var lst = []

const bb = BigInt('0x12ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff99');
const sbb = bb.toString(2)
const TT = 500
// loop config:
const MAX1 = 18

console.log("\n--- BEGIN BENCHMARK ---")
console.log("  xconfigs:",MAX1,TT,bb.toString(32))

import(fileOpts[process.argv[2]] || fileOpts.main ).then(({default: SizedBigInt}) => {

  // MAIN:
  b4h = new SizedBigInt(0)
  showBase4hValues(MAX1) // change to any number of bits... take care with output overflow.

  let x=1;

  SizedBigInt.sort(lst,true,false)
  x += lst[TT].bits;
  SizedBigInt.sort(lst,true,true)  // lexOrder, descOrder
  x += lst[TT].bits;
  SizedBigInt.sort(lst,false,true)  // lexOrder, descOrder
  x += lst[TT].bits;

  SizedBigInt.sort(lst,true,false)
  x += lst[TT].bits;
  SizedBigInt.sort(lst,true,true)  // lexOrder, descOrder
  x += lst[TT].bits;
  SizedBigInt.sort(lst,false,true)  // lexOrder, descOrder
  x += lst[TT].bits;

  SizedBigInt.sort(lst,true,false)
  x += lst[TT].bits;
  SizedBigInt.sort(lst,true,true)  // lexOrder, descOrder
  x += lst[TT].bits;
  SizedBigInt.sort(lst,false,true)  // lexOrder, descOrder
  x += lst[TT].bits;

  SizedBigInt.sort(lst,true,false)
  x += lst[TT].bits;
  SizedBigInt.sort(lst,true,true)  // lexOrder, descOrder
  x += lst[TT].bits;
  SizedBigInt.sort(lst,false,true)  // lexOrder, descOrder
  x += lst[TT].bits;

  console.log("  check sum:",x)
  console.log("--- END ---\n")

});

//
// LIB:

function showBase4hValues(maxBits, cur = ''){
  // see also https://stackoverflow.com/a/54506574/287948
  if (cur.length >= maxBits) return
  for (let i=0; i<2; i++) {
    let bits  = cur.length+1
    let next  = cur + i
    let strB4 = b4h.fromString(sbb+next,2).toString('4h')
    //console.log(`${bits}\t'${next}\t'${strB4}`)
    lst.push( b4h.clone() )
    showBase4hValues(maxBits, next)
  } // \for
} // \func
