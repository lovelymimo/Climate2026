// 지역 정보 타입
export interface Region {
  id: string;
  name: string;
  type: 'city' | 'district';
  parentId?: string;
  center: {
    lat: number;
    lng: number;
  };
  riskLevel: 'high' | 'medium' | 'low';
}

// 시민 제보 타입
export interface Report {
  id: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  type: 'flood' | 'drainage' | 'other';
  description: string;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'resolved';
}

// 제보 유형 라벨
export const REPORT_TYPE_LABELS: Record<Report['type'], string> = {
  flood: '침수',
  drainage: '배수 문제',
  other: '기타',
};

// 위험도 라벨
export const RISK_LEVEL_LABELS: Record<Region['riskLevel'], string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};
