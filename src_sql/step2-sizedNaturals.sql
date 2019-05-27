
DROP SCHEMA IF EXISTS sizednat CASCADE;
CREATE SCHEMA sizednat;  -- Sized Natural, http://osm.codes/_foundations/art1.pdf

-- datatypes prefixes: jsonb, bigint, vbit, pair, numpair

CREATE TYPE sizednat.pair AS ( -- used only for final convertions
  n smallint, -- NOT NULL DEFAULT 0,--  CHECK(n>=0),  -- num. of bits, <32767
	v bigint -- 64 bit value
);

-------------------------------
-------------------------------
-- Metadata, informative datasets (not used in the functions)

CREATE TABLE sizednat.term ( -- URN
  id  serial NOT NULL PRIMARY KEY,
  tgroup text NOT NULL DEfAULT 'base_label',
  term   text NOT NULL,
  kx_aliasTo int, -- need cache refresh
  info   jsonb,
  UNIQUE(tgroup,term)
);
CREATE INDEX idx_sizednat_term_tg  ON sizednat.term(tgroup);

-- hbig = "hierarchical" bigint; vbit = varbit; str = text with base n representation);
-- pair = record(smallint,bigint); strbh = string baseH, strstd = string of other standard base.
---------------------------
---------------------------
---------------------------
--- VBIT LIB

/**
 * Converts bit string to text, using base2h, base4h, base8h or base16h.
 * Uses letters "G" and "H" to sym44bolize non strandard bit strings (0 for44 bases44)
 * Uses extended alphabet (with no letter I,O,U W or X) for base8h and base16h.
 * @see http://osm.codes/_foundations/art1.pdf
 * @version 1.0.0.
 */
CREATE FUNCTION sizednat.vbit_to_baseh(
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
CREATE FUNCTION sizednat.vbit_to_strstd(
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
CREATE FUNCTION sizednat.vbit_to_str(
  p_val varbit,  -- input
  p_base text DEFAULT '4h'
) RETURNS text AS $f$
  SELECT CASE WHEN x IS NULL OR p_val IS NULL THEN NULL
    WHEN x[1] IS NULL THEN  sizednat.vbit_to_strstd(p_val, x[2])
    ELSE  sizednat.vbit_to_baseh(p_val, x[1]::int)  END
  FROM regexp_match(lower(p_base), '^(?:base\-?\s*)?(?:(\d+)h|(\d.+))$') t(x);
$f$ LANGUAGE SQL IMMUTABLE;
--  select sizednat.vbit_to_str(b'011010'), sizednat.vbit_to_str(b'011010','16h'), sizednat.vbit_to_str(b'000111','4js');

/*
NOVO PARSE

select (('{
  "0":0,"1":1,"2":2,"3":3,"4":4,"5":5,
  "6":6,"7":7,"8":8,"9":9,"a":10,"b":11,"c":12,"d":13,
  "e":14,"f":15
}'::jsonb)->>'f')::int::bit(4);


tr_base16:

foreach(split as i)
  c=x[base16][4bits][char]
  if c is not null return c
  else if last char {  c=x[base16][4bits][char]

  */

/**
 * Parse text to bit string, parsing only base2h, base4h, base8h or base16h.
 * Inverse function of vbit_to_str().
 * @see http://osm.codes/_foundations/art1.pdf
 * Using non-silabic (no I,O,U nor WX) alphabet for base8h and base16h.
 * Version 0.
 */
 /*
CREATE FUNCTION sizednat.str_parse(
  p_val text,  -- input
  p_base int DEFAULT 4 -- selecting base2h, base4h, base8h, or base16h.
) RETURNS varbit AS $f$
DECLARE
  regx := array['^((?:[01]{2,2})*)([01]*)$','^((?:[01]{3,3})*)([01]*)$','^((?:[01]{4,4})*)([01]*)$'];
  ---    regular expressions to extract groups from base4h, 8h, 16h

   -- poderia fazer antes
... cada caractere converte para bits conforme array
... no final faz string_bits::varbit
BEGIN
END
$f$ LANGUAGE plpgsql IMMUTABLE;
*/

CREATE or replace FUNCTION sizednat.strbh_to_vbit(
  p_val text,  -- input
  p_base int DEFAULT 4 -- selecting base2h, base4h, base8h, or base16h.
) RETURNS varbit AS $f$
DECLARE
  tr_hdig jsonb := '{
    "G":[1,0],"H":[1,1],
    "J":[2,0],"K":[2,1],"L":[2,2],"M":[2,3],
    "N":[3,0],"P":[3,1],"Q":[3,2],"R":[3,3],
    "S":[3,4],"T":[3,5],"V":[3,6],"Z":[3,7]
  }'::jsonb;
  tr_full jsonb := '{
    "0":0,"1":1,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,
    "9":9,"a":10,"b":11,"c":12,"d":13,"e":14,"f":15
  }'::jsonb;
  blk text[];
  bits varbit;
  n int;
  i char;
  ret varbit;
  BEGIN
  ret = '';
  blk := regexp_match(p_val,'^([0-9a-f]*)([GHJ-NP-TVZ])?$');
  IF blk[1] >'' THEN
    FOREACH i IN ARRAY regexp_split_to_array(blk[1],'') LOOP
      ret := ret || CASE p_base
        WHEN 16 THEN (tr_full->>i)::int::bit(4)::varbit
        WHEN 8 THEN (tr_full->>i)::int::bit(3)::varbit
        WHEN 4 THEN (tr_full->>i)::int::bit(2)::varbit
        END;
    END LOOP;
  END IF;
  IF blk[2] >'' THEN
    n = (tr_hdig->blk[2]->>0)::int;
    ret := ret || CASE n
      WHEN 1 THEN (tr_hdig->blk[2]->>1)::int::bit(1)::varbit
      WHEN 2 THEN (tr_hdig->blk[2]->>1)::int::bit(2)::varbit
      WHEN 3 THEN (tr_hdig->blk[2]->>1)::int::bit(3)::varbit
      END;
  END IF;
  RETURN ret;
  END
