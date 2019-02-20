# SizedBigInt

Sometimes we need [natural numbers](https://en.wikipedia.org/wiki/Natural_number), but a kind of number where 0 is not equal to 00.

Sized BigInt's are arbitrary-precision integers ([BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)) with defined number of bits, to represent hashes, labels, hierarchical indexes or any other that need to differenciate `0` and `00`,  preserving all other numeric interpretations, like order (`002`&gt;`001`) and freedom to translate positional  notation to  [some especific radix](https://en.wikipedia.org/wiki/Radix#In_numeral_systems) (e.g. binary to quaternary or hexadecimal).

<!--
To a complete guide see the [project's page at `ppKrauss.github.com/SizedBigInt`](http://ppKrauss.github.com/SizedBigInt).
-->

## Terminology

* Base2, base4, base16, base32, base64: the web standards, as  [RFC&#160;4648](https://tools.ietf.org/html/rfc4648), use the term "base", but Javascript (ECMA-262) adopted the term "radix" in [`parseInt(string, radix)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt). The preferred term is *base*.

* The term "size" was used in the title of this project, but the usual term for "size of the string" is *length* and, for binary numbers,  [bit-length](https://en.wikipedia.org/wiki/Bit-length),  the preferred term.

* Set, element, number,   natural number and integer are terms of the [Set Theory](https://en.wikipedia.org/wiki/Set_theory), the formal mathematical foundation used here.  In   implementation context the  Javascript semantic for integer, class, number, etc. is preferred.

## Basic examples

The following examples  can be mathematically described as a **finite sets** of numeric representations.  Limiting examples in 8 bits:

* Samples of binary representations:  <i>X</i><sub>1</sub>&nbsp;=&nbsp;{`0`, `1`} &nbsp; <i>X</i><sub>2</sub>&nbsp;=&nbsp;{`0`, `00`, `01`, `1`, `10`, `11`} &nbsp; <i>X</i><sub>3</sub>&nbsp;=&nbsp;... <br/><i>X</i><sub>8</sub>&nbsp;=&nbsp;{`0`, `00`, `000`, `000`,..., `00000000`, `00000001`, ..., `11111111`}.

* The same set <i>X</i><sub>8</sub> without some (non-compatible) items, expressed in [quaternary (base4)](https://en.wikipedia.org/wiki/Quaternary_numeral_system): <i>Y</i><sub>8</sub>=&nbsp;{`0`, `00`, `000`, `0000`, `0001`, `0002`, `0003`, `001`, `0010`, `0011`, ..., `3333`}.

Ordering the illustred elements. The order in ordinarry mathematical *sets* is arbitrary, but to group or list elements we can adopt some order.  The main ordering options for typical SizedBigInts are the **lexicographic order**, to enhance "same prefix" grouping or hierarchy; and the **numeric orderder**, using the size as first criterium.

Here a set of elements illustrated with different representations, listed by lexicographic order of the binary representation:

&nbsp;&nbsp; TABLE-1

```
                    Representation   
    (size,value)   Binary              Base4
    (1,0)	    0
    (2,0)	    00                       0
    (3,0)	    000
    (4,0)	    0000                     00
    (5,0)	    00000
    (6,0)	    000000                   000
    (7,0)	    0000000
    (8,0)	    00000000                 0000
    (8,1)	    00000001                 0001
    (7,1)	    0000001
    (8,2)	    00000010                 0002
    (8,3)	    00000011                 0003
    (6,1)	    000001                   001
    (7,2)	    0000010
    (8,4)	    00000100                 0010
    (8,5)	    00000101                 0011
    ...            ...                      ...
```
## Definition

Each SizedBigInt is an *element* of a [*set*](https://en.wikipedia.org/wiki/Set_theory). The formal definition of this *set* is the mathematical reference-concept for implementations.

As showed in Table-1 we can represent elements of a set *X* as [ordered pairs](https://en.wikipedia.org/wiki/Ordered_pair), (*l*,*n*) of bit-length *l*  and numeric value *n*, a Natural number.  Supposing a maximal bit-length *lmax*, the set <b><i>X</i><sub>L</sub></b> is a finite set limited by  *L*:

![](assets/equations01.png)

## Representations

Natural numbers can be expressed with [positional notation](https://en.wikipedia.org/wiki/Positional_notation), using the rule of "remove [leading zeros](https://en.wikipedia.org/wiki/Leading_zero)".  The rule is used in any base (radix) representation.

The SizedBigInt's are like BigInt's **without the rule of remove leading zeros**, and the SizedBigInt must be the same in any base representation. This last condiction is a problem: as we see at table-1, there are no base4 representation for `0`, because each digit in base4 need 2 bits.

### Binary
The binary representation is the simplest and the canonic one, so it is the reference-representation.

### Base4h
How to represent `0` and `1` in base4?

The solution is to use a fake digit that represent these values. To avoid cofusion with hexadecimal letters we can start with `G` to represent `0` and `H` to represent `1`.  The will be named **half digits** because  the other base4 represent two bits, twice.

&nbsp;&nbsp; TABLE-2

```
    (size,value)    Binary                   Base4h
    (1,0)	    0                        G
    (2,0)	    00                       0
    (3,0)	    000                      0G
    (4,0)	    0000                     00
    (5,0)	    00000                    00G
    (6,0)	    000000                   000
    (7,0)	    0000000                  000G
    (8,0)	    00000000                 0000
    (8,1)	    00000001                 0001
    (7,1)	    0000001                  000H
    (8,2)	    00000010                 0002
    (8,3)	    00000011                 0003
    (6,1)	    000001                   001
    (7,2)	    0000010                  001G
    (8,4)	    00000100                 0010
    (8,5)	    00000101                 0011
    ...             ...                      ...
    (7,127)         1111111                  333H
    (8,254)         11111110                 3332
    (8,255)         11111111                 3333
```
Base4h numbers are strings with usual base4 pattern and the halfDigit as optional suffix:
```js
/^([0123]*)([GH])?$/
```
To translate from binary, only values with odd number of bits will be translate the last bit as halfDigit. The complete translation table, from binary to base4 representations, is:

```json
{ "0":"G", "1":"H", "00":"0", "01":"1", "10":"2", "11":"3" }
```

### Base16h

We can use base16 (hexadecimal representation) for any integer, but when controling the bit-length can use only base16-compatible lengths: 4 bits, 8 bits, 12 bits, ... multiples of 4.

So, how to represent `0`, `1`, `00`, `01`, `10`, ...  ?

The solution is to extend a hexadecimal representation, in a similar way to the previous one used for [base4h](#Base4h): the last digit as a fake-digit that can represent all these incompatible values  &mdash; so using the halphDigit values `G` and `H` for 1-bit values, and including more values for 2 bits (4 values) and 3 bits (8 values). The total is 2+4+8=14 values, they can be represented by the letters `G` to `T`. The name of this new representation is **Base16h**, because it is the usual Base16 "plus an optional halfDigit", by **h** shortening *half*.

Base16h numbers are strings with usual base16 pattern and an optional final exotic digit:
```js
/^([0-9a-f]*)([G-T])?$/
```

To translate from a binary string with *b* bits, there are `b % 4` last bits to be translated as special digits. Splitting the value as binary prefix (`part[0]`) and suffix (`part[1]` with 1, 2 or 3 last bits),
```js
let part = strbin.match(/^((?:[01]{4,4})*)([01]*)$/)
```
the prefix will be translated to usual hexadecimal number, and the suffix, when exists,  translated by this complete "bits to haslDigit" map:

```json
{
 "0":"G","1":"H",
 "00":"I","01":"J","10":"K","11":"L",
 "000":"M","001":"N","010":"O","011":"P","100":"Q","101":"R","110":"S","111":"T"
}
```
-------------

## Implementation using BigInt

The BigInt Javascript primitive datatype ...

Run *demo* with NodeJS using `node  --experimental-modules demo.mjs | more`.

1. Simplest didactic implementations: test with [demo01.mjs](src/demo01.mjs),

   1.1. With a "hidden bit" into the BigInt values: [SizedBigInt-didacticOpt1.mjs](src/SizedBigInt-didacticOpt1.mjs).

   1.2. With a pair (*size*,*value*) as in the set definition.  [SizedBigInt-didacticOpt2.mjs](src/SizedBigInt-didacticOpt2.mjs).

2. Complete implementations: see ...

------

&#160;&#160;Contents, data and source-code of this git repository are dedicated to the public domain.<br/>&#160;&#160;[![](assets/CC0-logo-200px.png)](https://creativecommons.org/publicdomain/zero/1.0/)
