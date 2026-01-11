import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import emailjs from "@emailjs/browser";
import { MapContainer, TileLayer, WMSTileLayer, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { useAppStore } from "../store/AppStore";
import { Portal } from "../components/Portal";
import { GYEONGGI_CITIES, CITY_ZOOM } from "../data/gyeonggi-regions";
import {
  fetchRegionStats,
  getFloodDangerLevel,
  type RegionStats,
} from "../services/wfsService";

// 지도 이동 컨트롤러 컴포넌트
function MapController({ center, zoom }: { center: LatLngExpression; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

// 솔루션 분야 정의
const SOLUTION_CATEGORIES = [
  { id: "infiltration", name: "투수·침투", icon: "🌊" },
  { id: "storage", name: "저류·저장", icon: "💧" },
  { id: "防災", name: "방재", icon: "🏢" },
  { id: "smart", name: "스마트", icon: "📡" },
  { id: "construction", name: "설계·시공", icon: "🔧" },
  { id: "maintenance", name: "운영·유지관리", icon: "⚙️" },
];

// 솔루션 추천 카드 데이터
const SOLUTION_RECOMMENDATIONS = [
  {
    id: "infiltration",
    icon: "🌊",
    title: "투수·침투형",
    description: "우수를 땅으로 침투시켜 유출량을 저감합니다",
    reason: "침수 흔적 다수, 불투수면 비율 높음",
    tags: ["투수블럭", "침투트렌치", "침투측구"],
    isPriority: true,
  },
  {
    id: "storage",
    icon: "💧",
    title: "저류·저장형",
    description: "빗물을 일시 저장해 첨두 유출을 완화합니다",
    reason: "집중호우 시 우수관 용량 초과 우려",
    tags: ["저류조", "빗물탱크", "지하저류"],
    isPriority: false,
  },
  {
    id: "building",
    icon: "🏢",
    title: "건물·시설 방재",
    description: "건물 및 지하시설의 침수 취약점을 보강합니다",
    reason: "취약시설 다수, 등급 3 이상 존재",
    tags: ["차수판", "역류방지밸브", "배수펌프"],
    isPriority: false,
  },
  {
    id: "smart",
    icon: "📡",
    title: "스마트 모니터링",
    description: "IoT 센서로 실시간 수위를 감시하고 예측합니다",
    reason: "하천 인접 지역, 예보 연동 필요",
    tags: ["수위센서", "CCTV", "AI예측"],
    isPriority: false,
  },
];

// 샘플 협력업체 데이터
type BadgeType = "poc" | "construction" | "dataLink";

const SAMPLE_PARTNERS: Array<{
  id: string;
  name: string;
  summary: string;
  categories: string[];
  caseStudy: string;
  badges: BadgeType[];
  website?: string;
}> = [
  {
    id: "1",
    name: "(주)웨스텍글로벌",
    summary: "결합틈새투수블록 및 입체결합옹벽블록 전문",
    categories: ["투수블럭", "옹벽블록"],
    caseStudy: "투수·침투 솔루션 제공",
    badges: ["poc", "construction"],
    website: "https://westec-g.com:53538/main/main.php",
  },
  {
    id: "2",
    name: "(주)그린인프라",
    summary: "투수성 포장재 및 침투시설 전문",
    categories: ["투수블럭", "침투트렌치"],
    caseStudy: "수원시 영통구 PoC 완료",
    badges: ["poc", "construction"],
  },
  {
    id: "3",
    name: "스마트워터텍",
    summary: "IoT 기반 우수 관리 솔루션",
    categories: ["수위센서", "CCTV"],
    caseStudy: "성남시 분당구 실증 진행중",
    badges: ["poc", "dataLink"],
  },
  {
    id: "4",
    name: "한국방재솔루션",
    summary: "건물 침수 방지 설비 전문",
    categories: ["차수판", "역류방지밸브"],
    caseStudy: "안양시 시공 5건",
    badges: ["construction"],
  },
];

// 상생 구조 역할 데이터
const COLLABORATION_ROLES = [
  {
    icon: "🏛️",
    title: "지자체",
    benefits: ["데이터 기반 대상지 선정", "예산 효율화", "정책 근거 확보"],
  },
  {
    icon: "🏢",
    title: "기업",
    benefits: ["실증(PoC) 기회 확보", "레퍼런스 구축", "공공시장 확산"],
  },
  {
    icon: "👥",
    title: "시민",
    benefits: ["위험 정보 접근", "침수 피해 예방", "신고/피드백 참여"],
  },
];

// 협력 프로세스 단계
const PROCESS_STEPS = [
  { num: 1, title: "데이터 진단", desc: "침수 위험도, 취약시설 분석" },
  { num: 2, title: "제안/매칭", desc: "솔루션 분야별 기업 연결" },
  { num: 3, title: "실증(PoC)", desc: "시범 적용 후 효과 검증" },
  { num: 4, title: "확산/성과", desc: "검증된 솔루션 전역 확산" },
];

// WMS 설정
const WMS_BASE_URL = import.meta.env.VITE_GG_WMS_BASE_URL || "https://climate.gg.go.kr/ols/api/geoserver/wms";
const WMS_API_KEY = import.meta.env.VITE_GG_API_KEY || "";

export function PartnerPage() {
  const { state, setRegion } = useAppStore();
  const currentRegion = `${state.region.sigungu}${state.region.eupmyeondong ? " " + state.region.eupmyeondong : ""}`;

  // 현재 선택된 도시 찾기
  const selectedCity = useMemo(() => {
    const city = GYEONGGI_CITIES.find((c) => c.name === state.region.sigungu);
    return city ?? GYEONGGI_CITIES[0]; // 기본값: 수원시
  }, [state.region.sigungu]);

  // 지도 중심 좌표
  const mapCenter: LatLngExpression = useMemo(
    () => [selectedCity.center.lat, selectedCity.center.lng],
    [selectedCity]
  );

  // 지역 통계 데이터 (WFS)
  const [regionStats, setRegionStats] = useState<RegionStats>({
    floodDangerIdx: null,
    floodDangerRank: null,
    floodTraceCount: null,
    weakFacilityCount: null,
    loading: false,
    error: null,
  });

  // 지역 통계 로드
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

  // 위험도 등급 계산
  const dangerLevel = useMemo(
    () => getFloodDangerLevel(regionStats.floodDangerIdx),
    [regionStats.floodDangerIdx]
  );

  // 추천 솔루션 순서 계산 (지역 통계 기반)
  const sortedRecommendations = useMemo(() => {
    const recommendations = [...SOLUTION_RECOMMENDATIONS];

    // 우선순위 점수 계산
    const scores: Record<string, number> = {
      infiltration: 0,
      storage: 0,
      building: 0,
      smart: 0,
    };

    // 위험도 높음 → 방재 우선
    if (dangerLevel.level === "높음") {
      scores.building += 3;
      scores.storage += 2;
    }

    // 침수흔적 많음 (5건 이상) → 저류·저장 우선
    if (regionStats.floodTraceCount && regionStats.floodTraceCount >= 5) {
      scores.storage += 3;
      scores.infiltration += 2;
    }

    // 취약시설 많음 (10개 이상) → 스마트 모니터링 우선
    if (regionStats.weakFacilityCount && regionStats.weakFacilityCount >= 10) {
      scores.smart += 3;
      scores.building += 1;
    }

    // 기본값: 투수·침투 우선
    scores.infiltration += 1;

    // 점수순 정렬
    recommendations.sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

    // isPriority 재설정 (1위만)
    return recommendations.map((r, idx) => ({
      ...r,
      isPriority: idx === 0,
    }));
  }, [regionStats, dangerLevel]);

  // Top 3 추천 솔루션
  const top3Recommendations = useMemo(
    () => sortedRecommendations.slice(0, 3),
    [sortedRecommendations]
  );

  // 필터 상태
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");

  // 필터링된 협력업체 목록
  const filteredPartners = useMemo(() => {
    return SAMPLE_PARTNERS.filter((partner) => {
      // 카테고리 필터
      if (activeCategory) {
        const categoryMatch = partner.categories.some((cat) =>
          SOLUTION_CATEGORIES.find((sc) => sc.id === activeCategory)?.name === cat ||
          cat.includes(SOLUTION_CATEGORIES.find((sc) => sc.id === activeCategory)?.name || "")
        );
        if (!categoryMatch) return false;
      }

      // 키워드 검색 필터
      if (searchKeyword.trim()) {
        const keyword = searchKeyword.trim().toLowerCase();
        const nameMatch = partner.name.toLowerCase().includes(keyword);
        const summaryMatch = partner.summary.toLowerCase().includes(keyword);
        const categoryMatch = partner.categories.some((cat) =>
          cat.toLowerCase().includes(keyword)
        );
        if (!nameMatch && !summaryMatch && !categoryMatch) return false;
      }

      return true;
    });
  }, [activeCategory, searchKeyword]);

  // 데이터 근거 펼침 상태
  const [showDataSource, setShowDataSource] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    serviceRegion: "경기도 전역",
    categories: [] as string[],
    certifications: "",
    caseLink: "",
    pocAvailability: "available",
    message: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  // 모달 상태
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const ctaButtonRef = useRef<HTMLButtonElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // 지역 선택 모달 상태
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [tempCityId, setTempCityId] = useState(selectedCity.id);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showRegisterModal) setShowRegisterModal(false);
        if (showRegionModal) setShowRegionModal(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showRegisterModal, showRegionModal]);

  // 모달 열릴 때 첫 입력 필드 포커스
  useEffect(() => {
    if (showRegisterModal && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [showRegisterModal]);

  // 모달 닫힐 때 CTA 버튼으로 포커스 복귀
  const closeModal = () => {
    setShowRegisterModal(false);
    setTimeout(() => ctaButtonRef.current?.focus(), 0);
  };

  // 전송 상태
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // 폼 제출 핸들러 (EmailJS)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setSendError(null);

    const templateParams = {
      subject: `[협력업체 등록 문의] ${formData.companyName}`,
      company_name: formData.companyName,
      contact_name: formData.contactName,
      email: formData.email,
      phone: formData.phone,
      service_region: formData.serviceRegion,
      categories: formData.categories.map(catId => SOLUTION_CATEGORIES.find(c => c.id === catId)?.name).filter(Boolean).join(", ") || "미선택",
      certifications: formData.certifications || "없음",
      case_link: formData.caseLink || "없음",
      poc_availability: formData.pocAvailability === "available" ? "가능" : formData.pocAvailability === "negotiable" ? "협의 필요" : "불가",
      message: formData.message || "없음",
    };

    try {
      await emailjs.send(
        "service_jlrqwys",
        "template_ic23isk",
        templateParams,
        "F6BhPnURVAKpmi31q"
      );
      setFormSubmitted(true);
    } catch (error) {
      console.error("EmailJS Error:", error);
      setSendError("전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSending(false);
    }
  };

  // 카테고리 토글
  const toggleCategory = (catId: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(catId)
        ? prev.categories.filter((c) => c !== catId)
        : [...prev.categories, catId],
    }));
  };

  // 지역 선택 모달 열기
  const openRegionModal = () => {
    setTempCityId(selectedCity.id);
    setShowRegionModal(true);
  };

  // 지역 선택 적용
  const applyRegionSelection = () => {
    const city = GYEONGGI_CITIES.find((c) => c.id === tempCityId);
    if (city) {
      setRegion({ sido: "경기도", sigungu: city.name });
    }
    setShowRegionModal(false);
  };

  return (
    <div className="cs-page">
      <div className="cs-container cs-section">
        {/* 헤더 */}
        <div className="cs-pageHeader">
          <div>
            <h1 className="cs-h2">기업협력</h1>
            <p className="cs-sub">
              데이터 기반으로 지역에 맞는 침수 대응 솔루션을 연결합니다.
            </p>
          </div>
          <div className="cs-pageHeaderRight">
            <button
              ref={ctaButtonRef}
              className="cs-btn cs-btnPrimary"
              onClick={() => setShowRegisterModal(true)}
            >
              업체 등록 문의하기
            </button>
          </div>
        </div>

        {/* 상단 요약 카드 */}
        <div className="cs-grid3 mt-6">
          <div className="cs-statCard">
            <div className="cs-statLabel">📍 현재 선택 지역</div>
            <div className="cs-statValue text-lg">{currentRegion || "미선택"}</div>
            <div className="cs-statDesc">
              <button
                className="text-sky-600 hover:underline bg-transparent border-none p-0 cursor-pointer"
                onClick={openRegionModal}
              >
                지역 변경하기 →
              </button>
            </div>
          </div>
          <div className="cs-statCard">
            <div className="cs-statLabel">💡 추천 솔루션 Top 3</div>
            <div className="cs-statValue text-lg">
              {regionStats.loading ? "로딩중..." : top3Recommendations[0]?.title || "투수·침투형"}
            </div>
            <div className="cs-statDesc">
              {top3Recommendations.slice(1, 3).map((r) => r.title).join(", ") || "저류·저장형, 건물·시설 방재"}
            </div>
          </div>
          <div className="cs-statCard">
            <div className="cs-statLabel">🔄 협력 프로세스</div>
            <div className="cs-statDesc mt-2 space-y-1">
              <div>1. 데이터 진단</div>
              <div>2. 실증(PoC)</div>
              <div>3. 확산</div>
            </div>
          </div>
        </div>

        {/* 지역 지도 프리뷰 */}
        <section className="mt-8">
          <div className="cs-mapPreviewWrap">
            <div className="cs-mapPreviewHeader">
              <div>
                <h3 className="cs-mapPreviewTitle">🗺️ {selectedCity.name} 침수 위험 지도</h3>
                <p className="cs-mapPreviewDesc">
                  이 지역의 침수흔적 및 위험도 데이터를 확인하세요
                </p>
              </div>
              <Link to="/map" className="cs-btn cs-btnGhost cs-btnSm">
                상세 지도 보기 →
              </Link>
            </div>
            <div className="cs-mapPreview">
              <MapContainer
                center={mapCenter}
                zoom={CITY_ZOOM}
                style={{ width: "100%", height: "100%" }}
                scrollWheelZoom={false}
                zoomControl={false}
                dragging={false}
              >
                {/* 지도 이동 컨트롤러 */}
                <MapController center={mapCenter} zoom={CITY_ZOOM} />

                {/* OSM 배경 지도 */}
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* WMS 침수흔적 레이어 */}
                <WMSTileLayer
                  url={`${WMS_BASE_URL}?apiKey=${WMS_API_KEY}`}
                  layers="spggcee:tm_fldn_trce"
                  format="image/png"
                  transparent={true}
                  opacity={0.7}
                />
              </MapContainer>

              {/* 클릭 유도 오버레이 */}
              <Link to="/map" className="cs-mapPreviewOverlay">
                <span className="cs-mapPreviewCta">클릭하여 상세 지도 보기</span>
              </Link>
            </div>
            <div className="cs-mapPreviewLegend">
              <span className="cs-legend"><span className="cs-dot cs-dotHigh" /> 침수 위험 높음</span>
              <span className="cs-legend"><span className="cs-dot cs-dotMid" /> 침수 흔적 지역</span>
              <span className="cs-legend"><span className="cs-dot cs-dotLow" /> 안전 지역</span>
            </div>
          </div>
        </section>

        {/* 섹션 1: 지역 맞춤 추천 */}
        <section className="mt-10">
          <h2 className="cs-h2 text-lg mb-4">📊 {selectedCity.name}에 적합한 솔루션 추천</h2>

          <div className="cs-partnerGrid">
            {sortedRecommendations.map((sol) => (
              <div
                key={sol.id}
                className={`cs-partnerCard ${sol.isPriority ? "ring-2 ring-sky-200" : ""}`}
              >
                {sol.isPriority && (
                  <span className="cs-partnerBadge mb-2">우선 추천</span>
                )}
                <div className="text-2xl mb-2">{sol.icon}</div>
                <h3 className="font-bold text-gray-900">{sol.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{sol.description}</p>
                <p className="text-xs text-sky-700 mt-2 bg-sky-50 px-2 py-1 rounded">
                  추천 이유: {sol.reason}
                </p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {sol.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 데이터 근거 안내 */}
          <div className="mt-4">
            <button
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              onClick={() => setShowDataSource(!showDataSource)}
            >
              ⓘ 데이터 근거 안내 {showDataSource ? "▼" : "▶"}
            </button>
            {showDataSource && (
              <div className="mt-2 p-4 bg-gray-50 rounded-xl text-xs text-gray-600 space-y-1">
                <p>• 침수 위험도: 모형 기반 평가 지수 (tm_sigun_flod_dngr_evl_rnk)</p>
                <p>• 침수 흔적: 실제 관측·기록 데이터 (tm_fldn_trce)</p>
                <p>• 취약시설 등급: WFS 속성(flod_dngr_grd) 분석 기반, 색상은 GeoServer SLD 스타일</p>
              </div>
            )}
          </div>

          <div className="mt-4 text-right">
            <a href="#partner-list" className="cs-btn cs-btnPrimary cs-btnSm">
              추천 솔루션으로 기업 찾기 →
            </a>
          </div>
        </section>

        {/* 섹션 2: 분야별 협력업체 */}
        <section id="partner-list" className="mt-10">
          <h2 className="cs-h2 text-lg mb-4">🏢 분야별 협력업체</h2>

          {/* 필터 */}
          <div className="cs-panel p-4 mb-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {SOLUTION_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`cs-chip ${activeCategory === cat.id ? "is-active" : ""}`}
                  onClick={() =>
                    setActiveCategory(activeCategory === cat.id ? null : cat.id)
                  }
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="cs-input flex-1"
                placeholder="업체명, 솔루션 검색..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              />
              <button
                type="button"
                className="cs-btn cs-btnPrimary cs-btnSm whitespace-nowrap"
                onClick={() => {/* 검색은 실시간 필터링 */}}
              >
                검색
              </button>
            </div>
          </div>

          {/* 고지 문구 */}
          <p className="text-xs text-gray-400 mb-4">
            ℹ️ 본 목록은 광고 목적이 아닌 정보 제공용이며, 성과와 품질은 실증/검증을 통해 확인됩니다.
          </p>

          {/* 업체 리스트 */}
          {filteredPartners.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-medium">검색 결과가 없습니다</p>
              <p className="text-sm mt-1">다른 키워드나 분야로 검색해보세요</p>
            </div>
          ) : (
          <div className="cs-partnerGrid">
            {filteredPartners.map((partner) => (
              <div key={partner.id} className="cs-partnerCard">
                <h3 className="font-bold text-gray-900">{partner.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{partner.summary}</p>

                <div className="flex flex-wrap gap-1 mt-3">
                  {partner.categories.map((cat) => (
                    <span
                      key={cat}
                      className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded"
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-gray-500 mt-2">📌 {partner.caseStudy}</p>

                <div className="flex flex-wrap gap-1 mt-2">
                  {partner.badges.includes("poc") && (
                    <span className="cs-partnerBadge">✓ 실증 가능</span>
                  )}
                  {partner.badges.includes("construction") && (
                    <span className="cs-partnerBadge">✓ 시공 포함</span>
                  )}
                  {partner.badges.includes("dataLink") && (
                    <span className="cs-partnerBadge">✓ 데이터 연동</span>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <button className="cs-btn cs-btnPrimary cs-btnSm flex-1">
                    자료 요청
                  </button>
                  {partner.website ? (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cs-btn cs-btnGhost cs-btnSm flex-1 text-center"
                    >
                      상세 보기
                    </a>
                  ) : (
                    <button className="cs-btn cs-btnGhost cs-btnSm flex-1">
                      상세 보기
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}

          <div className="text-center mt-6">
            <button className="cs-btn cs-btnGhost">더 보기 (12개 업체 더)</button>
          </div>
        </section>

        {/* 섹션 3: 상생 구조 */}
        <section className="mt-10">
          <h2 className="cs-h2 text-lg mb-4">🤝 지자체·기업·시민 상생 구조</h2>

          <div className="cs-grid3">
            {COLLABORATION_ROLES.map((role) => (
              <div key={role.title} className="cs-statCard">
                <div className="text-3xl mb-2">{role.icon}</div>
                <h3 className="font-bold text-gray-900">{role.title}</h3>
                <ul className="mt-3 space-y-1 text-sm text-gray-600">
                  {role.benefits.map((benefit) => (
                    <li key={benefit}>• {benefit}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* 프로세스 타임라인 */}
          <div className="mt-6 p-5 bg-gray-50 rounded-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {PROCESS_STEPS.map((step, idx) => (
                <div key={step.num} className="flex items-center gap-3">
                  <div className="cs-processStep">
                    <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                      {step.num}
                    </div>
                    <div className="font-bold text-gray-900 mt-2">{step.title}</div>
                    <div className="text-xs text-gray-500">{step.desc}</div>
                  </div>
                  {idx < PROCESS_STEPS.length - 1 && (
                    <span className="cs-processArrow">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      {/* 업체 등록 문의 모달 */}
      {showRegisterModal && (
        <Portal>
          <div className="cs-modalOverlay" onClick={closeModal}>
            <div
              className="cs-modal cs-modalLarge"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="cs-modalHeader">
                <div>
                  <h2 className="cs-modalTitle">📝 협력업체 등록 문의</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    등록 문의는 검토 후 연락드립니다.
                  </p>
                </div>
                <button
                  className="cs-modalClose"
                  onClick={closeModal}
                  aria-label="닫기"
                >
                  ✕
                </button>
              </div>
              <div className="cs-modalBody">
                {formSubmitted ? (
                  <div className="p-6 text-center">
                    <div className="text-4xl mb-4">✅</div>
                    <div className="text-lg font-bold text-gray-900">접수 완료</div>
                    <p className="text-sm text-gray-600 mt-2">
                      담당자가 1~2영업일 내 연락드립니다.
                    </p>
                    <button
                      className="cs-btn cs-btnPrimary mt-4"
                      onClick={closeModal}
                    >
                      확인
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="cs-field">
                        <label className="cs-label">업체명 *</label>
                        <input
                          ref={firstInputRef}
                          type="text"
                          className="cs-input"
                          placeholder="(주)회사명"
                          value={formData.companyName}
                          onChange={(e) =>
                            setFormData({ ...formData, companyName: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="cs-field">
                        <label className="cs-label">담당자명 *</label>
                        <input
                          type="text"
                          className="cs-input"
                          placeholder="홍길동"
                          value={formData.contactName}
                          onChange={(e) =>
                            setFormData({ ...formData, contactName: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="cs-field">
                        <label className="cs-label">이메일 *</label>
                        <input
                          type="email"
                          className="cs-input"
                          placeholder="example@company.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="cs-field">
                        <label className="cs-label">전화번호 *</label>
                        <input
                          type="tel"
                          className="cs-input"
                          placeholder="02-1234-5678"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="cs-field mt-4">
                      <label className="cs-label">서비스 가능 지역 *</label>
                      <select
                        className="cs-select"
                        value={formData.serviceRegion}
                        onChange={(e) =>
                          setFormData({ ...formData, serviceRegion: e.target.value })
                        }
                      >
                        <option>경기도 전역</option>
                        <option>수원시</option>
                        <option>성남시</option>
                        <option>용인시</option>
                        <option>안양시</option>
                        <option>기타 (메시지에 기재)</option>
                      </select>
                    </div>

                    <div className="cs-field mt-4">
                      <label className="cs-label">제공 솔루션 분야 * (복수 선택)</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {SOLUTION_CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            className={`cs-chip ${formData.categories.includes(cat.id) ? "is-active" : ""}`}
                            onClick={() => toggleCategory(cat.id)}
                          >
                            {cat.icon} {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="cs-field mt-4">
                      <label className="cs-label">보유 인증/특허 (선택)</label>
                      <input
                        type="text"
                        className="cs-input"
                        placeholder="ISO 9001, 특허 제00호"
                        value={formData.certifications}
                        onChange={(e) =>
                          setFormData({ ...formData, certifications: e.target.value })
                        }
                      />
                    </div>

                    <div className="cs-field mt-4">
                      <label className="cs-label">적용 사례 링크 (선택)</label>
                      <input
                        type="url"
                        className="cs-input"
                        placeholder="https://..."
                        value={formData.caseLink}
                        onChange={(e) =>
                          setFormData({ ...formData, caseLink: e.target.value })
                        }
                      />
                    </div>

                    <div className="cs-field mt-4">
                      <label className="cs-label">실증(PoC) 참여 가능 *</label>
                      <div className="flex gap-4 mt-2">
                        {[
                          { value: "available", label: "가능" },
                          { value: "negotiable", label: "협의 필요" },
                          { value: "unavailable", label: "불가" },
                        ].map((opt) => (
                          <label key={opt.value} className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name="pocAvailability"
                              value={opt.value}
                              checked={formData.pocAvailability === opt.value}
                              onChange={(e) =>
                                setFormData({ ...formData, pocAvailability: e.target.value })
                              }
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="cs-field mt-4">
                      <label className="cs-label">추가 메시지 (선택)</label>
                      <textarea
                        className="cs-textarea"
                        placeholder="문의 내용을 자유롭게 작성해주세요"
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                      />
                    </div>

                    {sendError && (
                      <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                        {sendError}
                      </div>
                    )}

                    <div className="mt-6 flex gap-3 justify-end">
                      <button
                        type="button"
                        className="cs-btn cs-btnGhost"
                        onClick={closeModal}
                        disabled={isSending}
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="cs-btn cs-btnPrimary"
                        disabled={isSending}
                      >
                        {isSending ? "전송 중..." : "등록 문의 제출"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* 지역 선택 모달 */}
      {showRegionModal && (
        <Portal>
          <div className="cs-modalOverlay" onClick={() => setShowRegionModal(false)}>
            <div
              className="cs-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="cs-modalHeader">
                <h2 className="cs-modalTitle">📍 지역 선택</h2>
                <button
                  className="cs-modalClose"
                  onClick={() => setShowRegionModal(false)}
                  aria-label="닫기"
                >
                  ✕
                </button>
              </div>
              <div className="cs-modalBody">
                <p className="text-sm text-gray-600 mb-4">
                  협력 솔루션을 확인할 지역을 선택하세요.
                </p>
                <div className="cs-regionGrid">
                  {GYEONGGI_CITIES.map((city) => (
                    <button
                      key={city.id}
                      className={`cs-regionItem ${tempCityId === city.id ? "is-selected" : ""}`}
                      onClick={() => setTempCityId(city.id)}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    className="cs-btn cs-btnGhost"
                    onClick={() => setShowRegionModal(false)}
                  >
                    취소
                  </button>
                  <button
                    className="cs-btn cs-btnPrimary"
                    onClick={applyRegionSelection}
                  >
                    적용
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
