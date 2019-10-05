// // // // // // //
// Benckmark for opt1 and opt2, sort performance.
// USE ON TERMINAL: by "node" ou "time node"
//  node  --experimental-modules bench_sort1.mjs main
//  node  --experimental-modules bench_sort1.mjs opt2
//  node  --experimental-modules bench_sort1.mjs opt1
//

'use strict';

const fileOpts = {
   opt1: './SizedBigInt-didacticOpt1.mjs'
  ,opt2: './SizedBigInt-didacticOpt2.mjs'
  ,opt3: './sOpt2.mjs'
  ,main: '../SizedBigInt.mjs'
};
var b4h;
var lst = []

const AA = BigInt('0x12ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1');
const BB = BigInt('0x12ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff9');
// loop config:
const maxRange = 90000

console.log("---  configs:")
console.log(" ",maxRange, AA.toString(32) )

let lib = fileOpts[process.argv[2]]
if (!lib) throw new Error("Invalid argument. Use opt1/opt2/opt3/main\n");
import( lib ).then(({default: SizedBigInt}) => {

  // MAIN:
  let sbiA = new SizedBigInt(AA)
  let sbiB = new SizedBigInt(BB)
  let x=0;
  let bench_name='--- BENCHMARK COMPARE'
  console.time(bench_name)
  for(let i=0; i<maxRange; i++)
    x += SizedBigInt.compare(sbiA,sbiB,true)
  for(let i=0; i<maxRange; i++) {
    let t = new SizedBigInt(AA+BigInt(i))
    x += SizedBigInt.compare(sbiA,t,true)
      + SizedBigInt.compare(t,sbiA,true)
      + SizedBigInt.compare(sbiB,t,true)
      + SizedBigInt.compare(t,sbiB,true)
      + SizedBigInt.compare(t,sbiA,true)
      //  repeat all:
      + SizedBigInt.compare(sbiA,t,true)
      + SizedBigInt.compare(t,sbiA,true)
      + SizedBigInt.compare(sbiB,t,true)
      + SizedBigInt.compare(t,sbiB,true)
      + SizedBigInt.compare(t,sbiA,true)
  }
  console.log("  Check sum:",x)
  console.timeEnd(bench_name)
  console.log("--- END")
});
