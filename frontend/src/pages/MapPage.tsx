import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, WMSTileLayer, useMap, CircleMarker, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { useAppStore } from "../store/AppStore";
import {
  GYEONGGI_CITIES,
  GYEONGGI_CENTER,
  DEFAULT_ZOOM,
  CITY_ZOOM,
  DISTRICT_ZOOM,
} from "../data/gyeonggi-regions";
import {
  fetchRegionStats,
  fetchFloodTraceDetails,
  fetchWeakFacilityDetails,
  getFloodDangerLevel,
  type RegionStats,
  type FloodTraceDetail,
  type WeakFacilityDetail,
} from "../services/wfsService";
import { Portal } from "../components/Portal";

// 지도 이동 컨트롤러 컴포넌트
function MapController({ center, zoom }: { center: LatLngExpression; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

// WMS 레이어 정의 (시민 핵심 정보 우선)
const WMS_LAYERS = [
  { id: "flood-trace", name: "침수흔적", layer: "spggcee:tm_fldn_trce" },
  { id: "weak-facility", name: "침수취약시설", layer: "spggcee:flod_weak_fclt" },
  { id: "risk-rank", name: "침수위험도 순위", layer: "spggcee:tm_sigun_flod_dngr_evl_rnk" },
];

// 환경변수에서 WMS 설정 가져오기
const WMS_BASE_URL = import.meta.env.VITE_GG_WMS_BASE_URL || "https://climate.gg.go.kr/ols/api/geoserver/wms";
const WMS_API_KEY = import.meta.env.VITE_GG_API_KEY || "";

export function MapPage() {
  const { state, setRegion } = useAppStore();

  // store.region.sigungu 기반으로 초기 cityId 계산
  const getInitialCityId = () => {
    const city = GYEONGGI_CITIES.find((c) => c.name === state.region.sigungu);
    return city?.id ?? GYEONGGI_CITIES[0].id;
  };

  const [keyword, setKeyword] = useState("");
  const [cityId, setCityId] = useState(getInitialCityId);
  const [districtId, setDistrictId] = useState(() => {
    const city = GYEONGGI_CITIES.find((c) => c.name === state.region.sigungu) ?? GYEONGGI_CITIES[0];
    return city.districts.length > 0 ? city.districts[0].id : "";
  });
  const [searchError, setSearchError] = useState<string | null>(null);

  // 지도 중심/줌 상태 (store 기반 초기값)
  const [mapCenter, setMapCenter] = useState<LatLngExpression>(() => {
    const city = GYEONGGI_CITIES.find((c) => c.name === state.region.sigungu);
    return city ? [city.center.lat, city.center.lng] : [GYEONGGI_CENTER.lat, GYEONGGI_CENTER.lng];
  });
  const [mapZoom, setMapZoom] = useState(() => {
    const city = GYEONGGI_CITIES.find((c) => c.name === state.region.sigungu);
    return city ? CITY_ZOOM : DEFAULT_ZOOM;
  });

  // WMS 레이어 상태
  const [activeLayerId, setActiveLayerId] = useState(WMS_LAYERS[0].id);
  const [opacity, setOpacity] = useState(0.7);

  // 지역 통계 데이터 (WFS)
  const [regionStats, setRegionStats] = useState<RegionStats>({
    floodDangerIdx: null,
    floodDangerRank: null,
    floodTraceCount: null,
    weakFacilityCount: null,
    loading: false,
    error: null,
  });

  // 침수흔적 상세 모달 상태
  const [showTraceModal, setShowTraceModal] = useState(false);
  const [traceDetails, setTraceDetails] = useState<FloodTraceDetail[]>([]);
  const [traceLoading, setTraceLoading] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true); // 지도 마커 표시 여부

  // 취약시설 상태
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [facilityDetails, setFacilityDetails] = useState<WeakFacilityDetail[]>([]);
  const [facilityLoading, setFacilityLoading] = useState(false);
  const [showFacilityMarkers, setShowFacilityMarkers] = useState(false); // 취약시설 마커 표시 여부

  // 침수위험도 상세 모달 상태
  const [showDangerModal, setShowDangerModal] = useState(false);

  // 범례 접기/펼치기 상태
  const [legendExpanded, setLegendExpanded] = useState(true);

  const selectedCity = useMemo(
    () => GYEONGGI_CITIES.find((c) => c.id === cityId) ?? GYEONGGI_CITIES[0],
    [cityId]
  );

  // 선택된 구/읍면동
  const selectedDistrict = useMemo(
    () => selectedCity.districts.find((d) => d.id === districtId),
    [selectedCity, districtId]
  );

  // 지역 통계 데이터 로드
  useEffect(() => {
    const loadStats = async () => {
      setRegionStats((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const stats = await fetchRegionStats(selectedCity.name, selectedCity.sigunCd);
        setRegionStats(stats);
      } catch (error) {
        setRegionStats({
          floodDangerIdx: null,
          floodDangerRank: null,
          floodTraceCount: null,
          weakFacilityCount: null,
          loading: false,
          error: error instanceof Error ? error.message : "데이터 로드 실패",
        });
      }
    };
    loadStats();
  }, [selectedCity]);

  // 홍수위험지수 등급
  const dangerLevel = useMemo(
    () => getFloodDangerLevel(regionStats.floodDangerIdx),
    [regionStats.floodDangerIdx]
  );

  // 침수흔적 상세 데이터 로드 (마커 표시용)
  useEffect(() => {
    const loadTraceDetails = async () => {
      setTraceLoading(true);
      try {
        const details = await fetchFloodTraceDetails(selectedCity.sigunCd);
        setTraceDetails(details);
      } catch (error) {
        console.error('침수흔적 상세 조회 실패:', error);
        setTraceDetails([]);
      } finally {
        setTraceLoading(false);
      }
    };
    loadTraceDetails();
  }, [selectedCity]);

  // 취약시설 상세 데이터 로드 (마커 표시용)
  useEffect(() => {
    const loadFacilityDetails = async () => {
      setFacilityLoading(true);
      try {
        const details = await fetchWeakFacilityDetails(selectedCity.sigunCd);
        setFacilityDetails(details);
      } catch (error) {
        console.error('취약시설 상세 조회 실패:', error);
        setFacilityDetails([]);
      } finally {
        setFacilityLoading(false);
      }
    };
    loadFacilityDetails();
  }, [selectedCity]);

  // 마커용 좌표 추출 함수
  const getMarkerPosition = (trace: FloodTraceDetail): [number, number] | null => {
    const geometry = trace.geometry;
    if (!geometry?.coordinates) return null;

    try {
      // GeoJSON은 [lng, lat] 순서 → Leaflet은 [lat, lng] 순서
      let lng: number | undefined;
      let lat: number | undefined;

      if (geometry.type === 'Point') {
        const pt = geometry.coordinates as number[];
        if (pt.length >= 2) {
          lng = pt[0];
          lat = pt[1];
        }
      } else if (geometry.type === 'Polygon') {
        const poly = geometry.coordinates as number[][][];
        if (poly[0]?.[0]?.length >= 2) {
          lng = poly[0][0][0];
          lat = poly[0][0][1];
        }
      } else if (geometry.type === 'MultiPolygon') {
        const mpoly = geometry.coordinates as unknown as number[][][][];
        if (mpoly[0]?.[0]?.[0]?.length >= 2) {
          lng = mpoly[0][0][0][0];
          lat = mpoly[0][0][0][1];
        }
      }

      // 좌표 유효성 검사 (WGS84 경기도 범위: lat 36.9~38.3, lng 126.3~127.9)
      if (lat !== undefined && lng !== undefined) {
        // EPSG:4326 WGS84 좌표인지 확인
        if (lat >= 36 && lat <= 39 && lng >= 125 && lng <= 130) {
          return [lat, lng];
        }
        // EPSG:5186 좌표인 경우 (미터 단위, 큰 숫자) - 변환 시도
        if (lng > 100000 && lat > 100000) {
          // 대략적인 EPSG:5186 → WGS84 변환 (정확도 낮음, 임시용)
          // 중부원점 기준 대략적 변환
          const approxLat = 38.0 + (lat - 2000000) / 110000;
          const approxLng = 127.0 + (lng - 1000000) / 90000;
          if (approxLat >= 36 && approxLat <= 39 && approxLng >= 125 && approxLng <= 130) {
            return [approxLat, approxLng];
          }
        }
      }
    } catch {
      // 좌표 파싱 실패
    }

    return null;
  };

  // 유효한 좌표가 있는 마커 목록
  const markersData = useMemo(() => {
    const result = traceDetails
      .map((trace, idx) => {
        const pos = getMarkerPosition(trace);
        return pos ? { trace, position: pos, index: idx } : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // 개발모드: 마커 데이터 상세 로깅
    if (import.meta.env.DEV && traceDetails.length > 0) {
      console.group('📍 마커 데이터 분석');
      console.log(`총 데이터: ${traceDetails.length}건, 유효 좌표: ${result.length}건`);

      if (traceDetails[0].geometry) {
        const g = traceDetails[0].geometry;
        console.log('첫 번째 geometry 타입:', g.type);
        console.log('첫 번째 원본 좌표:', JSON.stringify(g.coordinates).substring(0, 100));
      } else {
        console.log('geometry 없음');
      }

      if (result.length > 0) {
        console.log('변환된 첫 번째 마커 좌표 [lat, lng]:', result[0].position);
        console.log('좌표 범위 확인 - 경기도(lat: 36.9~38.3, lng: 126.3~127.9)');
      } else {
        console.warn('⚠️ 유효한 좌표 없음 - 좌표계 확인 필요');
      }
      console.groupEnd();
    }

    return result;
  }, [traceDetails]);

  // 취약시설 마커용 좌표 추출 함수
  const getFacilityMarkerPosition = (facility: WeakFacilityDetail): [number, number] | null => {
    const geometry = facility.geometry;
    if (!geometry?.coordinates) return null;

    try {
      // GeoJSON은 [lng, lat] 순서 → Leaflet은 [lat, lng] 순서
      let lng: number | undefined;
      let lat: number | undefined;

      if (geometry.type === 'Point') {
        const pt = geometry.coordinates as number[];
        if (pt.length >= 2) {
          lng = pt[0];
          lat = pt[1];
        }
      } else if (geometry.type === 'Polygon') {
        const poly = geometry.coordinates as number[][][];
        if (poly[0]?.[0]?.length >= 2) {
          lng = poly[0][0][0];
          lat = poly[0][0][1];
        }
      } else if (geometry.type === 'MultiPolygon') {
        // MultiPolygon: 첫 번째 폴리곤의 첫 번째 점 사용
        const mpoly = geometry.coordinates as unknown as number[][][][];
        if (mpoly[0]?.[0]?.[0]?.length >= 2) {
          lng = mpoly[0][0][0][0];
          lat = mpoly[0][0][0][1];
        }
      }

      // 좌표 유효성 검사 (WGS84 경기도 범위)
      if (lat !== undefined && lng !== undefined) {
        if (lat >= 36 && lat <= 39 && lng >= 125 && lng <= 130) {
          return [lat, lng];
        }
      }
    } catch {
      // 좌표 파싱 실패
    }
    return null;
  };

  // 취약시설 마커 데이터
  const facilityMarkersData = useMemo(() => {
    const result = facilityDetails
      .map((facility, idx) => {
        const pos = getFacilityMarkerPosition(facility);
        return pos ? { facility, position: pos, index: idx } : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // 개발모드: 취약시설 마커 데이터 분석
    if (import.meta.env.DEV && facilityDetails.length > 0) {
      console.group('🏢 취약시설 마커 분석');
      console.log(`총 데이터: ${facilityDetails.length}건, 유효 좌표: ${result.length}건`);
      if (facilityDetails[0]) {
        console.log('첫 번째 geometry:', facilityDetails[0].geometry);
        console.log('첫 번째 coordinates:', facilityDetails[0].coordinates);
      }
      console.groupEnd();
    }

    return result;
  }, [facilityDetails]);

  // 위험등급별 마커 색상
  const getRiskGradeColor = (grade?: number): { color: string; fillColor: string } => {
    switch (grade) {
      case 3: return { color: '#ea580c', fillColor: '#fb923c' }; // 주의 - 주황
      case 4: return { color: '#b45309', fillColor: '#f59e0b' }; // 경계 - 호박
      case 5: return { color: '#dc2626', fillColor: '#ef4444' }; // 위험 - 빨강
      default: return { color: '#6b7280', fillColor: '#9ca3af' }; // 기본 - 회색
    }
  };

  // 침수흔적 상세 보기 클릭 핸들러
  const handleTraceCardClick = () => {
    if (regionStats.floodTraceCount === null || regionStats.floodTraceCount === 0) return;
    setShowTraceModal(true);
  };

  // 취약시설 상세 보기 클릭 핸들러
  const handleFacilityCardClick = () => {
    if (regionStats.weakFacilityCount === null || regionStats.weakFacilityCount === 0) return;
    setShowFacilityModal(true);
  };

  // 침수위험도 상세 보기 클릭 핸들러
  const handleDangerCardClick = () => {
    if (regionStats.floodDangerIdx === null) return;
    setShowDangerModal(true);
  };

  // 검색 실행 함수
  const handleSearch = () => {
    const q = keyword.trim();
    if (!q) {
      setSearchError("검색어를 입력해주세요.");
      return;
    }

    const foundCity = GYEONGGI_CITIES.find(
      (c) => c.name.includes(q) || c.districts.some((d) => d.name.includes(q))
    );

    if (foundCity) {
      const foundDistrict = foundCity.districts.find((d) => d.name.includes(q));
      setCityId(foundCity.id);
      if (foundDistrict) {
        setDistrictId(foundDistrict.id);
        setMapCenter([foundDistrict.center.lat, foundDistrict.center.lng]);
        setMapZoom(DISTRICT_ZOOM);
      } else {
        setDistrictId(foundCity.districts.length > 0 ? foundCity.districts[0].id : "");
        setMapCenter([foundCity.center.lat, foundCity.center.lng]);
        setMapZoom(CITY_ZOOM);
      }
      setSearchError(null);
      setKeyword("");
      // 전역 store 업데이트
      setRegion({ sido: "경기도", sigungu: foundCity.name });
    } else {
      setSearchError(`"${q}"에 해당하는 지역을 찾을 수 없습니다.`);
    }
  };

  // 엔터키 검색
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // 시/군 변경 핸들러
  const handleCityChange = (newCityId: string) => {
    const city = GYEONGGI_CITIES.find((c) => c.id === newCityId);
    if (city) {
      setCityId(newCityId);
      setDistrictId(city.districts.length > 0 ? city.districts[0].id : "");
      setMapCenter([city.center.lat, city.center.lng]);
      setMapZoom(CITY_ZOOM);
      setSearchError(null);
      // 전역 store 업데이트
      setRegion({ sido: "경기도", sigungu: city.name });
    }
  };

  // 구/읍면동 변경 핸들러
  const handleDistrictChange = (newDistrictId: string) => {
    setDistrictId(newDistrictId);
    const district = selectedCity.districts.find((d) => d.id === newDistrictId);
    if (district) {
      setMapCenter([district.center.lat, district.center.lng]);
      setMapZoom(DISTRICT_ZOOM);
    }
    setSearchError(null);
  };

  // 현재 선택된 WMS 레이어
  const activeLayer = useMemo(
    () => WMS_LAYERS.find((l) => l.id === activeLayerId) ?? WMS_LAYERS[0],
    [activeLayerId]
  );

  return (
    <div className="cs-page">
      <div className="cs-container cs-sectionTight">
        <div className="cs-pageHeader">
          <div>
            <h1 className="cs-h2">침수 위험 지도</h1>
            <p className="cs-sub">
              지역을 선택하면 해당 구역의 침수 위험(예: 침수흔적 WMS)을 지도에서 확인합니다.
            </p>
          </div>

          <div className="cs-pageHeaderRight">
            <div className="cs-pill">위험지역제보 6건</div>
            <Link to="/report" className="cs-btn cs-btnPrimary cs-btnSm">
              제보하기
            </Link>
          </div>
        </div>

        {/* Search & Select */}
        <div className="cs-panel mt-6">
          <div className="cs-panelRow">
            <div className="cs-field">
              <label className="cs-label">지역 검색</label>
              <div className="cs-searchRow">
                <input
                  className="cs-input"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="예: 수원, 영통, 분당…"
                />
                <button className="cs-btn cs-btnPrimary" onClick={handleSearch}>
                  찾기
                </button>
              </div>
              {searchError && (
                <div className="cs-toast cs-toastError">{searchError}</div>
              )}
            </div>

            <div className="cs-field">
              <label className="cs-label">시/군 선택</label>
              <select
                className="cs-select"
                value={cityId}
                onChange={(e) => handleCityChange(e.target.value)}
              >
                {GYEONGGI_CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="cs-field">
              <label className="cs-label">구 선택</label>
              <select
                className="cs-select"
                value={districtId}
                onChange={(e) => handleDistrictChange(e.target.value)}
              >
                {selectedCity.districts.length > 0 ? (
                  <>
                    <option value="">{selectedCity.name} 전체</option>
                    {selectedCity.districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </>
                ) : (
                  <option value="">{selectedCity.name} 전체</option>
                )}
              </select>
            </div>
          </div>

          <div className="cs-legendRow">
            <div className="cs-legend">
              <span className="cs-dot cs-dotHigh" /> 높음
            </div>
            <div className="cs-legend">
              <span className="cs-dot cs-dotMid" /> 보통
            </div>
            <div className="cs-legend">
              <span className="cs-dot cs-dotLow" /> 낮음
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="cs-mapWrap">
          <div className="cs-mapHeader">
            <div className="cs-mapTitle">
              선택 지역: <b>{selectedCity.name}</b>
              {selectedDistrict && <> · <b>{selectedDistrict.name}</b></>}
            </div>
            <div className="cs-mapTools">
              {/* 침수흔적 마커 토글 */}
              <button
                className={`cs-markerToggle ${showMarkers ? "is-active" : ""}`}
                onClick={() => setShowMarkers(!showMarkers)}
                title={showMarkers ? "침수흔적 마커 숨기기" : "침수흔적 마커 표시"}
              >
                📍 침수흔적 {markersData.length > 0 ? `${markersData.length}건` : ""}
                {traceLoading && " ⏳"}
              </button>
              {/* 침수취약시설 마커 토글 */}
              <button
                className={`cs-markerToggle cs-facilityMarkerToggle ${showFacilityMarkers ? "is-active" : ""}`}
                onClick={() => setShowFacilityMarkers(!showFacilityMarkers)}
                title={showFacilityMarkers ? "침수취약시설 마커 숨기기" : "침수취약시설 마커 표시"}
              >
                🏢 침수취약시설 {regionStats.weakFacilityCount ? `${regionStats.weakFacilityCount.toLocaleString()}건` : ""}
                {facilityLoading && " ⏳"}
              </button>
              <div className="cs-opacityControl">
                <span className="cs-opacityLabel">투명도</span>
                <input
                  type="range"
                  className="cs-opacitySlider"
                  min="0.3"
                  max="1"
                  step="0.1"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                />
                <span className="cs-opacityLabel">{Math.round(opacity * 100)}%</span>
              </div>
            </div>
          </div>

          {/* 레이어 탭 */}
          <div className="cs-layerTabs">
            {WMS_LAYERS.map((layer) => (
              <button
                key={layer.id}
                className={`cs-layerTab ${activeLayerId === layer.id ? "is-active" : ""}`}
                onClick={() => setActiveLayerId(layer.id)}
              >
                {layer.name}
              </button>
            ))}
          </div>

          {/* Leaflet 지도 */}
          <div className="cs-map">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ width: "100%", height: "100%" }}
              scrollWheelZoom={true}
            >
              {/* 지도 이동 컨트롤러 */}
              <MapController center={mapCenter} zoom={mapZoom} />

              {/* OSM 배경 지도 */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* WMS 오버레이 레이어 */}
              <WMSTileLayer
                key={activeLayer.id}
                url={`${WMS_BASE_URL}?apiKey=${WMS_API_KEY}`}
                layers={activeLayer.layer}
                format="image/png"
                transparent={true}
                opacity={opacity}
              />

              {/* 침수흔적 마커 */}
              {showMarkers && markersData.map(({ trace, position, index }) => (
                <CircleMarker
                  key={trace.id}
                  center={position}
                  radius={8}
                  pathOptions={{
                    color: '#dc2626',
                    fillColor: '#ef4444',
                    fillOpacity: 0.7,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="cs-markerPopup">
                      <div className="cs-markerPopupTitle">
                        {trace.districtName || `침수 발생 지역 #${index + 1}`}
                      </div>
                      {trace.hasDetailInfo ? (
                        <>
                          {trace.startDate && (
                            <div className="cs-markerPopupRow">발생일: {trace.startDate}</div>
                          )}
                          {trace.floodDepth !== undefined && (
                            <div className="cs-markerPopupRow">침수깊이: {trace.floodDepth}cm</div>
                          )}
                          {trace.causeDetail && (
                            <div className="cs-markerPopupRow cs-markerPopupCause">{trace.causeDetail}</div>
                          )}
                        </>
                      ) : (
                        <div className="cs-markerPopupRow cs-markerPopupNoData">
                          과거 침수가 발생한 지역입니다.
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {/* 취약시설 마커 */}
              {showFacilityMarkers && facilityMarkersData.map(({ facility, position }) => {
                const colors = getRiskGradeColor(facility.riskGrade);
                return (
                  <CircleMarker
                    key={facility.id}
                    center={position}
                    radius={7}
                    pathOptions={{
                      color: colors.color,
                      fillColor: colors.fillColor,
                      fillOpacity: 0.8,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="cs-markerPopup">
                        <div className="cs-markerPopupTitle">🏢 {facility.facilityName}</div>
                        <div className="cs-markerPopupRow">{facility.facilityType}</div>
                        {facility.riskLevel && (
                          <div className={`cs-markerPopupRow cs-markerPopupRisk cs-riskGrade${facility.riskGrade}`}>
                            위험등급: {facility.riskLevel}
                          </div>
                        )}
                        {facility.address && facility.address !== '상세정보 미제공' && (
                          <div className="cs-markerPopupRow">{facility.address}</div>
                        )}
                        {/* 취약사유 표시 */}
                        {facility.vulnerabilityReasons && facility.vulnerabilityReasons.length > 0 && (
                          <div className="cs-markerPopupReasons">
                            <span className="cs-markerPopupReasonsLabel">취약사유:</span>
                            <div className="cs-markerPopupReasonsTags">
                              {facility.vulnerabilityReasons.map((reason, i) => (
                                <span key={i} className="cs-markerPopupReasonTag">{reason}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>

            {/* 취약시설 레이어 범례 (flod_dngr_grd 기반) */}
            {activeLayerId === "weak-facility" && (
              <div className="cs-mapLegend">
                <div
                  className="cs-mapLegendHeader"
                  onClick={() => setLegendExpanded(!legendExpanded)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={legendExpanded}
                  aria-label={legendExpanded ? "범례 접기" : "범례 펼치기"}
                >
                  <span className="cs-mapLegendTitle">🏢 취약시설 범례</span>
                  <span className="cs-mapLegendToggle">{legendExpanded ? "▼" : "▲"}</span>
                </div>
                {legendExpanded && (
                  <div className="cs-mapLegendBody">
                    <div className="cs-mapLegendItem">
                      <span className="cs-mapLegendDot" style={{ background: "#22c55e" }} />
                      <span>안전/해당없음 (등급 0)</span>
                    </div>
                    <div className="cs-mapLegendItem">
                      <span className="cs-mapLegendDot" style={{ background: "#84cc16" }} />
                      <span>낮음 (등급 1)</span>
                    </div>
                    <div className="cs-mapLegendItem">
                      <span className="cs-mapLegendDot" style={{ background: "#eab308" }} />
                      <span>보통 (등급 2)</span>
                    </div>
                    <div className="cs-mapLegendItem">
                      <span className="cs-mapLegendDot" style={{ background: "#f97316" }} />
                      <span>주의 (등급 3)</span>
                    </div>
                    <div className="cs-mapLegendItem">
                      <span className="cs-mapLegendDot" style={{ background: "#b45309" }} />
                      <span>경계 (등급 4)</span>
                    </div>
                    <div className="cs-mapLegendItem">
                      <span className="cs-mapLegendDot" style={{ background: "#dc2626" }} />
                      <span>위험 (등급 5)</span>
                    </div>
                    <div className="cs-mapLegendItem">
                      <span className="cs-mapLegendDot" style={{ background: "#9ca3af" }} />
                      <span>기타/미분류</span>
                    </div>
                    <div className="cs-mapLegendNote">
                      표기 기준: WFS 속성 flod_dngr_grd(0~5) 샘플 분석 결과<br />
                      실제 색상은 GeoServer SLD 스타일 기반이며, 위 색상은 추정치입니다.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info Cards - WFS 데이터 연동 */}
        <div className="cs-grid3">
          {/* 침수 위험도 - 클릭하면 상세 보기 */}
          <div
            className={`cs-statCard ${regionStats.loading ? "cs-statCardLoading" : ""} ${
              regionStats.floodDangerIdx !== null ? "cs-statCardClickable" : ""
            }`}
            onClick={handleDangerCardClick}
            role={regionStats.floodDangerIdx !== null ? "button" : undefined}
            tabIndex={regionStats.floodDangerIdx !== null ? 0 : undefined}
          >
            <div className="cs-statLabel">
              침수 위험도
              <span className="cs-statHelp" title="위험도 평가지표 (레이어: tm_sigun_flod_dngr_evl_rnk)&#10;※ 과거 침수 건수와는 별개의 모형 기반 평가입니다.">ⓘ</span>
            </div>
            {regionStats.loading ? (
              <div className="cs-statValue cs-statNoData">로딩중...</div>
            ) : regionStats.floodDangerIdx !== null ? (
              <>
                <div className={`cs-statValue ${dangerLevel.className}`}>{dangerLevel.level}</div>
                <div className="cs-statDesc">
                  위험지수 {(regionStats.floodDangerIdx * 100).toFixed(1)}점
                  {regionStats.floodDangerRank && ` (경기도 ${regionStats.floodDangerRank}위)`}
                </div>
              </>
            ) : (
              <>
                <div className="cs-statValue cs-statNoData">—</div>
                <div className="cs-statDesc">데이터 미제공</div>
              </>
            )}
            <div className="cs-statSource">클릭하여 상세 보기</div>
            <div className="cs-statExplain">
              모형 기반 평가지수로, 실제 침수 기록 건수와 다를 수 있습니다.
            </div>
          </div>
          {/* 침수 흔적 건수 - 클릭하면 상세 보기 */}
          <div
            className={`cs-statCard ${regionStats.loading ? "cs-statCardLoading" : ""} ${
              regionStats.floodTraceCount ? "cs-statCardClickable" : ""
            }`}
            onClick={handleTraceCardClick}
            role={regionStats.floodTraceCount ? "button" : undefined}
            tabIndex={regionStats.floodTraceCount ? 0 : undefined}
          >
            <div className="cs-statLabel">
              침수 흔적
              <span className="cs-statHelp" title="기록된 침수흔적 건수 (레이어: tm_fldn_trce)&#10;※ 위험도 평가와는 별개로, 실제 관측/기록된 흔적입니다.">ⓘ</span>
            </div>
            {regionStats.loading ? (
              <div className="cs-statValue cs-statNoData">로딩중...</div>
            ) : regionStats.floodTraceCount !== null ? (
              <>
                <div className="cs-statValue">{regionStats.floodTraceCount}건</div>
                <div className="cs-statDesc">
                  {regionStats.floodTraceCount > 0 ? "클릭하여 상세 보기" : "기록된 흔적 없음"}
                </div>
              </>
            ) : (
              <>
                <div className="cs-statValue cs-statNoData">—</div>
                <div className="cs-statDesc">데이터 미제공</div>
              </>
            )}
            <div className="cs-statSource">과거 관측 기록</div>
            <div className="cs-statExplain">
              실제 관측·기록된 침수 흔적으로, 위험도 평가와는 별개입니다.
            </div>
          </div>
          {/* 취약시설 - 클릭하면 상세 보기 */}
          <div
            className={`cs-statCard ${regionStats.loading ? "cs-statCardLoading" : ""} ${
              regionStats.weakFacilityCount ? "cs-statCardClickable" : ""
            }`}
            onClick={handleFacilityCardClick}
            role={regionStats.weakFacilityCount ? "button" : undefined}
            tabIndex={regionStats.weakFacilityCount ? 0 : undefined}
          >
            <div className="cs-statLabel">
              침수 취약시설
              <span className="cs-statHelp" title="침수 시 피해가 우려되는 시설&#10;• 위험등급 주의(3)·경계(4)·위험(5) 시설&#10;• 지하층 보유, 침수예상지역 내 건물 포함&#10;• 건축물대장 + 홍수위험분석 결합 데이터">ⓘ</span>
            </div>
            {regionStats.loading ? (
              <div className="cs-statValue cs-statNoData">로딩중...</div>
            ) : regionStats.weakFacilityCount !== null ? (
              <>
                <div className="cs-statValue cs-riskFacility">{regionStats.weakFacilityCount.toLocaleString()}개소</div>
                <div className="cs-statDesc">
                  {regionStats.weakFacilityCount > 0 ? "주의·경계·위험 등급 시설 · 상세보기 ▶" : "해당 등급 시설 없음"}
                </div>
              </>
            ) : (
              <>
                <div className="cs-statValue cs-statNoData">—</div>
                <div className="cs-statDesc">데이터 미제공</div>
              </>
            )}
            <div className="cs-statExplain">
              홍수·도시침수 발생 시 피해 우려가 큰 건축물입니다.
            </div>
          </div>
        </div>

        {/* 침수흔적 상세 모달 */}
        {showTraceModal && (
          <Portal>
          <div className="cs-modalOverlay" onClick={() => setShowTraceModal(false)}>
            <div className="cs-modal cs-modalLarge" onClick={(e) => e.stopPropagation()}>
              <div className="cs-modalHeader">
                <h2 className="cs-modalTitle">
                  📍 {selectedCity.name} 침수흔적 상세 ({traceDetails.length}건)
                </h2>
                <button
                  className="cs-modalClose"
                  onClick={() => setShowTraceModal(false)}
                  aria-label="닫기"
                >
                  ✕
                </button>
              </div>
              <div className="cs-modalSubHeader">
                <span className="cs-modalSubText">과거 침수가 발생했던 기록입니다. 위치와 피해 정보를 확인하세요.</span>
              </div>
              <div className="cs-modalBody">
                {traceLoading ? (
                  <div className="cs-modalLoading">데이터 로딩중...</div>
                ) : traceDetails.length === 0 ? (
                  <div className="cs-modalEmpty">침수흔적 데이터가 없습니다.</div>
                ) : (
                  <div className="cs-traceList">
                    {traceDetails.map((trace, idx) => (
                      <div key={trace.id} className="cs-traceItem">
                        <div className="cs-traceNum">{idx + 1}</div>
                        <div className="cs-traceInfo">
                          {/* 지역명 표시 */}
                          <div className="cs-traceAddress">
                            {trace.districtName || `침수 발생 지역 #${idx + 1}`}
                          </div>

                          {/* 상세정보가 있는 경우 */}
                          {trace.hasDetailInfo ? (
                            <>
                              <div className="cs-traceMetaGrid">
                                {trace.startDate && (
                                  <div className="cs-traceMetaItem">
                                    <span className="cs-traceMetaLabel">발생일</span>
                                    <span className="cs-traceMetaValue">{trace.startDate}</span>
                                  </div>
                                )}
                                {trace.floodDepth !== undefined && (
                                  <div className="cs-traceMetaItem">
                                    <span className="cs-traceMetaLabel">침수깊이</span>
                                    <span className="cs-traceMetaValue">{trace.floodDepth}cm</span>
                                  </div>
                                )}
                                {trace.floodArea !== undefined && (
                                  <div className="cs-traceMetaItem">
                                    <span className="cs-traceMetaLabel">침수면적</span>
                                    <span className="cs-traceMetaValue">{trace.floodArea}㎡</span>
                                  </div>
                                )}
                              </div>
                              {trace.causeDetail && (
                                <div className="cs-traceCause">
                                  <span className="cs-traceCauseLabel">원인:</span> {trace.causeDetail}
                                </div>
                              )}
                            </>
                          ) : (
                            /* 상세정보 없음 */
                            <div className="cs-traceNoDetail">
                              상세 정보가 제공되지 않은 기록입니다.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          </Portal>
        )}

        {/* 침수취약시설 상세 모달 */}
        {showFacilityModal && (
          <Portal>
          <div className="cs-modalOverlay" onClick={() => setShowFacilityModal(false)}>
            <div className="cs-modal cs-modalLarge" onClick={(e) => e.stopPropagation()}>
              <div className="cs-modalHeader">
                <h2 className="cs-modalTitle">
                  🏢 {selectedCity.name} 침수취약시설 ({regionStats.weakFacilityCount?.toLocaleString()}개소)
                </h2>
                <button
                  className="cs-modalClose"
                  onClick={() => setShowFacilityModal(false)}
                  aria-label="닫기"
                >
                  ✕
                </button>
              </div>
              <div className="cs-modalSubHeader">
                <span className="cs-modalSubText">위험등급 주의(3)·경계(4)·위험(5) 등급 시설만 표시됩니다.</span>
              </div>
              <div className="cs-modalBody">
                {facilityLoading ? (
                  <div className="cs-modalLoading">데이터 로딩중...</div>
                ) : facilityDetails.length === 0 ? (
                  <div className="cs-modalEmpty">취약시설 데이터가 없습니다.</div>
                ) : (
                  <div className="cs-traceList">
                    {facilityDetails.map((facility, idx) => (
                      <div key={facility.id} className="cs-traceItem">
                        <div className="cs-traceNum cs-facilityNum">{idx + 1}</div>
                        <div className="cs-traceInfo">
                          <div className="cs-traceAddress">{facility.facilityName}</div>
                          <div className="cs-facilityType">{facility.facilityType}</div>
                          <div className="cs-traceMetaGrid">
                            <div className="cs-traceMetaItem">
                              <span className="cs-traceMetaLabel">건물정보</span>
                              <span className="cs-traceMetaValue">{facility.address}</span>
                            </div>
                            {facility.riskLevel && (
                              <div className="cs-traceMetaItem">
                                <span className="cs-traceMetaLabel">위험등급</span>
                                <span className={`cs-traceMetaValue cs-riskBadge cs-riskGrade${facility.riskGrade ?? ''}`}>
                                  {facility.riskLevel}
                                  {facility.riskCriteriaYear && <span className="cs-riskYear">({facility.riskCriteriaYear}년 기준)</span>}
                                </span>
                              </div>
                            )}
                          </div>
                          {/* 취약 사유 표시 */}
                          {facility.vulnerabilityReasons && facility.vulnerabilityReasons.length > 0 && (
                            <div className="cs-vulnerabilityReasons">
                              <span className="cs-vulnerabilityLabel">취약사유:</span>
                              {facility.vulnerabilityReasons.map((reason, i) => (
                                <span key={i} className="cs-vulnerabilityTag">{reason}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          </Portal>
        )}

        {/* 침수위험도 상세 모달 */}
        {showDangerModal && (
          <Portal>
          <div className="cs-modalOverlay" onClick={() => setShowDangerModal(false)}>
            <div className="cs-modal" onClick={(e) => e.stopPropagation()}>
              <div className="cs-modalHeader">
                <h2 className="cs-modalTitle">
                  ⚠️ {selectedCity.name} 침수위험도 분석
                </h2>
                <button
                  className="cs-modalClose"
                  onClick={() => setShowDangerModal(false)}
                  aria-label="닫기"
                >
                  ✕
                </button>
              </div>
              <div className="cs-modalBody">
                <div className="cs-dangerDetail">
                  {/* 위험도 등급 */}
                  <div className="cs-dangerGrade">
                    <div className={`cs-dangerGradeCircle ${dangerLevel.className}`}>
                      {dangerLevel.level}
                    </div>
                    <div className="cs-dangerGradeText">
                      <div className="cs-dangerGradeLabel">침수 위험 등급</div>
                      <div className="cs-dangerGradeDesc">
                        {dangerLevel.level === '높음' && '침수 발생 가능성이 높은 지역입니다. 호우 시 각별한 주의가 필요합니다.'}
                        {dangerLevel.level === '보통' && '침수 발생 가능성이 있는 지역입니다. 집중호우 시 주의하세요.'}
                        {dangerLevel.level === '낮음' && '침수 발생 가능성이 낮은 지역입니다.'}
                      </div>
                    </div>
                  </div>

                  {/* 상세 지표 */}
                  <div className="cs-dangerStats">
                    <div className="cs-dangerStatItem">
                      <div className="cs-dangerStatLabel">위험지수</div>
                      <div className="cs-dangerStatValue">
                        {regionStats.floodDangerIdx !== null
                          ? `${(regionStats.floodDangerIdx * 100).toFixed(1)}점`
                          : '—'}
                      </div>
                      <div className="cs-dangerStatBar">
                        <div
                          className="cs-dangerStatBarFill"
                          style={{ width: `${(regionStats.floodDangerIdx ?? 0) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="cs-dangerStatItem">
                      <div className="cs-dangerStatLabel">경기도 순위</div>
                      <div className="cs-dangerStatValue">
                        {regionStats.floodDangerRank !== null
                          ? `${regionStats.floodDangerRank}위 / 31개 시군`
                          : '—'}
                      </div>
                    </div>
                  </div>

                  {/* 안내 문구 */}
                  <div className="cs-dangerNote">
                    <div className="cs-dangerNoteTitle">📊 데이터 출처</div>
                    <div className="cs-dangerNoteText">
                      본 위험도는 경기도 기후환경 플랫폼의 홍수위험평가 모형 결과입니다.
                      지형, 배수시설, 과거 침수이력 등을 종합적으로 분석한 지표이며,
                      실제 침수 발생과는 차이가 있을 수 있습니다.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </Portal>
        )}
      </div>
    </div>
  );
}
