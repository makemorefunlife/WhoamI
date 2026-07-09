-- Rename legacy Primary Axis key `control` → `structure` in stored survey JSON
-- Canonical keys: autonomy, connection, stability, growth, structure, adaptability

update public.survey_responses
set answers = jsonb_set(
  answers,
  '{v2_profile,primary_axes}',
  (
    coalesce(answers->'v2_profile'->'primary_axes', '{}'::jsonb) - 'control'
  ) || case
    when answers->'v2_profile'->'primary_axes' ? 'control'
    then jsonb_build_object(
      'structure',
      answers->'v2_profile'->'primary_axes'->'control'
    )
    else '{}'::jsonb
  end
)
where answers->'v2_profile'->'primary_axes' ? 'control';
