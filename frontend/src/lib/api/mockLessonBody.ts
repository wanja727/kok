import type { LessonSteps } from "./types";

/** 목 API용 N+1 레슨 본문. 실제 원본은 dev-lessons의 content/questions/jpa-n-plus-1.yaml의 steps다 */
export const nPlusOneSteps: LessonSteps = {
  predict: {
    question: "이 코드가 실행되는 동안 DB에 SQL을 몇 번 보낼까요?",
    text: "팀이 10개 있고, 팀마다 멤버가 여러 명 있어요. 아래 코드는 팀 목록을 가져온 뒤 팀마다 멤버 수를 출력해요. 모르는 게 정상이니 감으로 골라 보세요.",
    code: [
      "List<Team> teams = teamRepository.findAll();",
      "for (Team team : teams) {",
      "    System.out.println(team.getMembers().size());",
      "}",
    ].join("\n"),
    choices: ["1번", "2번", "11번", "20번"],
    answer: 3,
  },
  background: {
    title: "JPA는 객체와 테이블 사이의 통역사예요",
    text: [
      "자바 코드는 `team.getMembers()`처럼 객체를 따라가요. 실제 데이터는 DB 테이블에 있어서, JPA가 코드가 데이터를 필요로 하는 순간 SQL을 대신 만들어 보내요.",
      "연관된 데이터를 언제 가져올지는 로딩 전략이 정해요. **지연 로딩(LAZY)**은 팀만 가져오고 멤버 자리에는 \"나중에 채울 빈 상자\"를 넣어 둬요. 상자를 처음 열 때(`size()`, 반복문) 그제서야 SQL을 보내요. **즉시 로딩(EAGER)**은 팀을 가져오자마자 멤버도 채워요.",
      "SQL을 한 번 보낼 때마다 DB와 네트워크 왕복이 한 번 생겨요. N+1은 이 쿼리 수가 데이터 개수에 비례해 늘어나는 문제예요.",
    ].join("\n\n"),
    code: [
      "@Entity",
      "class Team {",
      "    @Id Long id;",
      "    String name;",
      '    @OneToMany(mappedBy = "team")   // 컬렉션은 기본값이 LAZY',
      "    List<Member> members;",
      "}",
    ].join("\n"),
    codeNote: null,
    flow: null,
    alternatives: null,
    quiz: {
      question: "LAZY로 둔 members는 언제 SQL을 보낼까요?",
      choices: ["팀을 조회할 때 함께", "members를 처음 열 때", "트랜잭션이 끝날 때"],
      answer: 2,
    },
    recall: null,
  },
  practice: {
    title: "쿼리를 직접 세어 봐요",
    text: "예측 단계의 코드를 실제 PostgreSQL에서 돌리고, 나간 SQL을 셌어요. 결과를 먼저 예상하고 눌러서 확인해요.",
    code: [
      "List<Team> teams = teamRepository.findAll();   // 팀 10개",
      "for (Team team : teams) {",
      "    team.getMembers().size();",
      "}",
    ].join("\n"),
    runs: [
      {
        call: "LAZY · 멤버에 접근",
        note: "위 코드 그대로",
        choices: ["1번", "2번", "11번"],
        answer: 3,
        output: "11번 · 팀 목록 1번 + 팀마다 멤버 1번씩 10번",
      },
      {
        call: "LAZY · 멤버에 접근하지 않음",
        note: "반복문을 지우고 팀만 조회",
        choices: ["1번", "11번"],
        answer: 1,
        output: "1번 · 상자를 열지 않으면 쿼리도 나가지 않아요",
      },
      {
        call: "EAGER · 팀만 조회",
        note: "members를 FetchType.EAGER로 바꾸고 반복문 없이",
        choices: ["1번", "11번"],
        answer: 2,
        output: "11번 · EAGER로 바꿔도 그대로예요",
      },
    ],
    after: "목록 1번에 팀마다 1번씩, 그래서 1 + N이에요. EAGER로 바꿔도 줄지 않은 이유는 다음 단계에서 봐요.",
  },
  pitfall: {
    title: "EAGER는 쿼리 시점을 앞당길 뿐이에요",
    text: [
      "`findAll()`은 안에서 JPQL을 만들어 실행해요. JPQL은 적힌 그대로 SQL로 번역돼서, 처음에는 팀만 조회해요. EAGER 연관은 그 다음에 팀마다 따로 채워요.",
      "그래서 EAGER는 쿼리 수를 줄이지 못해요. 게다가 멤버가 필요 없는 화면에서도 늘 함께 읽어 와요. 실무에서는 연관관계를 모두 LAZY로 두고, 필요한 곳에서만 한꺼번에 가져와요.",
    ].join("\n\n"),
    code: null,
    codeNote: null,
    flow: [
      "teamRepository.findAll() 호출",
      "JPQL `select t from Team t`를 SQL로 번역해 팀만 조회 (1번)",
      "팀 10개가 영속성 컨텍스트에 올라옴",
      "EAGER 설정을 보고 팀마다 멤버를 조회 (10번)",
    ],
    alternatives: null,
    quiz: null,
    recall: {
      prompt: "EAGER로 바꿔도 N+1이 사라지지 않는 이유를 한 문장으로 말해 보세요.",
      answer: "JPQL이 팀만 조회하는 SQL로 먼저 번역되고, EAGER 연관은 그 뒤에 팀마다 따로 채우기 때문이에요.",
    },
  },
  fix: {
    title: "필요한 데이터를 한꺼번에 가져와요",
    text: '해결의 핵심은 "이 화면에서는 멤버도 필요하다"를 조회하는 시점에 JPA에 알려 주는 거예요. 가장 기본은 fetch join이에요.',
    code: ['@Query("select t from Team t left join fetch t.members")', "List<Team> findAllWithMembers();"].join("\n"),
    codeNote: "실제 SQL은 team과 member를 join한 한 번 · 쿼리 1번, 중복 없이 팀 10개",
    flow: null,
    alternatives: [
      {
        title: '@EntityGraph(attributePaths = "members")',
        note: "선언형 fetch join이에요. findAll() 같은 기본 메서드에도 붙일 수 있어요. 쿼리 1번",
      },
      {
        title: "배치 페치 (default_batch_fetch_size)",
        note: "LAZY는 그대로 두고 여러 팀의 멤버를 IN 절로 묶어 가져와요. 1 + ⌈N / 배치 크기⌉번. 페이징과 함께 쓸 수 있어요",
      },
      {
        title: "컬렉션 fetch join에 페이징을 걸면",
        note: "DB에서 자르지 못하고 전체 행을 메모리로 가져와 잘라요(HHH90003004 경고). 이때는 팀만 페이징하고 멤버는 배치 페치로 가져와요",
      },
    ],
    quiz: null,
    recall: {
      prompt: "fetch join으로 쿼리가 1번으로 줄어드는 이유를 한 문장으로 말해 보세요.",
      answer: "팀과 멤버를 join한 SQL 한 번으로 함께 가져와서, 나중에 멤버를 열 때 추가 쿼리가 필요 없기 때문이에요.",
    },
  },
  interview: {
    question: "JPA N+1 문제에 대해 설명해 주세요.",
    points: [
      { label: "정의", text: "목록을 조회하는 쿼리 1번 뒤에, 결과 수 N만큼 연관 엔티티를 조회하는 쿼리가 더 나간다" },
      { label: "원리", text: "JPQL은 적힌 대로 번역되고 연관 로딩은 그 뒤에 따로 일어난다. 그래서 EAGER로 바꿔도 해결되지 않는다" },
      { label: "해결", text: "모두 LAZY로 두고 fetch join이나 @EntityGraph로 한 번에 가져온다. 컬렉션 페이징이 필요하면 배치 페치를 쓴다" },
      { label: "경험", text: "SQL 로그로 쿼리 수를 직접 확인하고 줄인 내 프로젝트 사례를 덧붙인다" },
    ],
  },
};
