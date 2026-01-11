import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";
import { useAuth } from "../contexts/AuthContext";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";

// Leaflet 기본 마커 아이콘 설정 (웹팩 이슈 해결)
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadowUrl from "leaflet/dist/images/marker-shadow.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

type ReportType = "flood" | "drain" | "etc";

// 경기도 중심 좌표 (기본값)
const GYEONGGI_CENTER: LatLngExpression = [37.4138, 127.5183];
const DEFAULT_ZOOM = 10;
const SEARCH_ZOOM = 16;

// 지도 이동 컨트롤러
function MapController({ center, zoom }: { center: LatLngExpression; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

// Nominatim 지오코딩 (OpenStreetMap 무료 서비스)
async function geocodeAddress(query: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  try {
    // 경기도 범위 내 검색 우선
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + " 경기도 대한민국")}&limit=1&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "ko",
      },
    });
    const data = await res.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

export function ReportPage() {
  const navigate = useNavigate();
  const { user, addReport } = useAuth();
  const [type, setType] = useState<ReportType>("flood");
  const [address, setAddress] = useState("");
  const [detail, setDetail] = useState("");
  const [photoName, setPhotoName] = useState<string>("");
  const [contact, setContact] = useState("");

  // 지도 관련 상태
  const [mapCenter, setMapCenter] = useState<LatLngExpression>(GYEONGGI_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [markerPosition, setMarkerPosition] = useState<LatLngExpression | null>(null);
  const [searchStatus, setSearchStatus] = useState<"idle" | "loading" | "success" | "error" | "manual">("idle");
  const [foundAddress, setFoundAddress] = useState<string>("");

  const count = detail.length;

  // 유효성 검사
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (address.trim().length === 0) {
      errors.push("위치를 입력해주세요");
    }
    if (detail.trim().length === 0) {
      errors.push("상세 설명을 입력해주세요");
    } else if (detail.trim().length < 10) {
      errors.push(`상세 설명 ${10 - detail.trim().length}자 더 입력해주세요`);
    }
    return errors;
  }, [address, detail]);

  const canSubmit = validationErrors.length === 0;

  // 주소 검색 핸들러
  const handleSearchAddress = async () => {
    const query = address.trim();
    if (!query) return;

    setSearchStatus("loading");
    const result = await geocodeAddress(query);

    if (result) {
      const pos: LatLngExpression = [result.lat, result.lng];
      setMapCenter(pos);
      setMapZoom(SEARCH_ZOOM);
      setMarkerPosition(pos);
      setFoundAddress(result.displayName);
      setSearchStatus("success");
    } else {
      setSearchStatus("error");
      setFoundAddress("");
    }
  };

  // 현재 위치 가져오기 (Geolocation API)
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저에서는 위치 서비스를 지원하지 않습니다.");
      return;
    }

    setSearchStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const pos: LatLngExpression = [latitude, longitude];
        setMapCenter(pos);
        setMapZoom(SEARCH_ZOOM);
        setMarkerPosition(pos);

        // 역지오코딩으로 주소 가져오기
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
          const res = await fetch(url, {
            headers: { "Accept-Language": "ko" },
          });
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name.split(",").slice(0, 3).join(", "));
            setFoundAddress(data.display_name);
          }
        } catch {
          setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
        setSearchStatus("success");
      },
      (error) => {
        console.error("Geolocation error:", error);
        setSearchStatus("error");
        alert("위치를 가져올 수 없습니다. 위치 권한을 확인해주세요.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 엔터키로 검색
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchAddress();
    }
  };

  // 전송 상태
  const [isSending, setIsSending] = useState(false);

  // 제보 제출 핸들러 (EmailJS)
  const onSubmit = async () => {
    setIsSending(true);

    // 제보 유형 텍스트
    const typeText = type === "flood" ? "침수" : type === "drain" ? "배수 문제" : "기타";

    // 좌표 정보
    const coords = markerPosition
      ? `${(markerPosition as [number, number])[0].toFixed(6)}, ${(markerPosition as [number, number])[1].toFixed(6)}`
      : "미지정";

    const templateParams = {
      subject: `[위험지역제보] ${typeText} - ${address || "위치미상"}`,
      report_type: typeText,
      address: address || "미입력",
      address_detail: foundAddress || "검색 안됨",
      coordinates: coords,
      description: detail,
      photo_name: photoName || "없음",
      contact: contact || "미입력",
    };

    try {
      // 이메일 전송
      await emailjs.send(
        "service_jlrqwys",
        "template_xq2mpll",
        templateParams,
        "F6BhPnURVAKpmi31q"
      );

      // 로그인된 사용자인 경우 Firestore에도 저장
      if (user) {
        await addReport({
          type,
          address: address || "미입력",
          addressDetail: foundAddress || "검색 안됨",
          coordinates: coords,
          description: detail,
          contact: contact || "미입력",
        });
      }

      // 완료 페이지로 이동
      navigate("/report/complete");
    } catch (error) {
      console.error("Report Error:", error);
      alert("전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="cs-page">
      <div className="cs-container cs-sectionTight">
        <div className="cs-pageHeader">
          <div>
            <h1 className="cs-h2">위험지역 제보</h1>
            <p className="cs-sub">
              사진 한 장·설명 한 줄이 우리 동네의 예방 데이터를 만듭니다.
            </p>
          </div>
          <div className="cs-pill">기후안전 포인트 +10~+20</div>
        </div>

        <div className="cs-formGrid mt-6">
          {/* Left: Form */}
          <div className="cs-panel">
            <div className="cs-field">
              <label className="cs-label">제보 유형</label>
              <div className="cs-chipRow">
                <button
                  type="button"
                  className={`cs-chip ${type === "flood" ? "is-active" : ""}`}
                  onClick={() => setType("flood")}
                >
                  🌧️ 침수
                </button>
                <button
                  type="button"
                  className={`cs-chip ${type === "drain" ? "is-active" : ""}`}
                  onClick={() => setType("drain")}
                >
                  🧱 배수 문제
                </button>
                <button
                  type="button"
                  className={`cs-chip ${type === "etc" ? "is-active" : ""}`}
                  onClick={() => setType("etc")}
                >
                  📌 기타
                </button>
              </div>
            </div>

            <div className="cs-field">
              <label className="cs-label">위치</label>
              <div className="cs-inline">
                <input
                  className="cs-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="예: 수원시 영통구 …"
                />
                <button
                  type="button"
                  className="cs-btn cs-btnGhost cs-btnSm whitespace-nowrap"
                  onClick={handleSearchAddress}
                  disabled={searchStatus === "loading"}
                >
                  검색
                </button>
                <button
                  type="button"
                  className="cs-btn cs-btnGhost cs-btnSm whitespace-nowrap"
                  onClick={handleGetCurrentLocation}
                  disabled={searchStatus === "loading"}
                >
                  현재위치
                </button>
              </div>
              {searchStatus === "loading" && (
                <div className="cs-help cs-helpLoading">위치 검색 중...</div>
              )}
              {searchStatus === "success" && foundAddress && (
                <div className="cs-help cs-helpSuccess">📍 {foundAddress.split(",").slice(0, 4).join(", ")}</div>
              )}
              {searchStatus === "error" && (
                <div className="cs-help cs-helpError">
                  주소를 찾을 수 없습니다.{" "}
                  <button
                    type="button"
                    className="text-sky-600 underline hover:text-sky-800"
                    onClick={() => {
                      setFoundAddress(address);
                      setSearchStatus("manual");
                    }}
                  >
                    직접 입력으로 진행
                  </button>
                </div>
              )}
              {searchStatus === "manual" && (
                <div className="cs-help cs-helpSuccess">📝 직접 입력: {address}</div>
              )}
            </div>

            {/* 지도 미리보기 */}
            <div className="cs-field">
              <label className="cs-label">위치 미리보기</label>
              <div className="cs-reportMapWrap">
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ width: "100%", height: "100%" }}
                  scrollWheelZoom={true}
                >
                  <MapController center={mapCenter} zoom={mapZoom} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {markerPosition && <Marker position={markerPosition} />}
                </MapContainer>
              </div>
              <div className="cs-help">주소를 입력하고 검색 버튼을 누르거나, 현재위치 버튼으로 위치를 확인하세요.</div>
            </div>

            <div className="cs-field">
              <label className="cs-label">사진 (선택)</label>
              <label className="cs-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setPhotoName(file?.name ?? "");
                  }}
                />
                <div>
                  <div className="cs-uploadTitle">사진 첨부하기</div>
                  <div className="cs-uploadDesc">
                    {photoName ? `선택됨: ${photoName}` : "균열/침수 흔적이 선명할수록 우수 제보(추가 포인트) 가능"}
                  </div>
                </div>
              </label>
            </div>

            <div className="cs-field">
              <label className="cs-label">상세 설명</label>
              <textarea
                className="cs-textarea"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="무엇이, 어디서, 언제부터, 얼마나 위험해 보이는지 간단히 적어주세요. (최소 10자)"
                maxLength={200}
              />
              <div className="cs-counter">{count}/200</div>
            </div>

            <div className="cs-field">
              <label className="cs-label">연락처 (선택)</label>
              <input
                className="cs-input"
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="전화번호 또는 이메일 (추가 확인 시 연락드립니다)"
              />
              <div className="cs-help">제보 내용 확인이 필요한 경우에만 연락드립니다.</div>
            </div>

            <div className="cs-actions mt-8">
              {/* 유효성 검사 메시지 */}
              {validationErrors.length > 0 && (
                <div className="cs-validation-errors">
                  {validationErrors.map((error, idx) => (
                    <div key={idx} className="cs-validation-error">
                      <span className="cs-validation-icon">!</span>
                      {error}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                className={`cs-btn cs-btnPrimary ${!canSubmit || isSending ? "is-disabled" : ""}`}
                disabled={!canSubmit || isSending}
                onClick={onSubmit}
              >
                {isSending ? "전송 중..." : "제보 등록하기"}
              </button>
              <div className="cs-help">
                등록 후 <b>기후안전 포인트</b>가 적립됩니다. (우수 제보는 추가 +20)
              </div>
            </div>
          </div>

          {/* Right: Guide */}
          <div className="cs-sideCard">
            <div className="cs-sideTitle">우수 제보 팁</div>
            <ul className="cs-list">
              <li>위치가 명확하게 보이게(표지판/건물명)</li>
              <li>침수 흔적/막힘/균열은 가까이서 선명하게</li>
              <li>가능하면 "비 온 직후" 촬영</li>
              <li>위험이 크면 112/119 등 즉시 신고가 우선</li>
            </ul>

            <div className="cs-divider" />

            <div className="cs-sideTitle">포인트 사용 예시</div>
            <ul className="cs-list">
              <li>지역화폐 일부 전환</li>
              <li>동네 카페·상점 할인</li>
              <li>공공시설(체육관/도서관) 할인</li>
              <li>지역 기후안전 기금 기부</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
