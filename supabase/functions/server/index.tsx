import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://sendly.vercel.app'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Helper function to verify user authentication
async function verifyUser(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return { user: null, error: 'No access token provided' };
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  return { user, error };
}

// Sign up endpoint
app.post('/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Signup error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.log(`Server error during signup: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create gift card endpoint
app.post('/gift-cards', async (c) => {
  try {
    // TODO: Add authentication when auth system is ready
    // const { user, error: authError } = await verifyUser(c.req.raw);
    // if (!user) {
    //   return c.json({ error: 'Unauthorized' }, 401);
    // }

    const cardData = await c.req.json();
    const cardId = `GIFT${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    const giftCard = {
      id: cardId,
      sender_id: 'temp_user', // TODO: Replace with actual user ID
      sender_address: cardData.senderAddress,
      recipient_address: cardData.recipientAddress,
      amount: cardData.amount,
      currency: cardData.currency,
      design: cardData.design,
      message: cardData.message,
      secret_message: cardData.secretMessage || '',
      has_timer: cardData.hasTimer || false,
      timer_hours: cardData.timerHours || 0,
      has_password: cardData.hasPassword || false,
      password_hash: cardData.password ? await hashPassword(cardData.password) : '',
      expiry_days: cardData.expiryDays || 7,
      custom_image: cardData.customImage || '',
      nft_cover: cardData.nftCover || '',
      status: 'active',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + (cardData.expiryDays || 7) * 24 * 60 * 60 * 1000).toISOString(),
      qr_code: `sendly://redeem/${cardId}`,
      tx_hash: cardData.txHash || ''
    };

    await kv.set(`gift_card:${cardId}`, giftCard);
    await kv.set(`user_sent:temp_user:${cardId}`, { card_id: cardId, created_at: giftCard.created_at });
    
    // Add to analytics
    const userStats = await kv.get(`user_stats:temp_user`) || { 
      total_sent: 0, 
      total_received: 0, 
      cards_sent: 0, 
      cards_received: 0 
    };
    userStats.total_sent += parseFloat(cardData.amount);
    userStats.cards_sent += 1;
    await kv.set(`user_stats:temp_user`, userStats);

    return c.json({ card: giftCard });
  } catch (error) {
    console.log(`Error creating gift card: ${error}`);
    return c.json({ error: 'Failed to create gift card' }, 500);
  }
});

// Get user's gift cards
app.get('/gift-cards', async (c) => {
  try {
    // TODO: Add authentication when auth system is ready
    // const { user, error: authError } = await verifyUser(c.req.raw);
    // if (!user) {
    //   return c.json({ error: 'Unauthorized' }, 401);
    // }

    const type = c.req.query('type') || 'sent';
    const prefix = type === 'sent' ? `user_sent:temp_user:` : `user_received:temp_user:`;
    
    const cardRefs = await kv.getByPrefix(prefix);
    const cards = [];
    
    for (const ref of cardRefs) {
      const card = await kv.get(`gift_card:${ref.card_id}`);
      if (card) {
        cards.push(card);
      }
    }

    return c.json({ cards: cards.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) });
  } catch (error) {
    console.log(`Error fetching gift cards: ${error}`);
    return c.json({ error: 'Failed to fetch gift cards' }, 500);
  }
});

// Get gift card details
app.get('/gift-cards/:cardId', async (c) => {
  try {
    const cardId = c.req.param('cardId');
    const card = await kv.get(`gift_card:${cardId}`);
    
    if (!card) {
      return c.json({ error: 'Gift card not found' }, 404);
    }

    // Check if card is expired
    if (new Date() > new Date(card.expires_at)) {
      card.status = 'expired';
      await kv.set(`gift_card:${cardId}`, card);
    }

    // Remove sensitive information
    const publicCard = { ...card };
    delete publicCard.password_hash;
    
    return c.json({ card: publicCard });
  } catch (error) {
    console.log(`Error fetching gift card: ${error}`);
    return c.json({ error: 'Failed to fetch gift card' }, 500);
  }
});

