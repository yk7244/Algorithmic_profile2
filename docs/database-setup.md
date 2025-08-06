# 🗄️ TubeLens 데이터베이스 설정 가이드

## 📋 개요

이 가이드는 TubeLens 앱을 위한 Supabase 데이터베이스 설정 방법을 설명합니다.

## 🚀 빠른 설정

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 로그인
2. "New Project" 클릭
3. 프로젝트 설정:
   - **Name**: `tubelens-production` (또는 원하는 이름)
   - **Database Password**: 안전한 비밀번호 생성
   - **Region**: `Northeast Asia (Seoul)` 선택 (한국 사용자 대상)

### 2. 데이터베이스 스키마 적용

**Supabase Dashboard > SQL Editor**에서 다음 파일의 내용을 실행:

```sql
-- lib/database-schema.sql 파일의 전체 내용을 복사하여 실행
```

⚠️ **주의**: 스키마를 순서대로 실행해주세요. 테이블 간 의존성이 있습니다.

### 3. OAuth 공급자 설정

**Settings > Authentication > Providers**에서:

#### Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **APIs & Services > Credentials** 이동
4. **+ CREATE CREDENTIALS > OAuth 2.0 Client IDs** 클릭
5. 설정:
   - **Application type**: Web application
   - **Name**: TubeLens
   - **Authorized redirect URIs**: 
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     ```
6. 생성된 Client ID와 Client Secret을 Supabase에 입력

#### GitHub OAuth
1. [GitHub Settings](https://github.com/settings/developers) 접속
2. **OAuth Apps > New OAuth App** 클릭
3. 설정:
   - **Application name**: TubeLens
   - **Homepage URL**: `https://your-domain.com`
   - **Authorization callback URL**: 
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     ```
4. 생성된 Client ID와 Client Secret을 Supabase에 입력

### 4. 환경변수 설정

`.env.local` 파일 생성:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# External APIs (기존 유지)
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-key
NEXT_PUBLIC_GOOGLE_API_KEY=your-google-key
NAVER_CLIENT_ID=your-naver-id
NAVER_CLIENT_SECRET=your-naver-secret
GOOGLE_APPLICATION_CREDENTIALS=path/to/google-credentials.json
```

## 📊 데이터베이스 구조

### 핵심 테이블

| 테이블 | 용도 | 관계 |
|--------|------|------|
| `users` | 사용자 기본 정보 | Auth 기본 테이블 확장 |
| `profiles` | AI 생성 프로필 | users (1:N) |
| `watch_history` | 유튜브 시청 기록 | users (1:N), videos (N:1) |
| `cluster_analysis` | AI 클러스터 분석 결과 | users (1:N), profiles (N:1) |
| `image_data` | 무드보드 이미지 데이터 | users (1:N), cluster_analysis (N:1) |
| `moodboard_history` | 무드보드 변경 이력 | users (1:N) |
| `reflections` | 사용자 피드백/설문 | users (1:1) |

### 지원 테이블

| 테이블 | 용도 |
|--------|------|
| `videos` | YouTube 비디오 메타데이터 캐싱 |
| `thumbnail_cache` | 이미지 검색 결과 캐싱 |

## 🔒 보안 정책 (RLS)

모든 테이블에 Row Level Security가 적용되어 있습니다:

- **개인 데이터**: 사용자는 자신의 데이터만 접근 가능
- **공개 데이터**: `open_to_connect=true`인 사용자의 프로필/이미지는 공개
- **캐시 테이블**: 모든 사용자가 읽기 가능

## 🚀 성능 최적화

### 인덱스

주요 쿼리 패턴에 대한 인덱스가 설정되어 있습니다:

- 사용자별 데이터 조회
- 시간순 정렬
- 키워드 검색
- 활성 프로필 조회

### 캐싱

- **비디오 메타데이터**: YouTube API 호출 최소화
- **썸네일 이미지**: 이미지 검색 결과 30일간 캐싱
- **자동 정리**: 매일 자정 오래된 캐시 데이터 삭제

## 🧪 테스트 데이터 삽입

개발/테스트를 위한 샘플 데이터:

```sql
-- 테스트 사용자 생성 (실제 OAuth 로그인 후 수동 삽입)
INSERT INTO public.users (id, email, nickname, provider, background_color) VALUES 
('test-user-id', 'test@example.com', '테스트사용자', 'google', '#6366f1');

-- 테스트 프로필 생성
INSERT INTO public.profiles (user_id, nickname, main_description) VALUES 
('test-user-id', 'AI 생성 별명', 'AI가 생성한 설명입니다.');
```

## 🔧 마이그레이션

기존 localStorage 데이터를 데이터베이스로 마이그레이션하는 스크립트는 별도로 제공됩니다.

## 📈 모니터링

### 주요 메트릭

- **사용자 등록 수**: `SELECT COUNT(*) FROM users`
- **활성 프로필 수**: `SELECT COUNT(*) FROM profiles WHERE is_active = true`
- **일별 분석 수**: `SELECT DATE(created_at), COUNT(*) FROM cluster_analysis GROUP BY DATE(created_at)`

### 성능 모니터링

Supabase Dashboard에서 확인:
- 쿼리 성능
- 저장소 사용량
- API 요청 수

## ❓ 문제 해결

### 일반적인 문제

1. **RLS 정책 오류**: 사용자 인증 상태 확인
2. **외래 키 제약 조건**: 참조 테이블에 데이터 존재 여부 확인
3. **JSON 데이터 오류**: 스키마 검증 후 삽입

### 로그 확인

```sql
-- 최근 오류 로그 확인
SELECT * FROM auth.audit_log_entries 
WHERE created_at > NOW() - INTERVAL '1 hour' 
ORDER BY created_at DESC;
```

## 🔄 백업 및 복구

### 정기 백업

Supabase는 자동 백업을 제공하지만, 중요한 데이터는 별도 백업 권장:

```bash
# pg_dump를 사용한 백업
pg_dump "postgresql://postgres:[password]@[host]:5432/postgres" > backup.sql
```

### 복구

```bash
# 백업 파일에서 복구
psql "postgresql://postgres:[password]@[host]:5432/postgres" < backup.sql
```

---

## 🎯 다음 단계

1. ✅ 데이터베이스 스키마 설정
2. ⏳ API 엔드포인트 구현
3. ⏳ localStorage → DB 마이그레이션
4. ⏳ 실시간 기능 구현

설정 중 문제가 발생하면 Supabase 공식 문서를 참조하거나 지원팀에 문의하세요.