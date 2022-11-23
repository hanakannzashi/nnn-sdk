import {Modify} from "@near-wallet-selector/core/lib/utils.types";
import {WalletSelector} from "@near-wallet-selector/core";
import {Near} from "near-api-js";
import {ViewOptions} from "./common";
import {BrowserLocalStorageKeyStore} from "near-api-js/lib/key_stores";
import {BaseArgs} from "../../near-transaction/types/common";
import {NearTransaction} from "../../near-transaction/core/NearTransaction";

export interface WalletSelectorEnhancement {
  near: Near;
  getAccountId(): string | undefined;
  getKeyStore(): BrowserLocalStorageKeyStore;
  view<Value, Args extends BaseArgs>({contractId, methodName, args, blockQuery}: ViewOptions<Args>): Promise<Value>;
  send<Value>(transaction: NearTransaction, callbackUrl?: string): Promise<Value>;
  sendWithLocalKey<Value>(signerId: string, transaction: NearTransaction): Promise<Value>;
}

export type WalletSelectorPlus = Modify<WalletSelector, WalletSelectorEnhancement>
