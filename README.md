# Tradesee - Solana 에스크로 플랫폼

Tradesee는 Solana와 Anchor 프레임워크로 구축된 프로덕션급 에스크로 플랫폼입니다. 에스크로 계약, 문서 해시 앵커링, 트러스트 스코어, 오라클 통합을 포함한 전체 설계를 목표로 합니다.

## 기능 개요

### 1) 에스크로 & 문서 해시 앵커링
- 계약 초기화: 구매자/판매자, 만료, 문서 해시, 금액 등으로 계약 생성
- 입금: USDC 예치 (SPL Token + Token-2022 지원)
- 지급: 자동/마일스톤 기반 지급
- 환불: 만료 후 안전한 환불
- 문서 앵커링: SHA256 기반 문서 검증
- 환경변수: USDC_MINT, RPC_URL 환경변수 지원

### 2) 트러스트 스코어 앵커링(Stub)
- 오프체인 산출 스코어(0-1000)를 온체인에 앵커링
- Authority 기반 스코어 관리

### 3) 오라클 통합(Stub)
- 운송 검증을 위한 불리언 결과 앵커링
- 오프체인 모니터링을 위한 이벤트 방출

## 아키텍처

### 스마트컨트랙트 (Rust + Anchor)
- Program ID: `.env` 또는 `Anchor.toml` 참고
- PDA: Contract, TrustScore, OracleFlag 등
- 보안: 입력 검증, 재진입 방지, 역할 기반 접근

### 프런트엔드 (Next.js + React)
- 지갑 연동(Phantom/Solflare)
- 계약 생성/상태 표시

### SDK (TypeScript)
- 클라이언트 래퍼, PDA/ATA 유틸, 타입 지원
- SPL Token + Token-2022 양방향 지원
- 환경변수 기반 설정 관리

## 사전 준비물

- Rust 최신 안정판
- Solana CLI v2.3.13+ (Anza)
- Anchor v0.31.1
- Node.js v20.18.0+ (TS SDK 최신 버전 요구사항)
- npm 또는 yarn


## 환경변수 설정

### 앱 환경변수 (app/.env.local)
```bash
# Solana 네트워크 설정
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
NEXT_PUBLIC_PROGRAM_ID=J6w1gENjjbx8XG6ECtwWqfjmoPFHwtz9wqx2jj84qk5t

# 앱 설정
NEXT_PUBLIC_APP_NAME=Tradesee
NEXT_PUBLIC_APP_VERSION=0.1.0
NEXT_PUBLIC_DEBUG_MODE=true
```

### 주요 환경변수 설명
- `NEXT_PUBLIC_RPC_URL`: Solana RPC 엔드포인트 (Devnet/Mainnet)
- `NEXT_PUBLIC_USDC_MINT`: USDC 토큰 민트 주소 (SPL Token 또는 Token-2022)
- `NEXT_PUBLIC_PROGRAM_ID`: 배포된 프로그램 ID

## 프로젝트 구조

```
tradesee/
├── anchor.toml          # Anchor 설정
├── Cargo.toml           # Rust 프로젝트 설정
├── package.json         # 루트 의존성 관리 (Yarn Workspaces)
├── yarn.lock            # 의존성 잠금 파일
├── tsconfig.json        # TypeScript 설정
├── programs/            # Solana 프로그램
│   └── tradesee_escrow/
│       └── src/lib.rs
├── tests/               # 테스트 코드
│   ├── escrow.test.ts
│   └── sdk/
└── app/                 # 프론트엔드 (Next.js)
    └── package.json     # 프론트엔드 전용 의존성
```

## 빠른 시작

```bash
git clone <repository-url>
cd tradesee

# Node.js 20.18.0 사용 (중요!)
nvm use 20.18.0

# 루트 의존성 설치 (테스트/Anchor 관련)
yarn install

# 앱 의존성 설치
cd app && npm install
```

### 환경 변수 (app/.env.local)

```env
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU  # 필요 시 Devnet 민트로 교체
NEXT_PUBLIC_PROGRAM_ID=<Program ID>
```

### 개발 서버 실행

```bash
# 방법 1: 루트에서 실행
npm run dev:app

# 방법 2: 앱 디렉토리에서 직접 실행
cd app
npm run dev
# http://localhost:3000
```

