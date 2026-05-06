#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC_CHAINS = path.join(ROOT, 'src', 'chains.json');
const ABIS_DIR = path.join(ROOT, 'src', 'abis');
const DIST_DIR = path.join(ROOT, 'dist');
const OUT_FILE = path.join(DIST_DIR, 'chains.json');

function loadAbi(chainId, address) {
    const abiPath = path.join(ABIS_DIR, String(chainId), `${address}.json`);
    if (!fs.existsSync(abiPath)) {
        console.warn(`  [warn] ABI file not found: ${abiPath}`);
        return null;
    }
    return JSON.parse(fs.readFileSync(abiPath, 'utf8'));
}

function transformChain(chain) {
    const {
        name,
        nativeCurrencyName,
        nativeCurrencySymbol,
        nativeCurrencyDecimals,
        rpcUrls,
        blockExplorers,
        chainImageUrl,
        graphUrl,
        minimumSelfDelegationAmount,
        chainId,
        contracts,
        isTestnet,
        isActive
    } = chain;

    return {
        name,
        nativeCurrencyName,
        nativeCurrencySymbol,
        nativeCurrencyDecimals,
        rpcUrls,
        blockExplorers,
        contracts: contracts.map(contract => {
            const { abi, ...rest } = contract;
            const resolvedAbi = abi === true ? loadAbi(chainId, contract.address) : null;
            return { ...rest, abi: resolvedAbi };
        }),
        graphUrl,
        chainImageUrl,
        minimumSelfDelegationAmount,
        chainId,
        isActive,
        isTestnet,        
    };
}

function main() {
    console.log('Building dist/chains.json...');

    const chains = JSON.parse(fs.readFileSync(SRC_CHAINS, 'utf8'));

    const output = chains.map(chain => {
        console.log(`  Processing chain: ${chain.name} (${chain.chainId})`);
        return transformChain(chain);
    });

    fs.mkdirSync(DIST_DIR, { recursive: true });
    fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');

    console.log(`Done → ${OUT_FILE}`);
}

main();