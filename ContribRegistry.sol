// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PHYToken.sol";
import "./ContribNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ContribRegistry is Ownable {

    // 기여 등급
    enum Grade { PARTIAL, FULL }

    // 기고문 구조체
    struct Contribution {
        bytes32 docHash;    // 기고문 파일 해시
        address author;     // 제출자 지갑 주소
        string docNumber;   // 기고문 번호 (예: R1-2408426)
        bool approved;      // 반영 승인 여부
        uint256 timestamp;  // 등록 시각
    }

    PHYToken public phyToken;
    ContribNFT public contribNFT;

    uint256 public contribCount;
    mapping(uint256 => Contribution) public contributions;

    // 등급별 보상 토큰 수량
    uint256 public constant REWARD_PARTIAL = 50;
    uint256 public constant REWARD_FULL    = 100;

    // 이벤트
    event ContribRegistered(uint256 indexed id, address indexed author, bytes32 docHash);
    event ContribApproved(uint256 indexed id, address indexed author, uint256 tokenReward);

    constructor(address _phyToken, address _contribNFT) Ownable(msg.sender) {
        phyToken   = PHYToken(_phyToken);
        contribNFT = ContribNFT(_contribNFT);
    }

    // ── 연구자가 호출 ───────────────────────────────────
    // 기고문 등록
    function register(bytes32 docHash, string memory docNumber) external {
        uint256 id = contribCount++;
        contributions[id] = Contribution({
            docHash:   docHash,
            author:    msg.sender,
            docNumber: docNumber,
            approved:  false,
            timestamp: block.timestamp
        });
        emit ContribRegistered(id, msg.sender, docHash);
    }

    // ── 오라클(관리자)이 호출 ───────────────────────────
    // 스펙 반영 확인 후 승인 + 보상 자동 지급
    function approve(uint256 id, Grade grade, string memory nftURI) external onlyOwner {
        Contribution storage c = contributions[id];
        require(!c.approved, "Already approved");

        c.approved = true;

        // 등급에 따라 보상 토큰 수량 결정
        uint256 reward = (grade == Grade.FULL) ? REWARD_FULL : REWARD_PARTIAL;

        // PHYToken 보상 지급
        phyToken.mintReward(c.author, reward);

        // ContribNFT 발행 (기고문 번호·TS명·날짜 담긴 메타데이터 URI 전달)
        contribNFT.mint(c.author, nftURI);

        emit ContribApproved(id, c.author, reward);
    }

    // 기고문 정보 조회
    function getContrib(uint256 id) external view returns (Contribution memory) {
        return contributions[id];
    }
}