
DROP SCHEMA IF EXISTS sizednat CASCADE;
CREATE SCHEMA sizednat;  -- Sized Natural, http://osm.codes/_foundations/art1.pdf

-- datatypes prefixes: jsonb, bigint, vbit, pair, numpair

CREATE TYPE sizednat.pair AS ( -- used only for final convertions
  n smallint, -- NOT NULL DEFAULT 0,--  CHECK(n>=0),  -- num. of bits, <32767
	v bigint -- 64 bit value
);


---------------------------
---------------------------
---------------------------
--- VBIT LIB

/**
 * Converts bit string to text, using base2h, base4h, base8h or base16h.
 * Using non-silabic (no I,O,U nor WX) alphabet for base8h and base16h.
 * @see http://osm.codes/_foundations/art1.pdf
 * @version 1.0.0.
 */
CREATE or replace FUNCTION sizednat.vbit_to_baseh(
  p_val varbit,  -- input
  p_base int DEFAULT 4 -- selecting base2h, base4h, base8h, or base16h.
) RETURNS text AS $f$
DECLARE
    vlen int;
    pos0 int;
    ret text := '';
    blk varbit;
    blk_n int;
    bits_per_digit int;
    tr int[] := '{ {1,2,0,0}, {1,3,4,0}, {1,3,5,6} }'::int[]; -- --4h(bits,pos), 8h(bits,pos)
    tr_selected JSONb;
    trtypes JSONb := '{"2":[1,1], "4":[1,2], "8":[2,3], "16":[3,4]}'::JSONb; -- TrPos,bits
    trpos int;
    baseh "char"[] := array[
      '[0:15]={G,H,x,x,x,x,x,x,x,x,x,x,x,x,x,x}'::"char"[], --1. 4h,8h,16h 1bit
      '[0:15]={0,1,2,3,x,x,x,x,x,x,x,x,x,x,x,x}'::"char"[], --2. 4h 2bit
      '[0:15]={J,K,L,M,x,x,x,x,x,x,x,x,x,x,x,x}'::"char"[], --3. 8h,16h 2bit
      '[0:15]={0,1,2,3,4,5,6,7,x,x,x,x,x,x,x,x}'::"char"[], --4. 8h 3bit
      '[0:15]={N,P,Q,R,S,T,V,Z,x,x,x,x,x,x,x,x}'::"char"[], --5. 16h 3bit
      '[0:15]={0,1,2,3,4,5,6,7,8,9,a,b,c,d,e,f}'::"char"[]  --6. 16h 4bit
    ]; -- jumpping I,O and U,W,X letters!
       -- the standard alphabet is https://tools.ietf.org/html/rfc4648#section-6
BEGIN
  vlen := bit_length(p_val);
  tr_selected := trtypes->(p_base::text);
  IF p_val IS NULL OR tr_selected IS NULL OR vlen=0 THEN
    RETURN NULL; -- or  p_retnull;
  END IF;
  IF p_base=2 THEN
    RETURN $1::text; --- direct bit string as string
  END IF;
  bits_per_digit := (tr_selected->>1)::int;
  blk_n := vlen/bits_per_digit;
  pos0  := (tr_selected->>0)::int;
  trpos := tr[pos0][bits_per_digit];
  FOR counter IN 1..blk_n LOOP
      blk := substring(p_val FROM 1 FOR bits_per_digit);
      ret := ret || baseh[trpos][ varbit_to_int(blk,bits_per_digit) ];
      p_val := substring(p_val FROM bits_per_digit+1); -- same as p_val<<(bits_per_digit*blk_n)
  END LOOP;
  vlen := bit_length(p_val);
  IF p_val!=b'' THEN -- vlen % bits_per_digit>0
    trpos := tr[pos0][vlen];
    ret := ret || baseh[trpos][ varbit_to_int(p_val,vlen) ];
  END IF;
  RETURN ret;
END
$f$ LANGUAGE plpgsql IMMUTABLE;

/**
 * Converts bit string to text, using standard numeric bases (base4js, base32ghs, etc.)
 * @version 1.0.0.
 */