## 사용 방법

### 전체 플로우
1) **지갑 연결** → 2) **계약 생성** → 3) **입금 검증** → 4) **에스크로 지급** → 5) **완료**

### 상세 사용법

#### 1. 지갑 연결
- 우상단 "Connect Wallet" 버튼 클릭
- Phantom 또는 Solflare 지갑 연결
- Devnet 네트워크 사용 권장

#### 2. 계약 생성
- "Create New Trade" 버튼 클릭
- 계약 정보 입력 (Exporter/Importer, 금액, 무게 등)
- 파일 업로드 시 SHA-256 해시 자동 계산
- "Generate Contract & Share" 클릭 → Solana Pay QR 코드 생성

#### 3. 입금 검증 (Seller)
- 계약 상세 모달에서 "Verify Deposit" 버튼 클릭
- TxID 입력하여 입금 검증
- 검증 성공 시 상태가 "Pending" → "In Transit"으로 변경

#### 4. 에스크로 지급 (Seller)
- "Release Payment" 버튼 클릭
- USDC가 Seller에게 지급
- 계약 상태가 "Complete"로 변경

## 스마트컨트랙트 인스트럭션

### 핵심 인스트럭션

- `initialize_contract`
  - 계약 초기화 (구매자, 판매자, 금액, 만료시간, 문서해시 등)
  - PDA: `[b"contract", initializer, contract_id]`

- `deposit_payin`
  - Buyer가 USDC를 escrow vault에 예치
  - 권한: Buyer만 실행 가능
  - 검증: 금액 일치, 만료 전 조건

- `update_to_in_transit`
  - 계약 상태를 "In Transit"으로 업데이트
  - 권한: Seller만 실행 가능
  - 기능: 배송 정보 및 문서해시 저장

- `release_payout`
  - Seller에게 USDC 지급
  - 권한: Seller만 실행 가능
  - 조건: 마일스톤 완료 또는 자동지급 조건

- `refund`
  - Buyer에게 USDC 환불
  - 조건: 만료, 자동지급 비활성, 미지급 상태

### 계약 상태
- **Pending**: 입금 대기
- **In Transit**: 배송 중
- **Complete**: 완료
- **Refunded**: 환불

## 배포

### Devnet
```bash
solana config set --url https://api.devnet.solana.com
anchor build
npm run idl:copy
```

### Mainnet
```bash
solana config set --url https://api.mainnet-beta.solana.com
# anchor.toml Program ID 갱신 후 빌드/배포
```

## 개발 워크플로우

### 추천 사용 흐름

```bash
# 1. 프로그램 빌드
anchor build

# 2. IDL 복사 (필요할 때만)
npm run idl:copy

# 3. 테스트 실행
anchor test

# 4. 앱 개발
npm run dev:app
```

### 상세 워크플로우

1) **프로그램 개발** (`programs/tradesee_escrow`) → `anchor build`
2) **테스트** (`tests/`) → `anchor test` (Anchor 자동 validator 관리)
3) **프론트엔드** (`app/`) → `npm run dev:app`
4) **IDL 동기화** 필요 시 → `npm run idl:copy`


## Devnet E2E 테스트

### 사전 준비
```bash
# 1. Devnet 설정
solana config set --url https://api.devnet.solana.com
solana airdrop 2

# 2. USDC mint 생성
npm run create:mint

# 3. 프로그램 배포
anchor deploy --provider.cluster devnet
solana program show J6w1gENjjbx8XG6ECtwWqfjmoPFHwtz9wqx2jj84qk5t

# 4. 프론트엔드 실행
npm run dev:app
```

### 테스트 플로우
1. **http://localhost:3000** 접속
2. **Phantom 지갑 연결** (Devnet 네트워크)
3. **USDC 잔액 확인** (My Account 카드)
4. **계약 생성** → **입금 검증** → **에스크로 지급** 테스트


## 스크립트

- `scripts/create-devnet-mint.ts`: Devnet USDC 민트 생성
- `scripts/devnet-e2e-check.ts`: Devnet E2E 검증
- `scripts/local-usdc-mint.ts`: 로컬 테스트용 USDC 민트 생성(선택)
