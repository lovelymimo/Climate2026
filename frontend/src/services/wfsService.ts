// WFS 서비스 - 경기도 기후플랫폼 데이터 조회

const WFS_BASE_URL = import.meta.env.VITE_GG_WMS_BASE_URL?.replace('/wms', '/wfs')
  || 'https://climate.gg.go.kr/ols/api/geoserver/wfs';
const API_KEY = import.meta.env.VITE_GG_API_KEY || '';

// 홍수 위험 데이터 타입
export type FloodDangerData = {
  sigunNm: string;
  sigunCd: string;
  flodDngrIdx: number; // 0~1 범위 (높을수록 위험)
  flodDngRnk: number;  // 순위 (1이 가장 위험)
};

// 침수 흔적 건수 타입
export type FloodTraceCount = {
  sigunCd: string;
  count: number;
};

// 통계 데이터 타입
export type RegionStats = {
  floodDangerIdx: number | null;  // 홍수위험지수
  floodDangerRank: number | null; // 홍수위험순위
  floodTraceCount: number | null; // 침수흔적 건수
  weakFacilityCount: number | null; // 취약시설 건수
  loading: boolean;
  error: string | null;
};

// WFS GetFeature 요청
async function wfsGetFeature(params: {
  typeName: string;
  propertyName?: string;
  cqlFilter?: string;
  maxFeatures?: number;
  srsName?: string; // 좌표계 지정 (기본값: EPSG:4326)
}): Promise<any> {
  const url = new URL(WFS_BASE_URL);
  url.searchParams.set('apiKey', API_KEY);
  url.searchParams.set('service', 'WFS');
  url.searchParams.set('request', 'GetFeature');
  url.searchParams.set('typeName', params.typeName);
  url.searchParams.set('outputFormat', 'application/json');
  // WGS84 좌표계로 요청 (Leaflet 호환)
  url.searchParams.set('srsName', params.srsName || 'EPSG:4326');

  if (params.propertyName) {
    url.searchParams.set('propertyName', params.propertyName);
  }
  if (params.cqlFilter) {
    url.searchParams.set('CQL_FILTER', params.cqlFilter);
  }
  if (params.maxFeatures) {
    url.searchParams.set('maxFeatures', params.maxFeatures.toString());
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`WFS 요청 실패: ${response.status}`);
  }
  return response.json();
}

// 시군별 홍수위험지수 조회
export async function fetchFloodDanger(sigunNm: string): Promise<FloodDangerData | null> {
  try {
    const data = await wfsGetFeature({
      typeName: 'spggcee:tm_sigun_flod_dngr_evl_rnk',
      propertyName: 'sigun_nm,sigun_cd,flod_dngr_idx,flod_dng_rnk',
      cqlFilter: `sigun_nm LIKE '%${sigunNm.replace('시', '').replace('군', '')}%'`,
      maxFeatures: 1,
    });

    if (data.features && data.features.length > 0) {
      const props = data.features[0].properties;
      return {
        sigunNm: props.sigun_nm,
        sigunCd: props.sigun_cd,
        flodDngrIdx: props.flod_dngr_idx,
        flodDngRnk: props.flod_dng_rnk,
      };
    }
    return null;
  } catch (error) {
    console.error('홍수위험지수 조회 실패:', error);
    return null;
  }
}

// 시군별 침수흔적 건수 조회
export async function fetchFloodTraceCount(sigunCd: string): Promise<number | null> {
  try {
    // 시군구 코드 앞 5자리로 필터링 (예: 41110 -> 경기도 수원시)
    const data = await wfsGetFeature({
      typeName: 'spggcee:tm_fldn_trce',
      propertyName: 'stdg_sgg_cd',
      cqlFilter: `stdg_sgg_cd LIKE '${sigunCd.substring(0, 5)}%'`,
    });

    if (data.features) {
      return data.features.length;
    }
    return 0;
  } catch (error) {
    console.error('침수흔적 건수 조회 실패:', error);
    return null;
  }
}

