/**
 * Sized BigInt's (SizedBigInt) are arbitrary-precision integers with defined number of bits.
 * Each instance is a pair (size,number). Input and output accepts many optional representations.
 *
 * License CC0   https://creativecommons.org/publicdomain/zero/1.0
 * Original (C) 2019 by ppkrauss, source at https://github.com/ppKrauss/SizedBigInt
 */

export default class SizedBigInt {

  constructor(val,radix,bits,maxBits=null) {
    SizedBigInt.kxRefresh_defaults(); // global cache once.
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
    if (t=='string') {
      if (!radix) radix = 4;
      if (bits) throw new Error("Invalid input bits for string");
      this.fromString(val, radix, maxBits)
    } else // bigint, number or null
      this.fromInt(val, bits, maxBits)
  }

  static createMany(a) { // mulple constructor
    let t = typeof a;
    // if (a instanceof Set) ... if (WeakMap) ...
    if (t=='array' || a instanceof Array)
      return a.map( x => new SizedBigInt(x) );
    else if (t=='object')
      return Object.assign(...Object.entries(a).map(
        ([k, v]) => ({ [k]: new SizedBigInt(v) })
      ));
    else throw new Error("Invalid input type, use Array or Object");
  }

  // // //
  // Clone utilities:

  clone() {
    return new SizedBigInt(this.val, null, this.bits)
  }

  /**
   * Create two new numbers, prefix and suffix about bits.
   * No changes in the current value.
   * @param bits integer, number of bits in the prefix.
   * @return array, two new SizedBigInts. Null when invalid bits.
   */
   createSplitAt(bits) {
    if (!bits || bits<0 || bits>this.bits) return null;
    let strbin = this.toString(2)
    return [
      new SizedBigInt( strbin.slice(0,bits), 2 ),
      new SizedBigInt( strbin.slice(bits), 2 )
    ]; // must be tested!
  }

  // // //
  // Input methods:

  fromNull() { this.val=null; this.bits=0; return this; }

  fromBinaryString(strval, maxBits=null) {
    if (!strval) return this.fromNull();
    this.bits = strval.length
    if (maxBits && this.bits>maxBits)
      throw new Error(`bit-length ${this.bits} exceeded the limit ${maxBits}`);
    this.val = BigInt("0b"+strval)
    return this
  }

  /**
   * Input from string.
   * @param strval string with valid representation for radix.
   * @param radix the representation adopted in strval, a label of SizedBigInt.kx_baseLabel.
   * @param maxBits null or maximal number of bits.
   * @return new or redefined SizedBigInt.
   */
  fromString(strval, radix=4, maxBits=null) {
    if (typeof strval!='string') throw new Error("Invalid input type, must be String");
    let r = SizedBigInt.baseLabel(radix,false)
    if (!strval) return this.fromNull()
    if (r.base==2)
      return this.fromBinaryString(strval,maxBits);
    let trLabel = r.label+'-to-2'
    if (!SizedBigInt.kx_tr[trLabel]) SizedBigInt.kx_trConfig(r.label);
    let tr = SizedBigInt.kx_tr[trLabel]
    let strbin = ''
    for (let i=0; i<strval.length; i++)
      strbin += tr[ strval.charAt(i) ]
    return this.fromBinaryString(strbin,maxBits)
  }

  /**
   * Input from BigInt or integer part of a Number.
   * @param val Number or BigInt.
   * @param bits optional, the bit-length of val, to padding zeros.
   * @param maxBits null or maximal number of bits (trunc when val is Number).
   * @return new or redefined SizedBigInt.
   */
  fromInt(val, bits=0, maxBits=null) {
    let t = typeof val
    let isNum = (t=='number')
    if (t == 'bigint' || isNum) {
      if (isNum)  this.val =
        maxBits? BigInt.asUintN( maxBits, String(val) )
        : BigInt( String(val) );
      else this.val = val; // is a clone?
      let l = this.val.toString(2).length  // ? check https://stackoverflow.com/q/54758130/287948
      this.bits = bits? bits: l;
      if (l>this.bits)
        throw new Error("invalid input value, bigger than input bit-length");
      if (maxBits && this.bits>maxBits)
        throw new Error(`bit-length ${this.bits} exceeded the limit ${maxBits}`);
      return this
    } else // null, undefined, string, etc.
      return this.fromNull()
  }

  _fromHexString(strval) {  // not in use, for performance optimizations
    if (!strval) return this.fromNull()
    this.bits = strval.length*4
    this.val = BigInt("0x"+strval)
    return this
  }

  // // //
  // Getters and output methods:

  get value() { return [this.bits,this.val] }


  /**
   * Overrides the default toString() method and implements radix convertions.
   * @param radix optional, the base-label (see keys of SizedBigInt.kx_baseLabel)
   */
  toString(radix) {
    if (radix===undefined)
      return `[${this.bits},${this.val}]`; // Overrides Javascript toString()
    let rTo = SizedBigInt.baseLabel(radix,false)
    if (this.val===null || (!rTo.useHalfDigit && this.bits % rTo.bitsPerDigit != 0))
      return '';
    if (rTo.base==2)
      return this.val.toString(2).padStart(this.bits,'0');

    let b = this.toString(2) // recurrence
    let trLabel = '2-to-'+rTo.label
    if (!SizedBigInt.kx_tr[trLabel]) SizedBigInt.kx_trConfig(rTo.label);
    let tr = SizedBigInt.kx_tr[trLabel]
    let r = ''
    for (let i=0; i<b.length; i+=rTo.bitsPerDigit)
      r += tr[ b.slice(i,i+rTo.bitsPerDigit) ]
    return r;
  }

