# main.py — ContribChain FastAPI 오라클 서버
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from web3 import Web3
from dotenv import load_dotenv
from abis import CONTRIB_REGISTRY_ABI, PHY_TOKEN_ABI
import os

load_dotenv()

app = FastAPI(title="ContribChain Oracle Server")

# ── CORS 설정 (React 프론트에서 호출 허용) ──────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Web3 연결 (학교 네트워크 SSL 인증서 우회) ────────────
w3 = Web3(Web3.HTTPProvider(
    os.getenv("SEPOLIA_RPC_URL"),
    request_kwargs={"verify": False}
))


ADMIN_ADDRESS     = os.getenv("ADMIN_WALLET_ADDRESS")
ADMIN_PRIVATE_KEY = os.getenv("ADMIN_PRIVATE_KEY")

REGISTRY_ADDRESS = Web3.to_checksum_address(os.getenv("CONTRIB_REGISTRY_ADDRESS"))
PHY_ADDRESS      = Web3.to_checksum_address(os.getenv("PHY_TOKEN_ADDRESS"))

registry = w3.eth.contract(address=REGISTRY_ADDRESS, abi=CONTRIB_REGISTRY_ABI)
phy      = w3.eth.contract(address=PHY_ADDRESS,      abi=PHY_TOKEN_ABI)


# ── 헬퍼: 트랜잭션 서명 & 전송 ──────────────────────────
def send_tx(fn):
    """컨트랙트 함수를 받아서 서명 후 Sepolia에 전송"""
    tx = fn.build_transaction({
        "from":     ADMIN_ADDRESS,
        "nonce":    w3.eth.get_transaction_count(ADMIN_ADDRESS, "pending"),
        "gas":      300_000,
        "gasPrice": w3.eth.gas_price * 2,
    })
    signed   = w3.eth.account.sign_transaction(tx, ADMIN_PRIVATE_KEY)
    tx_hash  = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt  = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    return tx_hash.hex(), receipt.status  # status 1 = 성공


# ════════════════════════════════════════════════════════
# 엔드포인트
# ════════════════════════════════════════════════════════

# ── 서버 상태 확인 ───────────────────────────────────────
@app.get("/")
def root():
    connected = w3.is_connected()
    return {
        "server":    "ContribChain Oracle",
        "connected": connected,
        "network":   "Sepolia" if connected else "disconnected",
    }


# ── 기고문 목록 조회 ─────────────────────────────────────
@app.get("/contribs")
def get_contribs():
    """등록된 모든 기고문 목록 반환"""
    count = registry.functions.contribCount().call()
    result = []
    for i in range(count):
        c = registry.functions.getContrib(i).call()
        result.append({
            "id":        i,
            "docHash":   c[0].hex(),
            "author":    c[1],
            "docNumber": c[2],
            "approved":  c[3],
            "timestamp": c[4],
        })
    return {"contribs": result, "total": count}


# ── 특정 기고문 상태 조회 ────────────────────────────────
@app.get("/status/{id}")
def get_status(id: int):
    """특정 기고문의 현재 승인 상태 조회"""
    try:
        c = registry.functions.getContrib(id).call()
        return {
            "id":        id,
            "docNumber": c[2],
            "author":    c[1],
            "approved":  c[3],
            "timestamp": c[4],
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"기고문 {id}를 찾을 수 없습니다: {str(e)}")


# ── 승인 요청 Body ───────────────────────────────────────
class ApproveRequest(BaseModel):
    grade: int      # 0 = PARTIAL(50 token), 1 = FULL(100 token)
    nft_uri: str    # NFT 메타데이터 URI (예: ipfs://... 또는 로컬 JSON)
    doc_number: str # 기고문 번호 (로그용)
    ts_name: str    # 반영된 TS 문서명 (로그용)


# ── 핵심: 승인 + 보상 자동 지급 ─────────────────────────
@app.post("/approve/{id}")
def approve(id: int, body: ApproveRequest):
    """
    오라클이 스펙 반영 확인 후 호출.
    approve() 트랜잭션을 Sepolia에 전송하면
    컨트랙트가 NFT mint + PHYToken transfer 자동 실행.
    """
    # 이미 승인됐는지 먼저 확인
    c = registry.functions.getContrib(id).call()
    if c[3]:  # approved == True
        raise HTTPException(status_code=400, detail="이미 승인된 기고문입니다.")

    try:
        tx_hash, status = send_tx(
            registry.functions.approve(id, body.grade, body.nft_uri)
        )
        reward = 100 if body.grade == 1 else 50
        return {
            "success":   status == 1,
            "id":        id,
            "doc_number": body.doc_number,
            "ts_name":   body.ts_name,
            "grade":     "FULL" if body.grade == 1 else "PARTIAL",
            "reward":    reward,
            "tx_hash":   tx_hash,
            "etherscan": f"https://sepolia.etherscan.io/tx/{tx_hash}",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── PHYToken 잔액 조회 ───────────────────────────────────
@app.get("/balance/{address}")
def get_balance(address: str):
    """특정 지갑의 PHYToken 잔액 조회"""
    try:
        addr    = Web3.to_checksum_address(address)
        raw     = phy.functions.balanceOf(addr).call()
        balance = raw / 10**18  # wei → token
        return {"address": addr, "balance": balance, "unit": "PHY"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
