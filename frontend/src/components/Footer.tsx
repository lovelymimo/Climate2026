import { Link } from "react-router-dom";
import logoImg from "../assets/logo.png";

export function Footer() {
  return (
    <footer className="cs-footer">
      <div className="cs-container">
        <div className="cs-footerContent">
          {/* 왼쪽: 로고 */}
          <div className="cs-footerLogo">
            <Link to="/">
              <img src={logoImg} alt="기후안전허브" className="cs-footerLogoImg" />
            </Link>
          </div>

          {/* 중간: 정보 */}
          <div className="cs-footerInfo">
            <div className="cs-footBrand">기후안전허브</div>
            <div className="cs-footText">
              경기도와 시민이 함께 만드는 기후안전 도시
            </div>
          </div>

          {/* 오른쪽: 문의하기 버튼 */}
          <div className="cs-footerAction">
            <a
              href="mailto:violetyj01@gmail.com"
              className="cs-btn cs-btnGhost cs-btnSm"
            >
              문의하기
            </a>
          </div>
        </div>

        {/* 하단: 저작권 */}
        <div className="cs-footCopyright">
          © 2025 기후안전허브. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