  // // //
  // Order and other:

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


  /**
   * Swap-object utility.
   * @return object with swapped key-values.
   */
  static objSwap(obj) {
    return Object.entries(obj).reduce(
      (obj, [key,value])  =>  ({ ...obj, [value]: key }),  {}
    )
  }


  /**
   * Check and normalize the base label. Access the global kx_baseLabel.
   * @param string label
   * @param boolean retLabel, to return string instead pointer.
   * @return object pointer (to the correct kx_baseLabel), or a string with normalized label.
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


  /**
   * Changes current val to a truncate prefix (most significative part).
   * Trucated is same as createSplitAt(bits)[0];
   * @param bits, number of bits of the result.
   * @return this.
   */
  truncAt(bits) {
    if (!bits || bits<0 || bits>this.bits) return this;
    return this.fromBinaryString( this.toString(2).slice(0,bits) );
  }


  // // //
  // Iternal use, cache-manager methods:

  /**
   * Internal class-level cache-builder for Base4h and Base16ph complete translations.
   * and generates all other kx_baseLabel global defaults. Singleton Design Pattern.
   */
  static kxRefresh_defaults() {
   // each standard alphabet as key in the translator.
   if (!SizedBigInt.kx_tr) {
     SizedBigInt.kx_tr={};
     SizedBigInt.kx_baseLabel = {
       "2":   { base:2, alphabet:"01", isDefault:true, ref:"ECMA-262" }
       ,"4h": {
         base:4, isDefault:true,
         useHalfDigit:true,
         alphabet:"0123GH", case:"upper",
         regex:'^([0123]*)([GH])?$',
         ref:"SizedBigInt"
         }
       ,"16h": {
         base:16, isDefault:true,
         useHalfDigit:true,
         alphabet:"0123456789abcdefGHIJKLMNOPQRST",
         regex:'^([0-9a-f]*)([G-T])?$',
         ref:"SizedBigInt"
       }
       ,"4js":   { alphabet:"0123", ref:"ECMA-262" }
       ,"8js":   { alphabet:"01234567", isDefault:true, ref:"ECMA-262" }
       ,"16js":  { alphabet:"0123456789abcdef", ref:"ECMA-262" } // RFC 4648 sec 8 is upper
       ,"32hex": { alphabet:"0123456789abcdefghijklmnopqrstuv", isDefault:true, ref:"RFC 4648 sec. 7" }
       ,"32pt":  { alphabet:"0123456789BCDFGHJKLMNPQRSTUVWXYZ", ref:"Portuguese encodings" }
       ,"32rfc": { alphabet:"ABCDEFGHIJKLMNOPQRSTUVWXYZ234567", ref:"RFC 4648 sec. 6" }
       ,"32ghs": { alphabet:"0123456789bcdefghjkmnpqrstuvwxyz", ref:"Geohash, classical of 2008" }
       ,"64url": {
         alphabet:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
         isDefault:true, ref:"RFC 4648 sec. 5"
       }
     };
     SizedBigInt.kx_baseLabel_setRules();

     SizedBigInt.kx_tr['4h-to-2'] = {
       "G":"0","H":"1", // HalfDigit to binary
       "0":"00", "1":"01", "2":"10", "3":"11", // standard base4 to binary
     };
     SizedBigInt.kx_tr['2-to-4h']  = SizedBigInt.objSwap(SizedBigInt.kx_tr['4h-to-2']);
     SizedBigInt.kx_trConfig('16js'); // '16js-to-2' and '2-to-16js'
     SizedBigInt.kx_tr['16h-to-2'] = Object.assign(
         SizedBigInt.kx_tr['16js-to-2'],
         {
           "G":"0","H":"1", // HalfDigit to binary
           "I":"00","J":"01","K":"10","L":"11",  // 2-bit-HalfDigits to binary
           "M":"000","N":"001","O":"010","P":"011","Q":"100","R":"101","S":"110","T":"111" // 3-bit-HalfDigits
         }
     );
     SizedBigInt.kx_tr['2-to-16h'] = SizedBigInt.objSwap(SizedBigInt.kx_tr['16h-to-2']);
     // any other kx_tr[] must to use the fabric kx_trConfig().
   } // \if
  }

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
      if (!r.useHalfDigit) r.useHalfDigit = false;
      let alphaRgx = r.alphabet.replace('-','\\-')
      if (!r.regex)  r.regex =  '^(['+ alphaRgx +']+)$';
      if (!r.case)
        r.case = rAlpha[String(r.alphabet==r.alphabet.toLowerCase()) + (r.alphabet==r.alphabet.toUpperCase())]
      let aux = (r.case===false)? 'i': '';
      if (typeof r.regex =='string')  r.regex = new RegExp(r.regex,aux);
      if (r.isDefault===undefined)    r.isDefault=false;
      if (r.isDefault && i!=r.base) SizedBigInt.kx_baseLabel[String(r.base)] = {isAlias: i};
      aux = String(r.bitsPerDigit) +','+ r.bitsPerDigit;
      if (i!='2')
        r.regex_b2 = new RegExp('^((?:[01]{'+ aux +'})*)([01]*)$');
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
    let label = r.label + '-to-2'
    if (!SizedBigInt.kx_tr[label]) SizedBigInt.kx_tr[label] = {};
    for (let i=0; i<r.base; i++) { // scans alphabet
        let c = r.alphabet.charAt(i)
        SizedBigInt.kx_tr[label][c] = i.toString(2).padStart(r.bitsPerDigit,'0')
    }
    SizedBigInt.kx_tr['2-to-'+r.label] = SizedBigInt.objSwap(SizedBigInt.kx_tr[label]);
  }

} // \class
