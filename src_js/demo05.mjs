// // // // // // //
//  Simulating internal encoding algorithms.
//  node  --experimental-modules demo05.mjs | more
/*
 A1.  h||x.  Arbitrary precision, unsigned int # 1, the hidden bit h=1.

 A2.  s||h||x . Arbitrary precision, signed int # 2, the signal s=0 and h.

 A3R.  h||x  and cast to right.  Fixed length, unsignid int8 # 1, h.

 A3L. x||k  and cast to left. Fixed length, unsignid int8 # 1, a right mark k=1.

 A4R.  h||x  and cast to (positive) right. Fixed length, int8 # 2, s and h.

 A4L.  s||x||k  and cast to left. Fixed length, int8 # 2, s and k.
*/
'use strict';
// import SizedBigInt from './SizedBigInt.mjs';
function qt(x) { return "'"+x+"'" }

const s='0'
const h='1'
const k='1'
const xList = ['0','00','1','001']
const enc = {
   "A1": x => [h+x]
  ,"A2": x => [s+h+x]
  ,"A3R": x => [h+x]
  ,"A3L": x => [(x+k).padEnd(64,'0')]
  ,"A4R": x => [h+x] // signal on  cast.
  ,"A4L": x => [s+(x+k).padEnd(63,'0')]
};

console.log('----- to article1 list -----')
for (let a of Object.keys(enc)) {
  let lst = ''
  for(let x of xList)  lst+= ', '+qt( enc[a](x) )
  console.log(a,lst)
}
console.log('----- to demo PostgreSQL -----')

delete enc['A1']; delete enc['A3R']; delete enc['A3L'];
for (let a of Object.keys(enc)) {
  let lst = []
  for(let x of xList)  lst.push( `b'${enc[a](x)}'::bigint` )
  console.log(qt(a),(''+lst).trim('[]'))
  console.log(' UNION ')
}
