# Tradesee - Solana 기반 에스크로/무역 계약 데모 (UI 가이드)

Next.js(React) + Anchor(Solana)로 구현된 에스크로/무역 계약 데모입니다. 대시보드, 새 계약 생성, 파일 해시(문서 앵커링), Solana Pay 공유, 계약 상세 보기, 지갑 연동(USDC 잔액 표시)을 제공합니다.

## 주요 기능

- 대시보드(홈)
  - My Account: 지갑 연결 상태 및 USDC 잔액 표시(클라이언트 전용 카드)
  - Total Amount: 화면에 표시된 계약 금액 합산
  - My Trades / Contract In Progress 카운트
  - 계약 카드 목록(클릭 시 상세 모달)
- 새 계약 생성(Create New Trade)
  - Exporter/Importer 주소 입력 및 검증(Use my wallet 지원)
  - From/To Country, Weight(kg), Contract Value(USDC), Deposit Rate(%), Expired Date, Contract Terms 입력
  - 파일 업로드 → SHA-256 해시 계산 및 복사
  - Generate Contract & Share → Solana Pay URL 새 탭 오픈, 홈 목록에 즉시 반영
- 계약 상세 모달(ContractDetailModal)
  - 기본 정보(경로/금액/무게/날짜/상태)와 세부 정보(보증금 비율/만료일/약관)
  - 업로드 파일 정보와 SHA-256 해시
  - Exporter/Importer 주소 표시
- 지갑/USDC 잔액 표시
  - SPL(Token Program)과 Token‑2022 두 프로그램의 ATA를 모두 조회해 잔액 표시
  - 홈 페이지는 ssr: false로 렌더되어 WalletContext SSR 이슈 방지

## 폴더 구조(일부)

```
app/
  src/
    components/
      AccountBalanceCard.tsx      # USDC 잔액 카드(클라이언트 전용)
      CreateContractModal.tsx     # 새 계약 생성 모달
      ContractDetailModal.tsx     # 계약 상세 모달
      WalletConnect.tsx           # 지갑/Connection Provider
    pages/
      index.tsx                   # 대시보드(SSR 비활성화)
      _app.tsx                    # 글로벌 스타일 주입
    styles/globals.css            # Tailwind + 커스텀 스타일
  tailwind.config.js
  postcss.config.js
programs/tradesee_escrow/        # Anchor 프로그램(Rust)
ts/                              # (선택) SDK/테스트
```

## 요구 사항

- Node.js 18+
- Solana CLI 1.16+
- Anchor 0.31.x

## 설치 및 실행

```bash
git clone <repository-url>
cd tradesee

cd app && npm install
npm run dev
# http://localhost:3000
```

## 환경 변수 (app/.env.local)

```env
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
NEXT_PUBLIC_PROGRAM_ID=<Devnet Program ID>
```

## 트러블슈팅

- 잔액 0/미표시: Devnet 네트워크/USDC 민트 주소 확인 → 하드 리프레시(Cmd+Shift+R)
- WalletContext 오류: 홈은 ssr: false, 지갑 재연결 시 해결
- Tailwind/PostCSS 오류: 설정은 CommonJS, 서버 재시작

---

이 파일은 프론트엔드 데모 사용 안내입니다. 프로토콜/스마트컨트랙트 문서는 메인 `README.md`를 참고하세요.
