import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function SignupPage() {
  const navigate = useNavigate();
  const { user, signup, loginWithGoogle } = useAuth();

  // 이미 로그인된 경우 마이페이지로 리다이렉트
  useEffect(() => {
    if (user) {
      navigate("/mypage", { replace: true });
    }
  }, [user, navigate]);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 유효성 검사
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      await signup(email, password, displayName);
      navigate("/mypage");
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("email-already-in-use")) {
          setError("이미 사용 중인 이메일입니다.");
        } else if (err.message.includes("invalid-email")) {
          setError("올바른 이메일 형식이 아닙니다.");
        } else if (err.message.includes("weak-password")) {
          setError("비밀번호가 너무 약합니다. 6자 이상 입력해주세요.");
        } else {
          setError("회원가입에 실패했습니다. 다시 시도해주세요.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      await loginWithGoogle();
      navigate("/mypage");
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("popup-closed-by-user")) {
          setError("로그인이 취소되었습니다.");
        } else {
          setError("Google 로그인에 실패했습니다. 다시 시도해주세요.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cs-page">
      <div className="cs-container cs-sectionTight">
        <div className="max-w-md mx-auto">
          <div className="cs-panel p-8">
            <div className="text-center mb-8">
              <h1 className="cs-h2">회원가입</h1>
              <p className="cs-sub mt-2">기후안전허브와 함께 안전한 도시를 만들어요</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            {/* Google 회원가입 */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium text-gray-700">Google로 시작하기</span>
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">또는 이메일로 가입</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="cs-field">
                <label className="cs-label">이름 (닉네임)</label>
                <input
                  type="text"
                  className="cs-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="홍길동"
                  required
                />
              </div>

              <div className="cs-field">
                <label className="cs-label">이메일</label>
                <input
                  type="email"
                  className="cs-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div className="cs-field">
                <label className="cs-label">비밀번호</label>
                <input
                  type="password"
                  className="cs-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6자 이상 입력"
                  required
                />
              </div>

              <div className="cs-field">
                <label className="cs-label">비밀번호 확인</label>
                <input
                  type="password"
                  className="cs-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호를 다시 입력"
                  required
                />
              </div>

              <button
                type="submit"
                className="cs-btn cs-btnPrimary w-full mt-6"
                disabled={loading}
              >
                {loading ? "가입 중..." : "회원가입"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              이미 계정이 있으신가요?{" "}
              <Link to="/login" className="text-sky-600 hover:underline font-medium">
                로그인
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
