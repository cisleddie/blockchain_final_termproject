# ContribChain 세팅 가이드

## 1. 패키지 설치

```bash
# 백엔드
cd backend
pip install fastapi uvicorn web3 python-dotenv

# 프론트엔드
cd frontend
npm install ethers axios react-router-dom
```

---

## 2. 스마트 컨트랙트 배포 (remix.ethereum.org)

> MetaMask 네트워크를 **Sepolia**로 설정 후 진행

1. `PHYToken.sol` 컴파일 → Deploy → **주소 복사**
2. `ContribNFT.sol` 컴파일 → Deploy → **주소 복사**
3. `ContribRegistry.sol` 컴파일 → Deploy
   - `_phyToken`: ①번 주소
   - `_contribNFT`: ②번 주소
   - **주소 복사**
4. PHYToken → `transferOwnership(③번 주소)` 실행
5. ContribNFT → `transferOwnership(③번 주소)` 실행

### 확인
- PHYToken → `owner()` → ③번 주소 나오면 ✅
- ContribNFT → `owner()` → ③번 주소 나오면 ✅

---

## 3. .env 설정

`backend/.env` 파일에 아래 내용 채우기

```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
ADMIN_WALLET_ADDRESS=YOUR_WALLET_ADDRESS
ADMIN_PRIVATE_KEY=YOUR_PRIVATE_KEY

PHY_TOKEN_ADDRESS=①번 주소
CONTRIB_NFT_ADDRESS=②번 주소
CONTRIB_REGISTRY_ADDRESS=③번 주소
```

`frontend/src/config.js`도 동일하게 주소 업데이트

---

## 4. 실행

터미널 2개 열어서 각각 실행

**터미널 1 — 백엔드**
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

**터미널 2 — 프론트엔드**
```bash
cd frontend
npm start
```

브라우저에서 `http://localhost:3000` 접속

---

## 5. 접속 주소

| 페이지 | 주소 |
|--------|------|
| 유저 페이지 | http://localhost:3000 |
| 관리자 페이지 | http://localhost:3000/admin |
| 백엔드 API | http://localhost:8000 |
