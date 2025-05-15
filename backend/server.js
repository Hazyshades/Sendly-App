const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const config = require('./config');

const app = express();

// CORS settings
app.use(cors({
  origin: config.FRONTEND_URL,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Route for sponsoring a transaction
app.post('/api/sponsor-operation', async (req, res) => {
  try {
    const { userOperation, entryPoint, chainId } = req.body;

    // Log incoming data
    console.log('Received from frontend:');
    console.log('userOperation:', JSON.stringify(userOperation, null, 2));
    console.log('entryPoint:', entryPoint);
    console.log('chainId:', chainId);

    if (!userOperation || !entryPoint || !chainId) {
      return res.status(400).json({ error: 'Missing userOperation, entryPoint, or chainId' });
    }

    // Form JSON-RPC object for Coinbase Paymaster
    const body = {
      userOperation,
      entryPoint,
      chainId
    };
    body: JSON.stringify(body)

    // Log what we're sending to Paymaster
    console.log('Sending to Paymaster:', JSON.stringify(body, null, 2));

    // Log URL and headers
    console.log('Paymaster URL:', config.COINBASE_PAYMASTER_URL);
    console.log('Headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.COINBASE_API_KEY.substring(0, 10)}...` // show only start of key
    });

    const response = await fetch(config.COINBASE_PAYMASTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.COINBASE_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Paymaster API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        details: JSON.stringify(errorData, null, 2)
      });
      return res.status(response.status).json({ error: 'Paymaster API error', details: errorData });
    }

    const data = await response.json();
    console.log('Successful response from Paymaster:', JSON.stringify(data, null, 2));
    res.json(data);

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Start server
app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});