CREATE or replace FUNCTION sizednat.vbit_to_base_std(
  p_val varbit,  -- input
  p_base text DEFAULT '4js' -- selecting base2js? base4js, etc. with no leading zeros.
) RETURNS text AS $f$
DECLARE
    vlen int;
    pos0 int;
    ret text := '';
    blk varbit;
    blk_n int;
    bits_per_digit int;
    trtypes JSONb := '{
      "4js":[0,1,2],"8js":[0,1,3],"16js":[0,1,4],
      "32ghs":[1,4,5],"32hex":[1,1,5],"32nvu":[1,2,5],"32rfc":[1,3,5],
      "64url":[2,8,6]
    }'::JSONb; -- var,pos,bits
    base0 "char"[] := array[
      '[0:15]={0,1,2,3,4,5,6,7,8,9,a,b,c,d,e,f}'::"char"[] --1. 4,5,16 js
    ];
    base1 "char"[] := array[
       '[0:31]={0,1,2,3,4,5,6,7,8,9,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v}'::"char"[] --1=32hex
      ,'[0:31]={0,1,2,3,4,5,6,7,8,9,B,C,D,F,G,H,J,K,L,M,N,P,Q,R,S,T,U,V,W,X,Y,Z}'::"char"[] --2=32nvu
      ,'[0:31]={A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,2,3,4,5,6,7}'::"char"[] --3=32rfc
      ,'[0:31]={0,1,2,3,4,5,6,7,8,9,b,c,d,e,f,g,h,j,k,m,n,p,q,r,s,t,u,v,w,x,y,z}'::"char"[] --4=32ghs
    ];
    -- "64url": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
    tr_selected JSONb;
    trbase "char"[];
BEGIN
  vlen := bit_length(p_val);
  tr_selected := trtypes->(p_base::text);-- [1=var,2=pos,3=bits]
  IF p_val IS NULL OR tr_selected IS NULL OR vlen=0 THEN
    RETURN NULL; -- or  p_retnull;
  END IF;
  IF p_base='2' THEN
     -- need to strip leading zeros
    RETURN $1::text; --- direct bit string as string
  END IF;
  bits_per_digit := (tr_selected->>2)::int;
  IF vlen % bits_per_digit != 0 THEN
    RETURN NULL;  -- trigging ERROR
  END IF;
  blk_n := vlen/bits_per_digit;
  pos0 = (tr_selected->>1)::int;
  -- trbase := CASE tr_selected->>0 WHEN '0' THEN base0[pos0] ELSE base1[pos0] END; -- NULL! pgBUG?
  trbase := CASE tr_selected->>0 WHEN '0' THEN base0 ELSE base1 END;
  --RAISE NOTICE 'HELLO: %; % % -- %',pos0,blk_n,trbase,trbase[pos0][1];
  FOR counter IN 1..blk_n LOOP
      blk := substring(p_val FROM 1 FOR bits_per_digit);
      ret := ret || trbase[pos0][ varbit_to_int(blk,bits_per_digit) ];
      p_val := substring(p_val FROM bits_per_digit+1);
  END LOOP;
  vlen := bit_length(p_val);
  -- IF p_val!=b'' THEN ERROR
  RETURN ret;
END
$f$ LANGUAGE PLpgSQL IMMUTABLE;

/**
 * Hub function to base conversion. Varbit to String.
 */
CREATE or replace FUNCTION sizednat.vbit_toString(
  p_val varbit,  -- input
  p_base text DEFAULT '4h'
) RETURNS text AS $f$
  SELECT CASE WHEN x IS NULL OR p_val IS NULL THEN NULL
    WHEN x[1] IS NULL THEN  sizednat.vbit_to_base_std(p_val, x[2])
    ELSE  sizednat.vbit_to_baseh(p_val, x[1]::int)  END
  FROM regexp_match(lower(p_base), '^(?:base\-?\s*)?(?:(\d+)h|(\d.+))$') t(x);
$f$ LANGUAGE SQL IMMUTABLE;
--  select sizednat.vbit_toString(b'011010'), sizednat.vbit_toString(b'011010','16h'), sizednat.vbit_toString(b'000111','4js');


/**
 * Parse text to bit string, parsing only base2h, base4h, base8h or base16h.
 * @see http://osm.codes/_foundations/art1.pdf
 * Using non-silabic (no I,O,U nor WX) alphabet for base8h and base16h.
 * Version 0.
 */
 /*
CREATE or replace FUNCTION sizednat.parse(
  p_val text,  -- input
  p_base int DEFAULT 4 -- selecting base2h, base4h, base8h, or base16h.
) RETURNS varbit AS $f$
DECLARE
... cada caractere converte para bits conforme array
... no final faz string_bits::varbit
BEGIN
END
$f$ LANGUAGE plpgsql IMMUTABLE;
*/


---------------------------
---------------------------
---------------------------
--- hidbit_*() LIB  + cating functions hidbig_to_*() and *_to_hidbig()
--- Uses direct bigint (62 bits) with 2 hidden bits encapsulatting SizedNatural.

