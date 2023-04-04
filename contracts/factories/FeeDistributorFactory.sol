// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "contracts/interfaces/IFeeDistributorFactory.sol";
import "contracts/FeeDistributor.sol";

import "./BaseFactory.sol";

/*
    we don't need two bribe contracts, but for now leave it be
*/

contract FeeDistributorFactory is IFeeDistributorFactory, BaseFactory, Initializable {
    address public lastFeeDistributer;

    address public feeDistributorImplementation;

    modifier onlyAdmin() {
        require(msg.sender == 0x2aE2A1F05e9d5De2493B6679158Cd02Ed059Ff59, "!admin");
        _;
    }

    function initialize(address _proxyAdmin) external initializer {
        proxyAdmin = _proxyAdmin;

        feeDistributorImplementation = _deployContract(
            type(FeeDistributor).creationCode,
            "FEE_DISTRIBUTOR_IMPLEMENTATION"
        );
    }

    function createFeeDistributor(address pair) external returns (address) {
        lastFeeDistributer = _deployProxy(
            feeDistributorImplementation,
            keccak256(abi.encodePacked(msg.sender, pair, "INTERNAL"))
        );
        FeeDistributor(lastFeeDistributer).initialize(msg.sender);

        return lastFeeDistributer;
    }

    function setImplementation(address _implementation) external onlyAdmin {
        feeDistributorImplementation = _implementation;
    }
}
