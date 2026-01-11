// src/types/models.ts
export type Severity = "HIGH" | "MID" | "LOW";
export type ReportType = "FLOOD" | "DRAIN" | "OTHER";

export type Region = {
  sido: string; // 경기도 고정 (MVP)
  sigungu: string; // 수원시 등
  eupmyeondong?: string; // 장안구/영통구 등(구/읍면동을 여기로 통합)
};

export type Report = {
  id: string;
  type: ReportType;
  region: Region;

  locationText: string; // 사용자가 적은 위치 텍스트
  description: string; // 상세 설명
  photoName?: string; // MVP: 실제 업로드 대신 파일명만 저장

  createdAt: string; // ISO
  pointsEarned: number; // 이 제보로 적립된 포인트
};

export type PartnerCompany = {
  id: string;
  name: string;
  category: "편의점" | "공공" | "유통" | "생활" | "기타";
  shortDesc: string;
  logoText?: string; // MVP: 이미지 대신 텍스트(나중에 logoUrl로 확장)
  benefitHint?: string; // "포인트로 교환 가능" 같은 한 줄
};

export type RewardItem = {
  id: string;
  title: string; // 예: "크라운 마이쮸(사과)"
  brand: string; // 예: "GS25"
  cost: number; // 포인트
  imageUrl?: string; // MVP: 있으면 표시
  note?: string; // 유의사항
};

export type PointTx = {
  id: string;
  type: "EARN" | "SPEND";
  amount: number;
  title: string; // "제보 등록", "상품 교환" 등
  createdAt: string; // ISO
  refId?: string; // reportId or rewardId
};

export type UserProfile = {
  id: string; // MVP: guest id
  nickname: string; // "게스트"
};

export type AppState = {
  // 지역 선택
  selectedRegion: Region;

  // 시민 제보/포인트
  reports: Report[];
  pointsBalance: number;
  pointHistory: PointTx[];

  // 기업/혜택
  partners: PartnerCompany[];
  rewards: RewardItem[];

  // 유저(로그인 전 MVP는 guest)
  user: UserProfile;

  // UI
  lastVisitedTab?: "HOME" | "MAP" | "REPORT" | "PARTNER" | "BENEFITS" | "MYPAGE";
};
