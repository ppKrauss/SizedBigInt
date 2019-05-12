// // // // // // //
// Lista diversos valores em diversas bases.
//  node  --experimental-modules demo04.mjs |more
//
'use strict';
import SizedBigInt from './SizedBigInt.mjs'; // change to Opt1

// configs:
const sp = ' '
// inits:
var b4h = new SizedBigInt(1)

// MAIN:
console.log("\nn;v | Base4h| Base4| b8| b8h | b16 | b16h | b32 |32ghs")

// configs block1:
var spLen = 4
var spLen2 = 4
var pos=0
showBase4hValues(5) // change to any number of bits... take care with output overflow.
console.log("\n total de itens: "+pos+"\n")

// configs block2:
spLen = 17
spLen2 = 8
pos=0  // reinit
showBase4hValues(35,'00100111011111100100101000101')
console.log("\n total de itens: "+pos+"\n")

// // // //
// LIB:
function show_b4h(base,sp2) {
  let x = b4h.toString(base)
  return (x? x: '?').padEnd(sp2?spLen2:spLen , sp)
}

function showBase4hValues(maxBits, cur = ''){
  // see also https://stackoverflow.com/a/54506574/287948
  if (cur.length >= maxBits) return
  for (let i=0; i<2; i++) {
    let bits  = cur.length+1
    let next  = cur + i
    let strB4h = b4h.fromString(next,2).toString('4h').padEnd(spLen,sp)
    pos++;
    let aux=`${bits};${b4h.val}`
    console.log(`${aux.padEnd(spLen,sp)} | ${strB4h}| ${show_b4h('4')} | ${show_b4h('8')}| ${show_b4h('8h')}| ${show_b4h('16',1)}| ${show_b4h('16h',1)}| ${show_b4h('32',1)}| ${show_b4h('32ghs',1)}`)
    showBase4hValues(maxBits, next)
  } // \for
} // \func
