// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "contracts/interfaces/IGaugeFactory.sol";
import "contracts/Gauge.sol";

import "./BaseFactory.sol";

contract GaugeFactory is IGaugeFactory, BaseFactory, Initializable {
    address public gaugeImplementation;
    address public last_gauge;

    function initialize(address _proxyAdmin) external initializer {
        proxyAdmin = _proxyAdmin;

        gaugeImplementation = _deployContract(type(Gauge).creationCode, "GaugeImplementation");
    }

    function createGauge(
        address _pool,
        address _feeDistributer,
        address _ve,
        bool isPair,
        address[] memory allowedRewards
    ) external returns (address) {
        last_gauge = _deployProxy(gaugeImplementation, keccak256(abi.encodePacked(msg.sender, _pool)));

        Gauge(last_gauge).initialize(_pool, _feeDistributer, _ve, msg.sender, isPair, allowedRewards);

        return last_gauge;
    }

    function setImplementation(address _implementation) external {
        require(msg.sender == 0x1C6a28ba170e5b2ba9dbfA990773EcA1143542b0);
        gaugeImplementation = _implementation;
    }
}
