// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CyberGAToken is ERC20 {
    uint256 public constant tokenPrice = 0.000001 ether;
    uint256 public constant maxSupply = 10000 * 10**18; // 10,000 tokens
    
    
    constructor() ERC20("CyberGA Token", "CYBERGA") {
        // mint 10 tokens to the developer
        _mint(msg.sender, 10 * 10**18);
    }

    function mintTokens(uint256 _amount) public payable {
        uint256 _calculatedAmount = _amount * tokenPrice;
        require(msg.value >= _calculatedAmount, "Not enough ether to mint the requested CYBERGA tokens");
        uint256 amountInWei = _amount * 10**18;
        require(totalSupply() + amountInWei <= maxSupply, "Not enough tokens left for sale");
        _mint(msg.sender, amountInWei);
    }

    function viewTokenBal() public view returns (uint256) {
        return balanceOf(msg.sender);
    }
}