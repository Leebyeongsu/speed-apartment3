# Speed 아파트 통신 환경 개선 신청서

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)

Speed 아파트 거주자들을 위한 웹 기반 통신 환경 개선 신청서 시스템입니다. 모바일 우선 반응형 디자인으로 제작되었으며, Supabase 데이터베이스와 EmailJS를 통한 이메일 알림 기능을 제공합니다.

## 📱 주요 기능

### 🏠 관리자 기능
- **📝 신청서 관리**: 통신 환경 개선 요청사항 수집 및 관리
- **📧 이메일/SMS 설정**: 관리자 연락처 설정 및 자동 알림 발송
- **📱 QR 코드 생성**: 쉬운 폼 공유 및 배포를 위한 QR 코드 생성
- **💬 카카오톡 공유**: 소셜 미디어를 통한 신청서 공유
- **🔧 제목/부제목 편집**: 동적 타이틀 편집 기능

### 👥 고객 기능
- **📋 간편 신청**: 모바일 최적화된 신청서 작성
- **📞 자동 연락처 형식**: 전화번호 자동 포맷팅
- **📅 날짜 선택**: 공사 희망일 달력 선택
- **📝 상세 요청**: 자유형식 요청사항 입력

### 🎯 특별 모드
- **고객 모드** (`?mode=customer`): 신청서만 표시하는 간소화 인터페이스
- **디버그 모드** (`?debug=true` 또는 `#eruda`): 모바일 디버깅을 위한 Eruda 개발자 도구

## 🏗️ 기술 스택

### Frontend
- **HTML5**: 시맨틱 마크업과 모바일 최적화 메타태그
- **CSS3**: Flexbox/Grid 레이아웃, CSS 변수, 애니메이션
- **JavaScript (ES6+)**: 모던 JavaScript, async/await, Promise 패턴

