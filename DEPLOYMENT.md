# 🚀 Vercel 배포 가이드

## 1. 데이터베이스 준비

### Neon (추천)
1. [Neon](https://neon.tech/)에 가입
2. 새 프로젝트 생성
3. PostgreSQL 데이터베이스 생성
4. 연결 문자열 복사

### Supabase
1. [Supabase](https://supabase.com/)에 가입
2. 새 프로젝트 생성
3. Settings > Database에서 연결 문자열 확인

## 2. Vercel 배포

### GitHub 연결
1. GitHub에 코드 푸시
2. [Vercel](https://vercel.com/)에 가입
3. "New Project" 클릭
4. GitHub 레포지토리 선택

### 환경 변수 설정
Vercel Dashboard에서 다음 환경 변수 추가:

```
DATABASE_URL=postgresql://username:password@host:5432/database
```

### 빌드 설정
- Framework Preset: **Next.js**
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

## 3. 배포 후 확인

1. 배포 완료 후 사이트 접속
2. 데이터베이스 마이그레이션 자동 실행 확인
3. 기본 기능 테스트:
   - 멤버 추가
   - 책 등록
   - 모임 생성

## 4. 도메인 설정 (선택사항)

1. Vercel Dashboard > Domains
2. 커스텀 도메인 추가
3. DNS 설정 완료

## 🎯 주요 기능

- ✅ **멤버 관리**: 북클럽 멤버 등록 및 관리
- ✅ **책 관리**: 독서 목록 및 장르별 분류
- ✅ **모임 관리**: 일정 등록 및 참석자 관리
- ✅ **참석률 통계**: 멤버별 모임 참석률 분석
- ✅ **반응형 디자인**: 모바일/데스크톱 최적화

## 🔧 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL, Prisma ORM
- **Deployment**: Vercel
