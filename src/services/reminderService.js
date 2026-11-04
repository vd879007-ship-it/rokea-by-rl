import { db } from './firebase';

/**
 * ROKEA by RK - Abandoned Cart & Wishlist Email Reminder Service
 *
 * Automatically tracks and sends reminder emails to logged-in customers
 * who added items to their shopping bag or wishlist and left without purchasing.
 */

// Throttle between automatic triggers for the same user (1 minute for rapid testing and real-time response)
const REMINDER_THROTTLE_MINUTES = 1;

/**
 * Dispatch real email directly from rokeabyrk@gmail.com to customer inbox.
 * Priority 1: Official Gmail SMTP (/api/send-email) with sender rokeabyrk@gmail.com
 * Priority 2: FormSubmit REST API fallback
 */
export async function sendRealEmail({ userEmail, userName, subject, cart = [], wishlist = [], cartTotal = 0, emailHtml = '' }) {
  if (!userEmail) return { success: false, reason: 'No destination email' };

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://rokeabyrk.com';

  const cartLines = (cart || []).map((item, idx) =>
    `${idx + 1}. ${item.name} - ₹${Number(item.price || 0).toLocaleString('en-IN')}`
  ).join('\n');

  const wishlistLines = (wishlist || []).map((item, idx) =>
    `${idx + 1}. ${item.name} - ₹${Number(item.price || 0).toLocaleString('en-IN')}`
  ).join('\n');

  const summary = `
Hello ${userName || 'Valued Customer'},

Your handcrafted selection has been saved at ROKEA by RK:

${cartLines ? `ITEMS IN SHOPPING BAG:\n${cartLines}\nTotal Bag Value: ₹${Number(cartTotal || 0).toLocaleString('en-IN')}\n` : ''}
${wishlistLines ? `SAVED WISHLIST ITEMS:\n${wishlistLines}\n` : ''}

Boutique Privilege Voucher:
Use promo code: ROKEA20 during checkout for an exclusive 20% courtesy reduction.

Complete your order: ${siteUrl}/collections

Need blouse tailoring assistance or personal styling?
WhatsApp our boutique concierge: https://wa.me/917010394051

ROKEA by RK Luxury Boutique
Opp. to New Bus Stand, Near Sundaram Theater, Aranthangi - 614616
Phone: +91 70103 94051 | Email: rokeabyrk@gmail.com

To opt out of bag reminder updates, reply to this email with "UNSUBSCRIBE".
  `.trim();

  // Retrieve saved Gmail App Password from localStorage
  let savedAppPassword = '';
  try {
    savedAppPassword = localStorage.getItem('saforio_gmail_app_password') || '';
  } catch (e) {}

  // ── 1. PRIMARY: DIRECT GMAIL SMTP DISPATCH (From: rokeabyrk@gmail.com) ──
  try {
    const smtpRes = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        to: userEmail,
        subject: subject || 'ROKEA by RK - Saved Items in Your Shopping Bag',
        html: emailHtml,
        text: summary,
        gmailAppPassword: savedAppPassword || undefined
      })
    });
    const smtpJson = await smtpRes.json().catch(() => ({}));
    if (smtpRes.ok && smtpJson.success) {
      console.log(`[Reminder Service] Successfully dispatched FROM rokeabyrk@gmail.com to ${userEmail}!`, smtpJson);
      return {
        success: true,
        from: 'rokeabyrk@gmail.com',
        to: userEmail,
        method: 'gmail-smtp',
        messageId: smtpJson.messageId
      };
    } else {
      console.warn('[Reminder Service] SMTP response notice:', smtpJson?.message || smtpJson?.error);
    }
  } catch (smtpErr) {
    console.warn('[Reminder Service] SMTP fetch notice:', smtpErr);
  }

  // ── 2. BACKUP DISPATCH: FormSubmit REST API ──
  let customerDispatchOk = false;
  let adminDispatchOk = false;

  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(userEmail)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      keepalive: true,
      body: JSON.stringify({
        _subject: subject || "✨ Your Exclusive Collection is Waiting at ROKEA by RK",
        _replyto: "rokeabyrk@gmail.com",
        _template: "table",
        _captcha: "false",
        "Sender": "ROKEA by RK <rokeabyrk@gmail.com>",
        "Customer Name": userName || "Customer",
        "Customer Email": userEmail,
        "Exclusive Items in Bag": cartLines || "None",
        "Bag Total Amount": `₹${Number(cartTotal || 0).toLocaleString('en-IN')}`,
        "Wishlist Items": wishlistLines || "None",
        "VIP Privilege Voucher": "ROKEA20 (20% OFF)",
        "Direct Boutique Link": `${siteUrl}/collections`,
        "WhatsApp Concierge": "https://wa.me/917010394051",
        "Message": summary
      })
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok || json.success === "true" || json.success === true) {
      customerDispatchOk = true;
      console.log(`[Reminder Service] Delivered via relay to ${userEmail}`);
    }
  } catch (err) {
    console.warn("[Reminder Service] Customer dispatch network warning:", err);
  }

  // Also send lead alert to store owner rokeabyrk@gmail.com
  try {
    const adminRes = await fetch(`https://formsubmit.co/ajax/rokeabyrk@gmail.com`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        _subject: `🚨 [Abandoned Cart Alert] ${userName} (${userEmail}) left ₹${Number(cartTotal || 0).toLocaleString('en-IN')} in bag!`,
        _replyto: userEmail,
        _template: "table",
        _captcha: "false",
        "Customer Name": userName,
        "Customer Email": userEmail,
        "Cart Value": `₹${Number(cartTotal || 0).toLocaleString('en-IN')}`,
        "Items in Bag": cartLines || "None",
        "Items in Wishlist": wishlistLines || "None",
        "Direct Follow-up": `Email customer at ${userEmail} or WhatsApp https://wa.me/917010394051`
      })
    });
    if (adminRes.ok) adminDispatchOk = true;
  } catch (err) {
    console.warn("[Reminder Service] Admin alert warning:", err);
  }

  return {
    success: customerDispatchOk || adminDispatchOk,
    from: 'rokeabyrk@gmail.com',
    to: userEmail,
    customerDispatchOk,
    adminDispatchOk
  };
}

