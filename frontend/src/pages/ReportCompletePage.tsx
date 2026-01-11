import { Link } from "react-router-dom";

export function ReportCompletePage() {
  return (
    <div className="cs-page">
      <div className="cs-container cs-sectionTight">
        <div className="cs-complete">
          <div className="cs-completeIcon">
            <span className="text-6xl">🎉</span>
          </div>
          <h1 className="cs-h2">제보가 발송되었습니다!</h1>
          <p className="cs-sub">
            소중한 제보 감사합니다.<br />
            접수된 내용은 검토 후 침수위험지도에 반영됩니다.
          </p>

          <div className="cs-completePoints">
            <div className="cs-pill">기후안전 포인트 +10 적립 예정</div>
            <div className="cs-help mt-2">
              사진과 위치가 선명한 우수 제보는 +20 추가 적립!
            </div>
          </div>

          <div className="cs-completeInfo">
            <div className="bg-sky-50 rounded-xl p-4 mt-6 text-sm text-gray-600">
              <p className="font-medium text-gray-800 mb-2">📋 다음 단계 안내</p>
              <ul className="space-y-1">
                <li>• 제보 내용은 담당자가 확인 후 처리됩니다</li>
                <li>• 추가 확인이 필요한 경우 연락드릴 수 있습니다</li>
                <li>• 처리 결과는 침수위험지도에서 확인하세요</li>
              </ul>
            </div>
          </div>

          <div className="cs-ctaRow mt-8 justify-center">
            <Link to="/report" className="cs-btn cs-btnPrimary">
              추가 제보하기
            </Link>
            <Link to="/" className="cs-btn cs-btnGhost">
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
