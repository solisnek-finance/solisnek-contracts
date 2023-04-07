// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "contracts/interfaces/IPairFactory.sol";
import "contracts/interfaces/IPair.sol";

import "./BaseFactory.sol";

contract PairFactory is IPairFactory, Initializable, BaseFactory {
    bool public isPaused;
    address public pauser;
    address public pendingPauser;
    address public voter;
    uint256 public stableFee;
    uint256 public volatileFee;
    uint256 public constant MAX_FEE = 500; // 5%
    address public feeManager;
    address public pendingFeeManager;

    mapping(address => mapping(address => mapping(bool => address))) public getPair;
    address[] public allPairs;
    mapping(address => bool) public isPair; // simplified check if its a pair, given that `stable` flag might not be available in peripherals

    // chaning pairImplementation address in future could cause problems in router,
    // because router generate pair addresses itself
    address public pairImplementation;

    // pair => fee
    mapping(address => uint256) public pairFee;

    bool public isPairCreationPaused;

    event PairCreated(address indexed token0, address indexed token1, bool stable, address pair, uint256);

    modifier onlyAdmin() {
        require(msg.sender == 0x2aE2A1F05e9d5De2493B6679158Cd02Ed059Ff59, "!admin");
        _;
    }

    function initialize(
        address _proxyAdmin,
        address _pairImplementation,
        address _voter,
        address msig
    ) external initializer {
        pauser = msig;
        isPaused = true;
        feeManager = msig;
        stableFee = 2; // 0.02%
        volatileFee = 20; // 0.2%
        voter = _voter;
        proxyAdmin = _proxyAdmin;
        pairImplementation = _pairImplementation;
        isPairCreationPaused = true;
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    function setPauser(address _pauser) external {
        require(msg.sender == pauser);
        pendingPauser = _pauser;
    }

    function acceptPauser() external {
        require(msg.sender == pendingPauser);
        pauser = pendingPauser;
    }

    function setPairCreationPaused(bool _state) external {
        require(msg.sender == pauser);
        isPairCreationPaused = _state;
    }

    function setPause(bool _state) external {
        require(msg.sender == pauser);
        isPaused = _state;
    }

    function setFeeManager(address _feeManager) external {
        require(msg.sender == feeManager, "not fee manager");
        pendingFeeManager = _feeManager;
    }

    function acceptFeeManager() external {
        require(msg.sender == pendingFeeManager, "not pending fee manager");
        feeManager = pendingFeeManager;
    }

    function setFee(bool _stable, uint256 _fee) external {
        require(msg.sender == feeManager, "not fee manager");
        require(_fee <= MAX_FEE, "fee too high");
        require(_fee != 0, "fee must be nonzero");
        if (_stable) {
            stableFee = _fee;
        } else {
            volatileFee = _fee;
        }
    }

    function setPairFee(address _pair, uint256 _fee) external {
        require(msg.sender == feeManager, "not fee manager");
        require(_fee <= MAX_FEE, "fee too high");
        pairFee[_pair] = _fee;
    }

    function getFee(bool _stable) public view returns (uint256) {
        if (pairFee[msg.sender] == 0) {
            return _stable ? stableFee : volatileFee;
        } else {
            return pairFee[msg.sender];
        }
    }

    function pairCodeHash() external view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    type(TransparentUpgradeableProxy).creationCode,
                    abi.encode(pairImplementation, proxyAdmin, "")
                )
            );
    }

    function createPair(address tokenA, address tokenB, bool stable) external returns (address pair) {
        if (isPairCreationPaused) {
            require(msg.sender == pauser, "CP"); // Pair: CREATION_PAUSED
        }

        require(tokenA != tokenB, "IA"); // Pair: IDENTICAL_ADDRESSES
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "ZA"); // Pair: ZERO_ADDRESS
        require(getPair[token0][token1][stable] == address(0), "PE"); // Pair: PAIR_EXISTS - single check is sufficient

        bytes32 salt = keccak256(abi.encodePacked(token0, token1, stable));

        pair = _deployProxy(pairImplementation, salt);
        IPair(pair).initialize(token0, token1, stable);

        getPair[token0][token1][stable] = pair;
        getPair[token1][token0][stable] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);
        isPair[pair] = true;

        emit PairCreated(token0, token1, stable, pair, allPairs.length);
    }

    function setImplementation(address _implementation) external onlyAdmin {
        pairImplementation = _implementation;
    }
}
