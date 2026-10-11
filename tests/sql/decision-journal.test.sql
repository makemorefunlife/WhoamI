-- Decision Journal server storage (20261011150000). Throwaway DB only.
do $$
declare a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); i int;
begin
  -- free allowance: cap 2 for the test
  assert create_decision_journal_entry('user_1', jsonb_build_object('id', a, 'category', 'work', 'context', 'c1', 'situation', 's', 'decision', 'c1'), 2, false) = 'created';
  assert create_decision_journal_entry('user_1', jsonb_build_object('id', a, 'category', 'work', 'context', 'c1'), 2, false) = 'exists', 'same id once';
  assert create_decision_journal_entry('user_1', jsonb_build_object('id', gen_random_uuid(), 'category', 'work', 'context', 'c2'), 2, false) = 'created';
  assert create_decision_journal_entry('user_1', jsonb_build_object('id', gen_random_uuid(), 'category', 'work', 'context', 'c3'), 2, false) = 'cap_reached';
  assert create_decision_journal_entry('user_1', jsonb_build_object('id', gen_random_uuid(), 'category', 'work', 'context', 'c3'), 2, true) = 'created', 'unlimited';
  raise notice 'ok - new entries respect the free allowance (unlimited with a pass)';

  -- device import: no duplicates, never overwrites, kept above the allowance
  i := import_decision_journal_entries('user_1', jsonb_build_array(
    jsonb_build_object('id', a, 'category', 'work', 'context', 'DEVICE COPY', 'status', 'pending'),
    jsonb_build_object('id', b, 'category', 'love', 'context', 'old', 'status', 'reviewed', 'rating', 4, 'note', 'n',
                       'created_at', '2026-01-01T00:00:00Z', 'updated_at', '2026-01-02T00:00:00Z')));
  assert i = 1, 'only the new one';
  assert (select context from decision_journal_entries where id = a) = 'c1', 'existing row not overwritten';
  assert (select status || rating || imported_from from decision_journal_entries where id = b) = 'reviewed4device', 'review kept';
  assert (select created_at from decision_journal_entries where id = b) = '2026-01-01T00:00:00Z', 'original date kept';
  assert import_decision_journal_entries('user_1', jsonb_build_array(jsonb_build_object('id', b, 'category', 'x', 'context', 'y'))) = 0, 're-import is a no-op';
  assert import_decision_journal_entries('user_2', jsonb_build_array(jsonb_build_object('id', b, 'category', 'x', 'context', 'y'))) = 0, 'another account cannot take it';
  assert (select clerk_user_id from decision_journal_entries where id = b) = 'user_1';
  raise notice 'ok - device records move in once, never overwrite, never cross accounts';
end $$;
