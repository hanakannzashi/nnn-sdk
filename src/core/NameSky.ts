import { ACTION_MAX_NUM, moveRegistrantPublicKeyToEnd, REGISTRANT_KEYSTORE_PREFIX, sleep, wait } from '../utils';
import { CoreContract } from './contracts';
import { MarketplaceContract } from './contracts';
import { KeyPairEd25519, PublicKey } from 'near-api-js/lib/utils';
import { REQUEST_ACCESS_PENDING_KEY_PREFIX } from '../utils';
import { Network } from '@near-wallet-selector/core';
import { NameSkyComponent, NameSkyConfig } from './types/config';
import { CleanStateArgs, InitArgs } from './types/args';
import { GetControllerOwnerIdOptions, NftRegisterOptions, SetupControllerOptions } from './types/options';
import { UserSettingContract } from './contracts/UserSettingContract';
import { base58CodeHash } from '../utils';
import {
  Amount,
  BlockQuery,
  BorshSchema,
  endless,
  MultiSendAccount,
  MultiSendWalletSelector,
  MultiTransaction,
  setupMultiSendWalletSelector,
  Stringifier,
} from 'multi-transaction';
import { Provider } from 'near-api-js/lib/providers';
import { AccessKeyList, AccountView } from 'near-api-js/lib/providers/provider';
import { NameSkyNftSafety, NameSkyToken } from './types/data';
import { Buffer } from 'buffer';

export class NameSky {
  selector: MultiSendWalletSelector;
  coreContract: CoreContract;
  marketplaceContract: MarketplaceContract;
  userSettingContract: UserSettingContract;

  constructor({ selector, coreContract, marketplaceContract, userSettingContract }: NameSkyComponent) {
    this.selector = selector;
    this.coreContract = coreContract;
    this.marketplaceContract = marketplaceContract;
    this.userSettingContract = userSettingContract;

    this.onRequestFullAccess().catch((reason) => console.error('onRequestFullAccess Failed', reason));
  }

  getNetwork(): Network {
    return this.selector.options.network;
  }

  getNetworkId(): string {
    return this.getNetwork().networkId;
  }

  getCoreContractId(): string {
    return this.coreContract.contractId;
  }

  getMarketplaceContractId(): string {
    return this.marketplaceContract.contractId;
  }

  getUserSettingContractId(): string {
    return this.userSettingContract.contractId;
  }

  account(accountId: string): MultiSendAccount {
    return MultiSendAccount.new(this.selector.near.connection, accountId);
  }

  rpc(): Provider {
    return this.selector.near.connection.provider;
  }

  async requestFullAccess(webWalletBaseUrl: string, successUrl?: string, failureUrl?: string): Promise<never> {
    const keyPair = KeyPairEd25519.fromRandom();
    const publicKey = keyPair.getPublicKey().toString();
    const pendingAccountId = REQUEST_ACCESS_PENDING_KEY_PREFIX + publicKey;
    const keystore = this.selector.keyStore;
    const networkId = this.getNetworkId();
    await keystore.setKey(networkId, pendingAccountId, keyPair);
    const newUrl = new URL(webWalletBaseUrl + '/login/');
    newUrl.searchParams.set('public_key', publicKey);
    newUrl.searchParams.set('success_url', successUrl ?? window.location.href);
    newUrl.searchParams.set('failure_url', failureUrl ?? window.location.href);
    window.location.assign(newUrl.toString());

    // waiting for direction
    endless();
  }

  // auto callback
  private async onRequestFullAccess() {
    const currentUrl = new URL(window.location.href);
    const publicKey = currentUrl.searchParams.get('public_key');
    const accountId = currentUrl.searchParams.get('account_id');
    if (!publicKey || !accountId) {
      return;
    }
    const pendingAccountId = REQUEST_ACCESS_PENDING_KEY_PREFIX + PublicKey.fromString(publicKey).toString();
    const keystore = this.selector.keyStore;
    const networkId = this.getNetworkId();
    const keyPair = await keystore.getKey(networkId, pendingAccountId);
    if (!keyPair) {
      return;
    }
    await keystore.setKey(networkId, accountId, keyPair);
    await keystore.removeKey(networkId, pendingAccountId);
    console.log(`onRequestFullAccess Succeeded`);
  }

  // signed by registrant
  async register({ registrantId, minterId, gas }: NftRegisterOptions) {
    const [mintFee, oldMinterId] = await Promise.all([
      this.coreContract.get_mint_fee({}),
      this.coreContract.nft_get_minter_id({ args: { registrant_id: registrantId } }),
    ]);

    const mTx = MultiTransaction.batch(this.getCoreContractId()).functionCall({
      methodName: 'nft_register',
      args: {
        minter_id: minterId,
      },
      attachedDeposit: oldMinterId ? Amount.ONE_YOCTO : mintFee,
      gas,
    });

    await this.selector.sendWithLocalKey(registrantId, mTx);
  }

