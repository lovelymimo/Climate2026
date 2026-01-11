# 기후안전허브 (Climate Safety Hub)

경기도 시민이 함께 만드는 기후안전 플랫폼

## 프로젝트 소개

**기후안전허브**는 기후변화로 인한 침수 위험을 시민이 직접 확인하고, 위험 지역을 제보하여 안전한 도시를 함께 만들어가는 서비스입니다.

### 주요 기능

| 기능 | 설명 |
|------|------|
| **침수위험지도** | 경기도 31개 시·군의 침수위험도, 침수흔적, 취약시설을 지도에서 확인 |
| **위험지역 제보** | 침수, 배수 문제 등 위험 지역을 시민이 직접 제보 |
| **기후안전 포인트** | 제보 참여 시 포인트 적립, 등급 시스템 (브론즈→실버→골드) |
| **기업협력** | 침수 대응 솔루션을 제공하는 협력 기업 연결 |
| **마이페이지** | 내 포인트, 제보 내역, 등급 확인 |

## 기술 스택

### Frontend
- **React 19** + **TypeScript**
- **Vite** - 빌드 도구
- **Tailwind CSS v4** - 스타일링
- **React Router v7** - 라우팅
- **Leaflet** + **react-leaflet** - 지도

### Backend / Services
- **Firebase Authentication** - 이메일/Google 로그인
- **Firebase Firestore** - 사용자 데이터, 제보 저장
- **EmailJS** - 제보 알림 이메일 발송
- **경기도 기후플랫폼 GeoServer** - 침수 위험 데이터 (WMS/WFS)

## 화면 구성

```
/                 - 홈페이지 (서비스 소개, 주요 기능)
/map              - 침수위험지도 (레이어 선택, 지역 검색)
/region/:id       - 지역별 침수 상세 정보
/report           - 위험지역 제보 페이지
/report/complete  - 제보 완료 페이지
/partner          - 협력기업 소개
/login            - 로그인
/signup           - 회원가입
/mypage           - 마이페이지
```

## 로컬 개발 환경 설정

### 1. 저장소 클론
```bash
git clone https://github.com/lovelymimo/Climate2026.git
cd Climate2026/frontend
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
```bash
cp .env.example .env.local
# .env.local 파일에서 필요한 값 설정
```

### 4. 개발 서버 실행
```bash
npm run dev
```

### 5. 빌드
```bash
npm run build
```

## 프로젝트 구조

```
frontend/
├── src/
│   ├── components/     # 공통 컴포넌트 (Header, Footer, Layout)
│   ├── contexts/       # React Context (AuthContext)
│   ├── pages/          # 페이지 컴포넌트
│   ├── hooks/          # 커스텀 훅
│   ├── services/       # API 서비스 (WFS)
│   ├── data/           # 정적 데이터 (지역 정보)
│   ├── types/          # TypeScript 타입 정의
│   └── lib/            # 외부 서비스 설정 (Firebase)
├── public/             # 정적 파일
└── dist/               # 빌드 결과물
```

## 데이터 출처

- **침수위험지도 데이터**: [경기도 기후변화대응 플랫폼](https://climate.gg.go.kr)
- **행정구역 데이터**: 경기도 31개 시·군

## 배포

- **호스팅**: Vercel
- **도메인**: (배포 후 업데이트)

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

---

**기후안전허브** - 경기도와 시민이 함께 만드는 기후안전 도시
