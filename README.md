# 🏛️ 아고나락 - 독서 모임 관리 시스템

**아고나락**은 독서 모임을 위한 종합 관리 시스템입니다. 멤버 관리부터 독서 기록까지, 독서 모임 운영에 필요한 모든 기능을 제공합니다.

## ✨ 주요 기능

### 📊 **대시보드**
- 모임 현황 및 통계 한눈에 보기
- 다가오는 모임 일정 확인
- 최근 추가된 책 목록
- 고유한 책 수 기준 통계 (중복 제거)

### 👥 **멤버 관리**
- 멤버 추가/수정/삭제
- 역할 관리 (리더/일반 멤버)
- 실시간 참석률 통계 (지난 모임 기준)
- 연락처 관리

### 📅 **모임 일정 관리**
- 모임 생성/수정/삭제
- 날짜, 시간, 장소, 메모 관리
- 참석자 선택 및 관리
- 참여 인원 실시간 표시

### 📚 **책 관리**
- 책 추가/수정/삭제 (여러 멤버 동시 등록 가능)
- 제목, 저자, 등록일, 장르, 메모 관리
- 멤버별 독서 내역 상세 페이지
- 멤버별 장르 통계 및 선호도 분석
- 같은 책 재독/중복 등록 지원

### 🎯 **고급 기능**
- **고유한 책 통계**: 같은 책 여러 번 등록해도 1권으로 카운트
- **지난 모임 기준 참석률**: 미래 모임 제외한 정확한 참석률
- **멤버별 독서 분석**: 개인 독서 패턴 및 선호 장르 분석
- **반응형 디자인**: 모바일/태블릿/데스크톱 완벽 지원

## 🛠 기술 스택

### **Frontend**
- **Next.js 15** (App Router) + **React 19**
- **TypeScript** (타입 안정성)
- **Tailwind CSS** + **shadcn/ui** (모던 UI)
- **TanStack Query** (서버 상태 관리)
- **Lucide React** (아이콘)

### **Backend**
- **Prisma ORM** (타입 안전한 데이터베이스 접근)
- **PostgreSQL** (Neon.tech - 프로덕션)
- **SQLite** (로컬 개발)
- **Next.js API Routes** (서버리스 API)

### **개발 도구**
- **ESLint** + **Prettier** (코드 품질)
- **Vitest** (단위 테스트)
- **Playwright** (E2E 테스트)
- **Husky** (Git hooks)

### **배포**
- **Vercel** (프로덕션 배포)
- **Neon.tech** (PostgreSQL 데이터베이스)

## 🗄️ 데이터베이스 스키마

```prisma
// 주요 모델들
model Club {
  id          String   @id @default(cuid())
  name        String   // "아고나락"
  description String?
  members     Member[]
  books       Book[]
  meetings    Meeting[]
  genres      Genre[]
}

model Member {
  id       String     @id @default(cuid())
  nickname String
  role     MemberRole @default(MEMBER) // LEADER | MEMBER
  contact  String?
  isActive Boolean    @default(true)
  
  // 관계
  books        Book[]
  attendances  Attendance[]
  readingNotes ReadingNote[]
}

model Meeting {
  id          String    @id @default(cuid())
  title       String
  date        DateTime
  location    String?
  memo        String?
  
  // 관계
  books       MeetingBook[]
  attendances Attendance[]
}

model Book {
  id             String   @id @default(cuid())
  title          String
  author         String
  notes          String?
  registeredDate DateTime
  
  // 관계 (같은 책 여러 번 등록 가능)
  addedBy      Member?
  genres       BookGenre[]
  meetingBooks MeetingBook[]
}
```

## 🚀 빠른 시작

### **필요 조건**
- Node.js 18 이상
- npm 또는 yarn

### **로컬 개발 설정**

1. **저장소 클론**
   ```bash
   git clone https://github.com/yuhaeun-la/agonarak.git
   cd agonarak
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   
   `.env.local` 파일 생성:
   ```env
   # 로컬 개발용 (SQLite)
   DATABASE_URL="file:./dev.db"
   ```

4. **데이터베이스 설정**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **개발 서버 실행**
   ```bash
   npm run dev
   ```

6. **브라우저에서 확인**
   
   http://localhost:3000

### **Vercel 배포**

1. **Neon.tech 데이터베이스 생성**
2. **Vercel 프로젝트 연결**
3. **환경 변수 설정**:
   ```env
   DATABASE_URL="postgresql://..."
   ```
4. **배포 후 마이그레이션**:
   ```bash
   npx prisma db push --accept-data-loss
   ```

자세한 배포 가이드는 [DEPLOYMENT.md](DEPLOYMENT.md)를 참고하세요.

## 📝 사용 가능한 스크립트

```bash
# 개발
npm run dev              # 개발 서버 실행
npm run build            # 프로덕션 빌드
npm start               # 프로덕션 서버 실행

# 코드 품질
npm run lint            # ESLint 검사
npm run format          # Prettier 포맷팅

# 데이터베이스
npx prisma db push      # 스키마 적용
npx prisma generate     # 클라이언트 생성
npx prisma studio       # DB 관리 도구

# 배포 (Vercel)
npm run db:migrate:deploy  # 프로덕션 마이그레이션
```

## 🗂 프로젝트 구조

```
src/
├── app/                     # Next.js App Router
│   ├── api/                # API 라우트
│   │   ├── members/        # 멤버 CRUD API
│   │   ├── meetings/       # 모임 CRUD API
│   │   └── books/          # 책 CRUD API
│   ├── members/            # 멤버 관리 페이지
│   │   └── [id]/books/     # 멤버별 독서 내역
│   ├── meetings/           # 모임 관리 페이지
│   ├── books/              # 책 관리 페이지
│   └── page.tsx           # 대시보드 (홈)
├── components/             # React 컴포넌트
│   ├── ui/                # shadcn/ui 컴포넌트
│   └── layout/            # 레이아웃 컴포넌트
├── lib/                   # 유틸리티
│   ├── prisma.ts          # Prisma 클라이언트
│   └── utils.ts           # 공통 유틸리티
└── test/                  # 테스트 파일
```

## 🎯 주요 특징

### **🔄 실시간 데이터 동기화**
- TanStack Query를 통한 효율적인 서버 상태 관리
- 낙관적 업데이트로 빠른 사용자 경험

### **📱 완벽한 반응형 디자인**
- 모바일 우선 설계
- 터치 친화적 인터페이스

### **🎨 모던 UI/UX**
- shadcn/ui 기반 일관된 디자인 시스템
- 다크/라이트 모드 지원 준비

### **🔒 타입 안전성**
- TypeScript로 전체 애플리케이션 타입 보장
- Prisma를 통한 타입 안전한 데이터베이스 접근

### **⚡ 성능 최적화**
- Next.js 15 최신 기능 활용
- 서버 컴포넌트와 클라이언트 컴포넌트 최적 분배

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: 멋진 기능 추가'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🐛 이슈 및 피드백

버그 리포트나 기능 제안은 [GitHub Issues](https://github.com/yuhaeun-la/agonarak/issues)에서 해주세요.

---

<div align="center">

**📚 아고나락으로 더 체계적이고 즐거운 독서 모임을 만들어보세요! 🏛️**

[🚀 라이브 데모](https://agonarak.vercel.app) | [📖 배포 가이드](DEPLOYMENT.md) | [🐛 이슈 제보](https://github.com/yuhaeun-la/agonarak/issues)

</div>