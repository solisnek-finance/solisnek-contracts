// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

contract Deployer {
    event ContractCreated(address indexed contractAddress, uint salt);

    function getAddress(bytes memory bytecode, uint salt) public view returns (address) {
        bytes32 hash = keccak256(abi.encodePacked(bytes1(0xff), address(this), salt, keccak256(bytecode)));
        return address(uint160(uint(hash)));
    }

    function getProxyAddress(address logic, address admin, uint salt) external view returns (address) {
        bytes memory bytecode = _getProxyBytes(logic, admin);
        return getAddress(bytecode, salt);
    }

    function deployProxy(address logic, address admin, uint salt) external returns (address contractAddress) {
        bytes memory bytecode = _getProxyBytes(logic, admin);
        return _deploy(bytecode, salt);
    }

    function deployProxies(
        address[] memory logics,
        address admin,
        uint[] memory salts
    ) external returns (address[] memory) {
        require(salts.length == logics.length, "invalid length");
        address[] memory contractAddresses = new address[](salts.length);
        for (uint256 i = 0; i < salts.length; i++) {
            bytes memory bytecode = _getProxyBytes(logics[i], admin);
            contractAddresses[i] = _deploy(bytecode, salts[i]);
        }
        return contractAddresses;
    }

    function deploy(bytes memory bytecode, uint salt) external returns (address contractAddress) {
        return _deploy(bytecode, salt);
    }

    function deployMany(bytes memory bytecode, uint[] memory salts) external returns (address[] memory) {
        address[] memory contractAddresses = new address[](salts.length);
        for (uint256 i = 0; i < salts.length; i++) {
            contractAddresses[i] = _deploy(bytecode, salts[i]);
        }
        return contractAddresses;
    }

    function _deploy(bytes memory bytecode, uint salt) internal returns (address contractAddress) {
        assembly {
            contractAddress := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        require(contractAddress != address(0), "create2 failed");
        emit ContractCreated(contractAddress, salt);
        return contractAddress;
    }

    function _getProxyBytes(address logic, address admin) internal pure returns (bytes memory bytecode) {
        return abi.encodePacked(type(TransparentUpgradeableProxy).creationCode, abi.encode(logic, admin, ""));
    }
}
