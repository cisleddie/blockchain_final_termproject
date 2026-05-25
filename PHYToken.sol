// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PHYToken is ERC20, Ownable {

    constructor() ERC20("PHYToken", "PHY") Ownable(msg.sender) {
        // 배포자에게 초기 100만 토큰 발행
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    // ContribRegistry 컨트랙트가 보상 지급할 때 호출
    function mintReward(address to, uint256 amount) external onlyOwner {
        _mint(to, amount * 10 ** decimals());
    }
}