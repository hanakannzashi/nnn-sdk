import { BaseContract, BaseContractOptions } from './BaseContract';
import { Gas, MultiTransaction, StorageBalance, StorageBalanceBounds, Token } from 'multi-transaction';
import { AddFuelOptions, ClaimRewardsOptions, MintSpaceshipOptions } from '../types/change-options';
import {
  GetRewardsForAccountOptions,
  GetSpaceshipEngineOptions,
  GetSpaceshipOptions,
  GetTotalAddedFuelNumOptions,
} from '../types/view-options';
import { SpaceshipEngine } from '../types/data';
import { DEFAULT_SPACESHIP_STORAGE_DEPOSIT } from '../../utils';
import { NameSkySigner } from '../NameSkySigner';
import { AddFuelArgs, DistributeRewardsArgs } from '../types/args';

export type SpaceshipContractOptions = BaseContractOptions & {};

export class SpaceshipContract extends BaseContract {
  constructor(options: SpaceshipContractOptions) {
    super(options);
  }

  /**
   * Connect to new signer and return new instance
   */
  connect(signer: NameSkySigner): SpaceshipContract {
    return new SpaceshipContract({
      contractId: this.contractId,
      signer,
    });
  }

  // ------------------------------------------------- View -------------------------------------------------------

  async getSpaceship({ args, blockQuery }: GetSpaceshipOptions): Promise<Token | undefined> {
    return this.signer.view({
      contractId: this.contractId,
      methodName: 'get_spaceship',
      args,
      blockQuery,
    });
  }

  async getSpaceshipEngine({ args, blockQuery }: GetSpaceshipEngineOptions): Promise<SpaceshipEngine | undefined> {
    return this.signer.view({
      contractId: this.contractId,
      methodName: 'get_spaceship_engine',
      args,
      blockQuery,
    });
  }

  async getRewardsForAccount({ args, blockQuery }: GetRewardsForAccountOptions): Promise<string> {
    return this.signer.view({
      contractId: this.contractId,
      methodName: 'get_rewards_for_account',
      args,
      blockQuery,
    });
  }

  async getTotalAddedFuelNum({ blockQuery }: GetTotalAddedFuelNumOptions): Promise<string> {
    return this.signer.view({
      contractId: this.contractId,
      methodName: 'get_total_added_fuel_num',
      blockQuery,
    });
  }

  // -------------------------------------------------- Change -----------------------------------------------------

  async mintSpaceship({ callbackUrl }: MintSpaceshipOptions) {
    const mTx = MultiTransaction.batch(this.contractId).functionCall({
      methodName: 'mint_spaceship',
      attachedDeposit: DEFAULT_SPACESHIP_STORAGE_DEPOSIT,
      gas: Gas.parse(50, 'T'),
    });

    await this.signer.send(mTx, { callbackUrl });
  }

  async addFuel({ quantity, callbackUrl }: AddFuelOptions) {
    const mTx = MultiTransaction.batch(this.contractId).functionCall<AddFuelArgs>({
      methodName: 'add_fuel',
      args: {
        quantity,
      },
      gas: Gas.parse(50, 'T'),
    });

    await this.signer.send(mTx, { callbackUrl, throwReceiptErrors: true });
  }

  async claimRewards({ skyTokenId, callbackUrl }: ClaimRewardsOptions): Promise<string> {
    const mTx = MultiTransaction.new();

    const storageBalance = await this.signer.view<StorageBalance | undefined>({
      contractId: skyTokenId,
      methodName: 'storage_balance_of',
      args: {
        account_id: this.signer.accountId,
      },
    });

    if (!storageBalance) {
      const storageBalanceBounds = await this.signer.view<StorageBalanceBounds>({
        contractId: skyTokenId,
        methodName: 'storage_balance_bounds',
      });

      mTx.batch(skyTokenId).storageManagement.storage_deposit({
        attachedDeposit: storageBalanceBounds.min,
      });
    }

    mTx
      .batch(this.contractId)
      .functionCall<DistributeRewardsArgs>({
        methodName: 'distribute_rewards',
        args: {
          account_id: this.signer.accountId,
        },
      })
      .functionCall({
        methodName: 'claim_rewards',
        gas: Gas.parse(50, 'T'),
      });

    return this.signer.send(mTx, { callbackUrl, throwReceiptErrors: true });
  }
}
