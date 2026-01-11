import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../components/AdminLayout";
import {
  fetchAdminStats,
  fetchAllReports,
  type AdminStats,
  type AdminReport,
} from "../../services/adminService";

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentReports, setRecentReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [statsData, reportsData] = await Promise.all([
        fetchAdminStats(),
        fetchAllReports(),
      ]);
      setStats(statsData);
      setRecentReports(reportsData.slice(0, 5));
      setLoading(false);
    };
    loadData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">대기중</span>;
      case "reviewing":
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">검토중</span>;
      case "completed":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">완료</span>;
      case "rejected":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">반려</span>;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "flood": return "🌊 침수";
      case "drain": return "🚰 배수";
      default: return "📌 기타";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-500 mt-1">기후안전허브 현황을 한눈에 확인하세요.</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-500">데이터 로딩 중...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-sm text-gray-500">총 회원</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">
                  {stats?.totalUsers || 0}
                  <span className="text-sm font-normal text-gray-400 ml-1">명</span>
                </div>
                <div className="text-xs text-green-600 mt-2">
                  오늘 +{stats?.todayUsers || 0}명
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-sm text-gray-500">총 제보</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">
                  {stats?.totalReports || 0}
                  <span className="text-sm font-normal text-gray-400 ml-1">건</span>
                </div>
                <div className="text-xs text-green-600 mt-2">
                  오늘 +{stats?.todayReports || 0}건
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-sm text-gray-500">처리 대기</div>
                <div className="text-3xl font-bold text-orange-600 mt-1">
                  {stats?.pendingReports || 0}
                  <span className="text-sm font-normal text-gray-400 ml-1">건</span>
                </div>
                {(stats?.pendingReports || 0) > 0 && (
                  <Link to="/admin/reports" className="text-xs text-sky-600 mt-2 inline-block hover:underline">
                    처리하러 가기 →
                  </Link>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-sm text-gray-500">발행 포인트</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">
                  {stats?.totalPoints?.toLocaleString() || 0}
                  <span className="text-sm font-normal text-gray-400 ml-1">P</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/admin/reports"
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center text-xl">
                  📋
                </div>
                <div>
                  <div className="font-medium text-gray-900">제보 관리</div>
                  <div className="text-xs text-gray-500">전체 제보 보기</div>
                </div>
              </Link>

              <Link
                to="/admin/users"
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-xl">
                  👥
                </div>
                <div>
                  <div className="font-medium text-gray-900">회원 관리</div>
                  <div className="text-xs text-gray-500">전체 회원 보기</div>
                </div>
              </Link>

              <Link
                to="/"
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-xl">
                  🌐
                </div>
                <div>
                  <div className="font-medium text-gray-900">사이트 보기</div>
                  <div className="text-xs text-gray-500">메인 페이지</div>
                </div>
              </Link>

              <Link
                to="/map"
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-xl">
                  🗺️
                </div>
                <div>
                  <div className="font-medium text-gray-900">침수위험지도</div>
                  <div className="text-xs text-gray-500">지도 확인</div>
                </div>
              </Link>
            </div>

            {/* Recent Reports */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">최근 제보</h2>
                <Link to="/admin/reports" className="text-sm text-sky-600 hover:underline">
                  전체 보기 →
                </Link>
              </div>

              {recentReports.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  아직 제보가 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentReports.map((report) => (
                    <div key={report.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-xl">{getTypeLabel(report.type).split(" ")[0]}</div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {report.address || "주소 미입력"}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {report.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(report.status)}
                        <div className="text-xs text-gray-400">
                          {report.createdAt.toLocaleDateString("ko-KR")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
