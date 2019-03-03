/**
 * SizedBigInt class. This Opt2 implements internal hidden-bit value representation.
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
    if (t=='object') {
       if (val instanceof Array) [val,radix,bits,maxBits]=val;
       else ({val,radix,bits,maxBits} = val);
       t = typeof val
    }
    // set to default values when 0, null or undefined:
    if (!radix) radix = 4; if (!bits) bits=0; if (!maxBits) maxBits=64

    this.maxBits = maxBits
    SizedBigInt.compare_invert=null;
    if (t=='string')
      this.fromString(val,radix)
    else // bigint, number or null
      this.fromInt(val,bits)
  }

  clone() {
    return new SizedBigInt(this)
  }

  // // //
  // Input methods:

  fromString(val,radix=4) {
    return (radix==4||radix=='4h')
      ? this.fromBase4(val)
      : this.fromBinaryString(val);
  }

  fromInt(val,bits=0) {
    let t = typeof val
    let isNum = (t=='number')
    if (t == 'bigint' || isNum) {
      if (isNum)  val = BigInt.asUintN( this.maxBits, String(val) );
      let strbin  = val.toString(2);
      let l = strbin.length
      bits = bits? bits: l
      if (l>bits)  throw new Error("invalid input value, bigger than input bit-length");
      if (bits>this.maxBits) throw new Error(`bit-length exceeded the limit ${this.maxBits}`);
      return this.fromBinaryString(strbin,bits)
    } else {
      this.val  = null
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
    //console.log(" bin debug:",bits,"0b1"+strval,this.val)
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

  valueOf() { return this.val; } // GAMBI, with first bit '1'

  get value() { return this.toString(4) }

  toString(radix) { // melhor usar base4?
    if (radix==2)
      return (this.val===null)
        ? ''
        : this.val.toString(2).slice(1); // remove first 1!
    let b = this.toString(2) // recurrence
    if (radix!=4 && radix!='4h') {  // GAMBI, revisar
      if (this.val===null) return '[0,null]';
      let bits = b.length
      let v = BigInt('0b'+b)
      return `[${bits},${v}]` // (not coercing to array)
    }
    let r = ''
    for (let i=0; i<b.length; i=i+2)
      r += this.kx.alpha_itr[ b.charAt(i)+b.charAt(i+1) ];
    return r;
  }

  // // //
  // Order

  /**
   * Compare two SizedBigInt's, by numeric or lexicographic order.
   * Changes the input array.
   * Flags lexOrder by external SizedBigInt.compare_lexicographic when not null.
   * @param a Array of SizedBigInt instances, to reverse order.
   * @param lexOrder null or boolean to lexicographic order, else numeric order.
   * @return integer 0 when a=b, 1 when a>b, -1 otherwise.
   */
  static compare(SizedBigInt_a, SizedBigInt_b, cmpLex=null) {
    if (SizedBigInt.compare_invert)
      [SizedBigInt_a, SizedBigInt_b] = [SizedBigInt_b, SizedBigInt_a];
    if ( cmpLex===true || SizedBigInt.compare_lexicographic===true) {
      // lexicographic order: can use Uint32Array()  views?
      let a = SizedBigInt_a.toString(2)
      let b = SizedBigInt_b.toString(2)
      return (a>b)? 1: ( (a==b)? 0: -1 )
    } else { // numeric order:
      let bigDiff = SizedBigInt_a.val - SizedBigInt_b.val
      return (bigDiff==0n)? 0: ((bigDiff>0n)? 1: -1)
    }
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
