# Petalex Frontend

## Install

`npm i`

## Run

`npm run dev`

## Testing

The following is how I've found development testing useful.

1. Deploy Petalex smart contracts on a [Tenderly](https://dashboard.tenderly.co) development fork
2. Update RPC to use Tenderly fork RPC url
3. Update wallet RPC to use Tenderly fork RPC url
4. Do stuff

## Features

* Flashloan leverage into Gravita
* Mint new DSProxy NFTs
* Accurate onchain calculations
* Simulated action transactions before execution

TODO:

* Local storage time-based caching of onchain view calls
* Updating proxy info after action queue is executed successfuly
* Liquity integration
* More routing options for Exchange action (solidity code required)
* Metadata image generation and view capability
* Onchain NFT value calculation and visibility
* Timelock visibility if core contracts are being upgraded
* More integrations (not just CDP, but any protocol)