// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ContribNFT is ERC721URIStorage, Ownable {

    uint256 private _tokenIdCounter;

    constructor() ERC721("ContribNFT", "CNFT") Ownable(msg.sender) {}

    // 기여 증명 NFT 발행
    // tokenURI: 기고문 번호, TS명, 날짜 등 메타데이터 JSON 주소
    function mint(address to, string memory tokenURI) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        return tokenId;
    }
}