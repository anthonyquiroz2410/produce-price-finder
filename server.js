// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const { URLSearchParams } = require('url');
const app = express();

// Access environment variables
const krogerClientId = process.env.KROGER_CLIENT_ID;
const krogerClientSecret = process.env.KROGER_CLIENT_SECRET;
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Function to get access token
async function getKrogerAccessToken() {
    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('scope', 'product.compact');

        const tokenResponse = await axios.post(
            'https://api.kroger.com/v1/connect/oauth2/token',
            params.toString(),
            {
                auth: {
                    username: krogerClientId,
                    password: krogerClientSecret,
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        return tokenResponse.data.access_token;
    } catch (error) {
        console.error(
            'Error fetching access token:',
            error.response ? error.response.data : error.message
        );
        throw new Error('Unable to retrieve access token');
    }
}

// Endpoint to search for produce
app.get('/search', async (req, res) => {
    const zipcode = req.query.zipcode;
    const produce = req.query.produce;

    try {
        const accessToken = await getKrogerAccessToken();

        // Get nearby locations based on zip code
        const locationResponse = await axios.get(
            'https://api.kroger.com/v1/locations',
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                params: {
                    'filter.zipCode.near': zipcode,
                    'filter.limit': 5,
                },
            }
        );

        const locations = locationResponse.data.data;
        if (locations.length === 0) {
            return res.json([]);
        }

        const locationIds = locations.map((location) => location.locationId);

        // Search for the product at these locations
        const productResponse = await axios.get(
            'https://api.kroger.com/v1/products',
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                params: {
                    'filter.term': produce,
                    'filter.locationId': locationIds.join(','),
                    'filter.limit': 10,
                },
            }
        );

        const products = productResponse.data.data;

        // Map the products to your desired format
        const data = products.map((item) => {
            const priceInfo = item.items[0].price;
            const price = priceInfo.promo || priceInfo.regular;
            const storeLocationId = item.items[0].fulfillment.locationId;
            const store = locations.find(
                (loc) => loc.locationId === storeLocationId
            );

            return {
                name: item.description,
                price: price,
                address: store
                    ? store.address.addressLine1 +
                      ', ' +
                      store.address.city +
                      ', ' +
                      store.address.state +
                      ' ' +
                      store.address.zipCode
                    : 'Unknown Address',
            };
        });

        res.json(data);
    } catch (error) {
        console.error(
            'Error during search:',
            error.response ? error.response.data : error.message
        );
        res.status(500).json({ error: 'Unable to perform search' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

