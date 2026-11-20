-- 원칙 4번 (ADR-021): 배운 날 틀린 문제를 맞힐 때까지 다시 묻고, 지연 확인에서 틀리면 그날 다시 배운다.
-- 다시 푼 답이 기록(정답률·확신도별 정답률)을 부풀리지 않도록, 답마다 첫 시도인지 남긴다.
-- first_attempt: 레슨 답은 이 사용자가 이 문제를 처음 푼 답일 때만 true. 지연 확인 답은 늘 true(그날의 측정).
--   연습(PRACTICE: 끝낸 레슨 다시 풀기, 지연 확인 오답 뒤 다시 배우기) 답은 false
alter table answer_submission add column first_attempt boolean not null default true;

-- 이미 있는 레슨 답 가운데 같은 문제를 두 번째 이후로 푼 답은 첫 시도가 아니다
update answer_submission s
set first_attempt = false
from (
    select s2.id,
           row_number() over (partition by s2.user_id, v.question_id order by s2.submitted_at, s2.id) as rn
    from answer_submission s2
    join question_version v on v.id = s2.question_version_id
    where not s2.is_delayed_check
) ranked
where ranked.id = s.id and ranked.rn > 1;