// Redeem gift card
app.post('/gift-cards/:cardId/redeem', async (c) => {
  try {
    // TODO: Add authentication when auth system is ready
    // const { user, error: authError } = await verifyUser(c.req.raw);
    // if (!user) {
    //   return c.json({ error: 'Unauthorized' }, 401);
    // }

    const cardId = c.req.param('cardId');
    const { password, recipientAddress } = await c.req.json();
    
    const card = await kv.get(`gift_card:${cardId}`);
    if (!card) {
      return c.json({ error: 'Gift card not found' }, 404);
    }

    if (card.status !== 'active') {
      return c.json({ error: `Gift card is ${card.status}` }, 400);
    }

    if (new Date() > new Date(card.expires_at)) {
      card.status = 'expired';
      await kv.set(`gift_card:${cardId}`, card);
      return c.json({ error: 'Gift card has expired' }, 400);
    }

    // Check timer
    if (card.has_timer && card.timer_hours > 0) {
      const createdTime = new Date(card.created_at).getTime();
      const now = Date.now();
      const hoursElapsed = (now - createdTime) / (1000 * 60 * 60);
      
      if (hoursElapsed < card.timer_hours) {
        return c.json({ error: 'Gift card is still locked by timer' }, 400);
      }
    }

    // Check password
    if (card.has_password && card.password_hash) {
      if (!password) {
        return c.json({ error: 'Password required' }, 400);
      }
      
      const isValidPassword = await verifyPassword(password, card.password_hash);
      if (!isValidPassword) {
        return c.json({ error: 'Invalid password' }, 400);
      }
    }

    // Mark as redeemed
    card.status = 'redeemed';
    card.redeemed_at = new Date().toISOString();
    card.redeemed_by = 'temp_user'; // TODO: Replace with actual user ID
    card.redeemed_address = recipientAddress;
    
    await kv.set(`gift_card:${cardId}`, card);
    await kv.set(`user_received:temp_user:${cardId}`, { card_id: cardId, redeemed_at: card.redeemed_at });

    // Update analytics
    const userStats = await kv.get(`user_stats:temp_user`) || { 
      total_sent: 0, 
      total_received: 0, 
      cards_sent: 0, 
      cards_received: 0 
    };
    userStats.total_received += parseFloat(card.amount);
    userStats.cards_received += 1;
    await kv.set(`user_stats:temp_user`, userStats);

    // Create transaction record
    const transaction = {
      id: `tx_${Date.now()}`,
      user_id: 'temp_user', // Temporary for testing
      card_id: cardId,
      type: 'redeemed',
      amount: card.amount,
      currency: card.currency,
      counterpart: card.sender_address,
      message: card.message,
      status: 'completed',
      timestamp: new Date().toISOString(),
      tx_hash: card.tx_hash || ''
    };
    
    await kv.set(`transaction:${transaction.id}`, transaction);
    await kv.set(`user_transactions:temp_user:${transaction.id}`, { transaction_id: transaction.id, timestamp: transaction.timestamp });

    return c.json({ 
      card: card,
      secret_message: card.secret_message,
      transaction: transaction 
    });
  } catch (error) {
    console.log(`Error redeeming gift card: ${error}`);
    return c.json({ error: 'Failed to redeem gift card' }, 500);
  }
});

// Get user analytics
app.get('/analytics', async (c) => {
  try {
    // TODO: Add authentication when auth system is ready
    // const { user, error: authError } = await verifyUser(c.req.raw);
    // if (!user) {
    //   return c.json({ error: 'Unauthorized' }, 401);
    // }

    const stats = await kv.get(`user_stats:temp_user`) || { 
      total_sent: 0, 
      total_received: 0, 
      cards_sent: 0, 
      cards_received: 0 
    };

    const analytics = {
      ...stats,
      total_redeemed: stats.total_received,
      average_amount: stats.cards_sent > 0 ? (stats.total_sent / stats.cards_sent).toFixed(2) : '0',
      top_currency: 'USDC' // Could be calculated from actual data
    };

    return c.json({ analytics });
  } catch (error) {
    console.log(`Error fetching analytics: ${error}`);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

// Get user transactions
app.get('/transactions', async (c) => {
  try {
    // TODO: Add authentication when auth system is ready
    // const { user, error: authError } = await verifyUser(c.req.raw);
    // if (!user) {
    //   return c.json({ error: 'Unauthorized' }, 401);
    // }

    const transactionRefs = await kv.getByPrefix(`user_transactions:temp_user:`);
    const transactions = [];
    
    for (const ref of transactionRefs) {
      const transaction = await kv.get(`transaction:${ref.transaction_id}`);
      if (transaction) {
        transactions.push(transaction);
      }
    }

    return c.json({ 
      transactions: transactions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ) 
    });
  } catch (error) {
    console.log(`Error fetching transactions: ${error}`);
    return c.json({ error: 'Failed to fetch transactions' }, 500);
  }
});

// Revoke gift card
app.post('/gift-cards/:cardId/revoke', async (c) => {
  try {
    // TODO: Add authentication when auth system is ready
    // const { user, error: authError } = await verifyUser(c.req.raw);
    // if (!user) {
    //   return c.json({ error: 'Unauthorized' }, 401);
    // }

    const cardId = c.req.param('cardId');
    const card = await kv.get(`gift_card:${cardId}`);
    
    if (!card) {
      return c.json({ error: 'Gift card not found' }, 404);
    }

    // Temporarily allow anyone to revoke for testing
    // if (card.sender_id !== user.id) {
    //   return c.json({ error: 'Only the sender can revoke this card' }, 403);
    // }

    if (card.status !== 'active') {
      return c.json({ error: 'Can only revoke active cards' }, 400);
    }

    card.status = 'revoked';
    card.revoked_at = new Date().toISOString();
    
    await kv.set(`gift_card:${cardId}`, card);

    return c.json({ card });
  } catch (error) {
    console.log(`Error revoking gift card: ${error}`);
    return c.json({ error: 'Failed to revoke gift card' }, 500);
  }
});

// Helper functions for password hashing
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

Deno.serve(app.fetch);