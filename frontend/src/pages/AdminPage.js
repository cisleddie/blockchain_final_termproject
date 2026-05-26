// pages/AdminPage.js
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../config";
import "../styles/common.css";
import "../styles/admin.css";

export default function AdminPage() {
  const navigate = useNavigate();

  const [contribs, setContribs]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [message, setMessage]     = useState({ text: "", type: "" });
  const [txHistory, setTxHistory] = useState([]);
  const [gradeMap, setGradeMap]   = useState({});  // id → grade 선택값

  const fetchContribs = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/contribs`);
      setContribs(res.data.contribs);
    } catch (e) {
      showMsg("목록 조회 실패: " + e.message, "error");
    }
  }, []);

  useEffect(() => { fetchContribs(); }, [fetchContribs]);

  // ── 승인 처리 ────────────────────────────────────────
  async function approveContrib(c) {
    const grade = gradeMap[c.id] ?? 1;  // 기본값 FULL
    try {
      setLoading(true);
      showMsg(`#${c.id} ${c.docNumber} 승인 트랜잭션 전송 중...`, "info");

      const res = await axios.post(`${BACKEND_URL}/approve/${c.id}`, {
        grade:      grade,
        nft_uri:    `https://contribchain.io/nft/${c.id}`,
        doc_number: c.docNumber,
        ts_name:    "TS 38.211",
      });

      // 히스토리에 추가
      setTxHistory(prev => [{
        id:       c.id,
        docNum:   c.docNumber,
        author:   c.author,
        grade:    res.data.grade,
        reward:   res.data.reward,
        tx_hash:  res.data.tx_hash,
        etherscan: res.data.etherscan,
        time:     new Date().toLocaleTimeString(),
      }, ...prev]);

      showMsg(`✅ 승인 완료! ${res.data.reward} PHY + NFT 지급됨`, "success");
      await fetchContribs();
    } catch (e) {
      showMsg("승인 실패: " + (e.response?.data?.detail || e.message), "error");
    } finally {
      setLoading(false);
    }
  }

  function showMsg(text, type) {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 6000);
  }

  const pending  = contribs.filter(c => !c.approved);
  const approved = contribs.filter(c =>  c.approved);

  return (
    <div className="page">

      {/* ── 헤더 ── */}
      <header className="header admin-header">
        <div className="header-left">
          <h1 className="logo">ContribChain</h1>
          <span className="page-badge admin">관리자</span>
        </div>
        <div className="header-right">
          <button className="btn-admin" onClick={() => window.open("/", "_blank")}>← 유저 페이지</button>
        </div>
      </header>

      {/* ── 메시지 ── */}
      {message.text && (
        <div className={`msg-bar ${message.type}`}>
          {message.type === "info" && <span className="spinner" />}
          {message.text}
        </div>
      )}

      <main className="main">

        {/* ── 통계 요약 ── */}
        <div className="summary-row">
          <div className="summary-card">
            <div className="summary-label">전체 기고문</div>
            <div className="summary-value">{contribs.length} <span>건</span></div>
          </div>
          <div className="summary-card warn">
            <div className="summary-label">승인 대기</div>
            <div className="summary-value">{pending.length} <span>건</span></div>
          </div>
          <div className="summary-card ok">
            <div className="summary-label">승인 완료</div>
            <div className="summary-value">{approved.length} <span>건</span></div>
          </div>
        </div>

        {/* ── 승인 대기 목록 ── */}
        <section className="card">
          <div className="card-head">
            <h2>⏳ 승인 대기 기고문</h2>
            <button className="btn-sm" onClick={fetchContribs}>새로고침</button>
          </div>
          {pending.length === 0 ? (
            <p className="empty">대기 중인 기고문이 없습니다.</p>
          ) : (
            <table className="contrib-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>기고문 번호</th>
                  <th>제출자</th>
                  <th>문서 해시</th>
                  <th>반영 등급</th>
                  <th>승인</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(c => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td><strong>{c.docNumber}</strong></td>
                    <td className="mono">{c.author.slice(0,6)}...{c.author.slice(-4)}</td>
                    <td className="mono">{c.docHash.slice(0,16)}...</td>
                    <td>
                      <select
                        className="grade-select"
                        value={gradeMap[c.id] ?? 1}
                        onChange={e => setGradeMap(prev => ({...prev, [c.id]: Number(e.target.value)}))}
                      >
                        <option value={1}>FULL (100 PHY)</option>
                        <option value={0}>PARTIAL (50 PHY)</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn-approve"
                        onClick={() => approveContrib(c)}
                        disabled={loading}
                      >
                        {loading ? "처리중..." : "✅ 승인"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* ── 트랜잭션 히스토리 ── */}
        {txHistory.length > 0 && (
          <section className="card">
            <h2>📡 트랜잭션 히스토리</h2>
            <table className="contrib-table">
              <thead>
                <tr>
                  <th>기고문</th>
                  <th>제출자</th>
                  <th>등급</th>
                  <th>보상</th>
                  <th>트랜잭션</th>
                  <th>시간</th>
                </tr>
              </thead>
              <tbody>
                {txHistory.map((t, i) => (
                  <tr key={i}>
                    <td><strong>{t.docNum}</strong></td>
                    <td className="mono">{t.author.slice(0,6)}...{t.author.slice(-4)}</td>
                    <td><span className="badge approved">{t.grade}</span></td>
                    <td><strong>{t.reward} PHY</strong> + NFT</td>
                    <td>
                      <a href={t.etherscan} target="_blank" rel="noreferrer" className="tx-link">
                        {t.tx_hash.slice(0,12)}... →
                      </a>
                    </td>
                    <td>{t.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* ── 승인 완료 목록 ── */}
        {approved.length > 0 && (
          <section className="card">
            <h2>✅ 승인 완료 기고문</h2>
            <table className="contrib-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>기고문 번호</th>
                  <th>제출자</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {approved.map(c => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td><strong>{c.docNumber}</strong></td>
                    <td className="mono">{c.author.slice(0,6)}...{c.author.slice(-4)}</td>
                    <td><span className="badge approved">✅ 반영됨</span></td>
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
