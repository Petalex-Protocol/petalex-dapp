# Contributing to Petalex

Recommended to setup on [Tenderly](https://dashboard.tenderly.co) and fork ethereum mainnet. Easiest to test integrations using recent forks. Certain features that involve Chainlink Oracles will eventually become stale and might require you to refork so that features work again whilst testing over time.

Petalex is an fully open source project, with project contributors being distributed a share of the donations each month (distributed and decided by a multisig Safe).

## Goals

Petalex aims to be a hub for aggregated actions for protocols that store value as a separate proxy address wrapped into an NFT. This allows users to create advanced hedged delta neutral yield earning positions (as an example) that can be sold on marketplaces, unwound, compounded, or held safely and efficiently. Eventually the DSProxy could be released to give a specific address sole authority and come out of the Petalex system if safety becomes a concern.

Examples of good NFT proxy vaults (from simple to advanced):

* Leveraged CDP
* Stablecoin deposit with borrowed collateral on AAVE, deposited in a CDP and a debt token LP
* LP position with owned ve-token boosted vote on that gauge
* ve-token vault holding multiple ve-tokens for various projects that farms bribes

## Integrations

Prefer to use onchain calls over subgraph api calls as they're more reliable and it's easier to support a single data retrieval process. All calls should follow the same pattern as other integrations (cacheing, when to update, disconnection, etc).