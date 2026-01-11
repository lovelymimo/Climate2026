import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// 등급 정보
const LEVEL_INFO = {
  bronze: { name: "브론즈", icon: "🥉", color: "text-amber-600", nextLevel: "실버", nextPoints: 200 },
  silver: { name: "실버", icon: "🥈", color: "text-gray-500", nextLevel: "골드", nextPoints: 500 },
  gold: { name: "골드", icon: "🥇", color: "text-yellow-500", nextLevel: null, nextPoints: null },
};

// 제보 상태 정보
const STATUS_INFO = {
  pending: { label: "접수", color: "bg-gray-100 text-gray-600" },
  reviewing: { label: "검토중", color: "bg-sky-100 text-sky-600" },
  completed: { label: "반영완료", color: "bg-green-100 text-green-600" },
};

// 제보 유형 정보
const TYPE_INFO = {
  flood: { label: "침수", icon: "🌊" },
  drain: { label: "배수 문제", icon: "🚰" },
  etc: { label: "기타", icon: "📌" },
};

export function MyPage() {
  const { user, profile, reports, loading } = useAuth();

  // 로그인하지 않은 경우
  if (!loading && !user) {
    return (
      <div className="cs-page">
        <div className="cs-container cs-sectionTight">
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="cs-h2">로그인이 필요합니다</h1>
            <p className="cs-sub mt-2">마이페이지를 이용하려면 로그인해주세요.</p>
            <div className="cs-ctaRow mt-6 justify-center">
              <Link to="/login" className="cs-btn cs-btnPrimary">
                로그인
              </Link>
              <Link to="/signup" className="cs-btn cs-btnGhost">
                회원가입
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 로딩 중
  if (loading) {
    return (
      <div className="cs-page">
        <div className="cs-container cs-sectionTight">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-500">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  const levelInfo = profile?.level ? LEVEL_INFO[profile.level] : LEVEL_INFO.bronze;
  const progressToNext = levelInfo.nextPoints
    ? Math.min(100, ((profile?.points || 0) / levelInfo.nextPoints) * 100)
    : 100;

  return (
    <div className="cs-page">
      <div className="cs-container cs-sectionTight">
        <div className="cs-pageHeader">
          <div>
            <h1 className="cs-h2">마이페이지</h1>
            <p className="cs-sub">내 활동과 포인트를 확인하세요</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          {/* 왼쪽: 프로필 정보 */}
          <div className="lg:col-span-1 space-y-4">
            {/* 프로필 카드 */}
            <div className="cs-panel p-6 text-center">
              <div className="text-5xl mb-3">{levelInfo.icon}</div>
              <h2 className="text-xl font-bold text-gray-900">
                {profile?.displayName || "사용자"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{profile?.email}</p>
              <div className={`inline-block mt-3 px-3 py-1 rounded-full text-sm font-medium ${levelInfo.color} bg-gray-100`}>
                {levelInfo.name} 등급
              </div>
            </div>

          </div>

          {/* 오른쪽: 포인트 및 제보 기록 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 포인트 현황 */}
            <div className="cs-panel p-6">
              <h3 className="font-bold text-gray-900 mb-4">기후안전 포인트</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-bold text-sky-600">
                  {profile?.points || 0}P
                </span>
                <span className="text-sm text-gray-500">
                  제보 {profile?.reportCount || 0}건
                </span>
              </div>

              {/* 등급 진행 바 */}
              {levelInfo.nextLevel && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{levelInfo.name}</span>
                    <span>{levelInfo.nextLevel}까지 {levelInfo.nextPoints! - (profile?.points || 0)}P</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all"
                      style={{ width: `${progressToNext}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-sky-50 rounded-lg text-sm text-gray-600">
                <p className="font-medium text-gray-800 mb-1">포인트 적립 방법</p>
                <ul className="space-y-1 text-xs">
                  <li>• 위험지역 제보: +10P</li>
                  <li>• 우수 제보 선정: +20P 추가</li>
                  <li>• 제보 반영 완료: +5P 추가</li>
                </ul>
              </div>
            </div>

            {/* 제보 기록 */}
            <div className="cs-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">내 제보 기록</h3>
                <Link to="/report" className="cs-btn cs-btnPrimary cs-btnSm">
                  새 제보하기
                </Link>
              </div>

              {reports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📝</div>
                  <p>아직 제보 기록이 없습니다</p>
                  <Link to="/report" className="text-sky-600 hover:underline text-sm mt-2 inline-block">
                    첫 제보하러 가기 →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => {
                    const typeInfo = TYPE_INFO[report.type];
                    const statusInfo = STATUS_INFO[report.status];

                    return (
                      <div
                        key={report.id}
                        className="p-4 bg-gray-50 rounded-xl"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{typeInfo.icon}</span>
                            <div>
                              <div className="font-medium text-gray-900">
                                {typeInfo.label}
                              </div>
                              <div className="text-sm text-gray-500">
                                {report.address}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            <div className="text-xs text-gray-400 mt-1">
                              +{report.points}P
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {report.description}
                        </p>
                        <div className="text-xs text-gray-400 mt-2">
                          {report.createdAt.toLocaleDateString("ko-KR")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
