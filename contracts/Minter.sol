// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

import "contracts/interfaces/IMinter.sol";
import "contracts/interfaces/IRewardsDistributor.sol";
import "contracts/interfaces/ISnek.sol";
import "contracts/interfaces/IVoter.sol";
import "contracts/interfaces/IVotingEscrow.sol";

// codifies the minting rules as per ve(3,3), abstracted from the token to support any token that allows minting

contract Minter is IMinter, Initializable {
    uint256 internal constant WEEK = 86400 * 7; // allows minting once per week (reset every Thursday 00:00 UTC)
    uint256 internal constant EMISSION = 990;
    uint256 internal constant TAIL_EMISSION = 2;
    uint256 internal constant PRECISION = 1000;
    uint256 internal constant TERMINAL_SUPPLY = 500_000_000 * 1e18;
    uint256 internal constant TERMINAL_EMISSION = 1_000_000 * 1e18;
    uint256 internal constant GROWTH = 200; // 20%

    ISnek public _snek;
    IVoter public _voter;
    IVotingEscrow public _ve;
    IRewardsDistributor public _rewards_distributor;
    address msig;

    uint256 public weekly;

    uint256 public active_period;
    uint256 public first_period;

    address public _rewards_briber;
    uint256 public _growth_briber;

    event SetVeDist(address _value);
    event SetVoter(address _value);
    event Mint(address indexed sender, uint256 weekly, uint256 growth);

    function initialize(
        address __voter, // the voting & distribution system
        address __ve, // the ve(3,3) system that will be locked into
        address __rewards_distributor, // the distribution system that ensures users aren't diluted
        uint256 initialSupply,
        address _msig
    ) external initializer {
        _snek = ISnek(IVotingEscrow(__ve).token());
        _voter = IVoter(__voter);
        _ve = IVotingEscrow(__ve);
        _rewards_distributor = IRewardsDistributor(__rewards_distributor);

        emit SetVeDist(__rewards_distributor);
        emit SetVoter(__voter);

        if (initialSupply > 0) {
            _snek.mint(_msig, initialSupply);
        }

        weekly = 5_000_000 * 1e18; // represents a starting weekly emission of 15M SNEK (SNEK has 18 decimals)

        msig = _msig;
        active_period = type(uint256).max / 2;
    }

    // weekly emission takes the max of calculated (aka target) emission versus circulating tail end emission
    function weekly_emission() public view returns (uint256) {
        if (_snek.totalSupply() >= TERMINAL_SUPPLY) {
            return TERMINAL_EMISSION;
        } else {
            return (weekly * EMISSION) / PRECISION;
        }
    }

    // calculate inflation and adjust ve balances accordingly
    function calculate_growth(uint256 _minted) public pure returns (uint256) {
        return (GROWTH * _minted) / PRECISION;
    }

    function start_periods() external {
        require(msg.sender == msig, "!msig");
        require(first_period == 0, "Started");

        active_period = (block.timestamp / WEEK) * WEEK + WEEK;
        first_period = active_period;
        _snek.mint(msig, weekly);

        _rewards_distributor.checkpoint_token();
        _rewards_distributor.checkpoint_total_supply();

        emit Mint(msg.sender, weekly, 0);
    }

    // update period can only be called once per cycle (1 week)
    function update_period() external returns (uint256) {
        uint256 _period = active_period;
        if (block.timestamp >= _period + WEEK) {
            // only trigger if new week
            _period = (block.timestamp / WEEK) * WEEK;
            active_period = _period;
            weekly = weekly_emission();

            uint256 _growth = calculate_growth(weekly);
            uint256 _for_briber = (_growth_briber * weekly) / PRECISION;
            uint256 _required = _growth + _for_briber + weekly;
            uint256 _balanceOf = _snek.balanceOf(address(this));
            if (_balanceOf < _required) {
                _snek.mint(address(this), _required - _balanceOf);
            }

            require(_snek.transfer(address(_rewards_distributor), _growth));
            _rewards_distributor.checkpoint_token(); // checkpoint token balance that was just minted in rewards distributor
            _rewards_distributor.checkpoint_total_supply(); // checkpoint supply

            if (_for_briber > 0 && _rewards_briber != address(0)) {
                require(_snek.transfer(address(_rewards_briber), _for_briber));
            }

            _snek.approve(address(_voter), weekly);
            _voter.notifyRewardAmount(weekly);

            emit Mint(msg.sender, weekly, _growth);
        }
        return _period;
    }

    function setRewardsBriber(address rewards_briber, uint256 growth_briber) public {
        require(msg.sender == msig, "!msig");
        require(growth_briber <= 1000, "growth cannot greater than 100%");
        _rewards_briber = rewards_briber;
        _growth_briber = growth_briber;
    }
}
