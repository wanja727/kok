-- 레슨 본문 7단계 (콘텐츠 파일의 steps). 본문이 아직 없는 레슨은 null이고, 화면은 레슨 사이트로 연결한다
alter table lesson add column body jsonb;
