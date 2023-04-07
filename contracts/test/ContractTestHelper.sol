// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "../Pair.sol";

contract ContractTestHelper {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using Math for uint;

    function pairCurrentTwice(address pair, address tokenIn, uint amountIn) external returns (uint, uint) {
        uint c0 = Pair(pair).current(tokenIn, amountIn);
        Pair(pair).sync();
        uint c1 = Pair(pair).current(tokenIn, amountIn);
        return (c0, c1);
    }

    function hook(address, uint amount0, uint amount1, bytes calldata data) external {
        address pair = abi.decode(data, (address));
        (address token0, address token1) = Pair(pair).tokens();
        if (amount0 != 0) {
            IERC20Upgradeable(token0).safeTransfer(pair, amount0);
        }
        if (amount1 != 0) {
            IERC20Upgradeable(token1).safeTransfer(pair, amount1);
        }
    }
}
