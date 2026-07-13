const express = require('express');
const { nowIST } = require('../ist_time');

const router = express.Router();

// ════════════════════════════════════════════════════════════
//  POST /api/chat
//  Simple keyword-based chatbot — same responses as the Flask
//  version so the frontend behaves identically.
// ════════════════════════════════════════════════════════════

router.post('/', (req, res) => {
  try {
    const userMessage = (req.body.message || '').toLowerCase();
    // user_id is accepted but not currently used
    let replyText = '';

    if (userMessage.includes('hello') || userMessage.includes('hi')) {
      replyText = "Hello! I'm your ADM Assistant. How can I help you today?";
    } else if (userMessage.includes('access') || userMessage.includes('request')) {
      replyText =
        "I can help with that. You can either use the 'Request Access' page in the footer or tell me which dashboard you need access to right here.";
    } else if (userMessage.includes('dashboard')) {
      replyText =
        'We have several dashboards available: Sales Overview, Finance P&L, and HR Attrition. Which one are you interested in?';
    } else if (userMessage.includes('capabilities')) {
      replyText =
        "Our capabilities include Analytics, AI/ML, and Image Analytics. You can find more details in the 'Capabilities' menu.";
    } else if (userMessage.includes('help')) {
      replyText =
        'I can assist you with dashboard access, explaining our capabilities, or answering general questions about the ADM platform.';
    } else {
      replyText =
        "I'm not sure I understand. Could you please rephrase? You can ask about dashboard access or our platform capabilities.";
    }

    return res.status(200).json({
      status: 'success',
      reply: replyText,
      timestamp: nowIST(),
    });
  } catch (err) {
    console.error('[ERROR] Chat failed:', err.message);
    return res.status(500).json({ error: 'Chat processing failed', details: err.message });
  }
});

module.exports = router;
