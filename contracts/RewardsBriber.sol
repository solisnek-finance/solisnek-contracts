// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import "./interfaces/IERC20.sol";
import "./interfaces/IVotingEscrow.sol";

contract RewardsBriber is AccessControlUpgradeable {
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    IVotingEscrow public ve;
    IERC20 public underlying;

    event DepositFor(uint256 tokenId, uint256 amount);

    function initialize(address _ve, address _msig) public initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, _msig);
        _grantRole(EXECUTOR_ROLE, _msig);
        ve = IVotingEscrow(_ve);
        underlying = IERC20(IVotingEscrow(_ve).token());
    }

    function claimFor(uint256[] memory tokenIds, uint256[] memory amounts) public onlyRole(EXECUTOR_ROLE) {
        require(tokenIds.length == amounts.length, "ids and amounts must have same length");

        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }

        require(underlying.balanceOf(address(this)) >= total, "Not enough balance");
        underlying.approve(address(ve), total);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            ve.deposit_for(tokenIds[i], amounts[i]);
            emit DepositFor(tokenIds[i], amounts[i]);
        }
    }
}
