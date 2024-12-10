const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const { Groq } = require('groq-sdk');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');

// Initialize GROQ client
const groq = new Groq({
  apiKey: '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',
});

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

// Setup cache with 24 hour TTL
const geocodeCache = new NodeCache({ stdTTL: 86400 });

// Rate limiting for Nominatim API (1 request per second as per their usage policy)
const geocodeLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 1 // limit each IP to 1 request per windowMs
});

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

app.post("/generate-description", async function(req, res) {
    try {
        const { title, beds, baths, size, marketRent, images } = req.body;

        const imageAnalysis = images && images.length > 0 
            ? "Based on the provided images, I can see: " +
              "- Interior features like [specific features visible in images] " +
              "- Exterior elements such as [visible exterior elements] " +
              "- Notable amenities including [visible amenities] "
            : "No images provided for this listing.";

        const completion = await groq.chat.completions.create({
            messages: [{
                role: "user",
                content: `Generate a property listing description with EXACTLY between 500-850 characters (this is crucial) for:
                         Title: "${title}"
                         Bedrooms: ${beds || 'N/A'}
                         Bathrooms: ${baths || 'N/A'}
                         Size: ${size || 'N/A'} sq ft
                         Rent: $${marketRent || 'N/A'}
                         
                         Property Images Analysis:
                         ${imageAnalysis}
                         
                         STRICT REQUIREMENTS:
                         - Your response MUST be between 500-850 characters (not words)
                         - Incorporate notable features visible in the images
                         - Be detailed while staying under the limit
                         - Include key features and amenities
                         - Focus on unique selling points
                         - End with a compelling call-to-action
                         - Must have a natural, complete ending
                         
                         End the description with a brief, engaging call-to-action like "Schedule a viewing today!" or "Don't miss this opportunity!"
                         Count your characters carefully and ensure a proper closing statement.`
            }],
            model: "mixtral-8x7b-32768",
            temperature: 0.6,
            max_tokens: 400,
        });

        let description = completion.choices[0]?.message?.content || '';
        description = description.trim();

        if (description.length < 500) {
            throw new Error('Generated description too short');
        }

        // Truncate to 850 to leave room for closing if needed
        description = description.slice(0, 850);

        // Find the last complete sentence
        const lastPeriod = description.lastIndexOf('.');
        if (lastPeriod > 500) {
            description = description.slice(0, lastPeriod + 1);
            
            // Check if there's already a call-to-action
            const lowerDesc = description.toLowerCase();
            const hasCallToAction = lowerDesc.includes('schedule') || 
                                  lowerDesc.includes('contact') || 
                                  lowerDesc.includes('call') ||
                                  lowerDesc.includes('today') ||
                                  lowerDesc.includes('opportunity');

            // Add a closing call-to-action if there isn't one
            if (!hasCallToAction && description.length < 900) {
                description += ' Contact us to schedule a viewing today!';
            }
        }

        res.json({ description });
    } catch (error) {
        console.error("GROQ error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/geocode', geocodeLimiter, async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    // Check cache first
    const cachedResult = geocodeCache.get(address);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    // If not in cache, fetch from Nominatim
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search`,
      {
        params: {
          format: 'json',
          q: address,
          limit: 1
        },
        headers: {
          'User-Agent': 'Velloa/1.0'
        }
      }
    );

    if (response.data && response.data[0]) {
      const result = {
        coordinates: {
          lat: response.data[0].lat,
          lon: response.data[0].lon
        }
      };

      // Store in cache
      geocodeCache.set(address, result);

      res.json(result);
    } else {
      res.status(404).json({ error: 'Location not found' });
    }

  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Failed to geocode address' });
  }
});

app.listen(8000, () => {
   console.log("server has started");
});