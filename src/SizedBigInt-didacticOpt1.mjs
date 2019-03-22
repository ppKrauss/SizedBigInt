/**
 * SizedBigInt class by (size,value).
 * This Opt1 implements internal (bits,val) representation.
 * Didactic/simplified implementaion. Only illustrative, please avoid to use.
 *
 * Implements only base4h and hierarchical binary strings.
 * Sized BigInt's (SizedBigInt) are arbitrary-precision integers with defined number of bits.
 * Each instance is a pair (size,number). Input and output accepts many optional representations.
 *
 * License CC0   https://creativecommons.org/publicdomain/zero/1.0
 * Original (C) 2019 by ppkrauss, source at https://github.com/ppKrauss/SizedBigInt
 */

export default class SizedBigInt {

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
    if (t=='string')
      this.fromString(val,radix)
    else // bigint, number or null
      this.fromInt(val,bits)
  }

  clone() {
    return new SizedBigInt(this.val, null, this.bits)
  }

  // // //
  // Input methods:

  fromString(val,radix=4) {
    return (radix==4 || radix=='4h')
      ? this.fromBase4(val)
      : this.fromBinaryString(val);
  }

  fromInt(val,bits=0) {
    let t = typeof val
    let isNum = (t=='number')
    if (t == 'bigint' || isNum) {
      if (isNum)  this.val = BigInt.asUintN( this.maxBits, String(val) );
      else this.val = val; // is a clone?
      let l = val.toString(2).length  // ? check https://stackoverflow.com/q/54758130/287948
      this.bits = bits? bits: l;
      if (l>this.bits) throw new Error("invalid input value, bigger than input bit-length");
      if (this.bits>this.maxBits) throw new Error(`bit-length ${val} exceeded the limit ${this.maxBits}`);
    } else {
      this.val  = null
      this.bits = 0;
    }
    return this
  }

  fromBinaryString(strval) {
    this.bits = strval.length
    this.val = BigInt("0b"+strval)
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
  // Getters:

  get value() { return [this.bits,this.val] }

  // // //
  // Output and other non-invasive methods (that not changes internal state):

  toString(radix) {
    if (radix==2)
      return this.val.toString(2).padStart(this.bits,'0');
    else if (radix!=4 && radix!='4h') // debug debug output
      return `[${this.bits},${this.val}]`; // (not coercing to array)
    let b = this.toString(2) // recurrence
    let r = ''
    for (let i=0; i<b.length; i=i+2)
      r += this.kx.alpha_itr[ b.charAt(i)+b.charAt(i+1) ];
    return r;
  }


  // // //
  // Order:

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
      // lexicographic order:
      let a = SizedBigInt_a.toString(2)
      let b = SizedBigInt_b.toString(2)
      return (a>b)? 1: ( (a==b)? 0: -1 )
    } else { // numeric order:
      let bitsDiff = SizedBigInt_a.bits - SizedBigInt_b.bits
      if (bitsDiff) return bitsDiff;
      else {
        let bigDiff = SizedBigInt_a.val - SizedBigInt_b.val
        return (bigDiff==0n)? 0: ( (bigDiff>0n)? 1: -1 )
      }
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
