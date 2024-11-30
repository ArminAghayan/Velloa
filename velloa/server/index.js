const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const configuration = new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': '662a0765c66b62001b5669cb',
            'PLAID-SECRET': 'd03e5d216e497e915814e969d46e8e',
        },
    },
});

const plaidClient = new PlaidApi(configuration);
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/hello", (req, res) => {
    res.json({message: "hello " + req.body.name});
});

app.post('/create_link_token', async function (req, res) {
    const plaidRequest = {
        user: {
            client_user_id: 'user',
        },
        client_name: 'Velloa',
        products: ['auth', 'transactions'],
        language: 'en',
        redirect_uri: 'http://localhost:3000/',
        country_codes: ['US'],
    };
    try {
        const createTokenResponse = await plaidClient.linkTokenCreate(plaidRequest);
        res.json(createTokenResponse.data);
    } catch (error) {
        console.error("Link token error:", error);
        res.status(500).send("failure");
    }
});

app.post("/auth", async function(req, res) {
   try {
       const access_token = req.body.access_token;
       const plaidRequest = {
           access_token: access_token,
       };
       const plaidResponse = await plaidClient.authGet(plaidRequest);
       res.json(plaidResponse.data);
   } catch (e) {
       res.status(500).send("failed");
   }
});

app.post('/exchange_public_token', async function (
    req,
    res,
    next,
) {
    const publicToken = req.body.public_token;
    try {
        const plaidResponse = await plaidClient.itemPublicTokenExchange({
            public_token: publicToken,
        });
        // These values should be saved to a persistent database and
        // associated with the currently signed-in user
        const accessToken = plaidResponse.data.access_token;
        res.json({ accessToken });
    } catch (error) {
        res.status(500).send("failed");
    }
});

app.post("/get_balance", async function(req, res) {
    try {
        const request = {
            access_token: req.body.access_token,
        };
        const response = await plaidClient.accountsBalanceGet(request);
        res.json(response.data);
    } catch (error) {
        res.status(500).send("failed");
    }
});

app.post("/get_recurring_transactions", async function(req, res) {
    try {
        const request = {
            access_token: req.body.access_token,
            account_ids: req.body.account_ids,
            options: {
                include_personal_finance_category: true
            }
        };
        const response = await plaidClient.transactionsRecurringGet(request);
        console.log("Plaid response:", response.data);
        res.json({
            inflowStreams: response.data.inflow_streams || [],
            outflowStreams: response.data.outflow_streams || []
        });
    } catch (error) {
        console.error("Plaid error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(8000, () => {
   console.log("server has started");
});