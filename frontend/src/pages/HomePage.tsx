import { Link } from "react-router-dom";
import logoImg from "../assets/logo.png";
import { useAuth } from "../contexts/AuthContext";

export function HomePage() {
  const { user, profile } = useAuth();

  return (
    <div className="cs-page">
      {/* Hero */}
      <section className="cs-hero">
        <div className="cs-container">
          <div className="cs-heroGrid">
            <div className="cs-heroText">
              <p className="cs-badge">경기도 기후안전 플랫폼</p>
              <h1 className="cs-h1">
                우리 동네 침수 위험,
                <br />
                <span className="cs-h1Accent">미리 확인하고 대비하세요</span>
              </h1>
              <p className="cs-lead">
                경기도 31개 시·군의 침수 위험 정보를 지도에서 확인하고,
                위험 지역을 직접 제보하여 안전한 도시를 함께 만들어갑니다.
              </p>

              <div className="cs-ctaRow">
                <Link to="/map" className="cs-btn cs-btnPrimary">
                  침수위험지도 보기
                </Link>
                <Link to="/report" className="cs-btn cs-btnGhost">
                  위험지역 제보하기
                </Link>
              </div>

              <div className="cs-miniStats">
                <div className="cs-miniStat">
                  <div className="cs-miniStatValue">31</div>
                  <div className="cs-miniStatLabel">경기도 시·군</div>
                </div>
                <div className="cs-miniStat">
                  <div className="cs-miniStatValue">실시간</div>
                  <div className="cs-miniStatLabel">침수 위험 정보</div>
                </div>
                <div className="cs-miniStat">
                  <div className="cs-miniStatValue">시민</div>
                  <div className="cs-miniStatLabel">참여 제보</div>
                </div>
              </div>
            </div>

            {/* Hero visual */}
            <div className="cs-heroVisual">
              <div className="cs-heroCard">
                <div className="cs-logoWrap cs-logoWrapCenter">
                  <img
                    src={logoImg}
                    alt="기후안전허브"
                    className="cs-logoImgLarge"
                  />
                </div>

                <div className="cs-heroCardBody">
                  {user && profile ? (
                    <>
                      {/* 로그인 사용자: 내 정보 표시 */}
                      <div className="cs-myInfo">
                        <div className="cs-myInfoHeader">
                          <span className="cs-myInfoName">{profile.displayName}님</span>
                          <span className="cs-myInfoBadge">
                            {profile.level === "gold" ? "🥇" : profile.level === "silver" ? "🥈" : "🥉"}
                            {profile.level === "gold" ? "골드" : profile.level === "silver" ? "실버" : "브론즈"}
                          </span>
                        </div>
                        <div className="cs-myInfoStats">
                          <div className="cs-myInfoStat">
                            <div className="cs-myInfoStatValue">{profile.points}P</div>
                            <div className="cs-myInfoStatLabel">내 포인트</div>
                          </div>
                          <div className="cs-myInfoStat">
                            <div className="cs-myInfoStatValue">{profile.reportCount}건</div>
                            <div className="cs-myInfoStatLabel">내 제보</div>
                          </div>
                        </div>
                        <Link to="/mypage" className="cs-myInfoLink">
                          마이페이지 →
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* 비로그인: 일반 통계 표시 */}
                      <div className="cs-kpiGrid">
                        <div className="cs-kpi">
                          <div className="cs-kpiLabel">위험지역제보</div>
                          <div className="cs-kpiValue">6건</div>
                        </div>
                        <div className="cs-kpi">
                          <div className="cs-kpiLabel">협력기업</div>
                          <div className="cs-kpiValue">4곳</div>
                        </div>
                        <div className="cs-kpi">
                          <div className="cs-kpiLabel">안전 포인트</div>
                          <div className="cs-kpiValue">75P</div>
                        </div>
                      </div>

                      <div className="cs-note">
                        "시민의 한 번의 제보가, 우리 동네를 더 안전하게 만듭니다."
                      </div>

                      <Link to="/login" className="cs-loginPrompt">
                        로그인하고 포인트 적립하기 →
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="cs-section">
        <div className="cs-container">
          <div className="cs-sectionHeader">
            <h2 className="cs-h2">주요 서비스</h2>
            <p className="cs-sub">
              기후안전허브에서 제공하는 핵심 기능을 소개합니다.
            </p>
          </div>

          <div className="cs-featureGrid">
            <div className="cs-card">
              <div className="cs-cardIcon">🗺️</div>
              <h3 className="cs-cardTitle">침수위험지도</h3>
              <p className="cs-cardDesc">
                침수흔적, 침수위험도, 취약시설 정보를 지도에서 한눈에 확인합니다.
              </p>
              <Link to="/map" className="cs-link">
                지도 보기 →
              </Link>
            </div>

            <div className="cs-card">
              <div className="cs-cardIcon">📢</div>
              <h3 className="cs-cardTitle">위험지역제보</h3>
              <p className="cs-cardDesc">
                침수, 배수 문제 등 위험지역을 제보하고 기후안전 포인트를 적립하세요.
              </p>
              <Link to="/report" className="cs-link">
                제보하기 →
              </Link>
            </div>

            <div className="cs-card">
              <div className="cs-cardIcon">🤝</div>
              <h3 className="cs-cardTitle">기업협력</h3>
              <p className="cs-cardDesc">
                지역 맞춤 침수 대응 솔루션을 제공하는 기업을 연결합니다.
              </p>
              <Link to="/partner" className="cs-link">
                협력기업 보기 →
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
