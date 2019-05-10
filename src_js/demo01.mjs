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
  ,main: './SizedBigInt.mjs'
};
var b4h;
var lst = []

import(fileOpts[process.argv[2]] || fileOpts.main ).then(({default: SizedBigInt}) => {

  let sbiArray = [
    new SizedBigInt(1n),  new SizedBigInt(),  new SizedBigInt(0n),
    new SizedBigInt(881n), new SizedBigInt("1001",4),
    new SizedBigInt(900997199254740991n), // less than 64 bits
    new SizedBigInt(90099719925474099999991n,null,null,512)  // more than 64 bits
  ];
  console.log( sbiArray.toString() )

  if (SizedBigInt.createMany) { // only main option
    let testMany = SizedBigInt.createMany([
      1n, null,  0n, 881n, "1001", 900997199254740991n, [90099719925474099999991n,null,null,512]
    ]);
    let trc0 = new SizedBigInt(255)
    let trc  = trc0.clone(4)
    console.log( testMany.toString() == sbiArray.toString(), Number(trc.val)==15 )
  } else
    console.log( true, true )

  // MAIN:
  console.log("\n\nbits\tBinary\tBase4h")
  b4h = new SizedBigInt(0)
  showBase4hValues(8) // change to any number of bits... take care with output overflow.



  SizedBigInt.sort(lst,true,false)
  SizedBigInt.sort(lst,false,true)  // lexOrder, descOrder
  SizedBigInt.sort(lst,false,true)  // lexOrder, descOrder

  SizedBigInt.sort(lst,true,false)
  SizedBigInt.sort(lst,false,true)  // lexOrder, descOrder
  SizedBigInt.sort(lst,false,true)  // lexOrder, descOrder


  // LISTS:
  console.log("\t--- DEBUG1 SORT ASC lexicographic:")
  SizedBigInt.sort(lst,true,false)
  for(let i of lst) console.log(i.toString('4h'))

  console.log("\t--- DEBUG2 SORT DESC lexicographic:")
  SizedBigInt.sort(lst,true,true)  // lexOrder, descOrder
  for(let i of lst) console.log(i.toString('4h'))
  
  console.log("\t--- DEBUG2 SORT DESC numeric:")
  SizedBigInt.sort(lst,false,true)  // lexOrder, descOrder
  for(let i of lst) console.log(i.toString('4h'))


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
    console.log(`${bits}\t'${next}\t'${strB4}`)
    lst.push( b4h.clone() )
    showBase4hValues(maxBits, next)
  } // \for
} // \func
