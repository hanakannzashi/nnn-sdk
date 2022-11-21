import {Modify} from "@near-wallet-selector/core/lib/utils.types";
import {WalletSelector} from "@near-wallet-selector/core";
import {Near} from "near-api-js";
import {NearTransaction} from "../core/NearTransaction";
import {ViewOptions} from "./options";
import {BaseArgs} from "./common";
import {BrowserLocalStorageKeyStore} from "near-api-js/lib/key_stores";

export interface WalletSelectorEnhancement {
  near: Near;
  getAccountId(): string | undefined;
  getKeyStore(): BrowserLocalStorageKeyStore
  view<Value, Args extends BaseArgs>({contractId, methodName, args, blockQuery}: ViewOptions<Args>): Promise<Value>;
  // Sign with key in selected wallet and send transaction
  send<Value>(transaction: NearTransaction, callbackUrl?: string): Promise<Value>;
  // Sign with key in `BrowserLocalStorageKeyStore` and send transaction, will ignore signerId in `NearTransaction`
  sendWithLocal<Value>(signerId: string, transaction: NearTransaction): Promise<Value>;
}

export type WalletSelectorPlus = Modify<WalletSelector, WalletSelectorEnhancement>
