/**
 * Public LIB (adding or updating commom functions for general use)
 */

create or replace function hex_to_varbit(h text) RETURNS varbit as $f$
  SELECT ('X' || $1)::varbit
$f$ LANGUAGE SQL IMMUTABLE;


CREATE or replace FUNCTION varbit_to_int(
  -- ugly cast! please upgrade PostgreSQL. Here a workaround for bit(1)...bit(8)
  v varbit,  -- input
  len int     -- number of bits, from 1 to 6
) RETURNS int AS $f$
  SELECT CASE len
    WHEN 1 THEN v::bit(1)::int
    WHEN 2 THEN v::bit(2)::int
    WHEN 3 THEN v::bit(3)::int
    WHEN 4 THEN v::bit(4)::int
    WHEN 5 THEN v::bit(5)::int
    WHEN 6 THEN v::bit(6)::int
    WHEN 7 THEN v::bit(7)::int
    ELSE v::bit(8)::int
  END
$f$ LANGUAGE SQL IMMUTABLE;

CREATE or replace FUNCTION varbit_to_int(v varbit) RETURNS int AS $wrap$
  SELECT   varbit_to_int(v,bit_length(v))
$wrap$ LANGUAGE SQL IMMUTABLE;

------

/*
create or replace function varbit_to_hex(b varbit) returns text as $f$
  -- bets for varbit is to use base16h instead hex, see vbit_toString
  -- see https://tapoueh.org/blog/2010/08/playing-with-bit-strings/
  select array_to_string(array_agg(to_hex((b << (32*o))::bit(32)::bigint)), '')
  from (
      select b, generate_series(0, n-1) as o
      from (
        select $1, octet_length($1)/4) as t(b, n)
  ) t2
$f$ LANGUAGE SQL IMMUTABLE;

*/
