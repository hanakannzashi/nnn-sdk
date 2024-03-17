# NameSky SDK
Interact with NameSky contracts

## Install
```shell
yarn add namesky-sdk
```

## Init
For Node
```ts
import { initNameSky, MultiSendAccount, NameSkySigner } from 'namesky-sdk';
```

```ts
const account = MultiSendAccount.new(near.connection, 'alice.near');

const namesky = await initNameSky({
  network: 'mainnet',
  signer: NameSkySigner.fromAccount(account),
});
```

For Browser
```ts
import { initNameSky, setupMultiSendWalletSelector, NameSkySigner } from 'namesky-sdk';
```

```ts
const selector = setupMultiSendWalletSelector({
  network: 'mainnet',
  modules: [
    /* wallet modules */
  ],
});

const namesky = await initNameSky({
  network: 'mainnet',
  signer: NameSkySigner.fromWalletSelector(selector),
});
```

## Mint
Set registrant key

```ts
// registrant is the account that you want to mint as NameSky NFT. (e.g. star.near)
await namesky.setRegistrantKey('star.near', KeyPair.fromString('ed25519:<private key>'));
```

You can choose one click mint
```ts
await namesky.oneClickMint({ registrantId: 'star.near', minterId: 'alice.near' });
```

or step by step mint
```ts
await namesky.register({ registrantId: 'star.near', minterId: 'alice.near' });
await namesky.setupController({ registrantId: 'star.near' });
await namesky.waitForMinting({ registrantId: 'star.near' });
```

## Mange Listing
* Create listing
    ```ts
    import { Amount } from 'namesky-sdk';
    ```

    ```ts
    await namesky.marketplaceContract.createListing({
      args: {
        nft_contract_id: namesky.coreContractId,
        nft_token_id: 'star.near',
        price: Amount.parse(100, 'NEAR'),
      },
    });
    ```

* Update listing
    ```ts
    import { Amount } from 'namesky-sdk';
    ```

    ```ts
    await namesky.marketplaceContract.updateListing({
      args: {
        nft_contract_id: namesky.coreContractId,
        nft_token_id: 'star.near',
        new_price: Amount.parse(200, 'NEAR'),
      },
    });
    ```

* Remove listing
    ```ts
    await namesky.marketplaceContract.removeListing({
      args: {
        nft_contract_id: namesky.coreContractId,
        nft_token_id: 'star.near',
      },
    });
    ```

* Buy listing
    ```ts
    await namesky.marketplaceContract.buyListing({
      args: {
        nft_contract_id: namesky.coreContractId,
        nft_token_id: 'moon.near',
      },
    });
    ```

## Mange Offering
* Create Offering
    ```ts
    import { Amount } from 'namesky-sdk';
    ```

    ```ts
    await namesky.marketplaceContract.createOffering({
      args: {
        nft_contract_id: namesky.coreContractId,
        nft_token_id: 'moon.near',
        price: Amount.parse(30, 'NEAR'),
      },
    });
    ```

* Update Offering
    ```ts
    import { Amount } from 'namesky-sdk';
    ```

    ```ts
    await namesky.marketplaceContract.updateOffering({
      args: {
        nft_contract_id: namesky.coreContractId,
        nft_token_id: 'moon.near',
        new_price: Amount.parse(40, 'NEAR'),
      },
    });
    ```

* Remove Offering
    ```ts
    await namesky.marketplaceContract.removeOffering({
      args: {
        nft_contract_id: namesky.coreContractId,
        nft_token_id: 'moon.near',
      },
    });
    ```

* Accept Offering
    ```ts
    await namesky.marketplaceContract.acceptOffering({
      args: {
        buyer_id: 'bob.near',
        nft_contract_id: namesky.coreContractId,
        nft_token_id: 'star.near',
      },
    });
    ```
