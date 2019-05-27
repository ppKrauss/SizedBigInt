/**
 * Public LIB (adding or updating commom functions for general use)
 */

CREATE or replace FUNCTION hex_to_varbit(h text) RETURNS varbit as $f$
  SELECT ('X' || $1)::varbit
$f$ LANGUAGE SQL IMMUTABLE;


------------------------
------------------------
-- Workarounds for postgresqt cast ...

CREATE or replace FUNCTION varbit_to_int( b varbit, blen int DEFAULT NULL) RETURNS int AS $f$
  SELECT (  (b'0'::bit(32) || b) << COALESCE(blen,bit_length(b))   )::bit(32)::int
$f$ LANGUAGE SQL IMMUTABLE;
-- select b'010101'::bit(32) left_copy, varbit_to_int(b'010101')::bit(32) right_copy;

CREATE OR REPLACE FUNCTION varbit_to_bigint( b varbit )
RETURNS bigint AS $f$
  -- see https://stackoverflow.com/a/56119825/287948
  SELECT ( (b'0'::bit(64) || b) << bit_length(b) )::bit(64)::bigint
$f$  LANGUAGE SQL IMMUTABLE;

CREATE or replace FUNCTION bigint_usedbits( b bigint ) RETURNS int AS $f$
-- max bit_length(b) = 61!
-- LOSS of 1 bit, cant use negative neither b>4611686018427387904
  -- time_performance ~0.25 * time_performance of floor(log(2.0,x)).
  SELECT 63 - x
  FROM generate_series(1,62) t1(x)  -- stop ith 61?
  -- constant = b'01'::bit(64)::bigint
  WHERE ( 4611686018427387904 & (b << x) ) = 4611686018427387904
  -- not use! constant = b'1'::bit(64)::bigint
  -- WHERE ( -9223372036854775808 & (b << x) ) = -9223372036854775808
  LIMIT 1
$f$ LANGUAGE SQL IMMUTABLE;
