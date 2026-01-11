import { Link } from "react-router-dom";

type SidebarProps = {
  onNavigate?: () => void;
};

const sections = [
  {
    title: "침수위험지도",
    items: [
      { label: "침수위험지도", to: "/map" },
      { label: "지역별 리포트", to: "/region" },
    ],
  },
  {
    title: "위험지역제보",
    items: [
      { label: "위험지역 제보하기", to: "/report" },
      { label: "기후안전 포인트", to: "/points" },
    ],
  },
  {
    title: "기업협력",
    items: [
      { label: "협력기업 안내", to: "/partners" },
      { label: "솔루션/쿠폰", to: "/partners" },
    ],
  },
];

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <div className="p-5">
      <div className="rounded-2xl bg-light-gray border border-gray-100 p-4">
        <div className="text-sm font-semibold text-dark-gray">기후안전허브</div>
        <div className="text-xs text-medium-gray mt-1">
          시민·지자체·기업 협력으로 도시 물재난을 ‘예방’합니다.
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {sections.map((sec) => (
          <div key={sec.title}>
            <div className="text-xs font-semibold text-medium-gray tracking-wide">
              {sec.title}
            </div>
            <div className="mt-2 rounded-2xl border border-gray-100 overflow-hidden">
              {sec.items.map((it) => (
                <Link
                  key={it.label}
                  to={it.to}
                  onClick={onNavigate}
                  className="flex items-center justify-between px-4 py-3 text-sm text-dark-gray bg-white hover:bg-light-gray border-b border-gray-100 last:border-b-0"
                >
                  <span>{it.label}</span>
                  <span className="text-medium-gray">›</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-xs text-medium-gray">
        © Climate Safety Hub
      </div>
    </div>
  );
}
