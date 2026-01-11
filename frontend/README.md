# 기후안전허브 (Climate Safety Hub)

경기도 침수위험 지도 및 시민제보 플랫폼

## 배포 URL

https://climate2026.vercel.app

## 주요 기능

### 시민용
- **침수위험지도**: 경기도 지역별 침수위험 정보 확인
- **시민제보**: 침수/배수 문제 제보 및 포인트 적립
- **마이페이지**: 포인트, 등급, 제보 기록 확인

### 관리자용 (`/admin`)
- **대시보드**: 전체 통계, 최근 제보 현황
- **제보 관리**: 제보 목록 필터링, 상태 변경 (대기중/검토중/완료/반려)
- **회원 관리**: 회원 검색, 등급별 필터링, 회원 상세 정보

## 기술 스택

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Routing**: react-router-dom v7
- **Map**: Leaflet + react-leaflet v5
- **Backend**: Firebase (Auth, Firestore)
- **Deployment**: Vercel

## 로컬 개발

```bash
cd frontend
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

## 프로젝트 구조

```
frontend/src/
├── components/       # 공통 컴포넌트
│   ├── Layout.tsx
│   └── AdminLayout.tsx
├── contexts/         # React Context
│   └── AuthContext.tsx
├── pages/            # 페이지 컴포넌트
│   ├── admin/        # 관리자 페이지
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminReports.tsx
│   │   └── AdminUsers.tsx
│   ├── HomePage.tsx
│   ├── MapPage.tsx
│   ├── ReportPage.tsx
│   └── MyPage.tsx
├── services/         # API 서비스
│   ├── adminService.ts
│   └── wfsService.ts
└── lib/              # 라이브러리 설정
    └── firebase.ts
```

## 라이선스

Private
