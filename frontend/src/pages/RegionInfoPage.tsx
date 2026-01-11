import { useParams, useNavigate, Link } from 'react-router-dom';
import { regions } from '../data/regions';
import { useReports } from '../hooks/useReports';
import { RISK_LEVEL_LABELS } from '../types';

export function RegionInfoPage() {
  const { regionId } = useParams<{ regionId: string }>();
  const navigate = useNavigate();
  const { reports } = useReports();

  const region = regions.find((r) => r.id === regionId);
  const parentRegion = region?.parentId
    ? regions.find((r) => r.id === region.parentId)
    : null;

  // 해당 지역 근처의 제보 (간단한 필터링)
  const nearbyReports = reports.filter((report) => {
    if (!region) return false;
    const distance = Math.sqrt(
      Math.pow(report.location.lat - region.center.lat, 2) +
        Math.pow(report.location.lng - region.center.lng, 2)
    );
    return distance < 0.1;
  });

  if (!region) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg sm:text-xl text-dark-gray mb-4">지역을 찾을 수 없습니다</p>
          <button
            onClick={() => navigate('/map')}
            className="cs-btn cs-btnPrimary"
          >
            지도로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const getRiskStyles = () => {
    switch (region.riskLevel) {
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-risk-high',
          text: 'text-risk-high',
          icon: '⚠️',
        };
      case 'medium':
        return {
          bg: 'bg-orange-50',
          border: 'border-warning',
          text: 'text-warning',
          icon: '⚡',
        };
      case 'low':
        return {
          bg: 'bg-green-50',
          border: 'border-risk-low',
          text: 'text-risk-low',
          icon: '✅',
        };
    }
  };

  const riskStyles = getRiskStyles();

  const getActionGuide = () => {
    switch (region.riskLevel) {
      case 'high':
        return [
          '강우 예보 시 저지대 이동을 자제하세요',
          '지하차도 및 침수 취약 지역을 피하세요',
          '비상 연락처를 미리 확인해두세요',
          '침수 징후 발견 시 즉시 제보해주세요',
        ];
      case 'medium':
        return [
          '집중호우 시 외출을 자제하세요',
          '배수구 막힘 여부를 수시로 확인하세요',
          '위험 지역 발견 시 제보해주세요',
        ];
      case 'low':
        return [
          '평상시와 같이 생활하셔도 됩니다',
          '다만 장마철에는 주의가 필요합니다',
          '주변 위험 요소 발견 시 제보해주세요',
        ];
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-32">
      {/* Header Banner - 반응형 */}
      <div className={`${riskStyles.bg} border-b-4 ${riskStyles.border} px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10`}>
        <div className="max-w-4xl mx-auto">
          {parentRegion && (
            <p className="text-sm sm:text-base text-medium-gray mb-1">{parentRegion.name}</p>
          )}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-dark-gray">{region.name}</h1>
          <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
            <span className="text-2xl sm:text-3xl lg:text-4xl">{riskStyles.icon}</span>
            <span className={`font-semibold text-base sm:text-lg lg:text-xl ${riskStyles.text}`}>
              침수 위험도: {RISK_LEVEL_LABELS[region.riskLevel]}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* PC: 2컬럼 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* 왼쪽 컬럼 */}
          <div className="space-y-6 sm:space-y-8">
            {/* Risk Information */}
            <section>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-dark-gray mb-3 sm:mb-4">
                침수 위험 안내
              </h2>
              <div className={`p-4 sm:p-5 lg:p-6 rounded-lg lg:rounded-xl ${riskStyles.bg} border ${riskStyles.border}`}>
                {region.riskLevel === 'high' && (
                  <p className="text-dark-gray text-sm sm:text-base lg:text-lg leading-relaxed">
                    이 지역은 <strong>침수 위험이 높은 지역</strong>입니다.
                    과거 침수 이력이 있거나 지형적 특성상 배수가 원활하지 않을 수 있습니다.
                    장마철이나 집중호우 시 각별한 주의가 필요합니다.
                  </p>
                )}
                {region.riskLevel === 'medium' && (
                  <p className="text-dark-gray text-sm sm:text-base lg:text-lg leading-relaxed">
                    이 지역은 <strong>침수 주의 지역</strong>입니다.
                    평상시에는 큰 문제가 없지만, 집중호우 시 일부 지역에서
                    침수가 발생할 수 있습니다.
                  </p>
                )}
                {region.riskLevel === 'low' && (
                  <p className="text-dark-gray text-sm sm:text-base lg:text-lg leading-relaxed">
                    이 지역은 <strong>침수 위험이 낮은 지역</strong>입니다.
                    배수 시설이 양호하며, 과거 침수 이력이 적습니다.
                    다만 이상 기후 상황에서는 주의가 필요합니다.
                  </p>
                )}
              </div>
            </section>

            {/* Action Guide */}
            <section>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-dark-gray mb-3 sm:mb-4">
                행동 가이드
              </h2>
              <ul className="space-y-2 sm:space-y-3">
                {getActionGuide().map((guide, index) => (
                  <li key={index} className="flex items-start gap-3 text-dark-gray text-sm sm:text-base lg:text-lg">
                    <span className="text-primary-green text-lg">•</span>
                    <span>{guide}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* 오른쪽 컬럼 */}
          <div className="space-y-6 sm:space-y-8">
            {/* Nearby Reports */}
            <section>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-dark-gray mb-3 sm:mb-4">
                주변 위험지역제보 ({nearbyReports.length}건)
              </h2>
              {nearbyReports.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {nearbyReports.slice(0, 3).map((report) => (
                    <div
                      key={report.id}
                      className="p-3 sm:p-4 lg:p-5 bg-light-gray rounded-lg lg:rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <span className="font-medium text-dark-gray text-sm sm:text-base">
                          {report.type === 'flood'
                            ? '🌊 침수'
                            : report.type === 'drainage'
                            ? '🚰 배수 문제'
                            : '📌 기타'}
                        </span>
                        <span className="text-xs sm:text-sm text-medium-gray">
                          {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <p className="text-medium-gray text-sm sm:text-base">{report.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-medium-gray text-sm sm:text-base">
                  아직 이 지역의 제보가 없습니다.
                </p>
              )}
            </section>

            {/* Map Link */}
            <Link
              to="/map"
              className="block text-center text-primary-blue text-sm sm:text-base hover:underline"
            >
              지도에서 위치 확인하기 →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Action - 반응형 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-light-gray p-4 sm:p-5 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/report')}
            className="cs-btn cs-btnPrimary w-full py-4 sm:py-5 lg:py-6 text-base sm:text-lg"
          >
            이 지역 위험 제보하기
          </button>
        </div>
      </div>
    </div>
  );
}
