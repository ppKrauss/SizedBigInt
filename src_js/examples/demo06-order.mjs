// // // // // // //
// Demonstating basic operations, valid also for didactic options.
// USE ON TERMINAL: opt1, opt2 or main,
//  node  --experimental-modules demo01.mjs opt1 > chk_assert01.txt
//  diff ../data/assert01.txt chk_assert01.txt
//

'use strict';

const fileOpts = {
   opt1: './SizedBigInt-didacticOpt1.mjs'
  ,opt2: './SizedBigInt-didacticOpt2.mjs'
  ,main: '../SizedBigInt.mjs'
};
var b4h;
var out=[];
var lst = []

import(fileOpts[process.argv[2]] || fileOpts.main ).then(({default: SizedBigInt}) => {
  // MAIN:
  console.log("\n")
  b4h = new SizedBigInt(0);
  //for(i=2; i<8; )
  let nBase=5;
  showBase4hValues(nBase) // change to any number of bits... take care with output overflow.
  console.log( "S"+nBase+":", out.join(', '))
});

//
// LIB:

function showBase4hValues(maxBits, cur = ''){
  // see also https://stackoverflow.com/a/54506574/287948
  if (cur.length >= maxBits) return
  for (let i=0; i<2; i++) {
    let bits  = cur.length+1
    let next  = cur + i
    let strB4 = b4h.fromString(next,2).toString('4h')
    out.push(next)
    lst.push( b4h.clone() )
    showBase4hValues(maxBits, next)
  } // \for
} // \func
