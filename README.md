# Tradesee - Solana Escrow Platform

Tradesee는 Solana와 Anchor 프레임워크로 구축된 프로덕션급 에스크로 플랫폼입니다. 에스크로 계약, 문서 해시 앵커링, 트러스트 스코어, 오라클 통합을 포함한 전체 설계를 목표로 합니다.

## 기능 개요

### 1) 에스크로 & 문서 해시 앵커링
- Initialize Contract: 구매자/판매자, 만료, 문서 해시, 금액 등으로 계약 생성
- Deposit Payin: USDC 예치 (SPL Token + Token-2022 지원)
- Release Payout: 자동/마일스톤 기반 지급
- Refund: 만료 후 안전한 환불
- Document Anchoring: SHA256 기반 문서 검증
- Environment Variables: USDC_MINT, RPC_URL 환경변수 지원

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
# Solana Network Configuration
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS

# App Configuration
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
NEXT_PUBLIC_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v  # 필요 시 Devnet 민트로 교체
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

## 사용 흐름(프로토콜 관점)

1) 지갑 연결 → 2) 계약 생성(금액/만료/문서해시 등) → 3) 예치 → 4) 지급 또는 환불 → 5) 이벤트/상태 확인

## API 개요

### 핵심 인스트럭션

#### initialize_contract
- 매개변수: `contract_id [u8;32]`, `seller Pubkey`, `amount_expected u64`, `milestones_total u8`, `expiry_ts i64`, `auto_release_on_expiry bool`, `doc_hash [u8;32]`

#### deposit_payin
- 예치자(Buyer)만 실행, 금액 일치 및 만료 전 조건

#### release_payout
- 마일스톤 완료 또는 자동지급 조건 만족 시 판매자에게 지급

#### refund
- 만료, 자동지급 비활성, 미지급 상태에서 환불

### 계정 구조(요약)

Contract, TrustScore, OracleFlag 계정에 계약/스코어/오라클 상태를 저장합니다.

### 이벤트(요약)

`ContractInitialized`, `PayinDeposited`, `PayoutReleased`, `Refunded`, `TrustScoreAnchored`, `OracleUpdated` 등 상태 전이를 이벤트로 방출합니다.

## 테스트

```bash
# 루트에서 실행 (Anchor 자동 validator 관리)
npm run test
# 또는
anchor test
```

주요 시나리오: Init→Deposit→Release, Init→Deposit→Refund, 오류 케이스(서명/금액/중복), 트러스트/오라클 작성/조회 등

## 배포

### Devnet
```bash
solana config set --url https://api.devnet.solana.com
npm run build:program
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
npm run build:program

# 2. IDL 복사 (필요할 때만)
npm run idl:copy

# 3. 테스트 실행
npm run test

# 4. 앱 개발
npm run dev:app
```

### 상세 워크플로우

1) **프로그램 개발** (`programs/tradesee_escrow`) → `npm run build:program`
2) **테스트** (`tests/`) → `npm run test` (Anchor 자동 validator 관리)
3) **프론트엔드** (`app/`) → `npm run dev:app`
4) **IDL 동기화** 필요 시 → `npm run idl:copy`

## 트러블슈팅(요약)

### 일반적인 문제

- **InvalidAuthority/AmountMismatch 등**: 서명자/금액/상태 검증 확인
- **RPC 이슈**: RPC URL/네트워크 설정 확인
- **디버그**: `RUST_LOG=debug`로 상세 로그

### 프로젝트 구조 관련

- **Node.js 버전**: Node.js 20.18.0+ 필수 (TS SDK 최신 버전 요구사항)
- **의존성 충돌**: Yarn Workspaces로 루트/앱 의존성 분리
- **IDL 복사**: 앱 설치와 분리하여 수동 실행 (`npm run idl:copy`)
- **테스트 실행**: 루트에서 `npm run test` (Anchor 자동 validator 관리)

## 라이선스

MIT License

---

UI/프로토타입 사용 가이드는 `README-UI.md`를 참고하세요.

## 폴더 구조(상세)

