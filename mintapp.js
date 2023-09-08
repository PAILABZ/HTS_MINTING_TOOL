require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const {
    Client,
    PrivateKey,
    Hbar,
    TokenCreateTransaction,
    CustomFractionalFee,
    TokenSupplyType,
} = require("@hashgraph/sdk");

const app = express();
const PORT = 3000;


app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname));


async function environmentSetup(userAccountId, userPrivateKey, networkChoice) {
    if (!userAccountId || !userPrivateKey) {
        throw new Error("User Account ID and User Private Key must be present");
    }

    let client;

    if (networkChoice === 'mainnet') {
        client = Client.forMainnet();
    } else {
        
        client = Client.forTestnet();
    }

    client.setOperator(userAccountId, userPrivateKey);
    client.setDefaultMaxTransactionFee(new Hbar(500));
    client.setMaxQueryPayment(new Hbar(50));

    return client;
}

async function mintToken(numerator, tokenName, tokenSymbol, decimals, initialSupply, maxSupply, userAccountId, userPrivateKey, keyToggles, useCustomFees, tokenMemo, networkChoice) {
    const client = await environmentSetup(userAccountId, userPrivateKey, networkChoice);
    const treasuryAccountId = userAccountId;
    const userKey = PrivateKey.fromString(userPrivateKey);

    const transaction = new TokenCreateTransaction()
        .setTokenName(tokenName)
        .setTokenSymbol(tokenSymbol)
        .setDecimals(decimals)
        .setTreasuryAccountId(treasuryAccountId)
        .setInitialSupply(initialSupply)
        .setMaxTransactionFee(new Hbar(200))
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(maxSupply);

    if (tokenMemo) {
        transaction.setTokenMemo(tokenMemo);
    }

    if (useCustomFees === 'on') {
        const customFractionalFee = new CustomFractionalFee()
            .setNumerator(numerator)
            .setDenominator(100)
            .setFeeCollectorAccountId(treasuryAccountId);
        transaction.setCustomFees([customFractionalFee]);
    }

    if (keyToggles.useAdminKey) transaction.setAdminKey(userKey);
    if (keyToggles.useKycKey) transaction.setKycKey(userKey);
    if (keyToggles.useFreezeKey) transaction.setFreezeKey(userKey);
    if (keyToggles.useWipeKey) transaction.setWipeKey(userKey);
    if (keyToggles.useSupplyKey) transaction.setSupplyKey(userKey);
    if (keyToggles.usePauseKey) transaction.setPauseKey(userKey);

    const signTx = await transaction.freezeWith(client).sign(userKey);
    const txResponse = await signTx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const tokenId = receipt.tokenId;

    console.log("The new token ID is " + tokenId);
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/mintToken', async (req, res) => {
    const {
        numerator,
        tokenName,
        tokenSymbol,
        decimals,
        initialSupply,
        maxSupply,
        userAccountId,
        userPrivateKey,
        useAdminKey,
        useKycKey,
        useFreezeKey,
        useWipeKey,
        useSupplyKey,
        usePauseKey,
        useCustomFees,
        tokenMemo, 
        network 
    } = req.body;

    const keyToggles = {
        useAdminKey: useAdminKey === 'on',
        useKycKey: useKycKey === 'on',
        useFreezeKey: useFreezeKey === 'on',
        useWipeKey: useWipeKey === 'on',
        useSupplyKey: useSupplyKey === 'on',
        usePauseKey: usePauseKey === 'on'
    };

    try {
        await mintToken(numerator, tokenName, tokenSymbol, decimals, initialSupply, maxSupply, userAccountId, userPrivateKey, keyToggles, useCustomFees, tokenMemo, network);
        res.redirect('/?message=Token minted successfully!');
    } catch (error) {
        res.redirect('/?message=Error minting token: ' + encodeURIComponent(error.message));
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

