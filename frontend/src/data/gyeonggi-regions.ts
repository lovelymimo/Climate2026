// 경기도 31개 시/군 전체 데이터 (좌표 포함)
// 초기 MVP용 정적 데이터 (추후 검증 필요)

export type District = {
  id: string;
  name: string;
  center: { lat: number; lng: number };
};

export type GyeonggiCity = {
  id: string;
  name: string;
  sigunCd: string; // 시군구 코드 (WFS 조회용)
  center: { lat: number; lng: number };
  districts: District[];
};

export const GYEONGGI_CITIES: GyeonggiCity[] = [
  // === 시 단위 (28개) ===
  {
    id: "suwon",
    name: "수원시",
    sigunCd: "41110",
    center: { lat: 37.2636, lng: 127.0286 },
    districts: [
      { id: "jangan", name: "장안구", center: { lat: 37.3030, lng: 127.0107 } },
      { id: "gwonseon", name: "권선구", center: { lat: 37.2578, lng: 126.9717 } },
      { id: "paldal", name: "팔달구", center: { lat: 37.2822, lng: 127.0195 } },
      { id: "yeongtong", name: "영통구", center: { lat: 37.2596, lng: 127.0465 } },
    ],
  },
  {
    id: "seongnam",
    name: "성남시",
    sigunCd: "41130",
    center: { lat: 37.4200, lng: 127.1265 },
    districts: [
      { id: "sujeong", name: "수정구", center: { lat: 37.4503, lng: 127.1457 } },
      { id: "jungwon", name: "중원구", center: { lat: 37.4318, lng: 127.1370 } },
      { id: "bundang", name: "분당구", center: { lat: 37.3825, lng: 127.1194 } },
    ],
  },
  {
    id: "goyang",
    name: "고양시",
    sigunCd: "41280",
    center: { lat: 37.6584, lng: 126.8320 },
    districts: [
      { id: "deogyang", name: "덕양구", center: { lat: 37.6376, lng: 126.8320 } },
      { id: "ilsandong", name: "일산동구", center: { lat: 37.6586, lng: 126.7742 } },
      { id: "ilsanseo", name: "일산서구", center: { lat: 37.6753, lng: 126.7508 } },
    ],
  },
  {
    id: "yongin",
    name: "용인시",
    sigunCd: "41460",
    center: { lat: 37.2411, lng: 127.1776 },
    districts: [
      { id: "cheoin", name: "처인구", center: { lat: 37.2342, lng: 127.2003 } },
      { id: "giheung", name: "기흥구", center: { lat: 37.2802, lng: 127.1152 } },
      { id: "suji", name: "수지구", center: { lat: 37.3219, lng: 127.0987 } },
    ],
  },
  {
    id: "bucheon",
    name: "부천시",
    sigunCd: "41190",
    center: { lat: 37.5034, lng: 126.7660 },
    districts: [
      { id: "sosa", name: "소사구", center: { lat: 37.4827, lng: 126.7953 } },
      { id: "wonmi", name: "원미구", center: { lat: 37.5050, lng: 126.7830 } },
      { id: "ojeong", name: "오정구", center: { lat: 37.5234, lng: 126.7780 } },
    ],
  },
  {
    id: "ansan",
    name: "안산시",
    sigunCd: "41270",
    center: { lat: 37.3219, lng: 126.8309 },
    districts: [
      { id: "sangnok", name: "상록구", center: { lat: 37.3048, lng: 126.8468 } },
      { id: "danwon", name: "단원구", center: { lat: 37.3189, lng: 126.7983 } },
    ],
  },
  {
    id: "anyang",
    name: "안양시",
    sigunCd: "41170",
    center: { lat: 37.3943, lng: 126.9568 },
    districts: [
      { id: "manan", name: "만안구", center: { lat: 37.3866, lng: 126.9322 } },
      { id: "dongan", name: "동안구", center: { lat: 37.3943, lng: 126.9568 } },
    ],
  },
  {
    id: "namyangju",
    name: "남양주시",
    sigunCd: "41360",
    center: { lat: 37.6360, lng: 127.2165 },
    districts: [],
  },
  {
    id: "hwaseong",
    name: "화성시",
    sigunCd: "41590",
    center: { lat: 37.1996, lng: 126.8312 },
    districts: [],
  },
  {
    id: "pyeongtaek",
    name: "평택시",
    sigunCd: "41220",
    center: { lat: 36.9921, lng: 127.1127 },
    districts: [],
  },
  {
    id: "uijeongbu",
    name: "의정부시",
    sigunCd: "41150",
    center: { lat: 37.7381, lng: 127.0337 },
    districts: [],
  },
  {
    id: "siheung",
    name: "시흥시",
    sigunCd: "41390",
    center: { lat: 37.3800, lng: 126.8028 },
    districts: [],
  },
  {
    id: "paju",
    name: "파주시",
    sigunCd: "41480",
    center: { lat: 37.7126, lng: 126.7610 },
    districts: [],
  },
  {
    id: "gimpo",
    name: "김포시",
    sigunCd: "41570",
    center: { lat: 37.6153, lng: 126.7156 },
    districts: [],
  },
  {
    id: "gwangmyeong",
    name: "광명시",
    sigunCd: "41210",
    center: { lat: 37.4786, lng: 126.8644 },
    districts: [],
  },
  {
    id: "gwangju",
    name: "광주시",
    sigunCd: "41610",
    center: { lat: 37.4095, lng: 127.2550 },
    districts: [],
  },
  {
    id: "gunpo",
    name: "군포시",
    sigunCd: "41410",
    center: { lat: 37.3616, lng: 126.9352 },
    districts: [],
  },
  {
    id: "hanam",
    name: "하남시",
    sigunCd: "41450",
    center: { lat: 37.5393, lng: 127.2148 },
    districts: [],
  },
  {
    id: "osan",
    name: "오산시",
    sigunCd: "41370",
    center: { lat: 37.1498, lng: 127.0697 },
    districts: [],
  },
  {
    id: "icheon",
    name: "이천시",
    sigunCd: "41500",
    center: { lat: 37.2720, lng: 127.4350 },
    districts: [],
  },
  {
    id: "anseong",
    name: "안성시",
    sigunCd: "41550",
    center: { lat: 37.0080, lng: 127.2797 },
    districts: [],
  },
  {
    id: "uiwang",
    name: "의왕시",
    sigunCd: "41430",
    center: { lat: 37.3448, lng: 126.9683 },
    districts: [],
  },
  {
    id: "yangju",
    name: "양주시",
    sigunCd: "41630",
    center: { lat: 37.7853, lng: 127.0458 },
    districts: [],
  },
  {
    id: "guri",
    name: "구리시",
    sigunCd: "41310",
    center: { lat: 37.5943, lng: 127.1295 },
    districts: [],
  },
  {
    id: "pocheon",
    name: "포천시",
    sigunCd: "41650",
    center: { lat: 37.8949, lng: 127.2003 },
    districts: [],
  },
  {
    id: "dongducheon",
    name: "동두천시",
    sigunCd: "41250",
    center: { lat: 37.9035, lng: 127.0606 },
    districts: [],
  },
  {
    id: "gwacheon",
    name: "과천시",
    sigunCd: "41290",
    center: { lat: 37.4292, lng: 126.9876 },
    districts: [],
  },
  {
    id: "yeoju",
    name: "여주시",
    sigunCd: "41670",
    center: { lat: 37.2983, lng: 127.6375 },
    districts: [],
  },
  // === 군 단위 (3개) ===
  {
    id: "yangpyeong",
    name: "양평군",
    sigunCd: "41830",
    center: { lat: 37.4917, lng: 127.4875 },
    districts: [],
  },
  {
    id: "gapyeong",
    name: "가평군",
    sigunCd: "41820",
    center: { lat: 37.8315, lng: 127.5095 },
    districts: [],
  },
  {
    id: "yeoncheon",
    name: "연천군",
    sigunCd: "41800",
    center: { lat: 38.0965, lng: 127.0750 },
    districts: [],
  },
];

// 경기도 전체 중심 좌표
export const GYEONGGI_CENTER = { lat: 37.4138, lng: 127.0183 };

// 기본 줌 레벨
export const DEFAULT_ZOOM = 10;
export const CITY_ZOOM = 12;
export const DISTRICT_ZOOM = 14;
