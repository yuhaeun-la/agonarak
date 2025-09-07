# 아고나락 - 독서 모임 관리 시스템

독서 모임을 위한 종합 관리 시스템입니다. 멤버 관리부터 독서 노트까지, 독서 모임 운영에 필요한 모든 기능을 제공합니다.

## 🚀 주요 기능

### ✅ 구현 완료
- **대시보드**: 모임 현황 통계 및 개요
- **멤버 관리**: 멤버 추가/수정/탈퇴, 역할 관리 (리더/일반)
- **반응형 UI**: 모바일과 데스크톱 환경 지원
- **간단한 구조**: 별도 인증 없이 바로 사용 가능

### 🔄 개발 예정
- **모임 일정 관리**: 날짜/시간/장소/메모 관리
- **책 관리**: 책 정보, 독서 노트, 파일 첨부
- **참석 여부 관리**: 멤버별 참석/불참/미정 상태
- **장르 관리**: 장르 목록 CRUD, 다중 태그 지원
- **통계 및 리포트**: 
  - 개인별 선호 장르 Top N
  - 개인별 월간/분기별 독서량
  - 모임별 참석률
  - 작가/출판사 Top N
- **검색 및 필터**: 날짜/멤버/장르/저자 기준 검색

## 🛠 기술 스택

### Frontend
- **Next.js 15** (App Router)
- **React 19** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **TanStack Query** (데이터 패칭/캐싱)

### Backend
- **Prisma ORM** (데이터베이스)
- **SQLite** (개발환경)

### 개발 도구
- **ESLint** + **Prettier** (코드 품질)
- **Vitest** (단위 테스트)
- **Playwright** (E2E 테스트)
- **Husky** (Git hooks)

## 📋 데이터베이스 스키마

### 주요 모델
- **Club**: 독서 모임 정보
- **Member**: 모임 멤버 (역할: LEADER/MEMBER, 닉네임, 연락처)
- **Meeting**: 모임 일정
- **Book**: 책 정보
- **Genre**: 장르/분야 정보
- **Attendance**: 참석 여부
- **ReadingNote**: 독서 노트

### 권한 시스템
- **리더**: 구조적 변경 권한 (멤버 관리, 장르 편집, 모임 생성)
- **일반 멤버**: 개인 독서 노트 작성, 참석 여부 변경

## 🚀 시작하기

### 필요 조건
- Node.js 18 이상
- npm 또는 yarn

### 설치 및 실행

1. **저장소 클론**
   ```bash
   git clone https://github.com/your-username/agonarak.git
   cd agonarak
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   
   `.env.local` 파일을 생성하여 다음 변수를 설정하세요:
   ```env
   DATABASE_URL="file:./dev.db"
   ```

4. **데이터베이스 설정**
   ```bash
   npm run db:push
   npm run db:generate
   ```

5. **개발 서버 실행**
   ```bash
   npm run dev
   ```

6. **브라우저에서 확인**
   
   http://localhost:3000 에서 애플리케이션을 확인할 수 있습니다.

## 📝 사용 가능한 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 린트 검사
npm run lint

# 타입 검사
npm run type-check

# 단위 테스트 실행
npm run test

# E2E 테스트 실행
npm run test:e2e

# 데이터베이스 관리
npm run db:generate    # Prisma 클라이언트 생성
npm run db:push        # 스키마를 데이터베이스에 적용
npm run db:studio      # Prisma Studio 실행

# 코드 포맷팅
npm run format         # 코드 포맷팅 적용
npm run format:check   # 포맷팅 검사
```

## 🗂 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── auth/              # 인증 관련 페이지
│   ├── dashboard/         # 대시보드
│   ├── members/           # 멤버 관리
│   ├── meetings/          # 모임 일정 (예정)
│   ├── books/             # 책 관리 (예정)
│   └── api/               # API 라우트
├── components/            # React 컴포넌트
│   ├── ui/                # shadcn/ui 컴포넌트
│   └── layout/            # 레이아웃 컴포넌트
├── lib/                   # 유틸리티 및 설정
│   ├── prisma.ts          # Prisma 클라이언트
│   ├── auth.ts            # NextAuth 설정
│   └── utils.ts           # 유틸리티 함수
└── test/                  # 테스트 설정
```

## 🤝 기여하기

1. 이 저장소를 Fork 합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 Push 합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

## 🐛 버그 리포트 및 기능 요청

버그를 발견하거나 새로운 기능을 제안하고 싶으시다면 [Issues](https://github.com/your-username/agonarak/issues)에서 알려주세요.

## 📞 연락처

프로젝트에 대한 질문이나 제안사항이 있으시면 언제든지 연락주세요.

---

**아고나락**으로 더 체계적이고 즐거운 독서 모임을 만들어보세요! 📚