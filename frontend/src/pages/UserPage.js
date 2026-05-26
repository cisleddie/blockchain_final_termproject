// pages/UserPage.js
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CONTRACTS, BACKEND_URL, PHY_TOKEN_ABI, CONTRIB_REGISTRY_ABI } from "../config";
import "../styles/common.css";
import "../styles/user.css";

export default function UserPage() {
  const navigate = useNavigate();

  const [account, setAccount]     = useState(null);
  const [balance, setBalance]     = useState("0");
  const [signer, setSigner]       = useState(null);
  const [myContribs, setMyContribs] = useState([]);
  const [docNumber, setDocNumber] = useState("");
  const [file, setFile]           = useState(null);
  const [fileHash, setFileHash]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [message, setMessage]     = useState({ text: "", type: "" });
  const [txHash, setTxHash]       = useState("");
  const [rewardHistory, setRewardHistory] = useState([]);

  // ── 지갑 연결 ────────────────────────────────────────
  async function connectWallet() {
    if (!window.ethereum) return alert("MetaMask를 설치해주세요!");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const s = await provider.getSigner();
      const addr = await s.getAddress();
      setSigner(s);
      setAccount(addr);
      showMsg("지갑 연결 완료!", "success");
    } catch (e) {
      showMsg("지갑 연결 실패: " + e.message, "error");
    }
  }

  // ── 잔액 조회 ────────────────────────────────────────
  const fetchBalance = useCallback(async () => {
    if (!account) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const token = new ethers.Contract(CONTRACTS.PHY_TOKEN, PHY_TOKEN_ABI, provider);
      const raw = await token.balanceOf(account);
      setBalance(ethers.formatEther(raw));
    } catch (e) {
      console.error("잔액 조회 실패:", e);
    }
  }, [account]);

  // ── 내 기고문 목록 ───────────────────────────────────
  const fetchMyContribs = useCallback(async () => {
    if (!account) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/contribs`);
      const mine = res.data.contribs.filter(
        c => c.author.toLowerCase() === account.toLowerCase()
      );
      setMyContribs(mine);

      // 승인된 것들 → 보상 히스토리
      const approved = mine.filter(c => c.approved);
      setRewardHistory(approved);
    } catch (e) {
      console.error("목록 조회 실패:", e);
    }
  }, [account]);

  useEffect(() => {
    if (account) {
      fetchBalance();
      fetchMyContribs();
    }
  }, [account, fetchBalance, fetchMyContribs]);

  // ── 파일 해시 생성 ───────────────────────────────────
  async function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const buffer = await f.arrayBuffer();
    const hash = ethers.keccak256(new Uint8Array(buffer));
    setFileHash(hash);
    showMsg("해시 생성 완료!", "success");
  }

  // ── 기고문 등록 ──────────────────────────────────────
  async function registerContrib() {
    if (!signer)    return showMsg("지갑을 먼저 연결해주세요.", "error");
    if (!fileHash)  return showMsg("파일을 업로드해주세요.", "error");
    if (!docNumber) return showMsg("기고문 번호를 입력해주세요.", "error");

    try {
      setLoading(true);
      showMsg("MetaMask에서 서명 요청 중...", "info");
      const registry = new ethers.Contract(CONTRACTS.CONTRIB_REGISTRY, CONTRIB_REGISTRY_ABI, signer);
      const tx = await registry.register(fileHash, docNumber);
      showMsg("트랜잭션 전송 중... 잠시 기다려주세요.", "info");
      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      showMsg("기고문 등록 완료! 스펙 반영 심사 대기 중입니다.", "success");
      setDocNumber("");
      setFileHash("");
      setFile(null);
      await fetchMyContribs();
    } catch (e) {
      showMsg("등록 실패: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  function showMsg(text, type) {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  }

  // ─────────────────────────────────────────────────────
  return (
    <div className="page">

      {/* ── 헤더 ── */}
      <header className="header">
        <div className="header-left">
          <h1 className="logo">ContribChain</h1>
          <span className="page-badge user">연구자</span>
        </div>
        <div className="header-right">
          {account ? (
            <div className="wallet-box">
              <div className="wallet-addr">{account.slice(0,6)}...{account.slice(-4)}</div>
              <div className="wallet-balance">
                <span className="balance-num">{parseFloat(balance).toFixed(2)}</span>
                <span className="balance-unit"> PHY</span>
              </div>
              <button className="btn-refresh" onClick={fetchBalance}>↻</button>
            </div>
          ) : (
            <button className="btn-connect" onClick={connectWallet}>🦊 MetaMask 연결</button>
          )}
          <button className="btn-admin" onClick={() => window.open("/admin", "_blank")}>관리자 →</button>
        </div>
      </header>

      {/* ── 메시지 ── */}
      {message.text && (
        <div className={`msg-bar ${message.type}`}>
          {message.type === "info" && <span className="spinner" />}
          {message.text}
        </div>
      )}

      {/* ── tx 링크 ── */}
      {txHash && (
        <div className="tx-bar">
          ✅ 트랜잭션 완료:&nbsp;
          <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">
            {txHash.slice(0,20)}... Etherscan에서 확인 →
          </a>
        </div>
      )}

      <main className="main">

        {/* ── 보상 요약 카드 ── */}
        {account && (
          <div className="summary-row">
            <div className="summary-card">
              <div className="summary-label">보유 PHYToken</div>
              <div className="summary-value">{parseFloat(balance).toFixed(2)} <span>PHY</span></div>
            </div>
            <div className="summary-card">
              <div className="summary-label">등록한 기고문</div>
              <div className="summary-value">{myContribs.length} <span>건</span></div>
            </div>
            <div className="summary-card">
              <div className="summary-label">스펙 반영</div>
              <div className="summary-value">{rewardHistory.length} <span>건</span></div>
            </div>
          </div>
        )}

        {/* ── 기고문 등록 ── */}
        <section className="card">
          <h2>📄 기고문 등록</h2>
          <div className="form-group">
            <label>기고문 번호</label>
            <input
              type="text"
              placeholder="예: R1-2408426"
              value={docNumber}
              onChange={e => setDocNumber(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>기고문 PDF 업로드</label>
            <input type="file" accept=".pdf" onChange={handleFileChange} />
          </div>
          {fileHash && (
            <div className="hash-box">
              <span className="hash-label">keccak256</span>
              <span className="hash-value">{fileHash.slice(0,30)}...</span>
            </div>
          )}
          <button className="btn-primary" onClick={registerContrib} disabled={loading || !account}>
            {loading ? <><span className="spinner" /> 처리 중...</> : "등록하기"}
          </button>
          {!account && <p className="hint">* 지갑을 먼저 연결해주세요.</p>}
        </section>

        {/* ── 내 기고문 목록 ── */}
        <section className="card">
          <div className="card-head">
            <h2>📋 내 기고문 현황</h2>
            <button className="btn-sm" onClick={fetchMyContribs}>새로고침</button>
          </div>
          {!account ? (
            <p className="empty">지갑을 연결하면 내 기고문을 볼 수 있습니다.</p>
          ) : myContribs.length === 0 ? (
            <p className="empty">등록된 기고문이 없습니다.</p>
          ) : (
            <div className="contrib-list">
              {myContribs.map(c => (
                <div key={c.id} className={`contrib-item ${c.approved ? "approved" : "pending"}`}>
                  <div className="contrib-top">
                    <span className="contrib-id">#{c.id}</span>
                    <span className="contrib-doc">{c.docNumber}</span>
                    <span className={`badge ${c.approved ? "approved" : "pending"}`}>
                      {c.approved ? "✅ 스펙 반영됨" : "⏳ 심사 대기중"}
                    </span>
                  </div>
                  {c.approved && (
                    <div className="reward-info">
                      🎉 보상 수령: <strong>100 PHY</strong> + ContribNFT 발행됨
                    </div>
                  )}
                  <div className="contrib-hash">
                    해시: {c.docHash.slice(0,20)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 보상 히스토리 ── */}
        {rewardHistory.length > 0 && (
          <section className="card">
            <h2>🏆 보상 히스토리</h2>
            <table className="reward-table">
              <thead>
                <tr>
                  <th>기고문</th>
                  <th>등급</th>
                  <th>보상</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {rewardHistory.map(c => (
                  <tr key={c.id}>
                    <td>{c.docNumber}</td>
                    <td>FULL</td>
                    <td><strong>100 PHY</strong> + NFT</td>
                    <td><span className="badge approved">완료</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

      </main>
    </div>
  );
}
