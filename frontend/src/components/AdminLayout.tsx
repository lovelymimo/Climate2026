import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// 관리자 이메일 목록
const ADMIN_EMAILS = ["violetyj01@gmail.com"];

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 비로그인
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h1>
          <p className="text-gray-500 mb-6">관리자 페이지에 접근하려면 로그인하세요.</p>
          <Link to="/login" className="cs-btn cs-btnPrimary">
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  // 권한 없음
  if (!ADMIN_EMAILS.includes(user.email || "")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-5xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h1>
          <p className="text-gray-500 mb-6">관리자만 접근할 수 있는 페이지입니다.</p>
          <Link to="/" className="cs-btn cs-btnGhost">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/admin" className="font-bold text-lg">
                🛡️ 기후안전허브 관리자
              </Link>
              <nav className="hidden md:flex gap-1">
                <NavLink
                  to="/admin"
                  end
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-700"
                    }`
                  }
                >
                  대시보드
                </NavLink>
                <NavLink
                  to="/admin/reports"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-700"
                    }`
                  }
                >
                  제보 관리
                </NavLink>
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-700"
                    }`
                  }
                >
                  회원 관리
                </NavLink>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-sm text-slate-300 hover:text-white">
                사이트 보기 →
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-300 hover:text-white"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <div className="md:hidden bg-slate-700 px-4 py-2 flex gap-2 overflow-x-auto">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `px-3 py-1.5 rounded text-sm whitespace-nowrap ${
              isActive ? "bg-slate-600 text-white" : "text-slate-300"
            }`
          }
        >
          대시보드
        </NavLink>
        <NavLink
          to="/admin/reports"
          className={({ isActive }) =>
            `px-3 py-1.5 rounded text-sm whitespace-nowrap ${
              isActive ? "bg-slate-600 text-white" : "text-slate-300"
            }`
          }
        >
          제보 관리
        </NavLink>
        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            `px-3 py-1.5 rounded text-sm whitespace-nowrap ${
              isActive ? "bg-slate-600 text-white" : "text-slate-300"
            }`
          }
        >
          회원 관리
        </NavLink>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

// 관리자 여부 확인 헬퍼
export function isAdmin(email: string | null | undefined): boolean {
  return ADMIN_EMAILS.includes(email || "");
}
