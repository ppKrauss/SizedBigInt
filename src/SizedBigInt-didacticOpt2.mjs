/**
 * SizedBigInt class by hidden-bit.
 * This Opt2 implements internal hidden-bit value representation.
 * Didactic/simplified  implementaion. Only illustrative, please avoid to use.
 * Implements only base4h and hierarchical binary strings.
 *
 * Sized BigInt's are arbitrary-precision integers with controled number of bits.
 * Each instance is a pair (bits,val) with the BigInt value and the number of bits.
 * Input and output accepts many optional representations.
 * String output use the leading zeros to diffrenciate numbers (00 is not 0).
 * To review see also bitwise operations at https://github.com/GoogleChromeLabs/jsbi#why
 *
 * License CC0   https://creativecommons.org/publicdomain/zero/1.0
 * Original (C) 2019 by ppkrauss, source at https://github.com/ppKrauss/SizedBigInt
 */

export default class SizedBigInt { // (hidden bit version)

  constructor(val,radix,bits,maxBits) {
    this.kx = { // base4h alphabet translations to and from binary string:
      alpha_tr:   { "G":"0", "H":"1", "0":"00", "1":"01", "2":"10", "3":"11" }
      ,alpha_itr: { "0":"G", "1":"H", "00":"0", "01":"1", "10":"2", "11":"3" }
    };

    let t = typeof val;
    if (val && t=='object') { // not-null object
       if (val instanceof SizedBigInt)
        [val,radix,bits,maxBits]=[val.val,null,val.bits,null]; // clone()
       else if (val instanceof Array)
        [val,radix,bits,maxBits]=val;
       else ({val,radix,bits,maxBits} = val);
       t = typeof val
    }
    // set to default values when 0, null or undefined:
    if (!radix) radix = 4; if (!bits) bits=0; if (!maxBits) maxBits=1024

    this.maxBits = maxBits
    SizedBigInt.compare_invert=null;
    if (t=='string')
      this.fromString(val,radix)
    else // bigint, number or null
      this.fromInt(val,bits)
  }

  clone() {
    return new SizedBigInt( this.toBinaryString(), 2 )
  }

  // // //
  // Input methods:

  fromString(val,radix=4) {
    return (radix==4||radix=='4h')
      ? this.fromBase4(val)
      : this.fromBinaryString(val);
  }

  fromInt_TESTING(val,bits=0) { // bug
    //non-optimized, must use bitwise operations, and compare performance with old (string).
    const TWO = BigInt(2)
    let t = typeof val
    let isNum = (t=='number')
    if (t == 'bigint' || isNum) {
      if (isNum)  val = BigInt.asUintN( this.maxBits, String(val) );
      let l = SizedBigInt.bigint_log2(val)
      bits = bits? bits: l
      if (l>bits)  throw new Error("invalid input value, bigger than input bit-length: "+l+","+bits+","+val);
      if (bits>this.maxBits) throw new Error(`bit-length exceeded the limit ${this.maxBits}`);
      this.val = val+TWO**BigInt(bits) // add one bit, ideal is bitwise instead generic power.
      this.kx_bits = bits
    } else {
      this.val  = null
      this.kx_bits = null;
    }
    return this
  }

  fromInt(val,bits=0) {
    let t = typeof val
    let isNum = (t=='number')
    if (t == 'bigint' || isNum) {
      if (isNum)  val = BigInt.asUintN( this.maxBits, String(val) );
      let strbin  = val.toString(2);
      let l = strbin.length
      bits = bits? bits: l
      if (l>bits)  throw new Error("invalid input value, bigger than input bit-length: "+l+","+bits+","+val);
      return this.fromBinaryString(strbin,bits)
    } else {
      this.val  = null
      this.kx_bits = null;
      return this
    }
  }

  fromBinaryString(strval,bits=0) {
    if (bits>0) {
      if (bits<strval.length) throw new Error("er01, input value greater than bits");
      strval = strval.padStart(bits,'0')
    } else
      bits = strval.length
    if (bits>this.maxBits) throw new Error("er02, bits greater than maxBits");
    this.val = BigInt("0b1"+strval) // prefix "1"!
    this.kx_bits = bits;
    return this
  }

