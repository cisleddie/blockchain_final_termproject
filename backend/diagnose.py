import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
import requests
import os
from dotenv import load_dotenv
from web3 import Web3

load_dotenv()

rpc_url = os.getenv("SEPOLIA_RPC_URL")
registry_addr = os.getenv("CONTRIB_REGISTRY_ADDRESS")

print(f"RPC URL  : {rpc_url[:50]}..." if rpc_url and len(rpc_url) > 50 else f"RPC URL  : {rpc_url}")
print(f"Registry : {registry_addr}")
print()

# ── 1. 직접 requests로 eth_getCode 호출 ──────────────────
print("=== 방법 1: requests 직접 호출 ===")
try:
    resp = requests.post(
        rpc_url,
        json={"jsonrpc": "2.0", "method": "eth_getCode",
              "params": [registry_addr, "latest"], "id": 1},
        verify=False,
        timeout=15,
    )
    data = resp.json()
    code_hex = data.get("result", "")
    print(f"HTTP status : {resp.status_code}")
    print(f"eth_getCode : {code_hex[:80]}{'...' if len(code_hex) > 80 else ''}")
    print(f"code length : {(len(code_hex) - 2) // 2 if code_hex.startswith('0x') else 0} bytes")
except Exception as e:
    print(f"오류: {e}")

print()

# ── 2. web3.py로 호출 ────────────────────────────────────
print("=== 방법 2: web3.py ===")
w3 = Web3(Web3.HTTPProvider(rpc_url, request_kwargs={"verify": False}))
print(f"is_connected : {w3.is_connected()}")
if w3.is_connected():
    try:
        code = w3.eth.get_code(Web3.to_checksum_address(registry_addr))
        print(f"get_code     : {len(code)} bytes")
    except Exception as e:
        print(f"get_code 오류: {e}")

print()

# ── 3. 공개 RPC로 재시도 ─────────────────────────────────
print("=== 방법 3: 공개 RPC (publicnode) ===")
pub_rpc = "https://ethereum-sepolia-rpc.publicnode.com"
try:
    resp2 = requests.post(
        pub_rpc,
        json={"jsonrpc": "2.0", "method": "eth_getCode",
              "params": [registry_addr, "latest"], "id": 1},
        verify=False,
        timeout=15,
    )
    data2 = resp2.json()
    code_hex2 = data2.get("result", "")
    print(f"HTTP status : {resp2.status_code}")
    print(f"eth_getCode : {code_hex2[:80]}{'...' if len(code_hex2) > 80 else ''}")
    print(f"code length : {(len(code_hex2) - 2) // 2 if code_hex2.startswith('0x') else 0} bytes")
except Exception as e:
    print(f"오류: {e}")
