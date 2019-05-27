# SizedBigInt

Sized BigInt's are [bit strings](https://en.wikipedia.org/wiki/Bit_array#Language_support) for Javascript implementations (using native BigInts), to represent hashes, labels and hierarchical indexes.

* For main implementation, see  [src_js/SizedBigInt.mjs](src_js/SizedBigInt.mjs), runs with NodeJS and main browsers.

* For demos and simplified implementations, see  [src_js](src_js). The assert files are at [data/assert*.txt](data).

* SQL implementation: see [src_sql](src_sql).

* Text, etc. under construction. **See [PDF](http://osm.codes/_foundations/art1.pdf)** or help [at this link to **improve the text of foundations**](https://docs.google.com/document/d/19_X_QXpY56-72Aw7voWoPXclcGuZi7fosCNDj6uOcQM/).

* Collabore: [reporting issues](https://github.com/ppKrauss/SizedBigInt/issues), reviewing text of foundations, or installing and testing the SizedBigInt class.

## Brief presentation

(summarizing the contents of the [PDF](http://osm.codes/_foundations/art1.pdf) - "Sized Naturals as foundation for hierarchical labelingand extend hexadecimals for any bit string size").

Sometimes we need [natural numbers](https://en.wikipedia.org/wiki/Natural_number), but a kind of number where 0 is not equal to 00.

Sized BigInt's are arbitrary-precision integers ([BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)) with defined number of bits, to represent hashes, labels, encodings, hierarchical indexes or any other that need to differenciate `0` and `00`,  preserving all other numeric interpretations, like order (`002`&gt;`001`) and the freedom to translate its positional  notation to  [some especific radix](https://en.wikipedia.org/wiki/Radix#In_numeral_systems) (e.g. binary to quaternary or hexadecimal).

### Basic examples

The following examples  can be mathematically described as a **finite sets** of pseudo-numeric representations.  Limiting examples in 8 bits:

* Samples of base2 representations:  <i>X</i><sub>1</sub>&nbsp;=&nbsp;{`0`, `1`} &nbsp; <i>X</i><sub>2</sub>&nbsp;=&nbsp;{`0`, `00`, `01`, `1`, `10`, `11`} &nbsp; <i>X</i><sub>3</sub>&nbsp;=&nbsp;... <br/><i>X</i><sub>8</sub>&nbsp;=&nbsp;{`0`, `00`, `000`, `000`,..., `00000000`, `00000001`, ..., `11111111`}.

* The same set <i>X</i><sub>8</sub> without some (non-compatible) items, expressed in [quaternary (base4)](https://en.wikipedia.org/wiki/Quaternary_numeral_system): <br/><i>Y</i><sub>8</sub>=&nbsp;{`0`, `00`, `000`, `0000`, `0001`, `0002`, `0003`, `001`, `0010`, `0011`, ..., `3333`}.

* Ordering. The order in ordinary mathematical *sets* is arbitrary, but to group or list elements we can adopt some order.  The main ordering options for typical SizedBigInts are the **lexicographic order**, to enhance "same prefix" grouping or hierarchy; and the **pseudo-numeric order**, using the bit-length as first criterium and numeric order as second.

Here a set of elements illustrated with different representations, listed by lexicographic order of the binary representation:
```
                    Representation   
    (size,value)   Binary                   Base4
    (1,0)	    0                        ?
    (2,0)	    00                       0
    (3,0)	    000                      ?
    (4,0)	    0000                     00
    (5,0)	    00000                    ?
    (6,0)	    000000                   000
    (7,0)	    0000000                  ?
    (8,0)	    00000000                 0000
    (8,1)	    00000001                 0001
    (7,1)	    0000001                  ?
    (8,2)	    00000010                 0002
    (8,3)	    00000011                 0003
    (6,1)	    000001                   001
    (7,2)	    0000010                  ?
    (8,4)	    00000100                 0010
    (8,5)	    00000101                 0011
    ...            ...                      ...
```
### Formal definition

Each SizedBigInt is an *element* of a [*set*](https://en.wikipedia.org/wiki/Set_theory). The formal definition of this *set* is the mathematical reference-concept for implementations.

As showed in the table above, we can represent elements of a set *X* as [ordered pairs](https://en.wikipedia.org/wiki/Ordered_pair), (*l*,*n*) of bit&#8209;length&nbsp;*l*  and numeric value&nbsp;*n*, a Natural number.  Supposing a minimum bit-length function, *minBL()*, the set <b><i>X</i><sub>k</sub></b> is a SizedBigInt set constrained by  *k*, the maximum number of bits:
<!--![](assets/equations02.344px.png)-->

![](assets/equation06-main.png)

where

![](assets/equation06-minBL.v2.png)



### Representations

Natural numbers can be expressed with [positional notation](https://en.wikipedia.org/wiki/Positional_notation), using the rule of "remove [leading zeros](https://en.wikipedia.org/wiki/Leading_zero)".  The rule is used in any base (radix) representation.

The SizedBigInt's are like BigInt's **without the rule of remove leading zeros**, and the SizedBigInt must be the same in any base representation. This last condiction is a problem: as we see in the table, there are no base4 representation for `0`, because each digit in base4 need 2 bits.

How to convert base2 one-digit numbers `0` and `1` to base4?

The solution proposed here is to use a fake (optional) final digit that represent these values. To avoid cofusion with hexadecimal letters we can start with `G` to represent `0` and `H` to represent `1`.  It was named "hierarchical digit" (**hDigit**) because the ordinary base4 digits use two bits. The resulted notation is **base4h**. For base16 e neeed more hDigits, but the logic is the same.

### Base4h

Listing some bit strings and its base4h representations.

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
Base4h numbers are strings with usual base4 pattern and the halfDigit as optional suffix. This syntax rule can be expressed by a [regular expression](https://en.wikipedia.org/wiki/Regular_expression):

```js
/^([0123]*)([GH])?$/
```
To translate from binary, only values with odd number of bits will be translate the last bit as halfDigit. The complete translation table, from binary to base4 representations, is:

```json
{ "0":"G", "1":"H", "00":"0", "01":"1", "10":"2", "11":"3" }
```

### Base16h

Extending the hexadecimal representation, in a similar way to the previous one used for [base4h](#Base4h): the last digit as a fake-digit that can represent all these incompatible values  &mdash; so using the halphDigit values `G` and `H` for 1-bit values, and including more values for 2 bits (4 values) and 3 bits (8 values). The total is 2+4+8=14 values, they can be represented by the letters `G` to `T`.

The name of this new representation is **Base16h**, because it is the ordinary Base16 "plus an optional hDigit", and is used to represent hierarchical bit strings. Its string pattern is:

```js
/^([0-9a-f]*)([G-T])?$/
```
&nbsp;&nbsp; TABLE-3

```
value    Binary     Base16h
(1,0)	0       	G
(2,0)	00      	I
(3,0)	000     	M
(4,0)	0000    	0
(5,0)	00000   	0G
(6,0)	000000  	0I
(7,0)	0000000 	0M
(8,0)	00000000	00
(8,1)	00000001	01
(7,1)	0000001 	0N
(8,2)	00000010	02
(8,3)	00000011	03
(6,1)	000001  	0J
...
(6,63) 	111111  	fL
(7,126)	1111110 	fS
(8,252)	11111100	fc
(8,253)	11111101	fd
(7,127)	1111111 	fT
(8,254)	11111110	fe
(8,255)	11111111	ff
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


------

&#160;&#160;Contents, data and source-code of this git repository are dedicated to the public domain.<br/>&#160;&#160;[![](assets/CC0-logo-200px.png)](https://creativecommons.org/publicdomain/zero/1.0/)
