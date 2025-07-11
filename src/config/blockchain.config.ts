import { registerAs } from '@nestjs/config';
import { Blockchain } from '../bets/types/bet.types';

export interface BlockchainConfig {
  name: Blockchain;
  chainId: number;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer: string;
  contractAddress?: string;
}

export default registerAs('blockchain', () => {
  const blockchains: Record<Blockchain, BlockchainConfig> = {
    [Blockchain.CROSSFI]: {
      name: Blockchain.CROSSFI,
      chainId: 4157, // CrossFi mainnet chain ID
      rpcUrl: process.env.CROSSFI_RPC_URL || 'https://rpc.crossfi.org',
      nativeCurrency: {
        name: 'CrossFi',
        symbol: 'XFI',
        decimals: 18,
      },
      blockExplorer: 'https://scan.crossfi.org',
      contractAddress: process.env.CROSSFI_CONTRACT_ADDRESS,
    },
    [Blockchain.BNB]: {
      name: Blockchain.BNB,
      chainId: 56, // BSC mainnet chain ID
      rpcUrl: process.env.BNB_RPC_URL || 'https://bsc-dataseed1.binance.org',
      nativeCurrency: {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18,
      },
      blockExplorer: 'https://bscscan.com',
      contractAddress: process.env.BNB_CONTRACT_ADDRESS,
    },
  };

  return {
    blockchains,
    defaultChain: process.env.DEFAULT_BLOCKCHAIN || Blockchain.CROSSFI,
  };
});