  // signed by registrant
  async setupController({ registrantId, gasForCleanState, gasForInit }: SetupControllerOptions) {
    //  we don't need to check conditions at the same block in this method
    const account = this.account(registrantId);

    // code hash
    const codeBase64 = await this.coreContract.get_latest_controller_code({});
    const code = Buffer.from(codeBase64, 'base64');
    const accountView = await account.state();
    const accountCodeHash = accountView.code_hash;
    const codeHash = base58CodeHash(code);

    // state
    const state = await account.viewState('');

    // access keys
    const accessKeys = await account.getAccessKeys();

    const isCodeHashCorrect = accountCodeHash === codeHash;
    const isStateCleaned = state.length === 1;
    const isAccessKeysDeleted = accessKeys.length === 0;

    if (isCodeHashCorrect && isStateCleaned && isAccessKeysDeleted) {
      // controller owner id
      const controllerOwnerId = await this.getControllerOwnerId({ accountId: registrantId });
      const isControllerOwnerIdCorrect = controllerOwnerId === this.coreContract.contractId;
      if (isControllerOwnerIdCorrect) {
        // skip
        return;
      }
    }

    const mTx = MultiTransaction.batch(registrantId);

    // deploy controller contract
    mTx.deployContract(code);

    // clean account state if needed
    if (state.length !== 0) {
      const stateKeys = state.map(({ key }) => key);
      mTx.functionCall<CleanStateArgs>({
        methodName: 'clean_state',
        args: stateKeys,
        stringifier: Stringifier.borsh(BorshSchema.Array(BorshSchema.Vec(BorshSchema.u8), stateKeys.length)),
        attachedDeposit: Amount.ONE_YOCTO,
        gas: gasForCleanState,
      });
    }

    // init controller contract
    mTx.functionCall<InitArgs>({
      methodName: 'init',
      args: Buffer.from(this.getCoreContractId()), // raw args
      attachedDeposit: Amount.ONE_YOCTO,
      gas: gasForInit,
    });

    // delete all access keys
    const keyPair = await this.selector.keyStore.getKey(this.getNetworkId(), registrantId);

    if (!keyPair) {
      throw Error(`No access key found locally for Account(${registrantId}) to sign transaction.`);
    }

    const registrantPublicKey = keyPair.getPublicKey().toString();
    let publicKeys = accessKeys.map((accessKey) => accessKey.public_key);
    publicKeys = moveRegistrantPublicKeyToEnd(registrantPublicKey, publicKeys);

    for (const publicKey of publicKeys) {
      if (mTx.countActions() < ACTION_MAX_NUM) {
        mTx.deleteKey(publicKey);
      } else {
        mTx.batch(registrantId).deleteKey(publicKey);
      }
    }

    await this.selector.sendWithLocalKey(registrantId, mTx);
    await this.selector.keyStore.removeKey(this.getNetworkId(), registrantId);
    console.log(`Removed local full access key, registrant id: ${registrantId}`);
  }

  // minted by operator
  async waitForMinting(tokenId: string, timeout?: number): Promise<NameSkyToken> {
    return wait(async () => {
      while (true) {
        const token = await this.coreContract.nft_namesky_token({
          args: {
            token_id: tokenId,
          },
        });

        if (token) {
          return token;
        }

        console.log(`NFT(${tokenId}) is on minting...`);

        await sleep(1000);
      }
    }, timeout);
  }

  async getNftAccountSafety(accountId: string): Promise<NameSkyNftSafety> {
    const block = await this.rpc().block({ finality: 'optimistic' });

    const blockQuery: BlockQuery = { blockId: block.header.height };

    const [codeHash, controllerCodeViews, state, { keys: accessKeys }] = await Promise.all([
      this.rpc()
        .query<AccountView>({
          ...blockQuery,
          request_type: 'view_account',
          account_id: accountId,
        })
        .then((accountView) => accountView.code_hash),

      this.coreContract.get_controller_code_views({ blockQuery }),

      this.account(accountId).viewState('', blockQuery),

      this.rpc().query<AccessKeyList>({
        ...blockQuery,
        request_type: 'view_access_key_list',
        account_id: accountId,
      }),
    ]);

    const isCodeHashCorrect = controllerCodeViews.some((view) => view.code_hash === codeHash);
    const isStateCleaned = state.length === 1;
    const isAccessKeysDeleted = accessKeys.length === 0;
    let isControllerOwnerIdCorrect = false;

    if (isCodeHashCorrect) {
      const controllerOwnerId = await this.getControllerOwnerId({
        accountId,
        blockQuery,
      });
      isControllerOwnerIdCorrect = controllerOwnerId === this.coreContract.contractId;
    }

    return { isCodeHashCorrect, isStateCleaned, isAccessKeysDeleted, isControllerOwnerIdCorrect };
  }

  private async getControllerOwnerId({ accountId, blockQuery }: GetControllerOwnerIdOptions): Promise<string> {
    return this.selector.view({
      contractId: accountId,
      methodName: 'get_owner_id',
      blockQuery,
    });
  }
}

export async function initNameSky(config: NameSkyConfig): Promise<NameSky> {
  const { selectorConfig, contractsConfig } = config;
  const selector = await setupMultiSendWalletSelector({
    ...selectorConfig,
    keyStorePrefix: selectorConfig.keyStorePrefix ?? REGISTRANT_KEYSTORE_PREFIX,
  });
  const coreContract = new CoreContract(contractsConfig.coreContractId, selector);
  const marketplaceContract = new MarketplaceContract(contractsConfig.marketplaceContractId, selector);
  const userSettingContract = new UserSettingContract(contractsConfig.userSettingContractId, selector);
  return new NameSky({ selector, coreContract, marketplaceContract, userSettingContract });
}
