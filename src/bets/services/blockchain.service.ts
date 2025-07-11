import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Blockchain } from '../types/bet.types';
import { BlockchainConfig } from '../../config/blockchain.config';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Get blockchain configuration for a specific chain
   */
  getBlockchainConfig(blockchain: Blockchain): BlockchainConfig {
    const blockchains = this.configService.get<Record<Blockchain, BlockchainConfig>>('blockchain.blockchains');
    return blockchains[blockchain];
  }

  /**
   * Get all supported blockchains
   */
  getSupportedBlockchains(): Blockchain[] {
    return Object.values(Blockchain);
  }

  /**
   * Get default blockchain
   */
  getDefaultBlockchain(): Blockchain {
    return this.configService.get<Blockchain>('blockchain.defaultChain') || Blockchain.CROSSFI;
  }

  /**
   * Validate if a blockchain is supported
   */
  isSupportedBlockchain(blockchain: string): blockchain is Blockchain {
    return Object.values(Blockchain).includes(blockchain as Blockchain);
  }

  /**
   * Get blockchain information for API responses
   */
  getBlockchainInfo(blockchain: Blockchain) {
    const config = this.getBlockchainConfig(blockchain);
    return {
      name: config.name,
      chainId: config.chainId,
      nativeCurrency: config.nativeCurrency,
      blockExplorer: config.blockExplorer,
      rpcUrl: config.rpcUrl,
    };
  }

  /**
   * Validate wallet address format for a specific blockchain
   */
  validateWalletAddress(address: string, blockchain: Blockchain): boolean {
    // Basic Ethereum-style address validation (works for both CrossFi and BNB)
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    
    if (!ethereumAddressRegex.test(address)) {
      return false;
    }

    // Additional blockchain-specific validation can be added here
    switch (blockchain) {
      case Blockchain.CROSSFI:
        // CrossFi-specific validation if needed
        return true;
      case Blockchain.BNB:
        // BNB-specific validation if needed
        return true;
      default:
        return false;
    }
  }

  /**
   * Get transaction URL for a specific blockchain
   */
  getTransactionUrl(txHash: string, blockchain: Blockchain): string {
    const config = this.getBlockchainConfig(blockchain);
    return `${config.blockExplorer}/tx/${txHash}`;
  }

  /**
   * Get wallet URL for a specific blockchain
   */
  getWalletUrl(address: string, blockchain: Blockchain): string {
    const config = this.getBlockchainConfig(blockchain);
    return `${config.blockExplorer}/address/${address}`;
  }
} 