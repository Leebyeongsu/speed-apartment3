# 슈파베이스 MCP 서버 - hhofutures.store

이 프로젝트는 Model Context Protocol (MCP)을 사용하여 Supabase 데이터베이스와 상호작용할 수 있는 서버입니다.
웹사이트: https://hhofutures.store

## 설치 및 설정

### 1. 의존성 설치
```bash
npm install
```

### 2. MCP 서버 실행
```bash
npm start
```

### 3. Claude Desktop 설정
Claude Desktop의 설정 파일에 다음을 추가하세요:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "supabase-apartment": {
      "command": "node",
      "args": ["mcp-server.js"],
      "cwd": "C:\\Users\\user\\claude_code\\speed-apartment-추가등록"
    }
  }
}
```

## 사용 가능한 도구

### 1. `get_apartments`
모든 아파트 목록을 조회합니다.

### 2. `get_applications`
신청서 목록을 조회합니다.
- `apartment_id` (선택): 특정 아파트 ID로 필터링
- `limit` (선택): 결과 개수 제한 (기본값: 100)

### 3. `create_application`
새로운 신청서를 생성합니다.
- `name` (필수): 공사요청 동/호수
- `phone` (필수): 연락처
- `workType` (필수): 현재 사용 중인 인터넷 통신사
- `start_date` (필수): 공사 희망일 (YYYY-MM-DD 형식)
- `description` (선택): 상세 요청사항

### 4. `update_apartment_settings`
아파트 설정을 업데이트합니다.
- `apartment_id` (필수): 아파트 ID
- `apartment_name` (선택): 아파트 이름
- `agency_name` (선택): 대리점 이름
- `agency_code` (선택): 대리점 코드
- `title` (선택): 신청서 제목
- `subtitle` (선택): 신청서 부제목
- `phones` (선택): 전화번호 목록
- `emails` (선택): 이메일 목록

### 5. `get_apartment_settings`
특정 아파트의 설정을 조회합니다.
- `apartment_id` (필수): 아파트 ID

## 사용 예시

Claude Desktop에서 다음과 같이 사용할 수 있습니다:

```
아파트 목록을 보여줘
```

```
새로운 신청서를 생성해줘. 이름은 "101동 1201호", 연락처는 "010-1234-5678", 통신사는 "KT", 희망일은 "2024-01-15"야
```

```
아파트 ID가 "speed-3"인 설정을 조회해줘
```

## 데이터베이스 스키마

### admin_settings 테이블
- `id`: 기본키
- `apartment_id`: 아파트 고유 ID
- `apartment_name`: 아파트 이름
- `agency_name`: 대리점 이름
- `agency_code`: 대리점 코드
- `title`: 신청서 제목
- `subtitle`: 신청서 부제목
- `phones`: 전화번호 배열
- `emails`: 이메일 배열
- `created_at`: 생성일시
- `updated_at`: 수정일시

### applications 테이블
- `id`: 기본키
- `application_number`: 신청번호
- `name`: 공사요청 동/호수
- `phone`: 연락처
- `address`: 주소
- `workType`: 통신사 코드
- `workType_display`: 통신사 표시명
- `budget`: 예산 코드
- `budget_display`: 예산 표시명
- `start_date`: 공사 희망일
- `description`: 상세 요청사항
- `submitted_at`: 제출일시

## 문제 해결

### 1. 연결 오류
- Supabase URL과 API 키가 올바른지 확인하세요
- 네트워크 연결을 확인하세요

### 2. 권한 오류
- Supabase RLS (Row Level Security) 정책을 확인하세요
- API 키의 권한을 확인하세요

### 3. MCP 서버 연결 실패
- Claude Desktop을 재시작하세요
- 설정 파일의 경로가 올바른지 확인하세요
- Node.js가 설치되어 있는지 확인하세요

## 라이선스

MIT License