// 취약시설 CQL 필터 생성
// - 필수: 위험등급 3 이상 (주의/경계/위험) AND 침수예상구역
// - 침수예상구역: 국가하천/지방하천/도시침수 중 하나 이상 해당
function buildWeakFacilityCqlFilter(sigunPrefix: string): string {
  const regionFilter = `sigun_cd LIKE '${sigunPrefix}%'`;
  const riskGradeFilter = 'flod_dngr_grd >= 3';
  const floodZoneFilter = "(ntn_rvr_yr200_freq_rnfl_fldn_yn = 'Y' OR lcl_rvr_yr100_freq_rnfl_fldn_yn = 'Y' OR cty_fldn_yr100_freq_rnfl_fldn_yn = 'Y')";

  return `${regionFilter} AND ${riskGradeFilter} AND ${floodZoneFilter}`;
}

// 시군별 취약시설 건수 조회 (위험등급 3 이상: 주의/경계/위험)
export async function fetchWeakFacilityCount(sigunCd: string): Promise<number | null> {
  try {
    const sigunPrefix = sigunCd.substring(0, 5);
    const cqlFilter = buildWeakFacilityCqlFilter(sigunPrefix);

    const data = await wfsGetFeature({
      typeName: 'spggcee:flod_weak_fclt',
      propertyName: 'sigun_cd',
      cqlFilter,
      maxFeatures: 1, // 건수 확인용이므로 1건만 요청
    });

    // WFS 응답의 totalFeatures 값 사용 (정확한 건수)
    if (data.totalFeatures !== undefined) {
      return data.totalFeatures;
    }
    // fallback: features 배열 길이
    if (data.features) {
      return data.features.length;
    }
    return 0;
  } catch (error) {
    console.error('취약시설 건수 조회 실패:', error);
    return null;
  }
}