```
tradesee/
├── anchor.toml                  # Anchor 설정
├── Cargo.toml                   # Rust 프로젝트 설정
├── package.json                 # 루트 의존성 관리 (Yarn Workspaces)
├── yarn.lock                    # 의존성 잠금 파일
├── tsconfig.json                # TypeScript 설정
├── programs/                    # Solana 프로그램
│   └── tradesee_escrow/
│       ├── Cargo.toml
│       └── src/lib.rs
├── tests/                       # 테스트 코드
│   ├── escrow.test.ts
│   └── sdk/
│       ├── client.ts
│       ├── index.ts
│       ├── types.ts
│       └── utils.ts
└── app/                         # 프론트엔드 (Next.js)
    ├── package.json              # 프론트엔드 전용 의존성
    ├── src/
    │   ├── components/
    │   │   ├── AccountBalanceCard.tsx      # USDC 잔액 카드
    │   │   ├── CreateContractModal.tsx     # 새 계약 생성 모달
    │   │   ├── ContractDetailModal.tsx     # 계약 상세 모달
    │   │   └── WalletConnect.tsx           # 지갑/Connection Provider
    │   ├── pages/
    │   │   ├── index.tsx                   # 대시보드
    │   │   └── _app.tsx                    # 글로벌 스타일 주입
    │   └── styles/globals.css              # Tailwind + 커스텀 스타일
    ├── tailwind.config.js
    └── postcss.config.js
```

## 요구 사항

- Node.js 20.18.0+ (TS SDK 최신 버전 요구사항)
- Solana CLI 2.3.13+ (Anza)
- Anchor 0.31.1

## 설치 및 실행

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

### 환경 변수 설정 (app/.env.local)

```env
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
# Devnet USDC 민트(예시): 표준 Devnet USDC 민트 또는 본인의 커스텀 민트 주소
NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# (선택) 프로그램 ID – 프론트 일부 기능에서 참조
NEXT_PUBLIC_PROGRAM_ID=<Devnet Program ID>
```

설정 후 개발 서버 실행:

```bash
# 방법 1: 루트에서 실행
npm run dev:app

# 방법 2: 앱 디렉토리에서 직접 실행
cd app
npm run dev
# http://localhost:3000 접속
```

## 사용 방법

1) 지갑 연결(우상단 버튼)
- Phantom 또는 Solflare
- 네트워크는 Devnet 사용을 권장합니다

2) USDC 잔액 표시
- My Account 카드에 잔액이 표시됩니다
- 잔액 로직은 SPL과 Token‑2022의 ATA를 모두 계산하여 병렬 조회합니다
- `.env.local`의 `NEXT_PUBLIC_USDC_MINT`가 지갑에 보유한 USDC의 민트와 일치해야 합니다

3) 새 계약 생성
- Create New Trade 클릭 → 모달 입력
- Exporter/Importer 주소 검증, Use my wallet 버튼 제공
- From/To Country, Weight(kg), Contract Value(USDC) 등 입력
- 파일 업로드 시 SHA‑256 해시 자동 계산 및 복사 가능
- Generate Contract & Share → Solana Pay 링크 새 탭 오픈 + 홈 목록에 반영

4) 계약 상세 보기
- 카드 클릭 → 상세 모달에서 모든 정보 확인

## 트러블슈팅

- My Account에 잔액이 0 또는 미표시
  - 지갑 네트워크가 Devnet인지 확인
  - `.env.local`의 `NEXT_PUBLIC_USDC_MINT`가 실제 보유한 토큰의 민트와 일치하는지 확인
  - 하드 리프레시(Cmd+Shift+R)로 지갑 어댑터 초기화 이슈 방지

- WalletContext 관련 에러(SSR 시점 오류)
  - 홈 페이지는 `ssr: false`로 동작하며, 잔액 카드는 클라이언트 전용입니다
  - 그래도 문제가 있으면 새로고침 후 지갑 재연결

- Tailwind/PostCSS 오류
  - `tailwind.config.js`, `postcss.config.js`는 CommonJS로 설정되어 있습니다
  - 전처리 캐시 이슈가 있으면 개발 서버를 재시작하세요

## 스크립트(일부)

- `app/scripts/test-solana-pay.js`: Solana Pay URL 생성 테스트
- `scripts/local-usdc-mint.ts`: 로컬 테스트용 USDC 민트 생성(선택)
