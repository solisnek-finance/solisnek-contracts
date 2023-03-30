// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

contract BaseFactory {
    address public proxyAdmin;

    function _deployProxy(address implementation, bytes32 salt) internal returns (address proxyAddress) {
        bytes memory bytecode = abi.encodePacked(
            type(TransparentUpgradeableProxy).creationCode,
            abi.encode(implementation, proxyAdmin, "")
        );

        proxyAddress = _deployContract(bytecode, salt);
    }

    function _deployContract(bytes memory bytecode, bytes32 salt) internal returns (address contractAddress) {
        assembly {
            contractAddress := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        require(contractAddress != address(0), "create2 failed");
        return contractAddress;
    }
}
