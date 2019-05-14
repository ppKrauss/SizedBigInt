---------------
---------------
--- TESTS

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


CREATE or replace FUNCTION sizednat.test_hidbig_to_vbit(p bigint) RETURNS varbit AS $f$
  -- See art1.pdf, testing alternative algorithm A4L. 
  SELECT substring(
    $1::bit(64) FROM  2  FOR  62-sizednat.bigint_rightmost_bitpos($1)
  )
$f$ LANGUAGE SQL IMMUTABLE STRICT;