// 취약시설 상세 데이터 타입
export type WeakFacilityDetail = {
  id: string;
  facilityName: string;       // 시설명
  facilityType: string;       // 시설유형
  address: string;            // 주소/층수 정보
  coordinates?: string;       // 좌표 문자열 (표시용)
  geometry?: {                // 원본 geometry (마커 표시용)
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  riskLevel?: string;         // 위험등급 라벨
  riskGrade?: number;         // 위험등급 숫자 (0~5, 색상용)
  riskCriteriaYear?: string;  // 위험등급 기준년도
  vulnerabilityReasons: string[];  // 취약 사유 목록 (지하층, 침수예상, 노후 등)
  hasBasement?: boolean;      // 지하층 여부
  isOldBuilding?: boolean;    // 노후건물 여부 (20년+)
  hasEarthquakeDesign?: boolean; // 내진설계 여부
  floodZoneInfo?: string[];   // 침수예상지역 정보
  properties: Record<string, unknown>;
};

// 홍수위험등급 변환 (flod_dngr_grd 0~5)
function getFloodDangerGradeLabel(grade: number | string | null | undefined): string {
  const g = typeof grade === 'string' ? parseInt(grade, 10) : grade;
  if (g === null || g === undefined || isNaN(g as number)) return '';
  switch (g) {
    case 0: return '안전';
    case 1: return '낮음';
    case 2: return '보통';
    case 3: return '주의';
    case 4: return '경계';
    case 5: return '위험';
    default: return `등급${g}`;
  }
}

// 취약시설 상세 목록 조회 (위험등급 3 이상: 주의/경계/위험)
export async function fetchWeakFacilityDetails(sigunCd: string): Promise<WeakFacilityDetail[]> {
  try {
    const sigunPrefix = sigunCd.substring(0, 5);
    const cqlFilter = buildWeakFacilityCqlFilter(sigunPrefix);

    const data = await wfsGetFeature({
      typeName: 'spggcee:flod_weak_fclt',
      cqlFilter,
      maxFeatures: 500,
    });

    if (import.meta.env.DEV && data.features?.length > 0) {
      console.group('🏢 취약시설 WFS 데이터 (개발모드)');
      console.log('속성 목록:', Object.keys(data.features[0].properties));
      console.log('샘플 데이터:', data.features[0].properties);
      console.log('geometry 존재:', !!data.features[0].geometry);
      console.log('geometry:', data.features[0].geometry);
      console.groupEnd();
    }

    if (data.features) {
      return data.features.map((f: any, idx: number) => {
        const props = f.properties || {};

        // 실제 WFS 속성명 사용 (DescribeFeatureType 결과 기반)
        // bldg_nm: 건물명, bldg_dtl_nm: 건물상세명
        // bdrg_knd_nm: 건물종류명, main_usg_nm: 주용도명
        // flod_dngr_grd: 홍수위험등급 (0~5)
        const buildingName = props.bldg_nm || '';
        const buildingDetail = props.bldg_dtl_nm || '';
        const buildingKind = props.bdrg_knd_nm || '';
        const mainUsage = props.main_usg_nm || '';
        const dangerGrade = props.flod_dngr_grd;

        // 시설명 결정: 건물명 > 건물상세명 > 주용도명 순으로 우선
        let name = buildingName || buildingDetail || mainUsage || `시설 ${idx + 1}`;
        // 건물명이 있고 상세명도 있으면 합치기
        if (buildingName && buildingDetail && buildingName !== buildingDetail) {
          name = `${buildingName} (${buildingDetail})`;
        }

        // 시설유형: 건물종류명 > 주용도명
        const type = buildingKind || mainUsage || '미분류';

        // 위험등급 라벨
        const riskLabel = getFloodDangerGradeLabel(dangerGrade);

        // 좌표 추출 (Point geometry)
        let coords = '';
        if (f.geometry?.coordinates) {
          if (f.geometry.type === 'Point') {
            const [lng, lat] = f.geometry.coordinates;
            coords = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          } else if (f.geometry.type === 'Polygon' && f.geometry.coordinates?.[0]?.[0]) {
            const [lng, lat] = f.geometry.coordinates[0][0];
            coords = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          }
        }

        // 추가 정보 구성 (층수, 승인일 등)
        const groundFloors = props.grnd_nofl; // 지상층수
        const undergroundFloors = props.udgd_nofl; // 지하층수
        const approvalDate = props.use_aprv_ymd; // 사용승인일

        // 주소 대체: 층수 정보로 표시 (WFS에 주소 필드 없음)
        let addressInfo = '';
        if (groundFloors || undergroundFloors) {
          const parts = [];
          if (groundFloors) parts.push(`지상 ${groundFloors}층`);
          if (undergroundFloors) parts.push(`지하 ${undergroundFloors}층`);
          addressInfo = parts.join(', ');
        }
        if (approvalDate) {
          addressInfo += addressInfo ? ` (승인: ${approvalDate})` : `승인: ${approvalDate}`;
        }

        // 위험등급 숫자값 (색상용)
        const gradeNum = typeof dangerGrade === 'string' ? parseInt(dangerGrade, 10) : dangerGrade;

        // 취약 사유 분석
        const vulnerabilityReasons: string[] = [];
        const floodZoneInfo: string[] = [];

        // 지하층 여부
        const hasBasement = undergroundFloors && undergroundFloors >= 1;

        // 침수예상지역 정보 (위험등급 산정 근거)
        const isNationalRiverFlood = props.ntn_rvr_yr200_freq_rnfl_fldn_yn === 'Y';
        const isLocalRiverFlood = props.lcl_rvr_yr100_freq_rnfl_fldn_yn === 'Y';
        const isUrbanFlood = props.cty_fldn_yr100_freq_rnfl_fldn_yn === 'Y';

        // 침수예상구역 + 지하층 결합 표시 (의미있는 조합만)
        if (isNationalRiverFlood) {
          floodZoneInfo.push('국가하천 홍수');
          const reason = hasBasement
            ? `국가하천 침수예상 (지하 ${undergroundFloors}층)`
            : '국가하천 침수예상구역';
          vulnerabilityReasons.push(reason);
        }
        if (isLocalRiverFlood) {
          floodZoneInfo.push('지방하천 홍수');
          // 국가하천에서 이미 지하층 표시했으면 생략
          const reason = (hasBasement && !isNationalRiverFlood)
            ? `지방하천 침수예상 (지하 ${undergroundFloors}층)`
            : '지방하천 침수예상구역';
          vulnerabilityReasons.push(reason);
        }
        if (isUrbanFlood) {
          floodZoneInfo.push('도시침수');
          // 다른 곳에서 이미 지하층 표시했으면 생략
          const reason = (hasBasement && !isNationalRiverFlood && !isLocalRiverFlood)
            ? `도시침수 예상 (지하 ${undergroundFloors}층)`
            : '도시침수 예상구역';
          vulnerabilityReasons.push(reason);
        }

        // 지하층 단독으로는 취약사유에 표시하지 않음
        // (침수예상구역과 결합된 경우만 위에서 표시됨)

        // 위험등급 기준년도
        const criteriaYear = props.flod_dngr_crtr_yr as string | undefined;

        // 노후건물/내진설계 여부
        const isOldBuilding = props.use_aprv_day_20yr_ovr_yn === 'Y';
        const hasEarthquakeDesign = props.etrs_design_yn === 'Y';

        return {
          id: f.id || `facility-${idx}`,
          facilityName: name,
          facilityType: type,
          address: addressInfo || '상세정보 미제공',
          coordinates: coords || undefined,
          geometry: f.geometry || undefined,
          riskLevel: riskLabel || undefined,
          riskGrade: (gradeNum !== null && gradeNum !== undefined && !isNaN(gradeNum)) ? gradeNum : undefined,
          riskCriteriaYear: criteriaYear || undefined,
          vulnerabilityReasons,
          hasBasement: hasBasement || false,
          isOldBuilding,
          hasEarthquakeDesign,
          floodZoneInfo: floodZoneInfo.length > 0 ? floodZoneInfo : undefined,
          properties: props,
        };
      });
    }
    return [];
  } catch (error) {
    console.error('취약시설 상세 조회 실패:', error);
    return [];
  }
}

// 침수흔적 상세 데이터 타입
export type FloodTraceDetail = {
  id: string;
  stdgSggCd: string;           // 시군구코드
  districtName?: string;       // 피해지역명 (fldn_dstr_nm)
  causeDetail?: string;        // 침수원인 상세 (fldn_cs_dtl_expln)
  startDate?: string;          // 침수시작일 (fldn_bgng_ymd)
  endDate?: string;            // 침수종료일 (fldn_end_ymd)
  floodDepth?: number;         // 침수깊이 (fldn_dowa)
  floodArea?: number;          // 침수면적 (fldn_area)
  geometryType?: string;       // geometry 타입 (Point, Polygon 등)
  coordinates?: string;        // 좌표 문자열 (표시용)
  geometry?: {                 // 원본 geometry (마커 표시용)
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  properties: Record<string, unknown>; // 전체 속성 (디버깅용)
  hasDetailInfo: boolean;      // 상세정보 존재 여부
};

// 좌표를 표시용 문자열로 변환
function formatCoordinates(geometry: any): string {
  if (!geometry) return '';

  try {
    if (geometry.type === 'Point' && geometry.coordinates) {
      const [lng, lat] = geometry.coordinates;
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
    if (geometry.type === 'Polygon' && geometry.coordinates?.[0]?.[0]) {
      // 폴리곤의 첫 번째 점 (대표 좌표)
      const [lng, lat] = geometry.coordinates[0][0];
      return `${lat.toFixed(5)}, ${lng.toFixed(5)} (폴리곤)`;
    }
    if (geometry.type === 'MultiPolygon' && geometry.coordinates?.[0]?.[0]?.[0]) {
      const [lng, lat] = geometry.coordinates[0][0][0];
      return `${lat.toFixed(5)}, ${lng.toFixed(5)} (멀티폴리곤)`;
    }
  } catch {
    // 좌표 파싱 실패 시 빈 문자열
  }
  return '';
}

// 침수흔적 상세 목록 조회
export async function fetchFloodTraceDetails(sigunCd: string): Promise<FloodTraceDetail[]> {
  try {
    const data = await wfsGetFeature({
      typeName: 'spggcee:tm_fldn_trce',
      cqlFilter: `stdg_sgg_cd LIKE '${sigunCd.substring(0, 5)}%'`,
      maxFeatures: 500, // 최대 500건
    });

    if (data.features) {
      // 개발 모드에서만 속성 로그 출력
      if (import.meta.env.DEV && data.features.length > 0) {
        console.group('🔍 침수흔적 WFS 데이터 (개발모드)');
        console.log('속성 목록:', Object.keys(data.features[0].properties));
        console.log('샘플 데이터:', data.features[0].properties);
        console.groupEnd();
      }

      return data.features.map((f: any, idx: number) => {
        const props = f.properties || {};

        // 실제 WFS 속성명 사용 (DescribeFeatureType 결과 기반)
        const districtName = props.fldn_dstr_nm || '';           // 피해지역명
        const causeDetail = props.fldn_cs_dtl_expln || '';       // 침수원인 상세
        const startDate = props.fldn_bgng_ymd || '';             // 침수시작일
        const endDate = props.fldn_end_ymd || '';                // 침수종료일
        const floodDepth = props.fldn_dowa;                      // 침수깊이
        const floodArea = props.fldn_area;                       // 침수면적

        const hasDetailInfo = !!(districtName || causeDetail || startDate || floodDepth);

        return {
          id: f.id || `trace-${idx}`,
          stdgSggCd: props.stdg_sgg_cd || '',
          districtName: districtName || undefined,
          causeDetail: causeDetail || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          floodDepth: floodDepth ?? undefined,
          floodArea: floodArea ?? undefined,
          geometryType: f.geometry?.type || '',
          coordinates: formatCoordinates(f.geometry),
          geometry: f.geometry || undefined,
          properties: props,
          hasDetailInfo,
        };
      });
    }
    return [];
  } catch (error) {
    console.error('침수흔적 상세 조회 실패:', error);
    return [];
  }
}

// 통합 지역 통계 조회
export async function fetchRegionStats(sigunNm: string, sigunCd: string): Promise<RegionStats> {
  try {
    const [floodDanger, floodTraceCount, weakFacilityCount] = await Promise.all([
      fetchFloodDanger(sigunNm),
      fetchFloodTraceCount(sigunCd),
      fetchWeakFacilityCount(sigunCd),
    ]);

    return {
      floodDangerIdx: floodDanger?.flodDngrIdx ?? null,
      floodDangerRank: floodDanger?.flodDngRnk ?? null,
      floodTraceCount: floodTraceCount,
      weakFacilityCount: weakFacilityCount,
      loading: false,
      error: null,
    };
  } catch (error) {
    return {
      floodDangerIdx: null,
      floodDangerRank: null,
      floodTraceCount: null,
      weakFacilityCount: null,
      loading: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// 홍수위험지수를 등급으로 변환
export function getFloodDangerLevel(idx: number | null): { level: string; className: string } {
  if (idx === null) {
    return { level: '—', className: 'cs-statNoData' };
  }
  if (idx >= 0.8) {
    return { level: '높음', className: 'cs-riskHigh' };
  }
  if (idx >= 0.5) {
    return { level: '보통', className: 'cs-riskMid' };
  }
  return { level: '낮음', className: 'cs-riskLow' };
}
