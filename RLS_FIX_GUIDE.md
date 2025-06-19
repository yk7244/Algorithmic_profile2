# explore_watch_history RLS 정책 수정 가이드

## 문제상황
다른 사람 무드보드에서 "시청함" 버튼을 클릭할 때 다음과 같은 오류가 발생합니다:
```
POST https://your-supabase-url/rest/v1/explore_watch_history 403 (Forbidden)
new row violates row-level security policy for table "explore_watch_history"
```

## 해결방법

### 1. Supabase 대시보드 접속
1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 해당 프로젝트 선택

### 2. SQL Editor 접속
1. 왼쪽 메뉴에서 "SQL Editor" 클릭
2. "New query" 버튼 클릭

### 3. SQL 스크립트 실행
`fix_explore_watch_history_rls.sql` 파일의 내용을 복사해서 SQL Editor에 붙여넣고 실행합니다.

### 4. 실행 순서
1. 전체 스크립트를 복사
2. SQL Editor에 붙여넣기
3. "Run" 버튼 클릭
4. 오류 없이 실행되면 완료

### 5. 테스트
1. 웹사이트로 돌아가서 새로고침
2. 다른 사람 무드보드에서 "시청함" 버튼 클릭
3. 오류 없이 실행되고 my_page 시청기록에 표시되는지 확인

## 참고사항
- 이 스크립트는 `explore_watch_history` 테이블의 RLS 정책만 수정합니다
- 사용자는 자신의 시청기록만 생성/조회/수정/삭제할 수 있습니다
- 다른 사용자의 시청기록은 볼 수 없습니다

## 문제가 계속되는 경우
1. 브라우저 개발자 도구 콘솔에서 `window.debugMyPageWatchHistory()` 실행
2. 콘솔 로그를 확인해서 어떤 데이터가 로드되는지 확인
3. localStorage에 데이터가 저장되고 있는지 확인 