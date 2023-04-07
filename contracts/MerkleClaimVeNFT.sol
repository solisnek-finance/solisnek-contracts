// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IVotingEscrow.sol";

/// @title MerkleClaimVeNFT
/// @notice VeNFT claimable by members of a merkle tree
/// @author Modified from Merkle Airdrop Starter (https://github.com/Anish-Agnihotri/merkle-airdrop-starter/blob/master/contracts/src/MerkleClaimERC20.sol)
contract MerkleClaimVeNFT is OwnableUpgradeable {
    /// @notice max lock period 1 year
    uint256 public constant LOCK = 365 * 86400;

    uint256 public duration;
    uint256 public startTime;

    /// ============ Immutable storage ============

    IVotingEscrow public ve;

    /// @notice Token to claim
    IERC20 public underlying;

    /// ============ Mutable storage ============

    /// @notice VeNFT-claimee inclusion root
    bytes32 public merkleRoot;

    /// @notice Mapping of addresses who have claimed tokens
    mapping(address => bool) public hasClaimed;

    /// ============ Constructor ============

    /// @notice Initialize new MerkleClaim contract
    /// @param _ve address
    /// @param _merkleRoot of claimees
    /// @param _duration duration for airdrop
    function initialize(address _ve, bytes32 _merkleRoot, uint256 _duration) public initializer {
        __Ownable_init();
        ve = IVotingEscrow(_ve);
        underlying = IERC20(IVotingEscrow(_ve).token());
        merkleRoot = _merkleRoot;
        duration = _duration;
    }

    /* ============ Events ============ */

    /// @notice Emitted after a successful token claim
    /// @param to recipient of claim
    /// @param amount of veTokens claimed
    /// @param tokenId veToken NFT Id
    event Claim(address indexed to, uint256 amount, uint256 tokenId);

    /// @notice Emitted after a successful withdrawal of remaining tokens
    /// @param recipient recipient of remaining tokens
    /// @param amount of remaining tokens
    event Withdrawal(address indexed recipient, uint256 amount);

    /* ============ Functions ============ */

    /// @notice set start time for airdrop
    /// @param _startTime start time (in seconds)
    function setStartTime(uint256 _startTime) external onlyOwner {
        require(_startTime > block.timestamp, "Invalid start time");
        startTime = _startTime;
    }

    /// @notice set duration for airdrop
    /// @param _duration duration (in days)
    function setDuration(uint256 _duration) external onlyOwner {
        require(_duration > 0, "Invalid duration days");
        duration = _duration;
    }

    /// @notice set merkle root
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    /// @notice Allows claiming tokens if address is part of merkle tree
    /// @param _to address of claimee
    /// @param _amount under veNFT
    /// @param _proof merkle proof to prove address and amount are in tree
    function claim(address _to, uint256 _amount, bytes32[] calldata _proof) external {
        uint256 endTime = startTime + duration * 86400;
        // check valid timestamp
        require(
            block.timestamp >= startTime && block.timestamp <= endTime,
            "Airdrop is not started yet or already finished"
        );

        // Throw if address has already claimed tokens
        require(!hasClaimed[_to], "ALREADY_CLAIMED");

        // Verify merkle proof, or revert if not in tree
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(_to, _amount))));
        bool isValidLeaf = MerkleProof.verify(_proof, merkleRoot, leaf);
        require(isValidLeaf, "NOT_IN_MERKLE");

        require(underlying.balanceOf(address(this)) >= _amount, "All tokens were already claimed");

        // Set address to claimed
        hasClaimed[_to] = true;
        underlying.approve(address(ve), _amount);
        // Claim veNFT for address
        uint256 tokenId = ve.create_lock_for(_amount, LOCK, _to);
        // Emit claim event
        emit Claim(_to, _amount, tokenId);
    }

    /// @notice withdraw remaining tokens if airdrop is finished
    function withdrawUnderlying(address _recipient) external onlyOwner {
        require(block.timestamp > startTime + duration * 86400, "Airdrop is not finished yet");
        uint256 remaining = underlying.balanceOf(address(this));
        require(remaining > 0, "No remaining tokens");
        underlying.transfer(_recipient, remaining);
        // Emit withdrawal event
        emit Withdrawal(_recipient, remaining);
    }

    function setClaimStatus(address[] memory _accounts, bool[] memory _statuses) external onlyOwner {
        for (uint256 i = 0; i < _accounts.length; i++) {
            hasClaimed[_accounts[i]] = _statuses[i];
        }
    }
}
