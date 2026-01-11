import { useEffect, useState } from "react";
import { AdminLayout } from "../../components/AdminLayout";
import {
  fetchAllReports,
  updateReportStatus,
  type AdminReport,
} from "../../services/adminService";

type StatusFilter = "all" | "pending" | "reviewing" | "completed" | "rejected";
type TypeFilter = "all" | "flood" | "drain" | "etc";

export function AdminReports() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    const data = await fetchAllReports();
    setReports(data);
    setLoading(false);
  };

  const filteredReports = reports.filter((report) => {
    if (statusFilter !== "all" && report.status !== statusFilter) return false;
    if (typeFilter !== "all" && report.type !== typeFilter) return false;
    return true;
  });

  const handleStatusChange = async (reportId: string, newStatus: AdminReport["status"]) => {
    setUpdating(true);
    const success = await updateReportStatus(reportId, newStatus);
    if (success) {
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
      if (selectedReport?.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }
    } else {
      alert("상태 변경에 실패했습니다.");
    }
    setUpdating(false);
  };

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
      case "drain": return "🚰 배수 문제";
      default: return "📌 기타";
    }
  };

  const statusCounts = {
    all: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    reviewing: reports.filter((r) => r.status === "reviewing").length,
    completed: reports.filter((r) => r.status === "completed").length,
    rejected: reports.filter((r) => r.status === "rejected").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">제보 관리</h1>
          <p className="text-gray-500 mt-1">시민 제보를 검토하고 처리 상태를 관리합니다.</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">상태:</span>
              <div className="flex gap-1">
                {(["all", "pending", "reviewing", "completed", "rejected"] as StatusFilter[]).map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        statusFilter === status
                          ? "bg-slate-800 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {status === "all" && `전체 (${statusCounts.all})`}
                      {status === "pending" && `대기중 (${statusCounts.pending})`}
                      {status === "reviewing" && `검토중 (${statusCounts.reviewing})`}
                      {status === "completed" && `완료 (${statusCounts.completed})`}
                      {status === "rejected" && `반려 (${statusCounts.rejected})`}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">유형:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200"
              >
                <option value="all">전체</option>
                <option value="flood">침수</option>
                <option value="drain">배수 문제</option>
                <option value="etc">기타</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-500">데이터 로딩 중...</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Report List */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">
                  제보 목록 ({filteredReports.length}건)
                </h2>
              </div>

              {filteredReports.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  해당 조건의 제보가 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {filteredReports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`px-6 py-4 cursor-pointer transition-colors ${
                        selectedReport?.id === report.id
                          ? "bg-sky-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getTypeLabel(report.type).split(" ")[0]}</span>
                            <span className="font-medium text-gray-900 truncate">
                              {report.address || "주소 미입력"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {report.description}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-4">
                          {getStatusBadge(report.status)}
                          <span className="text-xs text-gray-400">
                            {report.createdAt.toLocaleDateString("ko-KR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Report Detail */}
            <div className="lg:col-span-1">
              {selectedReport ? (
                <div className="bg-white rounded-xl shadow-sm sticky top-4">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900">제보 상세</h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">유형</div>
                      <div className="font-medium">{getTypeLabel(selectedReport.type)}</div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">위치</div>
                      <div className="font-medium">{selectedReport.address || "미입력"}</div>
                      {selectedReport.addressDetail && (
                        <div className="text-sm text-gray-500">{selectedReport.addressDetail}</div>
                      )}
                      {selectedReport.coordinates && (
                        <div className="text-xs text-gray-400 mt-1">
                          좌표: {selectedReport.coordinates}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">상세 설명</div>
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {selectedReport.description}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">연락처</div>
                      <div className="font-medium">{selectedReport.contact || "미입력"}</div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">제보일시</div>
                      <div className="font-medium">
                        {selectedReport.createdAt.toLocaleString("ko-KR")}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">적립 포인트</div>
                      <div className="font-medium text-sky-600">+{selectedReport.points}P</div>
                    </div>

                    {/* Status Change */}
                    <div className="border-t pt-4">
                      <div className="text-xs text-gray-500 mb-2">상태 변경</div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleStatusChange(selectedReport.id, "pending")}
                          disabled={updating || selectedReport.status === "pending"}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                            selectedReport.status === "pending"
                              ? "bg-yellow-100 text-yellow-700 font-medium"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          대기중
                        </button>
                        <button
                          onClick={() => handleStatusChange(selectedReport.id, "reviewing")}
                          disabled={updating || selectedReport.status === "reviewing"}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                            selectedReport.status === "reviewing"
                              ? "bg-blue-100 text-blue-700 font-medium"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          검토중
                        </button>
                        <button
                          onClick={() => handleStatusChange(selectedReport.id, "completed")}
                          disabled={updating || selectedReport.status === "completed"}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                            selectedReport.status === "completed"
                              ? "bg-green-100 text-green-700 font-medium"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          완료
                        </button>
                        <button
                          onClick={() => handleStatusChange(selectedReport.id, "rejected")}
                          disabled={updating || selectedReport.status === "rejected"}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                            selectedReport.status === "rejected"
                              ? "bg-red-100 text-red-700 font-medium"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          반려
                        </button>
                      </div>
                      {updating && (
                        <div className="text-center text-sm text-gray-500 mt-2">
                          처리 중...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
                  <div className="text-4xl mb-2">👈</div>
                  <p>제보를 선택하면 상세 정보가 표시됩니다.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
