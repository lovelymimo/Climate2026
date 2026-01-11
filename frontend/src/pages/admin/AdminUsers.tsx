import { useEffect, useState } from "react";
import { AdminLayout } from "../../components/AdminLayout";
import { fetchAllUsers, type AdminUser } from "../../services/adminService";

type LevelFilter = "all" | "bronze" | "silver" | "gold";

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await fetchAllUsers();
    setUsers(data);
    setLoading(false);
  };

  const filteredUsers = users.filter((user) => {
    if (levelFilter !== "all" && user.level !== levelFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        user.email.toLowerCase().includes(query) ||
        user.displayName.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "gold":
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">🥇 골드</span>;
      case "silver":
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">🥈 실버</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">🥉 브론즈</span>;
    }
  };

  const levelCounts = {
    all: users.length,
    bronze: users.filter((u) => u.level === "bronze").length,
    silver: users.filter((u) => u.level === "silver").length,
    gold: users.filter((u) => u.level === "gold").length,
  };

  const totalPoints = users.reduce((sum, u) => sum + u.points, 0);
  const totalReports = users.reduce((sum, u) => sum + u.reportCount, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
          <p className="text-gray-500 mt-1">가입 회원 정보를 확인하고 관리합니다.</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-sm text-gray-500">총 회원</div>
            <div className="text-2xl font-bold text-gray-900">{users.length}명</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-sm text-gray-500">총 제보</div>
            <div className="text-2xl font-bold text-gray-900">{totalReports}건</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-sm text-gray-500">발행 포인트</div>
            <div className="text-2xl font-bold text-gray-900">{totalPoints.toLocaleString()}P</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-sm text-gray-500">평균 포인트</div>
            <div className="text-2xl font-bold text-gray-900">
              {users.length > 0 ? Math.round(totalPoints / users.length) : 0}P
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="이메일 또는 이름 검색..."
                className="w-full px-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Level Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">등급:</span>
              <div className="flex gap-1">
                {(["all", "gold", "silver", "bronze"] as LevelFilter[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setLevelFilter(level)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      levelFilter === level
                        ? "bg-slate-800 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {level === "all" && `전체 (${levelCounts.all})`}
                    {level === "gold" && `🥇 (${levelCounts.gold})`}
                    {level === "silver" && `🥈 (${levelCounts.silver})`}
                    {level === "bronze" && `🥉 (${levelCounts.bronze})`}
                  </button>
                ))}
              </div>
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
            {/* User List */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">
                  회원 목록 ({filteredUsers.length}명)
                </h2>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  해당 조건의 회원이 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.uid}
                      onClick={() => setSelectedUser(user)}
                      className={`px-6 py-4 cursor-pointer transition-colors ${
                        selectedUser?.uid === user.uid
                          ? "bg-sky-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                            👤
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.displayName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getLevelBadge(user.level)}
                          <div className="text-right">
                            <div className="text-sm font-medium text-sky-600">
                              {user.points}P
                            </div>
                            <div className="text-xs text-gray-400">
                              제보 {user.reportCount}건
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Detail */}
            <div className="lg:col-span-1">
              {selectedUser ? (
                <div className="bg-white rounded-xl shadow-sm sticky top-4">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900">회원 상세</h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Profile */}
                    <div className="text-center pb-4 border-b">
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl mx-auto mb-3">
                        👤
                      </div>
                      <div className="font-bold text-lg text-gray-900">
                        {selectedUser.displayName}
                      </div>
                      <div className="text-sm text-gray-500">{selectedUser.email}</div>
                      <div className="mt-2">{getLevelBadge(selectedUser.level)}</div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-sky-600">
                          {selectedUser.points}
                        </div>
                        <div className="text-xs text-gray-500">포인트</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {selectedUser.reportCount}
                        </div>
                        <div className="text-xs text-gray-500">제보 수</div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">UID</div>
                        <div className="text-sm font-mono text-gray-600 bg-gray-50 p-2 rounded break-all">
                          {selectedUser.uid}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 mb-1">가입일</div>
                        <div className="font-medium">
                          {selectedUser.createdAt.toLocaleString("ko-KR")}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 mb-1">회원 유형</div>
                        <div className="font-medium">
                          {selectedUser.userType === "citizen"
                            ? "시민"
                            : selectedUser.userType === "business"
                            ? "기업"
                            : "미설정"}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 mb-1">다음 등급까지</div>
                        <div className="font-medium">
                          {selectedUser.level === "gold" ? (
                            <span className="text-yellow-600">최고 등급</span>
                          ) : selectedUser.level === "silver" ? (
                            <span>{500 - selectedUser.points}P 필요 (골드)</span>
                          ) : (
                            <span>{200 - selectedUser.points}P 필요 (실버)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions (Future) */}
                    <div className="border-t pt-4">
                      <div className="text-xs text-gray-400 text-center">
                        포인트 수동 지급 기능은 추후 업데이트 예정
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
                  <div className="text-4xl mb-2">👈</div>
                  <p>회원을 선택하면 상세 정보가 표시됩니다.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
