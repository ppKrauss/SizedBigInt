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
  ,main: './SizedBigInt.mjs'
};
var b4h;
var lst = []

const AA = BigInt('0x12ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1');
const BB = BigInt('0x12ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff9');
// loop config:
const maxRange = 90000

console.log( "\n--- BEGIN BENCHMARK ---" )
console.log( "  xconfigs:", maxRange, AA.toString(32) )

import(fileOpts[process.argv[2]] || fileOpts.main ).then(({default: SizedBigInt}) => {

  // MAIN:
  let sbiA = new SizedBigInt(AA)
  let sbiB = new SizedBigInt(BB)
  let x=0;
  for(let i=0; i<maxRange; i++)
    x += SizedBigInt.compare(sbiA,sbiB,true)
  for(let i=0; i<maxRange; i++) {
    let t = new SizedBigInt(AA+BigInt(i))
    x += SizedBigInt.compare(sbiA,t,true)
    x += SizedBigInt.compare(t,sbiA,true)
    x += SizedBigInt.compare(sbiB,t,true)
    x += SizedBigInt.compare(t,sbiB,true)
    x += SizedBigInt.compare(t,sbiA,true)
  }
  console.log("  check sum:",x)
  console.log("--- END ---\n")

});
