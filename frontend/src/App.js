// App.js — ContribChain 메인 컴포넌트

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { CONTRACTS, BACKEND_URL, PHY_TOKEN_ABI, CONTRIB_REGISTRY_ABI } from "./config";
import "./App.css";

function App() {
  // ── 상태 ──────────────────────────────────────────────
  const [account, setAccount]       = useState(null);   // 연결된 지갑 주소
  const [balance, setBalance]       = useState(null);   // PHYToken 잔액
  const [signer, setSigner]         = useState(null);   // ethers Signer
  const [contribs, setContribs]     = useState([]);     // 기고문 목록
  const [docNumber, setDocNumber]   = useState("");     // 입력: 기고문 번호
  const [file, setFile]             = useState(null);   // 업로드 파일
  const [fileHash, setFileHash]     = useState("");     // 생성된 해시
  const [txHash, setTxHash]         = useState("");     // 트랜잭션 해시
  const [loading, setLoading]       = useState(false);  // 로딩 상태
  const [message, setMessage]       = useState("");     // 상태 메시지

  // ── MetaMask 지갑 연결 ───────────────────────────────
  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask를 설치해주세요!");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const s = await provider.getSigner();
      const addr = await s.getAddress();

      setSigner(s);
      setAccount(addr);
      await fetchBalance(addr, provider);
      await fetchContribs();
      setMessage("지갑 연결 완료!");
    } catch (e) {
      setMessage("지갑 연결 실패: " + e.message);
    }
  }

  // ── PHYToken 잔액 조회 ───────────────────────────────
  async function fetchBalance(addr, provider) {
    try {
      const token = new ethers.Contract(CONTRACTS.PHY_TOKEN, PHY_TOKEN_ABI, provider);
      const raw = await token.balanceOf(addr);
      setBalance(ethers.formatEther(raw));
    } catch (e) {
      console.error("잔액 조회 실패:", e);
    }
  }

  // ── 기고문 목록 조회 (백엔드) ────────────────────────
  async function fetchContribs() {
    try {
      const res = await axios.get(`${BACKEND_URL}/contribs`);
      setContribs(res.data.contribs);
    } catch (e) {
      console.error("목록 조회 실패:", e);
    }
  }

  // ── 파일 업로드 → keccak256 해시 생성 ───────────────
  async function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);

    const buffer = await f.arrayBuffer();
    const bytes  = new Uint8Array(buffer);
    const hash   = ethers.keccak256(bytes);
    setFileHash(hash);
    setMessage(`해시 생성 완료: ${hash.slice(0, 20)}...`);
  }

  // ── 기고문 등록 트랜잭션 ─────────────────────────────
  async function registerContrib() {
    if (!signer)    return setMessage("지갑을 먼저 연결해주세요.");
    if (!fileHash)  return setMessage("파일을 먼저 업로드해주세요.");
    if (!docNumber) return setMessage("기고문 번호를 입력해주세요.");

    try {
      setLoading(true);
      setMessage("MetaMask에서 서명 요청 중...");

      const registry = new ethers.Contract(
        CONTRACTS.CONTRIB_REGISTRY,
        CONTRIB_REGISTRY_ABI,
        signer
      );

      const tx = await registry.register(fileHash, docNumber);
      setMessage("트랜잭션 전송 중...");

      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      setMessage("등록 완료!");
      setDocNumber("");
      setFileHash("");
      setFile(null);
      await fetchContribs();
    } catch (e) {
      setMessage("등록 실패: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── 관리자 승인 (오라클 호출) ────────────────────────
  async function approveContrib(id, docNum) {
    try {
      setLoading(true);
      setMessage(`기고문 #${id} 승인 중...`);

      const res = await axios.post(`${BACKEND_URL}/approve/${id}`, {
        grade:      1,          // 1 = FULL (100 token)
        nft_uri:    `https://contribchain.io/nft/${id}`,
        doc_number: docNum,
        ts_name:    "TS 38.211",
      });

      setMessage(`승인 완료! 보상: ${res.data.reward} PHY`);
      setTxHash(res.data.tx_hash);

      // 잔액 갱신
      if (account) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await fetchBalance(account, provider);
      }
      await fetchContribs();
    } catch (e) {
      setMessage("승인 실패: " + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────
  return (
    <div className="app">

      {/* ── 헤더 ── */}
      <header className="header">
        <div className="header-left">
          <h1>ContribChain</h1>
          <span className="subtitle">3GPP 기고문 기여 보상 DApp</span>
        </div>
        <div className="header-right">
          {account ? (
            <div className="wallet-info">
              <span className="address">{account.slice(0, 6)}...{account.slice(-4)}</span>
              <span className="balance">{parseFloat(balance).toFixed(2)} PHY</span>
            </div>
          ) : (
            <button className="btn-connect" onClick={connectWallet}>
              MetaMask 연결
            </button>
          )}
        </div>
      </header>

      {/* ── 상태 메시지 ── */}
      {message && (
        <div className="message-bar">
          {loading && <span className="spinner" />}
          {message}
        </div>
      )}

      {/* ── tx hash 링크 ── */}
      {txHash && (
        <div className="tx-bar">
          트랜잭션 확인:&nbsp;
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            {txHash.slice(0, 20)}... (Etherscan)
          </a>
        </div>
      )}

      <main className="main">

        {/* ── 기고문 등록 폼 ── */}
        <section className="card">
          <h2>기고문 등록</h2>
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
            <div className="hash-display">
              keccak256: {fileHash.slice(0, 30)}...
            </div>
          )}
          <button
            className="btn-primary"
            onClick={registerContrib}
            disabled={loading || !account}
          >
            {loading ? "처리 중..." : "등록하기"}
          </button>
        </section>

        {/* ── 기고문 목록 ── */}
        <section className="card">
          <h2>기고문 목록</h2>
          <button className="btn-secondary" onClick={fetchContribs}>새로고침</button>
          {contribs.length === 0 ? (
            <p className="empty">등록된 기고문이 없습니다.</p>
          ) : (
            <table className="contrib-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>문서 번호</th>
                  <th>제출자</th>
                  <th>상태</th>
                  <th>관리자 승인</th>
                </tr>
              </thead>
              <tbody>
                {contribs.map(c => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td>{c.docNumber}</td>
                    <td>{c.author.slice(0, 6)}...{c.author.slice(-4)}</td>
                    <td>
                      <span className={`badge ${c.approved ? "approved" : "pending"}`}>
                        {c.approved ? "✅ 반영됨" : "⏳ 대기중"}
                      </span>
                    </td>
                    <td>
                      {!c.approved && (
                        <button
                          className="btn-approve"
                          onClick={() => approveContrib(c.id, c.docNumber)}
                          disabled={loading}
                        >
                          승인
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

      </main>
    </div>
  );
}

export default App;
