/**
 * Sized BigInt's (SizedBigInt) are arbitrary-precision integers with defined number of bits.
 * Each instance is a pair (size,number). Input and output accepts many optional representations.
 *
 * Adapted from original source at [github/SizedBigInt](https://github.com/ppKrauss/SizedBigInt)
 *  and foundations at [this PDF](http://osm.codes/_foundations/art1.pdf).
 */
 class SizedBigInt {

   /**  @constructor */
   constructor(val,radix,maxBits=null,onErr_cutLSD=true) {
     SizedBigInt.kx_RefreshDefaults(); // global cache once.
     this.fromAny(val,radix,maxBits,onErr_cutLSD)
   }

   // // //
   // Input methods:

   fromNull() { this.val=null; this.bits=0; return this; }

   setBits_byMax(maxBits,inputLen,onErr_cutLSD=true) {
     // mutate this.bits and return action about cut by MaxBits.
     let cutByMax = false // action
     this.bits = inputLen
     if (maxBits) {
        let forceBits = (maxBits<0)? 0: 1
        maxBits =Math.ceil( Math.abs(maxBits) )  // for example fractionary number of bits on decimal base
        if (forceBits) forceBits=maxBits;
        if (inputLen>maxBits) {
           if (onErr_cutLSD) cutByMax = true;
           else throw new Error(`ERR4. Bit-length ${inputLen} exceeded the limit ${maxBits}`);
           this.bits = maxBits;
        } else if (inputLen<forceBits)
           this.bits = forceBits; // will pad zeros on back toString().
     } else maxBits = 0
     return [cutByMax,maxBits]
   }

   /**
    * Input from any data type (string, array, SizedBigInt object, number, or bigint.
    * @param {any} val -  any valid consistent value.
    * @param {integer} radix - the representation adopted in strval, a label of SizedBigInt.kx_baseLabel.
    * @param {integer} maxBits - positive to enforce length; 0 to preserve input length; negative to express only maximum length.
    * @param onErr_cutLSD {Boolean} - flag to not throw error, only truncates LSD of binary representation.
    * @return - new or redefined SizedBigInt.
    */
   fromAny(val,radix=null,maxBits=null,onErr_cutLSD=true) {
     let t = typeof val
     if (t=='object') { // valid object or self
        if (val instanceof SizedBigInt)
          [val,radix,maxBits]=[val.val,null,val.bits]; // clone()
        else if (val instanceof Array)
          [val,radix,maxBits]=val;
        else
          ({val,radix,maxBits} = val);
        t = typeof val
     }
     if (t=='string' && radix) { // radix-string
       this.fromString(val, radix, maxBits, onErr_cutLSD)
     } else // auto-string, bigint, number or null
       this.fromInt(val, maxBits, onErr_cutLSD);
     return this
   }

   /**
    * Input from string of '0's and '1's, and number of bits can be controled.
    * @param {string} strval -  with valid /^[01]+$/ regex.
    * @param {integer} maxBits - positive to enforce length; 0 to preserve input length; negative to express only maximum length.
    * @param onErr_cutLSD {Boolean} - flag to not throw error, only truncates LSD of binary representation.
    * @return - new or redefined SizedBigInt.
    */
   fromBitString(strval, maxBits=null, onErr_cutLSD=true) {
     if (!strval)
         return this.fromNull();
     let cutBits = this.setBits_byMax(maxBits, strval.length, onErr_cutLSD)
     if (cutBits[0]) strval = strval.slice(0,cutBits[1]);
     this.val = BigInt("0b"+strval)
     return this
   }

   /**
    * Input from string.
    * @param {string} strval -  with valid representation for radix.
    * @param {integer} radix - the representation adopted in strval, a label of SizedBigInt.kx_baseLabel.
    * @param {integer} maxBits - positive to enforce length; 0 to preserve input length; negative to express only maximum length.
    * @param onErr_cutLSD {Boolean} - flag to not throw error, only truncates LSD of binary representation.
    * @return - new or redefined SizedBigInt.
    */
   fromString(strval, radix=4, maxBits=null, onErr_cutLSD=true) {
     if (typeof strval != 'string') throw new Error("ERR2. Invalid input type, must be String");
     let r = SizedBigInt.baseLabel(radix,false)
     if (!strval) return this.fromNull()
     if (r.base==2)
       return this.fromBitString(strval, maxBits, onErr_cutLSD);
     else if (r.label='16js') // ON TESTING!
       return this.fromHexString(strval, maxBits, onErr_cutLSD) // to optimize.
     let trLabel = r.label+'-to-2'
     if (!SizedBigInt.kx_tr[trLabel]) SizedBigInt.kx_trConfig(r.label);
     let tr = SizedBigInt.kx_tr[trLabel]
     let strbin = ''
     for (let i=0; i<strval.length; i++)
       strbin += tr[ strval.charAt(i) ]
     return this.fromBitString(strbin, maxBits, onErr_cutLSD)
   }

   /**
    * Input from BigInt, SizedBigInt or Number.
    * @param val - input value, any type, BigInt, SizedBigInt or Number.
    * @param {integer} maxBits - positive to enforce length; 0 to preserve input length; negative to express only maximum length.
    * @param onErr_cutLSD {Boolean} - flag to not throw error, only truncates LSD of binary representation.
    * @return - new or redefined SizedBigInt.
    */
   fromInt(val, maxBits=0, onErr_cutLSD=true) {
     let t = typeof val
     let isNum = (t=='number' || t=='string')
     let isSBI = (t=='object') // any {val:x,bits:y} not only instanceof SizedBigInt)
     if (t == 'bigint' || isNum || isSBI) {
       if (isNum) this.val = BigInt(val); // can't use Math.abs(val) or val>>>0
       else this.val = isSBI? val.val: val; // supposed positive
       if (this.val < 0n)  this.val = -this.val; // only for bigint or isNum.
       let len = isSBI? val.bits: this.val.toString(2).length  // no optimization as https://stackoverflow.com/q/54758130/287948
       let cutBits = this.setBits_byMax(maxBits, len, onErr_cutLSD)
       if (cutBits[0]) this.val = this.val >> BigInt(len-this.bits); // need to test!
       return this
     } else // null, undefined, string, etc.
       return this.fromNull()
   }

   fromHexString(strval, maxBits=0, onErr_cutLSD=true) {
     // method for performance optimization of standard Hexadecimals
     if (!strval) return this.fromNull()
     let len = strval.length*4
     let val = BigInt("0x"+strval)
     return this.fromInt({val:val,bits:len}, maxBits, onErr_cutLSD)
   }


   // // //
   // Getters and output methods:

   /**
    * Standard default getter for this class.
    */
   get value() { return [this.bits,this.val] }

   /**
    * Converts internal representation (of the SizedBigInt) into a string of ASCII 0s and 1s.
    *
    * Note: Javascript not offers a real array of bits, only array of bytes by Uint8Array().
    * @return {string} the "bit-string ASCII" representation.
    */
   toBitString(){
     return (this.val===null)
       ? ''
       : this.val.toString(2).padStart(this.bits,'0');
   }

   /**
    * Overrides the default toString() method and implements radix convertions.
    * @param {integer} radix - optional, the base-label (see keys of SizedBigInt.kx_baseLabel)
    * @return {string} the solicitated representation.
    */
   toString(radix) {
     if (radix===undefined)
       return `[${this.bits},${this.val}]`; // Overrides Javascript toString()
     let rTo = SizedBigInt.baseLabel(radix,false)
     if (this.val===null)// || (!rTo.isHierar && this.bits % rTo.bitsPerDigit != 0))
       return ''
     let b = this.toBitString()
     if (rTo.base==2)  // || rTo.base=='2h'
       return b
     let trLabel = '2-to-'+rTo.label
     if (!SizedBigInt.kx_tr[trLabel]) SizedBigInt.kx_trConfig(rTo.label);
     let tr = SizedBigInt.kx_tr[trLabel]
     let r = ''
     for (let i=0; i<b.length; i+=rTo.bitsPerDigit)
       r += tr[ b.slice(i,i+rTo.bitsPerDigit) ]
     return r;
   }

   // // //
   // Other methods:

   /**
    * Get the "last numeric SizedBigInt" using same number of bits.
    * @return {BitInt} -  the maximum value.
    */
   fixbits_last() {
      return 2n**BigInt(this.bits)-1n
   }
   /**
    * Get the "next numeric SizedBigInt" using same number of bits.
    * @param cycle boolean flag to use Sized Integers as cyclic group (no error on maximum value)
    * @return null or BitInt of the "same-bit-length successor" of the current state.
    */
   fixbits_next(cycle=false) {
      return (this.val!==this.fixbits_last())
         ? this.val+1n
         : (cycle? 0n: null);
   }

   /**
    * Swap-object utility.
    * @param {object} obj.
    * @return {object} - with swapped key-values.
    */
   static objSwap(obj) {
     return Object.entries(obj).reduce(
       (obj, [key,value])  =>  ({ ...obj, [value]: key }),  {}
     )
   }

   /**
    * Check and normalize the base label. Access the global kx_baseLabel.
    * @param {string} label
    * @param {boolean} retLabel - to return string instead pointer.
    * @return - object pointer (to the correct kx_baseLabel), or a string with normalized label.
    */
   static baseLabel(label,retLabel=false) {
     let t = typeof label;
     if (t=='number') label = String(label);
     else if (t=='boolean' || !label) label='2';
     label = label.toLowerCase();
     if (label.slice(0,3)=='base') label = label.slice(3);
     var r = SizedBigInt.kx_baseLabel[label]
     if (!r) throw new Error(`label "${label}" not exists, must be registered`);
     if (r.isAlias) r = SizedBigInt.kx_baseLabel[r.isAlias];
     return retLabel? r.label: r;
   }

   // // //
   // Iternal use, cache-manager methods:

   /**
    * Internal class-level cache-builder for Base4h and Base16ph complete translations.
    * and generates all other kx_baseLabel global defaults. Singleton Design Pattern.
    */
   static kx_RefreshDefaults() {
    // each standard alphabet as key in the translator.
    if (!SizedBigInt.kx_tr) {
      SizedBigInt.kx_tr={};
      SizedBigInt.kx_baseLabel = {
        "2":   { base:2, alphabet:"01", ref:"ECMA-262" } // never used here, check if necessary to implement
        ,"2h":  {  // BitString representation
          base:2, alphabet:"01",
          isDefault:true,
          isHierar:true, // use leading zeros (0!=00).
          ref:"SizedNaturals"
        }
        ,"4h": {
          base:4,
          isHierar:true, // use hDigit and leading zeros.
          alphabet:"0123GH", case:"upper",
          regex:'^([0123]*)([GH])?$',
          ref:"SizedNaturals"
          }
        ,"8h": {
          base:8,
          isHierar:true, // letters are non-hierarchical
          alphabet:"01234567GHJKLM",  // 2*8-2=14 characters
          regex:'^([0-7]*)([GHJ-M])?$',
          ref:"SizedNaturals"
        }
        ,"16h": {
          base:16,
          isHierar:true,  // upper case are the non-hierarchical
          alphabet:"0123456789abcdefGHJKLMNPQRSTVZ", //2*16-2=30 characters
          regex:'^([0-9a-f]*)([GHJ-NP-TVZ])?$',
          ref:"SizedNaturals"
        }
        ,"4js":   { alphabet:"0123", isDefault:true, ref:"ECMA-262" }
        ,"8js":   { alphabet:"01234567", isDefault:true, ref:"ECMA-262" }
        ,"16js":  { alphabet:"0123456789abcdef", isDefault:true, ref:"ECMA-262" } // RFC 4648 sec 8 is upper
        ,"32hex": { alphabet:"0123456789abcdefghijklmnopqrstuv", isDefault:true, ref:"RFC 4648 sec. 7" }
        ,"32nvu": { alphabet:"0123456789BCDFGHJKLMNPQRSTUVWXYZ", ref:"No-Vowels except U (near non-syllabic)" }
        ,"32rfc": { alphabet:"ABCDEFGHIJKLMNOPQRSTUVWXYZ234567", ref:"RFC 4648 sec. 6" }
        ,"32ghs": { alphabet:"0123456789bcdefghjkmnpqrstuvwxyz", ref:"Geohash, classical of 2008" }
        ,"64url": {
          alphabet:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
          isDefault:true, ref:"RFC 4648 sec. 5"
        }
      };
      SizedBigInt.kx_baseLabel_setRules();
      // to prepare cache, for example Bae16h, run here SizedBigInt.kx_trConfig('16h')
    } // \if
  } // \kx_RefreshDefaults

   /**
    * Apply correction rules to SizedBigInt.kx_baseLabel.
    */
   static kx_baseLabel_setRules(label=null) {
     let scan = label? [label]: Object.keys(SizedBigInt.kx_baseLabel)
     const rAlpha = {falsetrue:"upper", falsefalse:true, truefalse:"lower", truetrue:false};
     for (let i of scan) {
       const r = SizedBigInt.kx_baseLabel[i]
       if (!r.base)         r.base = r.alphabet.length;
       if (!r.bitsPerDigit) r.bitsPerDigit = Math.log2(r.base);
       if (!r.alphabet) throw new Error(`err2, invalid null alphabet`);
       if (!r.isHierar) r.isHierar = false;
       else if (r.alphabet.length<(r.base*2-2))
         throw new Error(`err3, invalid hierarchical alphabet in "${baseLabel}": ${r.alphabet}`);
       let alphaRgx = r.alphabet.replace('-','\\-');
       if (!r.regex)  r.regex =  '^(['+ alphaRgx +']+)$';
       if (!r.case)
         r.case = rAlpha[String(r.alphabet==r.alphabet.toLowerCase()) + (r.alphabet==r.alphabet.toUpperCase())]
       let aux = (r.case===false)? 'i': '';
       if (typeof r.regex =='string')  r.regex = new RegExp(r.regex,aux);
       if (r.isDefault===undefined)    r.isDefault=false;
       if (r.isDefault && i!=r.base) SizedBigInt.kx_baseLabel[String(r.base)] = {isAlias: i};
       aux = String(r.bitsPerDigit) +','+ r.bitsPerDigit;
       if (i!='2')
         r.regex_b2 = new RegExp('^((?:[01]{'+ aux +'})'+(r.isHierar?'*)([01]*)':'+)')+'$');
       r.label = i
     } // \for
   }

   /**
    * Internal cache-builder for input radix methods. Generates the non-default objects.
    * Changes the state of SizedBigInt.kx_tr.
    */
   static kx_trConfig(baseLabel) {
     const r = SizedBigInt.kx_baseLabel[baseLabel];
     if (!r || r.isAlias) throw new Error(`label "${baseLabel}" not exists or is alias`);
     if (r.base==2) return;
     if (r.base>64) throw new Error(`Base-${r.base} is invalid`);
     let label = r.label + '-to-2'
     if (!SizedBigInt.kx_tr[label]) SizedBigInt.kx_tr[label] = {};
     for (let i=0; i<r.base; i++) { // scans alphabet
         let c = r.alphabet.charAt(i)
         SizedBigInt.kx_tr[label][c] = i.toString(2).padStart(r.bitsPerDigit,'0')
     }
     if (r.isHierar) {
       let alphaPos = r.base;
       for(var bits=1; bits<r.bitsPerDigit; bits++)
         for (let i=0; i<2**bits; i++) {
           let c = r.alphabet.charAt(alphaPos)
           SizedBigInt.kx_tr[label][c] = i.toString(2).padStart(bits,'0')
           alphaPos++
         } // \for i, \for bits
     }
     SizedBigInt.kx_tr['2-to-'+r.label] = SizedBigInt.objSwap(SizedBigInt.kx_tr[label]);
   } // \kx_trConfig

   // // //
   // BigInt auxiliar utilities: (can drop from here!)

   /**
    * Calculates the integer log2() of a BigInt... So, its number of bits.
    * @param {BigInt} n - a positive integer.
    * @return {integer} - the ilog2(n)=ceil(log2(n))
    */
   static ilog2(n) {
     return n.toString(2).length - (
       (n<0n)
       ? 2 //discard bit of minus
       : 1
     );
   }

   /**
    * Division N/D with rest.
    * @param {BigInt} N - positive numerator.
    * @param {BigInt} D - positive non-zero denominator.
    * @return {Array} - BigInt values [integerPart,rest]
    */
   static bigint_divrest(N,D) {
     let I = N/D  // ideal a function that returns R and Q.
     let R = N-I*D // compare with performance of R=N%D
     return [I,R]  // quocient and rest.
   }

   /**
    * Division N/D. Returns integer part and "normalized fractional part",
    *  normailized by a power of 2; that is,
    *  result = integerPart + 1/fractionalPart = iP + 1/(nfP*2^P)
    * @param {BigInt} N - positive numerator.
    * @param {BigInt} D - positive non-zero denominator.
    * @param {BigInt} P - default 64, power to be used in 2**P, with P>0 and 2**P/D>=1.
    * @return {Array} - BigInt values [integerPart,normalizedFractionalPart] = [iP,nFP] where fraction=1/(nFP*2^P).
    */
   static bigint_div(N,D,P=64n) {
     let I = N/D  // ideal a function that returns R and Q.
     let R = N-I*D // compare with performance of R=N%D
     let F = ((2n**P)/D)*R  // = ((BigInt(2)**P)*R)/D
     return [I,F]
   }

 } // \SizedBigInt


// // // // // //
// for Node:
if (typeof window === 'undefined') { // suppose it is not a browser
  module.exports = { SizedBigInt }
} // see also https://gist.github.com/rhysburnie/498bfd98f24b7daf5fd5930c7f3c1b7b


 /* - - - - - - - - - - - - - - - - - - - - - - - -

 Copyright 2019 by Peter Krauss (github.com/ppkrauss or OSM.codes) and collaborators.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

- - - - - - - - - - - - - - - - - - - - - - - - - */
