-- TASK-007 — the seeded sample archive.
--
-- ENTIRELY FICTIONAL data. No real family data enters the repo (NFR-PRIV-05).
--
-- This archive stages the exact demo situation: one recollection saying 1972, one photograph
-- with 1974 written on the back. After loading, v_open_disagreement must return exactly one row.
--
-- NOTE: seeding must run through src/seed/loadSeed.ts (that is, through the command layer),
-- never as raw INSERTs. This file holds the content; loadSeed.ts decides the order of commands.
-- If a constraint blocks the seed, either the constraint is wrong or the seed is — do not relax
-- the constraint to make seeding work.

-- people
-- 'Bà ngoại'   (Grandma)    the subject of the story
-- 'Cậu Ba'     (Uncle Ba)   the person who can confirm
-- 'Mẹ'         (Mother)     the person recounting

-- places
-- 'Hội An', 'Đà Nẵng'

-- claim 1  : Grandma moved_to Đà Nẵng, year_value 1972, year_precision 'circa', certainty 'oral'
-- source 1 : oral_account, contributor = Mother,
--            verbatim 'Bà ngoại lên Đà Nẵng khoảng năm 1972, mở một tiệm may.'
--            ("Grandma moved up to Đà Nẵng around 1972 and opened a tailor shop.")
-- evidence : claim 1 <- source 1, stance 'supports'

-- claim 2  : Grandma moved_to Đà Nẵng, year_value 1974, year_precision 'exact'
-- source 2 : photo, title 'Ảnh tiệm may' (tailor shop photograph),
--            verbatim 'mặt sau ghi 1974' (1974 written on the back)
-- evidence : claim 2 <- source 2, stance 'supports'
-- evidence : claim 1 <- source 2, stance 'contradicts'   <- this is where the disagreement is born
