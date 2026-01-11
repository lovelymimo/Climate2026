import type { Report } from '../types';

// 시민 제보 더미 데이터
export const dummyReports: Report[] = [
  {
    id: 'report-001',
    location: {
      lat: 37.2636,
      lng: 127.0286,
      address: '수원시 팔달구 인계동',
    },
    type: 'flood',
    description: '비 오는 날 도로에 물이 많이 고입니다.',
    createdAt: '2024-07-15T14:30:00',
    status: 'confirmed',
  },
  {
    id: 'report-002',
    location: {
      lat: 37.4200,
      lng: 127.1265,
      address: '성남시 수정구 신흥동',
    },
    type: 'drainage',
    description: '하수구가 자주 막혀서 악취가 납니다.',
    createdAt: '2024-07-20T09:15:00',
    status: 'pending',
  },
  {
    id: 'report-003',
    location: {
      lat: 37.6584,
      lng: 126.8320,
      address: '고양시 일산서구 대화동',
    },
    type: 'flood',
    description: '지하차도 침수 위험 지역입니다.',
    createdAt: '2024-08-01T16:45:00',
    status: 'confirmed',
  },
  {
    id: 'report-004',
    location: {
      lat: 37.5034,
      lng: 126.7660,
      address: '부천시 원미구 중동',
    },
    type: 'other',
    description: '빗물 배수로 덮개가 파손되었습니다.',
    createdAt: '2024-08-05T11:20:00',
    status: 'resolved',
  },
  {
    id: 'report-005',
    location: {
      lat: 37.7381,
      lng: 127.0337,
      address: '의정부시 의정부동',
    },
    type: 'flood',
    description: '집중호우 시 상습 침수 지역입니다.',
    createdAt: '2024-08-10T08:00:00',
    status: 'confirmed',
  },
];