### Backend & Services
- **[Supabase](https://supabase.com/)**: PostgreSQL 데이터베이스, 실시간 구독
- **[EmailJS](https://www.emailjs.com/)**: 클라이언트 사이드 이메일 발송 서비스
- **CDN**: jsQR, QRCode.js, Eruda (모바일 디버깅)

### External APIs
- **카카오 SDK**: 소셜 공유 기능 (선택사항)
- **Supabase Edge Functions**: SMS 발송 기능 (향후 계획)

## 🚀 빠른 시작

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd speed-apartment-추가등록
```

### 2. 로컬 서버 실행
```bash
# Python 사용
python -m http.server 8000

# Node.js 사용
npx serve .

# PHP 사용
php -S localhost:8000
```

### 3. 브라우저에서 접속
- **관리자 모드**: http://localhost:8000/
- **고객 모드**: http://localhost:8000/?mode=customer
- **디버그 모드**: http://localhost:8000/?debug=true

## ⚙️ 설정

### 필수 설정 (`script.js`)
```javascript
// 아파트 고유 식별자 설정
const APARTMENT_ID = 'speed_apartment2';

// EmailJS 사용자 ID
emailjs.init('8-CeAZsTwQwNl4yE2');
```

### Supabase 설정 (`supabase-config.js`)
```javascript
const supabaseUrl = 'https://boorsqnfkwglzvnhtwcx.supabase.co';
const supabaseAnonKey = 'your_anon_key_here';
```

### 선택적 설정
- **카카오 개발자 키**: 소셜 공유 기능을 위해 `script.js`에서 설정
- **커스텀 도메인**: 프로덕션 배포 시 Supabase 프로젝트 설정에서 허용된 도메인 추가

## 📊 데이터베이스 스키마

### 관리자 설정 테이블 (`admin_settings`)
```sql
CREATE TABLE admin_settings (
    id SERIAL PRIMARY KEY,
    apartment_id TEXT UNIQUE NOT NULL,
    title TEXT,
    subtitle TEXT,
    phones TEXT[],
    emails TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 신청서 테이블 (`applications`)
```sql
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    application_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    work_type TEXT,
    work_type_display TEXT,
    budget TEXT,
    budget_display TEXT,
    start_date DATE,
    description TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 알림 로그 테이블 (`notification_logs`)
```sql
CREATE TABLE notification_logs (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id),
    notification_type TEXT NOT NULL, -- 'sms' or 'email'
    recipient TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 📱 모바일 최적화

### 반응형 디자인
- **모바일 우선**: 320px 이상의 모든 화면 크기 지원
- **터치 최적화**: 44px 이상의 터치 대상, 터치 피드백
- **줌 방지**: 입력 필드 포커스 시 줌 방지 설정

### 성능 최적화
- **CDN 활용**: 외부 라이브러리는 CDN을 통해 로드
- **지연 로딩**: 필요한 시점에 스크립트 로드
- **압축된 에셋**: 최소화된 CSS/JS 파일 사용

### 디버깅 도구
```javascript
// 모바일 디버그 콘솔 활성화
window.location.href = "?debug=true";
// 또는
window.location.hash = "eruda";
```

## 🔧 주요 기능 상세

### 폼 제출 플로우
1. **유효성 검사**: HTML5 검증 + JavaScript 추가 검증
2. **데이터 저장**: Supabase `applications` 테이블에 저장
3. **신청번호 생성**: 자동 생성되는 고유 신청번호
4. **이메일 알림**: 관리자에게 EmailJS를 통한 자동 알림
5. **성공 메시지**: 사용자에게 제출 완료 확인

### QR 코드 생성
```javascript
// QR 코드 생성 및 다운로드
function generateQRCode() {
    const qr = qrcode(0, 'M');
    qr.addData(window.location.href);
    qr.make();
    // PNG/JPG 다운로드 지원
}
```

### 관리자 설정 관리
- **로컬 스토리지**: 클라이언트 사이드 임시 저장
- **데이터베이스 동기화**: Supabase를 통한 영구 저장
- **실시간 업데이트**: 설정 변경 시 즉시 반영

## 🚨 에러 처리

### 전역 에러 핸들링
```javascript
window.addEventListener('error', (event) => {
    console.error('전역 에러 포착:', event.error);
    // 사용자 친화적 에러 메시지 표시
});
```

### 네트워크 에러 처리
- **자동 재시도**: API 호출 실패 시 최대 3회 재시도
- **오프라인 감지**: 네트워크 상태 모니터링
- **타임아웃 처리**: 긴 응답 시간에 대한 대응

### 모바일 디버깅
- **Eruda 콘솔**: 모바일에서 완전한 개발자 도구 제공
- **에러 로그 복사**: 디버깅을 위한 로그 복사 기능
- **네트워크 모니터링**: API 호출 상태 추적

## 📈 성능 모니터링

### 로드 성능
- **First Contentful Paint**: < 2초 목표
- **Time to Interactive**: < 3초 목표
- **Cumulative Layout Shift**: < 0.1

### 리소스 최적화
- **이미지 최적화**: WebP 포맷 사용 권장
- **CSS 최소화**: 중요하지 않은 스타일 지연 로딩
- **JavaScript 분할**: 필수 기능과 선택적 기능 분리

## 🔒 보안 고려사항

### 클라이언트 사이드 보안
- **API 키 관리**: Public anon key만 클라이언트에서 사용
- **입력 검증**: XSS 방지를 위한 입력값 이스케이핑
- **HTTPS 강제**: 프로덕션에서 모든 통신 암호화

### Supabase 보안
- **Row Level Security (RLS)**: 데이터베이스 레벨에서 접근 제어
- **실시간 권한 검사**: 모든 데이터베이스 작업에 대한 권한 검증
- **API 사용량 모니터링**: 남용 방지를 위한 사용량 추적

## 🚀 배포

### 정적 호스팅 플랫폼
- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod --dir .`
- **GitHub Pages**: GitHub Actions를 통한 자동 배포
- **Firebase Hosting**: `firebase deploy`

### 환경별 설정
```javascript
// 프로덕션 환경 감지
const isProduction = window.location.hostname !== 'localhost';

// 환경별 설정 적용
const config = isProduction ? productionConfig : developmentConfig;
```

## 🤝 기여 가이드

### 개발 가이드라인
1. **코드 스타일**: ESLint + Prettier 설정 준수
2. **브랜치 전략**: `feature/기능명` 브랜치에서 개발
3. **커밋 메시지**: Conventional Commits 형식 사용
4. **테스트**: 모바일 기기에서 실제 테스트 필수

### 풀 리퀘스트 절차
1. Fork 후 feature 브랜치 생성
2. 모든 기기에서 테스트 완료
3. 스크린샷 포함한 PR 생성
4. 코드 리뷰 후 머지

## 📚 문서

### API 문서
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [EmailJS Documentation](https://www.emailjs.com/docs/)
- [QR Code Generation](https://github.com/davidshimjs/qrcodejs)

### 디자인 참고
- [Material Design for Mobile](https://material.io/design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

## 🐛 알려진 이슈

### iOS Safari 관련
- **100vh 높이 문제**: CSS `env()` 함수로 해결
- **터치 지연**: `touch-action: manipulation` 적용
- **스크롤 바운스**: `-webkit-overflow-scrolling: touch` 제거

### Android 브라우저 관련
- **키보드 리사이즈**: viewport height 동적 조정
- **파일 다운로드**: 브라우저별 다운로드 방식 차이
- **WebRTC 지원**: 구형 브라우저 fallback 제공

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 지원 및 문의

- **개발자**: Speed 아파트 개발팀
- **이슈 리포팅**: GitHub Issues 탭 활용
- **기능 요청**: GitHub Discussions 섹션 활용

---

⭐ 이 프로젝트가 도움이 되었다면 GitHub에서 Star를 눌러주세요!