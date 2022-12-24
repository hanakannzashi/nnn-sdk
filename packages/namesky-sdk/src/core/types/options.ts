import { ArgsOptions, AttachedDepositOptions, BlockQuery, GasOptions, MethodArgs, NftTransferArgs } from '../../utils';
import {
  CreateListingArgs,
  CreateMarketAccountArgs,
  CreateOfferingArgs,
  GetAccountViewOfArgs,
  GetListingUniqueIdArgs,
  GetListingViewArgs,
  GetListingViewsArgs,
  GetListingViewsOfArgs,
  GetNftApprovalArgs,
  GetNftOfferingViewsOfArgs,
  getOfferingUniqueIdArgs,
  GetOfferingViewArgs,
  GetOfferingViewsArgs,
  GetOfferingViewsOfArgs,
  NearDepositArgs,
  NearWithdrawArgs,
  NftIsRegisteredArgs,
  NftRedeemArgs,
  NftRegisterArgs,
  RemoveListingArgs,
  RemoveOfferingArgs,
  UpdateListingArgs,
  UpdateOfferingArgs,
} from './args';

// ================================================ Call =======================================================
interface FunctionCallExtraOptions {
  callbackUrl?: string;
}

type RequiredArgsOptions<Args extends MethodArgs> = Required<ArgsOptions<Args>>;

// ---------------------------------------------- Controller ---------------------------------------------------
export interface SetupControllerOptions {
  registrantId: string;
  code: Buffer;
  gasForCleanState?: string;
  gasForInit?: string;
}

// ---------------------------------------------- Core ---------------------------------------------------------
export interface NftRegisterOptions extends RequiredArgsOptions<NftRegisterArgs>, AttachedDepositOptions, GasOptions {
  registrantId: string;
}

export interface NftRedeemOptions extends RequiredArgsOptions<NftRedeemArgs>, GasOptions, FunctionCallExtraOptions {}

export interface NftTransferOptions
  extends RequiredArgsOptions<NftTransferArgs>,
    GasOptions,
    FunctionCallExtraOptions {}

// ---------------------------------------------- Marketplace --------------------------------------------------
export interface CreateMarketAccountOption
  extends ArgsOptions<CreateMarketAccountArgs>,
    AttachedDepositOptions,
    GasOptions,
    FunctionCallExtraOptions {}

export interface NearDepositOptions
  extends ArgsOptions<NearDepositArgs>,
    AttachedDepositOptions,
    GasOptions,
    FunctionCallExtraOptions {}

export interface NearWithdrawOptions extends ArgsOptions<NearWithdrawArgs>, GasOptions, FunctionCallExtraOptions {}

export interface CreateListingOptions
  extends RequiredArgsOptions<CreateListingArgs>,
    GasOptions,
    FunctionCallExtraOptions {
  listingStorageDeposit?: string;
  approvalStorageDeposit?: string;
}

export interface UpdateListingOptions
  extends RequiredArgsOptions<UpdateListingArgs>,
    GasOptions,
    FunctionCallExtraOptions {
  approvalStorageDeposit?: string;
}

export interface RemoveListingOptions
  extends RequiredArgsOptions<RemoveListingArgs>,
    GasOptions,
    FunctionCallExtraOptions {}

export interface CreateOfferingOptions
  extends RequiredArgsOptions<CreateOfferingArgs>,
    GasOptions,
    FunctionCallExtraOptions {
  offeringStorageDeposit?: string;
}

export interface UpdateOfferingOptions
  extends RequiredArgsOptions<UpdateOfferingArgs>,
    GasOptions,
    FunctionCallExtraOptions {}

export interface RemoveOfferingOptions
  extends RequiredArgsOptions<RemoveOfferingArgs>,
    GasOptions,
    FunctionCallExtraOptions {}

// ================================================ View =======================================================
interface FunctionViewExtraOptions {
  blockQuery?: BlockQuery;
}

// ---------------------------------------------- Controller ---------------------------------------------------
export interface GetControllerOwnerIdOptions extends FunctionViewExtraOptions {
  registrantId: string;
}

// ---------------------------------------------- Core ---------------------------------------------------------
export interface NftIsRegisteredOptions extends RequiredArgsOptions<NftIsRegisteredArgs>, FunctionViewExtraOptions {}

// ---------------------------------------------- Marketplace --------------------------------------------------
export interface GetAccountViewOfOptions extends RequiredArgsOptions<GetAccountViewOfArgs>, FunctionViewExtraOptions {}

export interface GetOfferingViewOptions extends RequiredArgsOptions<GetOfferingViewArgs>, FunctionViewExtraOptions {}

export interface GetOfferingViewsOptions extends ArgsOptions<GetOfferingViewsArgs>, FunctionViewExtraOptions {}

export interface GetOfferingViewsOfOptions
  extends RequiredArgsOptions<GetOfferingViewsOfArgs>,
    FunctionViewExtraOptions {}

export interface GetNftOfferingViewsOfOptions
  extends RequiredArgsOptions<GetNftOfferingViewsOfArgs>,
    FunctionViewExtraOptions {}

export interface GetOfferingUniqueIdOptions
  extends RequiredArgsOptions<getOfferingUniqueIdArgs>,
    FunctionViewExtraOptions {}

export interface GetListingViewOptions extends RequiredArgsOptions<GetListingViewArgs>, FunctionViewExtraOptions {}

export interface GetListingViewsOptions extends ArgsOptions<GetListingViewsArgs>, FunctionViewExtraOptions {}

export interface GetListingViewsOfOptions
  extends RequiredArgsOptions<GetListingViewsOfArgs>,
    FunctionViewExtraOptions {}

export interface GetListingUniqueIdOptions
  extends RequiredArgsOptions<GetListingUniqueIdArgs>,
    FunctionViewExtraOptions {}

export interface GetNftApprovalOptions extends RequiredArgsOptions<GetNftApprovalArgs>, FunctionViewExtraOptions {}