  fromBase4(strval) {
    let strbin = ''
    for (let i=0; i<strval.length; i++)
      strbin += this.kx.alpha_tr[ strval.charAt(i) ];
    this.fromBinaryString(strbin)
    return this
  }

  // // //
  // Getters and output methods:

  get bits() {
    if (!this.kx_bits)
      this.kx_bits = SizedBigInt.bigint_log2(this.val)
    return this.kx_bits;
  }

  toBigInt() {
    // any way to remove first bit!?
    //let mask = BigInt( "0b"+(2**(this.bits-1)-1).toString(2) )
    //return this.val & mask;
    let aux = this.toBinaryString()
    return aux? BigInt( "0b"+aux ): null;
  } // GAMBI, with first bit '1'

  toBinaryString(){
    return (this.val===null)
      ? ''
      : this.val.toString(2).slice(1);
  }

  toString(radix) { // melhor usar base4?
    if (radix==2)
      return this.toBinaryString(); // remove first 1!
    else if (radix!=4 && radix!='4h') {  // GAMBI, revisar
      if (this.val===null) return '[0,null]';
      let xx = this.toBigInt()
      return `[${this.bits},${xx}]` // (not coercing to array)
    }
    let b = this.toBinaryString()
    let r = ''
    let xx=''
    for (let i=0; i<b.length; i=i+2){
      r += this.kx.alpha_itr[ b.charAt(i)+b.charAt(i+1) ];
      xx+= b.charAt(i)+b.charAt(i+1)+"."
    }
    return r;
  }

  // Utilities:

  static bigint_log2(n) {
     // Calculates the integer log2() of a BigInt...
     // = BitLength when n is a BigInt with left hiddem bit.
     const C1 = BigInt(1)
     const C2 = BigInt(2)
     for(var count=0, n=n; n>C1; count++)  n = n/C2
     //can be optimized! see https://github.com/peterolson/BigInteger.js/issues/121
     // ideal is to use webAssembler to acess BSR https://stackoverflow.com/a/994709/287948
     // https://stackoverflow.com/a/47074187/287948
     // but must used with primitive type BigInt...
     return count
  }

  // // //
  // Order

  /**
   * Compare two external SizedBigInt's, by numeric or lexicographic order.
   * Flags lexOrder by external SizedBigInt.compare_lexicographic when not null.
   * @param a SizedBigInt, first item.
   * @param b SizedBigInt, second item.
   * @return integer 0 when a=b, 1 when a>b, -1 otherwise.
   */
   static compare(a, b, cmpLex=null) {
     var dif
     if (SizedBigInt.compare_invert)
       [a, b] = [b, a];
     if ( cmpLex===true || SizedBigInt.compare_lexicographic===true) {
       // binary lexicographic order:
       let bdif = a.bits - b.bits
       if (bdif) {
         dif = (bdif>0)
           ? a.val/BigInt(2**bdif) - b.val     // normalize a
           : a.val - b.val/BigInt(2**(-bdif)); // normalize b
         if (!dif) dif = bdif;
       } else
         dif = a.val - b.val
    } else // numeric order:
       dif = a.val - b.val  // valid because the hiddenBit preserves leading zeros
   return dif? ((dif>0n)? 1: -1) : 0;
   }

  /**
   * Sort or reverse-sort of an array of SizedBigInt's.
   * Changes the input array.
   * @param a Array of SizedBigInt instances, to reverse order.
   * @param lexOrder boolean to lexicographic order, else numeric order.
   * @param descOrder boolean to descendent order, else ascendent.
   */
  static sort(a, lexOrder=false, descOrder=false) {
    SizedBigInt.compare_lexicographic = lexOrder
    SizedBigInt.compare_invert = descOrder
    a.sort(SizedBigInt.compare)
    SizedBigInt.compare_lexicographic = null // clean
  }


} // \class