$f$ LANGUAGE PLpgSQL IMMUTABLE;
-- select sizednat.strbh_to_vbit('f3V',16);


CREATE or replace FUNCTION sizednat.jinfo_term(
  p_term text,
  p_tg text DEFAULT 'base_label'
) RETURNS jsonb AS $f$
  SELECT CASE
     WHEN t.kx_aliasto IS NOT NULL THEN (
       select info
       from sizednat.term
       where id=t.kx_aliasto
     )
     ELSE info
     END
  FROM (
    select kx_aliasto, info
    from sizednat.term
    where tgroup=$2 AND term=$1 -- need lower(x) for both
  ) t
$f$ LANGUAGE SQL IMMUTABLE;


CREATE or replace FUNCTION sizednat.str_to_vbit(
  p_val text,  -- input
  p_base text DEFAULT '4h' -- selecting base2h, base4h, base8h, or base16h.
) RETURNS varbit AS $f$
DECLARE
  parts text[];
  base int;
  info jsonb;
  tr_full jsonb;
  blk text[];
  ch char;
  ret varbit;
BEGIN
  parts := regexp_match(lower(p_base),'^(?:base\-?|b\-?)?(([0-9]+)([^0-9].*)?)$');
  IF parts IS NULL OR NOT(parts[2]>'0') THEN
    RETURN NULL;
  ELSE
    base := parts[2]::int;
    IF parts[3]='h' AND base IN (4,8,16) THEN
      RETURN sizednat.strbh_to_vbit(p_val,base);
    ELSE  -- get definition, validate and solve
      info := sizednat.jinfo_term(parts[1],'base_label');
      IF info IS NULL OR NOT(info?'kx_tr') OR base!=(info->>'base')::int THEN
        RETURN NULL;
      ELSE
        tr_full := info->'kx_tr';
        blk := regexp_match( p_val, info->>'regex' ); -- validate
        -- RAISE NOTICE ' val=%, regex=%, %', p_val, info->>'regex',blk::text;
        ret := '';
        IF blk[1] >'' THEN
          FOREACH ch IN ARRAY regexp_split_to_array(blk[1],'') LOOP
            ret := ret || CASE base
              WHEN 64 THEN (tr_full->>ch)::int::bit(6)::varbit
              WHEN 32 THEN (tr_full->>ch)::int::bit(5)::varbit
              WHEN 16 THEN (tr_full->>ch)::int::bit(4)::varbit
              WHEN 8 THEN (tr_full->>ch)::int::bit(3)::varbit
              WHEN 4 THEN (tr_full->>ch)::int::bit(2)::varbit
              END;
          END LOOP;
        ELSE
          -- RAISE NOTICE ' val=%, regex=%', p_val, info->>'regex';
          return NULL; --b'011'::varbit;
        END IF;
        RETURN ret;
      END IF; -- info
    END IF; -- parts[3]
  END IF; -- parts  null
END
$f$ LANGUAGE PLpgSQL IMMUTABLE;
-- SELECT sizednat.str_to_vbit('f3V','16h'), sizednat.str_to_vbit('f3','16js');

