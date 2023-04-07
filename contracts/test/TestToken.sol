// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract TestToken is ERC20, ERC20Burnable {
    uint8 _decimals;

    constructor(string memory _name, string memory _symbol, uint8 __decimals) ERC20(_name, _symbol) {
        _decimals = __decimals;
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    // WETH

    function deposit() public payable {
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint wad) public {
        require(balanceOf(msg.sender) >= wad);
        _burn(msg.sender, wad);
        payable(msg.sender).transfer(wad);
    }
}
