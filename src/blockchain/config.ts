import { createThirdwebClient, defineChain } from 'thirdweb';
import { bsc, bscTestnet } from 'thirdweb/chains';

export const client = createThirdwebClient({
  clientId: "5358936037b9cdaaec2cc601d7446e71",
});

export const IS_TESTNET = true

export const testnetProviderUrlMap = [
  // "https://crossfi-testnet.g.alchemy.com/v2/LyMEMlI9ehqzPfajiDhvBXZ4MGjUQ6L-",
  'https://4157.rpc.thirdweb.com',
  'https://rpc.testnet.ms/',
  'https://rpc.xfi.ms/archive/4157',
];

export const mainnetProviderUrlMap = [
  // "https://crossfi-mainnet.g.alchemy.com/v2/LyMEMlI9ehqzPfajiDhvBXZ4MGjUQ6L-",
  'https://rpc.mainnet.ms/',
  'https://4158.rpc.thirdweb.com',
];

export const chain1Testnet = defineChain({
  id: 4157,
  name: 'CrossFi Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'XFI',
    symbol: 'XFI',
  },
  rpcUrls: {
    default: {
      http: testnetProviderUrlMap,
    },
  },
  testnet: true,
  blockExplorers: [
    { name: 'Testnet Explorer', url: 'https://test.xfiscan.com/' },
  ],
});

export const chain1Mainnet = defineChain({
  id: 4158,
  name: 'CrossFi Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'XFI',
    symbol: 'XFI',
  },
  rpcUrls: {
    default: {
      http: mainnetProviderUrlMap,
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://xfiscan.com/' },
  },
});

export const chain1TestnetBetContract =
  '0x1610D4E1F3e6f7A487cf27dc59c5694bbd74d951';
export const chain1MainnetBetContract = '';

export const chain2TestnetBetContract = '';
export const chain2MainnetBetContract = '';

export const chain2Testnet = bscTestnet;
export const chain2Mainnet = bsc;

export const chain1 = IS_TESTNET ? chain1Testnet : chain1Mainnet;
export const chain2 = IS_TESTNET ? chain2Testnet : chain2Mainnet;

export const chain1Contract = IS_TESTNET
  ? chain1TestnetBetContract
  : chain1MainnetBetContract;
export const chain2Contract = IS_TESTNET
  ? chain2TestnetBetContract
  : chain2MainnetBetContract;