---------------------------
---------------------------
---------------------------
--- hbig_*() LIB  + cating functions hbig_to_*() and *_to_hbig()
--- Uses direct bigint (62 bits) with 2 hidden bits encapsulatting SizedNatural.

CREATE FUNCTION sizednat.vbit_to_hbig(p varbit) RETURNS bigint AS $f$
  SELECT varbit_to_bigint(b'01' || $1)
  --SELECT CASE  WHEN blen>62 OR blen<1 THEN NULL::bigint
  --  ELSE  sizednat.vbit_to_bigint(b'1' || $1)  END
  --FROM (SELECT bit_length($1)) t(blen)
$f$ LANGUAGE SQL IMMUTABLE;

CREATE FUNCTION sizednat.vbit_to_hbig(p text) RETURNS bigint AS $wrap$
  SELECT sizednat.vbit_to_hbig(p::varbit)
$wrap$ LANGUAGE SQL IMMUTABLE;

CREATE FUNCTION sizednat.hbig_to_vbit(p bigint) RETURNS varbit AS $f$
  SELECT substring(
    $1::bit(64) FROM (66 - bigint_usedbits($1)) -- (65-1=64 to 65-64=1)
  ) WHERE $1>7 AND $1<4611686018427387904
$f$ LANGUAGE SQL IMMUTABLE;


CREATE FUNCTION sizednat.pair_to_hbig(
  n int,  -- num. of bits
	v bigint -- 64 bit value
) RETURNS bigint AS $f$
  SELECT sizednat.vbit_to_hbig(  substring(v::bit(64) FROM 65-n)  )
$f$ LANGUAGE SQL IMMUTABLE;

CREATE FUNCTION sizednat.hbig_to_str(
  p_val bigint,  -- input
  p_base text DEFAULT '4h'
) RETURNS text AS $wrap$
  SELECT sizednat.vbit_to_str(sizednat.hbig_to_vbit($1),$2)
$wrap$ LANGUAGE SQL IMMUTABLE;
-- select sizednat.hbig_toString(7999999999999949993,'16h'), sizednat.hbig_toString(80,'4h');



---------------------------
---------------------------
---------------------------
--- BIGINT LIB
--- for internal calculations, commom for sizednat.pair*() and sizednat.hidbit*()


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


CREATE FUNCTION sizednat.num_base_decode(
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
$f$ LANGUAGE SQL IMMUTABLE;


CREATE FUNCTION sizednat.numpair_base_decode(
  p_val text,
  p_base int, -- from 2 to 36
  p_alphabet text = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
) RETURNS sizednat.numpair
AS $f$
  SELECT round(log(2,p_base)*length($1))::smallint, sizednat.num_base_decode($1,$2,$3)
$f$ LANGUAGE SQL IMMUTABLE;
-- eg. select * from sizednat.numpair_base_decode('77GHIJKL99999999999999999999999999999',32);


-----------------
-----------------
-----------------
-----------------
-- ASSERTS: TESTING IMPLEMENTED FUNCTIONS:

DO $assert_sec$
begin
ASSERT
  (  -- check that is reversible
   SELECT bool_and(res=y AND res is not null AND y is not null)
   FROM (
     SELECT  sizednat.hbig_to_vbit(y2) res, y
     FROM (
       SELECT sizednat.vbit_to_hbig(y::varbit) y2, y
       FROM generate_series(0,512) t(x),
       LATERAL unnest( array[x::bit(9), (random()*2305843009213693950.0)::bigint::bit(61)] )  y
     ) t2
   ) t3
 ),
 'something wrong with hbig_to_vbit or vbit_to_hbig functions'
;
end;
$assert_sec$;

----------------------
--------- AUXILIAR (for metadata records)

CREATE or replace FUNCTION sizednat.term_kx_refresh() RETURNS void AS $f$
  UPDATE sizednat.term u
  SET kx_aliasTo=(
      SELECT id
      FROM sizednat.term t
      WHERE t.tgroup=u.tgroup AND t.term=u.info->>'isAlias'
    )
  WHERE info?'isAlias';

  UPDATE sizednat.term
  SET info = info || jsonb_build_object(
    -- 'regex',trim(info->>'regex','/'),  -- perigo refazer?
    'kx_tr',(
    SELECT  jsonb_object_agg(d,i-1)
    FROM regexp_split_to_table(info->>'alphabet','') WITH ORDINALITY t1(d,i)
  ))  -- replace kx_tr when exists
  WHERE tgroup='base_label' AND not((info->>'isHierar')::boolean)
  ; -- select term, (select count(*) from jsonb_object_keys(info->'kx_tr')) from sizednat.term;
$f$ LANGUAGE SQL;
