/**
 * Didactic/simplified  implementaion with the "hidden bit".
 * Only illustrative, please avoid to use.
 * Implements only base4h and hierarchical binary strings.
 * Sized BigInt's (SizedBigInt) are arbitrary-precision integers with defined number of bits.
 * Each instance is a pair (size,number). Input and output accepts many optional representations.
 */

export default class SizedBigInt { // (hidden bit version)

  constructor(val,radix,bits,maxBits) {
    this.kx = { // base4h alphabet translations to and from binary string:
      alpha_tr:   { "G":"0", "H":"1", "0":"00", "1":"01", "2":"10", "3":"11" }
      ,alpha_itr: { "0":"G", "1":"H", "00":"0", "01":"1", "10":"2", "11":"3" }
    };

    let t = typeof val;
    if (t=='object') {
       if (val instanceof SizedBigInt) {
         this.val = val.val // make a clone
         return this; // or exit with void return?
       }
       if (val instanceof Array) [val,radix,bits,maxBits]=val;
       else ({val,radix,bits,maxBits} = val);
       t = typeof val
    }
    // set to default values when 0, null or undefined:
    if (!radix) radix = 4; if (!bits) bits=0; if (!maxBits) maxBits=512

    SizedBigInt.compare_invert=null;
    this.maxBits = maxBits
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
    return (radix==4)
      ? this.fromBase4(val)
      : this.fromBinaryString(val);
  }

  fromInt(val,bits=0) {
    let t = typeof val
    if (t == 'bigint' || t=='number') {
      if (t=='number')  val = BigInt(String(val));
      let strbin = val.toString(2)
      let l = strbin.length
      bits = bits? bits: l
      if (l>bits)  throw new Error("input bits invalid");
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

  valueOf() { return this.val; } // with first bit '1'
  get value() { return this.toString(4) }

  toString(radix) {
    if (radix==2)
      return (this.val===null)
        ? ''
        : this.val.toString(2).slice(1); // remove first 1!
    else if (radix!=4) throw new Error("invalid radix");
    let b = this.toString(2) // recurrence
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