/**
 * Generate luxury HTML email template for abandoned cart / wishlist
 */
export function buildReminderEmailHtml({ user, cart = [], wishlist = [] }) {
  const customerName = user.name || 'Valued Customer';
  const hasCart = Array.isArray(cart) && cart.length > 0;
  const hasWishlist = Array.isArray(wishlist) && wishlist.length > 0;
  const cartTotal = hasCart
    ? cart.reduce((sum, item) => sum + (parseInt(item.price || 0, 10) * parseInt(item.quantity || 1, 10)), 0)
    : 0;

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://rokeabyrk.com';

  const cartItemsHtml = hasCart
    ? cart.map(item => {
        const qty = parseInt(item.quantity || 1, 10);
        const price = parseInt(item.price || 0, 10);
        const lineTotal = price * qty;
        return `
      <tr style="border-bottom: 1px solid #E8DFD8;">
        <td style="padding: 14px 10px; width: 75px;">
          <img src="${item.image || item.img || 'https://via.placeholder.com/80'}" alt="${item.name}" style="width: 70px; height: 90px; object-fit: cover; border-radius: 6px; border: 1px solid #D4AF37;" />
        </td>
        <td style="padding: 14px 12px; vertical-align: middle;">
          <h4 style="margin: 0 0 4px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 15px; color: #2A040B; font-weight: 700;">${item.name}</h4>
          <p style="margin: 0 0 6px 0; font-family: 'Poppins', Arial, sans-serif; font-size: 11px; color: #7A6A5E; text-transform: uppercase; letter-spacing: 1px;">Exclusive Handcrafted Piece</p>
          <span style="display: inline-block; background: #FAF5EE; border: 1px solid #EADBCC; color: #6B1327; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px;">Qty: ${qty}</span>
        </td>
        <td style="padding: 14px 10px; text-align: right; vertical-align: middle;">
          <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 16px; font-weight: 700; color: #8A1528;">₹${lineTotal.toLocaleString('en-IN')}</span>
          ${qty > 1 ? `<div style="font-size: 10.5px; color: #888; margin-top: 2px;">(₹${price.toLocaleString('en-IN')} each)</div>` : ''}
        </td>
      </tr>
    `;
      }).join('')
    : '';

  const wishlistItemsHtml = hasWishlist
    ? wishlist.map(item => `
      <tr style="border-bottom: 1px solid #E8DFD8;">
        <td style="padding: 12px 10px; width: 60px;">
          <img src="${item.image || item.img || 'https://via.placeholder.com/60'}" alt="${item.name}" style="width: 55px; height: 70px; object-fit: cover; border-radius: 6px; border: 1px solid #D4AF37;" />
        </td>
        <td style="padding: 12px 12px; vertical-align: middle;">
          <h4 style="margin: 0 0 4px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 14px; color: #2A040B;">${item.name}</h4>
          <span style="font-size: 11px; color: #C9A84C;">★ In High Demand</span>
        </td>
        <td style="padding: 12px 10px; text-align: right; vertical-align: middle;">
          <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 14px; font-weight: 700; color: #2A040B;">₹${Number(item.price || 0).toLocaleString('en-IN')}</span>
        </td>
      </tr>
    `).join('')
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Exclusive Collection is Waiting at ROKEA by RK</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F5F0; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D241E;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8F5F0; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08); border: 1px solid #EADBCC;">
          
          <!-- BRAND HEADER WITH OFFICIAL PROFILE LOGO & EMBLEM -->
          <tr>
            <td style="background: linear-gradient(135deg, #160307 0%, #380712 50%, #160307 100%); padding: 32px 20px 26px 20px; text-align: center; border-bottom: 3px solid #D4AF37;">
              <!-- CIRCULAR BOUTIQUE AVATAR / CREST -->
              <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto 14px auto;">
                <tr>
                  <td align="center" style="width: 68px; height: 68px; background: #2A040B; border: 2.5px solid #D4AF37; border-radius: 50%; box-shadow: 0 4px 18px rgba(212, 175, 55, 0.45); text-align: center; vertical-align: middle;">
                    <span style="font-family: 'Cinzel', Georgia, serif; font-size: 24px; font-weight: 700; color: #ECC85B; display: block; line-height: 1; letter-spacing: 1px;">R</span>
                    <span style="font-family: 'Poppins', sans-serif; font-size: 9px; color: #FFF3C4; letter-spacing: 2px; text-transform: uppercase; display: block; margin-top: 2px;">RK</span>
                  </td>
                </tr>
              </table>

              <!-- OFFICIAL ROKEA BRAND LOGO IMAGE -->
              <a href="${siteUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                <img
                  src="https://static.wixstatic.com/media/9881b8_16e714ef67304ad7812d38944b0b0b16~mv2.png/v1/crop/x_0,y_92,w_5000,h_1065/fill/w_440,h_94,al_c,q_95/ROKEA%20horizontal%20logo%20(1).png"
                  alt="ROKEA by RK Luxury Boutique"
                  width="220"
                  height="47"
                  style="display: block; margin: 0 auto; border: 0; outline: none; max-width: 220px; height: auto;"
                />
              </a>
              <span style="display: block; font-family: 'Poppins', sans-serif; font-size: 10px; color: #E8D0B5; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">
                LUXURY HANDLOOM SAREES &amp; HERITAGE JEWELLERY
              </span>
            </td>
          </tr>

          <!-- HERO BANNER -->
          <tr>
            <td style="padding: 35px 30px 20px 30px; text-align: center;">
              <span style="display: inline-block; padding: 4px 14px; background: rgba(201, 168, 76, 0.15); border: 1px solid #D4AF37; border-radius: 20px; font-size: 11px; font-weight: 700; color: #8A6510; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 15px;">
                Handcrafted Selection Saved For You
              </span>
              <h1 style="margin: 0 0 14px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #1F050A; font-weight: 700; line-height: 1.3;">
                Hello ${customerName}, your selected designs are saved.
              </h1>
              <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #695B50;">
                Your handcrafted sarees and heritage jewellery pieces have been safely saved in your shopping bag. You can review your selection and complete your order whenever you are ready.
              </p>
            </td>
          </tr>

          ${hasCart ? `
          <!-- CART ITEMS TABLE -->
          <tr>
            <td style="padding: 10px 30px;">
              <div style="background: #FDFAF6; border: 1px solid #EADBCC; border-radius: 10px; padding: 18px 20px;">
                <h3 style="margin: 0 0 12px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 16px; color: #6B1327; border-bottom: 1px solid #EADBCC; padding-bottom: 8px;">
                  Items in Your Shopping Bag
                </h3>
                <table width="100%" cellspacing="0" cellpadding="0">
                  ${cartItemsHtml}
                </table>
                <div style="text-align: right; margin-top: 15px; padding-top: 12px; border-top: 1px solid #EADBCC;">
                  <span style="font-size: 13px; color: #7A6A5E; margin-right: 10px;">Bag Total:</span>
                  <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 18px; font-weight: 700; color: #6B1327;">₹${cartTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </td>
          </tr>
          ` : ''}

          ${hasWishlist ? `
          <!-- WISHLIST ITEMS -->
          <tr>
            <td style="padding: 15px 30px;">
              <div style="background: #FAFAFA; border: 1px dashed #D4AF37; border-radius: 10px; padding: 16px 20px;">
                <h3 style="margin: 0 0 10px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 15px; color: #2A040B;">
                  Your Saved Wishlist Items
                </h3>
                <table width="100%" cellspacing="0" cellpadding="0">
                  ${wishlistItemsHtml}
                </table>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- SPECIAL OFFER BANNER -->
          <tr>
            <td style="padding: 15px 30px;">
              <div style="background: linear-gradient(135deg, #2D050D 0%, #5E0F20 100%); border-radius: 10px; padding: 18px 20px; text-align: center; color: #FFFFFF; border: 1px solid #D4AF37;">
                <span style="display: block; font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 2.5px; color: #ECC85B; text-transform: uppercase;">BOUTIQUE COURTESY</span>
                <span style="display: block; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #FFF9D6; margin: 4px 0;">PROMO CODE: ROKEA20</span>
                <span style="display: block; font-size: 12px; color: #E8D0B5;">Apply code ROKEA20 at checkout to enjoy a 20% courtesy reduction on your order.</span>
              </div>
            </td>
          </tr>

          <!-- PRIMARY CALL TO ACTION -->
          <tr>
            <td style="padding: 20px 30px 35px 30px; text-align: center;">
              <a href="${siteUrl}/collections" style="display: inline-block; background: linear-gradient(135deg, #ECC85B 0%, #D4AF37 50%, #8A6510 100%); color: #160407; font-family: 'Poppins', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 15px 38px; border-radius: 30px; box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);">
                Review Your Bag &rarr;
              </a>
              <p style="margin: 18px 0 0 0; font-size: 12px; color: #8A7B70;">
                Need styling advice or blouse measurement support?
                <br />
                <a href="https://wa.me/917010394051?text=Hi%20ROKEA%20by%20RK%2C%20I%20need%20help%20with%20my%20order." style="color: #25D366; text-decoration: none; font-weight: 600;">
                  WhatsApp us directly at +91 70103 94051
                </a>
              </p>
            </td>
          </tr>

          <!-- FOOTER WITH VERIFIED BOUTIQUE BADGE -->
          <tr>
            <td style="background: #140306; padding: 26px 30px; text-align: center; color: #A89585; font-size: 11px; line-height: 1.7; border-top: 1px solid rgba(212, 175, 55, 0.25);">
              <img
                src="https://static.wixstatic.com/media/9881b8_16e714ef67304ad7812d38944b0b0b16~mv2.png/v1/crop/x_0,y_92,w_5000,h_1065/fill/w_200,h_43,al_c,q_90/ROKEA%20horizontal%20logo%20(1).png"
                alt="ROKEA by RK"
                width="130"
                height="28"
                style="display: block; margin: 0 auto 10px auto; opacity: 0.85;"
              />
              <p style="margin: 0 0 6px 0; color: #ECC85B; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;">
                ROKEA by RK Luxury Boutique
              </p>
              <p style="margin: 0 0 6px 0; color: #C5B5A7;">
                Opp. to New Bus Stand, Near Sundaram Theater, Aranthangi - 614616
              </p>
              <p style="margin: 0 0 10px 0;">
                Official Email: <a href="mailto:rokeabyrk@gmail.com" style="color: #ECC85B; text-decoration: none; font-weight: 600;">rokeabyrk@gmail.com</a> | Concierge: +91 70103 94051
              </p>
              <p style="margin: 0; font-size: 10px; color: #7D6B5F;">
                Verified Official Communication from ROKEA by RK. Handcrafted with love.
              </p>
              <p style="margin: 10px 0 0 0; font-size: 10px; color: #8A7B70;">
                You received this communication because you saved items in your shopping bag at rokeabyrk.com.
                <br />
                To stop receiving bag reminders, <a href="mailto:rokeabyrk@gmail.com?subject=Unsubscribe" style="color: #ECC85B; text-decoration: underline;">click here to unsubscribe</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Record abandoned cart/wishlist to Firestore and trigger reminder email
 */
export async function processCartAbandonment({ user, cart = [], wishlist = [], triggerSource = 'idle', force = false }) {
  if (!user || !user.email) return { success: false, reason: 'No user email' };
  if ((!cart || cart.length === 0) && (!wishlist || wishlist.length === 0)) {
    return { success: false, reason: 'Cart and wishlist are empty' };
  }

  const userEmail = (user.email || '').trim().toLowerCase();
  const userName = user.name || userEmail.split('@')[0] || 'Customer';
  const userId = user.uid || 'guest';
  const now = new Date();

  // 1. Throttling check:
  // If force is true (e.g. manual test or resend), skip throttle completely!
  // For automatic idle triggers, throttle by 5 minutes so users aren't locked out during testing
  const throttleKey = `saforio_last_reminder_${userEmail}`;
  if (!force) {
    try {
      const lastSentTime = localStorage.getItem(throttleKey);
      if (lastSentTime) {
        const elapsedMinutes = (now.getTime() - new Date(lastSentTime).getTime()) / (1000 * 60);
        if (elapsedMinutes < REMINDER_THROTTLE_MINUTES) {
          console.log(`[Reminder Service] Throttled. Last reminder sent ${elapsedMinutes.toFixed(1)} minutes ago.`);
          return { success: false, reason: `Throttled (recently sent ${elapsedMinutes.toFixed(0)}m ago)` };
        }
      }
    } catch (e) {}
  }

  const cleanDocId = userEmail.replace(/[^a-zA-Z0-9_-]/g, '_');

  const cartItemsClean = (cart || []).map(i => ({
    id: i.id || '',
    name: i.name || 'Handcrafted Luxury Piece',
    price: parseInt(i.price || 0, 10),
    quantity: parseInt(i.quantity || 1, 10),
    image: i.image || i.img || '',
    category: i.category || ''
  }));

  const cartTotal = cartItemsClean.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalCartQty = cartItemsClean.reduce((sum, item) => sum + item.quantity, 0);

  const emailHtml = buildReminderEmailHtml({ user, cart: cartItemsClean, wishlist });

  const subject = cartItemsClean.length > 0
    ? `ROKEA by RK - Saved Items in Your Shopping Bag`
    : `ROKEA by RK - Saved Designs in Your Wishlist`;

  const reminderDoc = {
    id: cleanDocId,
    userId,
    userEmail,
    userName,
    userPhone: user.phone || '',
    cartCount: totalCartQty,
    cartTotal,
    cartItems: cartItemsClean,
    wishlistCount: (wishlist || []).length,
    wishlistItems: (wishlist || []).map(i => ({ id: i.id || '', name: i.name || '', price: parseInt(i.price || 0, 10), image: i.image || i.img || '' })),
    status: 'sent',
    triggerSource,
    timestamp: now.toISOString(),
    formattedDate: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  };

  // 2. Dispatch real email to customer inbox and store admin directly from rokeabyrk@gmail.com
  let emailDispatchResult = { success: false };
  try {
    emailDispatchResult = await sendRealEmail({
      userEmail,
      userName,
      subject,
      cart: cartItemsClean,
      wishlist,
      cartTotal,
      emailHtml
    });
  } catch (err) {
    console.warn("[Reminder Service] Real email dispatch warning:", err);
  }

  // 3. Save in Firestore "abandoned_reminders" collection for Boutique Admin monitoring
  // UPSERT by cleanDocId (userEmail) so EACH customer has ONLY 1 LATEST record in Firestore!
  if (db) {
    try {
      await db.collection("abandoned_reminders").doc(cleanDocId).set(reminderDoc, { merge: true });
      console.log(`[Reminder Service] Abandonment upserted in Firestore for ${userEmail}`);
    } catch (err) {
      console.warn("[Reminder Service] Firestore log error:", err);
    }

    // 4. Also queue in Firestore "mail" collection (Firebase Trigger Email extension if present)
    try {
      await db.collection("mail").add({
        to: [userEmail],
        from: 'ROKEA by RK <rokeabyrk@gmail.com>',
        replyTo: 'rokeabyrk@gmail.com',
        message: {
          subject,
          html: emailHtml
        },
        timestamp: now.toISOString()
      });
      console.log(`[Reminder Service] Email queued in Firestore mail collection for ${userEmail}`);
    } catch (mailErr) {
      console.warn("[Reminder Service] mail collection notice:", mailErr);
    }
  }

  // 5. Save to local storage for user session tracking (Deduplicated by email)
  try {
    localStorage.setItem(throttleKey, now.toISOString());
    const localHistory = JSON.parse(localStorage.getItem('saforio_abandoned_history') || '[]');
    const filteredHistory = localHistory.filter(h => (h.userEmail || h.email || '').toLowerCase() !== userEmail);
    filteredHistory.unshift(reminderDoc);
    localStorage.setItem('saforio_abandoned_history', JSON.stringify(filteredHistory.slice(0, 30)));
  } catch (e) {}

  // 6. Notify any open admin panel to update live
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('saforio:abandoned_updated', {
        detail: { reminderDoc }
      }));
    } catch (e) {}
  }

  return {
    success: true,
    email: userEmail,
    subject,
    dispatched: emailDispatchResult.success
  };
}

/**
 * Permanently remove abandoned cart/wishlist record from Firestore and localStorage
 * when customer completes an order OR empties their cart/wishlist.
 */
export async function removeAbandonedCartRecord(userEmail) {
  if (!userEmail) return { success: false, reason: 'No email provided' };
  const cleanMail = userEmail.trim().toLowerCase();
  const cleanDocId = cleanMail.replace(/[^a-zA-Z0-9_-]/g, '_');

  console.log(`[Reminder Service] 🗑️ Removing abandoned record for ${cleanMail}...`);

  // 1. Delete from Firestore "abandoned_reminders"
  if (db) {
    try {
      await db.collection("abandoned_reminders").doc(cleanDocId).delete().catch(() => {});

      // Query any older documents with matching userEmail
      const snap = await db.collection("abandoned_reminders").where("userEmail", "==", cleanMail).get().catch(() => null);
      if (snap && !snap.empty) {
        const batch = db.batch();
        snap.forEach(d => batch.delete(d.ref));
        await batch.commit().catch(() => {});
      }
      console.log(`[Reminder Service] Firestore record(s) deleted for ${cleanMail}`);
    } catch (err) {
      console.warn("[Reminder Service] Firestore deletion notice:", err);
    }
  }

  // 2. Remove from localStorage
  try {
    const local = JSON.parse(localStorage.getItem('saforio_abandoned_history') || '[]');
    const updated = local.filter(r => (r.userEmail || r.email || '').trim().toLowerCase() !== cleanMail);
    localStorage.setItem('saforio_abandoned_history', JSON.stringify(updated));
    localStorage.removeItem(`saforio_last_reminder_${cleanMail}`);
  } catch (e) {}

  // 3. Dispatch window event so open Admin panel removes this customer in real time
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('saforio:abandoned_removed', {
        detail: { email: cleanMail, docId: cleanDocId }
      }));
    } catch (e) {}
  }

  return { success: true, email: cleanMail };
}

/**
 * Synchronize the current cart/wishlist state to Firestore and localStorage
 * without sending an email (e.g. when an item is removed from cart/wishlist).
 * If both cart and wishlist become empty, automatically calls removeAbandonedCartRecord.
 */
export async function updateAbandonedCartRecord({ user, cart = [], wishlist = [] }) {
  if (!user || !user.email) return { success: false, reason: 'No user email' };
  const userEmail = (user.email || '').trim().toLowerCase();
  if (!userEmail) return { success: false, reason: 'Invalid email' };

  const hasCart = Array.isArray(cart) && cart.length > 0;
  const hasWishlist = Array.isArray(wishlist) && wishlist.length > 0;

  // If both cart and wishlist are completely empty, purge the abandoned record!
  if (!hasCart && !hasWishlist) {
    return await removeAbandonedCartRecord(userEmail);
  }

  const cleanDocId = userEmail.replace(/[^a-zA-Z0-9_-]/g, '_');
  const userName = user.name || userEmail.split('@')[0] || 'Customer';
  const userId = user.uid || 'guest';
  const now = new Date();

  const cartItemsClean = (cart || []).map(i => ({
    id: i.id || '',
    name: i.name || 'Handcrafted Luxury Piece',
    price: parseInt(i.price || 0, 10),
    quantity: parseInt(i.quantity || 1, 10),
    image: i.image || i.img || '',
    category: i.category || ''
  }));

  const cartTotal = cartItemsClean.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalCartQty = cartItemsClean.reduce((sum, item) => sum + item.quantity, 0);

  const updatedDoc = {
    id: cleanDocId,
    userId,
    userEmail,
    userName,
    userPhone: user.phone || '',
    cartCount: totalCartQty,
    cartTotal,
    cartItems: cartItemsClean,
    wishlistCount: (wishlist || []).length,
    wishlistItems: (wishlist || []).map(i => ({ id: i.id || '', name: i.name || '', price: parseInt(i.price || 0, 10), image: i.image || i.img || '' })),
    status: 'updated',
    triggerSource: 'item_updated',
    timestamp: now.toISOString(),
    formattedDate: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  };

  if (db) {
    try {
      await db.collection("abandoned_reminders").doc(cleanDocId).set(updatedDoc, { merge: true });
      console.log(`[Reminder Service] Abandoned record updated in Firestore for ${userEmail}`);
    } catch (err) {
      console.warn("[Reminder Service] Firestore update notice:", err);
    }
  }

  try {
    const localHistory = JSON.parse(localStorage.getItem('saforio_abandoned_history') || '[]');
    const filteredHistory = localHistory.filter(h => (h.userEmail || h.email || '').toLowerCase() !== userEmail);
    filteredHistory.unshift(updatedDoc);
    localStorage.setItem('saforio_abandoned_history', JSON.stringify(filteredHistory.slice(0, 30)));
  } catch (e) {}

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('saforio:abandoned_updated', {
        detail: { reminderDoc: updatedDoc }
      }));
    } catch (e) {}
  }

  return { success: true, email: userEmail, updatedDoc };
}

/**
 * Generate quick WhatsApp recovery link for admin to click and chat with customer
 */
export function generateWhatsAppReminderLink(reminder) {
  const phone = (reminder.userPhone || '').replace(/[^0-9]/g, '');
  const name = reminder.userName || 'there';
  const cartCount = reminder.cartCount || (reminder.cartItems ? reminder.cartItems.length : 0);

  const text = `Hi ${name}, this is ROKEA by RK Boutique! ✨ We noticed you saved ${cartCount} exclusive handcrafted item(s) in your bag. Each piece is unique and in high demand. Would you like assistance with blouse tailoring, customization, or completing your order? Reply here anytime!`;

  if (phone && phone.length >= 10) {
    const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  }
  return `https://wa.me/917010394051?text=${encodeURIComponent(`Follow-up with customer ${reminder.userEmail}: ` + text)}`;
}
