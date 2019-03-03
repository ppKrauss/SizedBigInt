// // // // // // //
// Demonstating basic operations, valid also for didactic options.
// USE ON TERMINAL:
//  node  --experimental-modules demo01.mjs opt1 > chk_assert01.txt
//  diff ../data/assert01.txt chk_assert01.txt
//

'use strict';
import SizedBigInt from './SizedBigInt-didacticOpt1.mjs';  // change to Opt2
/* switch (process.argv[2]) { // see https://stackoverflow.com/q/54968352/287948
  case 'opt2':
    import SizedBigInt from './SizedBigInt-didacticOpt2.mjs'; break;
  case 'main':
    import SizedBigInt from './SizedBigInt.mjs'; break;
  default:
    import SizedBigInt from './SizedBigInt-didacticOpt1.mjs';
}
*/
let sbiArray = [
  new SizedBigInt(1n),  new SizedBigInt(),  new SizedBigInt(0n),
  new SizedBigInt(881n), new SizedBigInt("1001",4),
  new SizedBigInt(900997199254740991n), // less than 64 bits
  new SizedBigInt(90099719925474099999991n,null,null,512)  // more than 64 bits
];
console.log( sbiArray.toString() )

if (SizedBigInt.createMany) { // only SizedBigInt.mjs
  let testMany = SizedBigInt.createMany([
    1n, null,  0n, 881n, "1001", 900997199254740991n, [90099719925474099999991n,null,null,512]
  ]);
  console.log( testMany.toString() == sbiArray.toString() )
} else
  console.log( true )


// // // //
console.log("\n\nbits\tBinary\tBase4h")
const b4h = new SizedBigInt(0)
var lst = []
showBase4hValues(8) // change to any number of bits... take care with output overflow.


///////

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

console.log("\t--- DEBUG1 SORT lexicographic:")
SizedBigInt.sort(lst,true) // false is default
for(let i of lst) console.log(i.toString('4h'))

console.log("\t--- DEBUG2 SORT numeric revert:")
SizedBigInt.sort(lst,false,true)
for(let i of lst) console.log(i.toString('4h'))
