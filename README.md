# SoliSnek Smart Contracts

## Commands

```
nvm i
nvm use
npm i

npm run compile
npm run test
```

## Scripts

```
deploy/test-token.ts (for testnet only)
deploy/lge.ts
deploy/logics.ts
deploy/deployer.ts
operation/verify-proxy.ts
operation/mine-address.ts
deploy/token.ts
deploy/dex.ts
operation/add-liquidity.ts (for weth/usdc)
operation/verify-pair.ts
deploy/vote-system.ts
```

## Testnet

### Implementations

| Contract              | Address                                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Snek                  | [0xfF7Dcc26D9a5E24974f27936BEA2895532F373a5](https://testnet.snowtrace.io/address/0xfF7Dcc26D9a5E24974f27936BEA2895532F373a5#code) |
| PairFactory           | [0xA15302aECD6C9646AEA06E429Af83d0DFD358501](https://testnet.snowtrace.io/address/0xA15302aECD6C9646AEA06E429Af83d0DFD358501#code) |
| Pair                  | [0x95171AA21A29A3cFa53BaB78345DD939fBb19802](https://testnet.snowtrace.io/address/0x95171AA21A29A3cFa53BaB78345DD939fBb19802#code) |
| Router                | [0x62bca03dFc65FfC9c9D96bA1AB6cc2135eFF6b52](https://testnet.snowtrace.io/address/0x62bca03dFc65FfC9c9D96bA1AB6cc2135eFF6b52#code) |
| SnekLibrary           | [0x991673ca3cD1e0960463bDa7cFC688C2867c080F](https://testnet.snowtrace.io/address/0x991673ca3cD1e0960463bDa7cFC688C2867c080F#code) |
| VeArtProxy            | [0xd09Cffc843710749B550b299243A7ff84b462fd1](https://testnet.snowtrace.io/address/0xd09Cffc843710749B550b299243A7ff84b462fd1#code) |
| VotingEscrow          | [0x270ef8f7364EE60CE0b486e90E5f99Bc2eb9Ea96](https://testnet.snowtrace.io/address/0x270ef8f7364EE60CE0b486e90E5f99Bc2eb9Ea96#code) |
| FeeDistributorFactory | [0x53B6c760282767dd9F8b5c518a725B91Dc906428](https://testnet.snowtrace.io/address/0x53B6c760282767dd9F8b5c518a725B91Dc906428#code) |
| GaugeFactory          | [0x9Dd766Df594D787Bb3f07438d135c4C42d31E4dF](https://testnet.snowtrace.io/address/0x9Dd766Df594D787Bb3f07438d135c4C42d31E4dF#code) |
| Voter                 | [0x4184C04A7f7c8cB002Fe3F067ad570dBfbF64d75](https://testnet.snowtrace.io/address/0x4184C04A7f7c8cB002Fe3F067ad570dBfbF64d75#code) |
| RewardsDistributor    | [0x64088aA4B2876473809fC0fEe2372b554226fe09](https://testnet.snowtrace.io/address/0x64088aA4B2876473809fC0fEe2372b554226fe09#code) |
| Minter                | [0xAeD4184C0e14DD77af0c980bB8DDcA8f0715A581](https://testnet.snowtrace.io/address/0xAeD4184C0e14DD77af0c980bB8DDcA8f0715A581#code) |

### Deployer

| Contract   | Address                                                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| ProxyAdmin | [0xa9B41ce6BD3F781Ead19d33b142270B392e7A5e2](https://testnet.snowtrace.io/address/0xa9B41ce6BD3F781Ead19d33b142270B392e7A5e2#code) |
| Deployer   | [0x3C252a188Aa35D5B08Ca141d79CBDC951Bc160F0](https://testnet.snowtrace.io/address/0x3C252a188Aa35D5B08Ca141d79CBDC951Bc160F0#code) |

### Proxies

| Contract              | Address                                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Snek                  | [0xeeee97AC0f417D220dFfA3DCCbf6121C53541513](https://testnet.snowtrace.io/address/0xeeee97AC0f417D220dFfA3DCCbf6121C53541513#code) |
| PairFactory           | [0xeeee175CC85Db8D1245094B0f83e39b0128a8D6B](https://testnet.snowtrace.io/address/0xeeee175CC85Db8D1245094B0f83e39b0128a8D6B#code) |
| Router                | [0xeeee1b84A9D7F1648ee1537D23E233283B042FA1](https://testnet.snowtrace.io/address/0xeeee1b84A9D7F1648ee1537D23E233283B042FA1#code) |
| SnekLibrary           | [0xeeee107104Dc4Bd4b3339eF6e9081572ac015DF4](https://testnet.snowtrace.io/address/0xeeee107104Dc4Bd4b3339eF6e9081572ac015DF4#code) |
| VeArtProxy            | [0xeeee22cd7047966eDBE47Ff5698d34159C953cCF](https://testnet.snowtrace.io/address/0xeeee22cd7047966eDBE47Ff5698d34159C953cCF#code) |
| VotingEscrow          | [0xeeee3823509dF4819F3D7F4B93D314e9a2fc8d9f](https://testnet.snowtrace.io/address/0xeeee3823509dF4819F3D7F4B93D314e9a2fc8d9f#code) |
| FeeDistributorFactory | [0xeeee461cFc20E385891380BC5d4DACc258ff50F5](https://testnet.snowtrace.io/address/0xeeee461cFc20E385891380BC5d4DACc258ff50F5#code) |
| GaugeFactory          | [0xeeee55A381ca608B45a550A0c261B9ADa9C645f5](https://testnet.snowtrace.io/address/0xeeee55A381ca608B45a550A0c261B9ADa9C645f5#code) |
| Voter                 | [0xeeee674b981F7A0266c099bdD8150B137996cC31](https://testnet.snowtrace.io/address/0xeeee674b981F7A0266c099bdD8150B137996cC31#code) |
| RewardsDistributor    | [0xeeee794A5dd290Eb5CC92598A08EB61fE6D5f261](https://testnet.snowtrace.io/address/0xeeee794A5dd290Eb5CC92598A08EB61fE6D5f261#code) |
| Minter                | [0xeeee84244DD0A1dE06493A0252dC02A238C04988](https://testnet.snowtrace.io/address/0xeeee84244DD0A1dE06493A0252dC02A238C04988#code) |

### Utilities

| Contract         | Address                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| LGE              | TBD                                                                                                                                |
| MerkleClaimVeNFT | [0x3d2f265d296A6A57fcF5F92788a5174C1dbf93A5](https://testnet.snowtrace.io/address/0x3d2f265d296A6A57fcF5F92788a5174C1dbf93A5#code) |

### Test Tokens

| Token | Address                                                                                                                            |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------- |
| wavax | [0xd00ae08403B9bbb9124bB305C09058E32C39A48c](https://testnet.snowtrace.io/address/0xd00ae08403B9bbb9124bB305C09058E32C39A48c#code) |
| weth  | [0xB124CD5F735810B3C672A4a0a208f0aAEF861201](https://testnet.snowtrace.io/address/0xB124CD5F735810B3C672A4a0a208f0aAEF861201#code) |
| usdc  | [0x8530f66241E47eE93dbDd3542455889f9f12FA6E](https://testnet.snowtrace.io/address/0x8530f66241E47eE93dbDd3542455889f9f12FA6E#code) |
| usdt  | [0x3Bb3dA843522f65b18d1E23d63124AA035f9A3D1](https://testnet.snowtrace.io/address/0x3Bb3dA843522f65b18d1E23d63124AA035f9A3D1#code) |
| mim   | [0x6223D4BF70e5aD440c41F39F3420178a0CF3AC70](https://testnet.snowtrace.io/address/0x6223D4BF70e5aD440c41F39F3420178a0CF3AC70#code) |
| dai   | [0x3383791f2C0CCd0f6f8f39043cBBb009DD9d7E21](https://testnet.snowtrace.io/address/0x3383791f2C0CCd0f6f8f39043cBBb009DD9d7E21#code) |

## Mainnet

### Implementations

| Contract              | Address                                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Snek                  | [0x68de44f52742a976EcA528dD353F4cF7FC4e09a8](https://snowtrace.io/address/0x68de44f52742a976EcA528dD353F4cF7FC4e09a8#code) |
| PairFactory           | [0x0bb975694606FAAd8Ac49A32434751090DF5a464](https://snowtrace.io/address/0x0bb975694606FAAd8Ac49A32434751090DF5a464#code) |
| Pair                  | [0x9eF38d9A074bfEBe21B13c3D287D4D82C3976280](https://snowtrace.io/address/0x9eF38d9A074bfEBe21B13c3D287D4D82C3976280#code) |
| Router                | [0x47717ddbB816AB308944E22bfe6598Bf8a5Cb998](https://snowtrace.io/address/0x47717ddbB816AB308944E22bfe6598Bf8a5Cb998#code) |
| SnekLibrary           | [0x2Df68b22A7664B27e51585BB62C927a20c9E921A](https://snowtrace.io/address/0x2Df68b22A7664B27e51585BB62C927a20c9E921A#code) |
| VeArtProxy            | TBD                                                                                                                        |
| VotingEscrow          | TBD                                                                                                                        |
| FeeDistributorFactory | TBD                                                                                                                        |
| GaugeFactory          | TBD                                                                                                                        |
| Voter                 | TBD                                                                                                                        |
| RewardsDistributor    | TBD                                                                                                                        |
| Minter                | TBD                                                                                                                        |

### Deployer

| Contract   | Address                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| ProxyAdmin | [0xCa6F5401C608d0E8242c638bd30af0F594A97118](https://snowtrace.io/address/0xCa6F5401C608d0E8242c638bd30af0F594A97118#code) |
| Deployer   | [0x206E32878ff6663Fcf3DE8907876Bd380762FE25](https://snowtrace.io/address/0x206E32878ff6663Fcf3DE8907876Bd380762FE25#code) |

### Proxies

| Contract              | Address                                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Snek                  | [0xeeee99b35Eb6aF5E7d76dd846DbE4bcc0c60cA1d](https://testnet.snowtrace.io/address/0xeeee99b35Eb6aF5E7d76dd846DbE4bcc0c60cA1d#code) |
| PairFactory           | [0xeeee1F1c93836B2CAf8B9E929cb978c35d46657E](https://testnet.snowtrace.io/address/0xeeee99b35Eb6aF5E7d76dd846DbE4bcc0c60cA1d#code) |
| Router                | [0xeeee17b45E4d127cFaAAD14e2710489523ADB4d8](https://testnet.snowtrace.io/address/0xeeee99b35Eb6aF5E7d76dd846DbE4bcc0c60cA1d#code) |
| SnekLibrary           | [0xeeee1A2Dd20FaeBef70b0fD7EA0673127c0366F2](https://testnet.snowtrace.io/address/0xeeee99b35Eb6aF5E7d76dd846DbE4bcc0c60cA1d#code) |
| VeArtProxy            | TBD                                                                                                                                |
| VotingEscrow          | TBD                                                                                                                                |
| FeeDistributorFactory | TBD                                                                                                                                |
| GaugeFactory          | TBD                                                                                                                                |
| Voter                 | TBD                                                                                                                                |
| RewardsDistributor    | TBD                                                                                                                                |
| Minter                | TBD                                                                                                                                |

### Utilities

| Contract         | Address                                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| LGE              | [0xe1Fa7CBD4a47B0Ebef5a93a2aa9cE8EEA2694e59](https://snowtrace.io/address/0xe1Fa7CBD4a47B0Ebef5a93a2aa9cE8EEA2694e59#code) |
| MerkleClaimVeNFT | TBD                                                                                                                        |

### Tokens

| Token | Address                                                                                                                    |
| ----- | -------------------------------------------------------------------------------------------------------------------------- |
| wavax | [0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7](https://snowtrace.io/address/0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7#code) |
| usdc  | [0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E](https://snowtrace.io/address/0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E#code) |
| usdt  | [0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7](https://snowtrace.io/address/0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7#code) |