CREATE or replace FUNCTION sizednat.vbit_to_hidbig(p varbit) RETURNS bigint AS $f$
  SELECT CASE
    WHEN blen>62 OR blen<1 THEN NULL::bigint
    ELSE  (b'0' || $1 || b'1')::bit(64)::bigint -- signal (0 = +) and "finish mark".
    END
  FROM (SELECT bit_length($1)) t(blen)
$f$ LANGUAGE SQL IMMUTABLE STRICT;

CREATE or replace FUNCTION sizednat.pair_to_hidbig(
  n int,  -- num. of bits
	v bigint -- 64 bit value
) RETURNS bigint AS $f$
  SELECT sizednat.vbit_to_hidbig(  substring(v::bit(64) FROM 65-n)  )
$f$ LANGUAGE SQL IMMUTABLE STRICT;


CREATE or replace FUNCTION sizednat.bigint_rightmost_bitpos(
  x bigint
) RETURNS int AS $f$
-- brute force solution. Please review. Ideal use C implementing
-- in C there are direct __builtin_ctz()+1 to do the same.
-- see also https://stackoverflow.com/a/48974850
DECLARE
    pos int DEFAULT 0;
BEGIN
   IF x<1 THEN RETURN NULL; END IF;
   LOOP EXIT WHEN x&1=1; -- bignt bitise and
      pos := pos + 1;
      x   := x >> 1; -- bigint rotate
   END LOOP;
   RETURN pos;
END;
$f$ LANGUAGE plpgsql IMMUTABLE STRICT;

CREATE or replace FUNCTION sizednat.hidbig_to_vbit(p bigint) RETURNS varbit AS $f$
  SELECT substring(
    $1::bit(64) FROM  2  FOR  62-sizednat.bigint_rightmost_bitpos($1)
  )
$f$ LANGUAGE SQL IMMUTABLE STRICT;


---------------------------
---------------------------
---------------------------
--- BIGINT LIB
--- for internal calculations, commom for sizednat.pair*() and sizednat.hidbit*()

CREATE or replace FUNCTION sizednat.hidbig_toString(
  p_val bigint,  -- input
  p_base text DEFAULT '4h'
) RETURNS text AS $wrap$
  SELECT sizednat.vbit_toString(sizednat.hidbig_to_vbit($1),$2)
$wrap$ LANGUAGE SQL IMMUTABLE;
-- select sizednat.hidbig_toString(7999999999999949993,'16h'), sizednat.hidbig_toString(80,'4h');



---------------------------
---------------------------
---------------------------
-- numpair* LIB. Sized natural defined by smallint and numeric(500,0).
---------------------------

CREATE TYPE sizednat.numpair AS (
  -- not implemented, only for tesing by numpair_base_decode()
	n smallint, -- NOT NULL DEFAULT 0,  --  CHECK(n>=0),  num. of bits, <32767
	v numeric(500,0) -- value
);


CREATE or replace FUNCTION sizednat.num_base_decode(
  p_val text,
  p_base int, -- from 2 to 36
  p_alphabet text = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
) RETURNS numeric(500,0) AS $f$
		  SELECT SUM(
	       ( p_base::numeric(500,0)^(length($1)-i) )::numeric(500,0)
	       *   -- base^j * digit_j
	       ( strpos(p_alphabet,d) - 1 )::numeric(500,0)
	    )::numeric(500,0) --- returns numeric?
  		FROM regexp_split_to_table($1,'') WITH ORDINALITY t1(d,i)
$f$ LANGUAGE SQL IMMUTABLE STRICT;


CREATE or replace FUNCTION sizednat.numpair_base_decode(
  p_val text,
  p_base int, -- from 2 to 36
  p_alphabet text = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
) RETURNS sizednat.numpair
AS $f$
  SELECT round(log(2,p_base)*length($1))::smallint, sizednat.num_base_decode($1,$2,$3)
$f$ LANGUAGE SQL IMMUTABLE STRICT;
-- eg. select * from sizednat.numpair_base_decode('77GHIJKL99999999999999999999999999999',32);



-----------------
-----------------
-----------------
-----------------
-- ASSERTS: TESTING IMPLEMENTED FUNCTIONS:

DO $assert_sec$
begin ASSERT (  -- check that is reversible
 SELECT bool_and( sizednat.hidbig_to_vbit(y2)=y ) res
 FROM (
   SELECT sizednat.vbit_to_hidbig(y::varbit) y2, y
   FROM generate_series(0,512) t(x),
   LATERAL unnest( array[x::bit(9), (random()*2305843009213693950.0)::bigint::bit(62)] )  y
 ) t2), 'something wrong with hidbig_to_vbit or vbit_to_hidbig functions';
end;
$assert_sec$;
