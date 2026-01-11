import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type HeaderProps = {
  drawerOpen: boolean;
  onOpenDrawer: () => void;
  onCloseDrawer: () => void;
};

// ✅ MVP 메뉴(오늘 논의된 3개만)
const NAV = [
  { label: "침수위험지도", to: "/map" },
  { label: "위험지역제보", to: "/report" },
  { label: "기업협력", to: "/partner" },
];

export function Header({ drawerOpen, onOpenDrawer, onCloseDrawer }: HeaderProps) {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      <header className="top-header">
        <div className="container header-inner">
          {/* Left: Brand */}
          <Link to="/" className="brand">
            <div className="brand-mark">🛡️</div>
            <span className="brand-text">
              <span className="brand-title">기후안전허브</span>
              <span className="brand-sub">경기도 기후안전 플랫폼</span>
            </span>
          </Link>

          {/* Center: Desktop nav */}
          <nav className="nav-desktop" aria-label="Primary">
            {NAV.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  ["nav-item", isActive ? "is-active" : ""].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right: Auth & Menu */}
          <div className="header-actions">
            {user ? (
              <>
                <Link to="/mypage" className="auth-link">
                  <span className="auth-avatar">👤</span>
                  <span className="auth-name">{profile?.displayName || user.displayName || "마이페이지"}</span>
                  {profile && (
                    <span className="auth-points">{profile.points}P</span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="auth-logout-btn"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link to="/login" className="auth-link">
                <span>로그인</span>
              </Link>
            )}
            <button
              type="button"
              className="icon-btn"
              aria-label="메뉴 열기"
              onClick={onOpenDrawer}
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* Drawer */}
      <div className={["drawer", drawerOpen ? "open" : ""].join(" ")}>
        <div className="drawer-backdrop" onClick={onCloseDrawer} />
        <aside className="drawer-panel" aria-label="전체 메뉴">
          <div className="drawer-head">
            <div className="drawer-title">전체 메뉴</div>
            <button className="icon-btn" onClick={onCloseDrawer} aria-label="닫기">
              ✕
            </button>
          </div>

          <div className="drawer-body">
            <div className="drawer-brand">
              <div className="drawer-brand-title">기후안전허브</div>
              <div className="drawer-brand-sub">
                시민과 함께 만드는 도시 기후안전 플랫폼
              </div>
            </div>

            <div className="drawer-nav">
              {NAV.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  onClick={onCloseDrawer}
                  className={({ isActive }) =>
                    ["drawer-link", isActive ? "is-active" : ""].join(" ")
                  }
                >
                  <span>{item.label}</span>
                  <span className="chev" aria-hidden>
                    ›
                  </span>
                </NavLink>
              ))}

              <div className="drawer-divider" />

              {user ? (
                <>
                  <NavLink
                    to="/mypage"
                    onClick={onCloseDrawer}
                    className={({ isActive }) =>
                      ["drawer-link", isActive ? "is-active" : ""].join(" ")
                    }
                  >
                    <span>👤 마이페이지</span>
                    <span className="chev" aria-hidden>
                      ›
                    </span>
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      onCloseDrawer();
                    }}
                    className="drawer-link drawer-logout"
                  >
                    <span>🚪 로그아웃</span>
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    onClick={onCloseDrawer}
                    className={({ isActive }) =>
                      ["drawer-link", isActive ? "is-active" : ""].join(" ")
                    }
                  >
                    <span>로그인</span>
                    <span className="chev" aria-hidden>
                      ›
                    </span>
                  </NavLink>
                  <NavLink
                    to="/signup"
                    onClick={onCloseDrawer}
                    className={({ isActive }) =>
                      ["drawer-link", isActive ? "is-active" : ""].join(" ")
                    }
                  >
                    <span>회원가입</span>
                    <span className="chev" aria-hidden>
                      ›
                    </span>
                  </NavLink>
                </>
              )}
            </div>

            <div className="drawer-foot">© Climate Safety Hub</div>
          </div>
        </aside>
      </div>
    </>
  );
}
