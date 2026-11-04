import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db, auth, googleProvider, firebase } from '../services/firebase';
import { FALLBACK_PRODUCTS, generateSlug } from '../utils/helpers';
import ALL_PRODUCTS_DATA from '../data/all_products.json';
import { processCartAbandonment, removeAbandonedCartRecord, updateAbandonedCartRecord } from '../services/reminderService';

const StoreContext = createContext();

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

export const StoreProvider = ({ children }) => {
  // Products State - Initialized with all 113 products from Firebase
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('saforio_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 50) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load products from storage:", e);
    }
    // Return all 113 bundled products from Firestore
    if (Array.isArray(ALL_PRODUCTS_DATA) && ALL_PRODUCTS_DATA.length > 0) {
      try {
        localStorage.setItem('saforio_products', JSON.stringify(ALL_PRODUCTS_DATA));
      } catch (e) {}
      return ALL_PRODUCTS_DATA;
    }
    return FALLBACK_PRODUCTS;
  });

  // User State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('saforio_currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Cart State - loaded only if user is authenticated
  const [cart, setCart] = useState(() => {
    try {
      const userSaved = localStorage.getItem('saforio_currentUser');
      if (!userSaved) return [];
      const saved = localStorage.getItem('saforio_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Wishlist State - loaded only if user is authenticated
  const [wishlist, setWishlist] = useState(() => {
    try {
      const userSaved = localStorage.getItem('saforio_currentUser');
      if (!userSaved) return [];
      const saved = localStorage.getItem('saforio_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Pending action if user attempted to add to cart/wishlist before signing in
  const pendingAuthActionRef = useRef(null);

  // Helper: check if a user is currently signed in
  const isUserLoggedIn = () => {
    return Boolean(currentUser && (currentUser.uid || currentUser.isAdmin));
  };

  // Toasts State
  const [toasts, setToasts] = useState([]);

  // Toast Helper - 1 Second duration as requested
  const showToast = (message, type = 'success', subText = '', duration = 1000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, subText, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Sync products with Firestore
  useEffect(() => {
    let isMounted = true;

    const applyProducts = (list) => {
      if (!isMounted || !Array.isArray(list) || list.length === 0) return;
      const sorted = [...list].sort((a, b) => (a.position || 0) - (b.position || 0));
      setProducts(sorted);
      try {
        localStorage.setItem('saforio_products', JSON.stringify(sorted));
      } catch (e) {}
    };

    // 1. Immediate Firestore get() query
    if (db) {
      db.collection("products").get().then((snapshot) => {
        if (!snapshot.empty) {
          const fsProducts = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            fsProducts.push({
              ...data,
              id: data.id || doc.id,
              position: data.position ?? 999
            });
          });
          applyProducts(fsProducts);
        }
      }).catch(err => {
        console.warn("Firestore get() notice:", err);
      });

      // 2. Realtime listener
      const unsubscribe = db.collection("products").onSnapshot(
        (snapshot) => {
          if (!snapshot.empty) {
            const fsProducts = [];
            snapshot.forEach(doc => {
              const data = doc.data();
              fsProducts.push({
                ...data,
                id: data.id || doc.id,
                position: data.position ?? 999
              });
            });
            applyProducts(fsProducts);
          }
        },
        (error) => {
          console.warn("Firestore product listener notice:", error);
        }
      );

      // 3. Fallback: Fetch directly from Firestore REST endpoint to guarantee 100% data delivery
      if (typeof fetch !== 'undefined') {
        fetch("https://firestore.googleapis.com/v1/projects/rokeya-3ccaa/databases/(default)/documents/products?pageSize=300")
          .then(res => res.json())
          .then(json => {
            if (json && json.documents && json.documents.length > 0) {
              const parseField = (val) => {
                if (!val) return null;
                if (val.stringValue !== undefined) return val.stringValue;
                if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
                if (val.doubleValue !== undefined) return parseFloat(val.doubleValue);
                if (val.booleanValue !== undefined) return val.booleanValue;
                if (val.arrayValue !== undefined) return (val.arrayValue.values || []).map(parseField);
                if (val.mapValue !== undefined) {
                  const obj = {};
                  for (const k in (val.mapValue.fields || {})) {
                    obj[k] = parseField(val.mapValue.fields[k]);
                  }
                  return obj;
                }
                return null;
              };
              const restProducts = json.documents.map(doc => {
                const p = {};
                for (const k in doc.fields) {
                  p[k] = parseField(doc.fields[k]);
                }
                p.id = p.id || doc.name.split('/').pop();
                p.position = p.position ?? 999;
                return p;
              });
              if (restProducts.length > 0) {
                applyProducts(restProducts);
              }
            }
          })
          .catch(err => console.warn("Firestore REST fallback notice:", err));
      }

      return () => {
        isMounted = false;
        unsubscribe();
      };
    }
  }, []);

  // Helpers to persist user cart & wishlist to Firestore and localStorage
  const syncUserCartAndWishlist = (uid, currentCart, currentWishlist) => {
    if (!uid) return;
    try {
      if (currentCart !== undefined) {
        localStorage.setItem(`saforio_cart_${uid}`, JSON.stringify(currentCart));
      }
      if (currentWishlist !== undefined) {
        localStorage.setItem(`saforio_wishlist_${uid}`, JSON.stringify(currentWishlist));
      }
    } catch (e) {}

    if (db) {
      const payload = {};
      if (currentCart !== undefined) payload.cart = currentCart;
      if (currentWishlist !== undefined) payload.wishlist = currentWishlist;
      db.collection("users").doc(uid).set(payload, { merge: true })
        .catch(err => console.warn("Firestore cart sync notice:", err));
    }
  };

  const restoreUserCartAndWishlist = (uid, firestoreData) => {
    if (!uid) return;
    let savedCart = [];
    let savedWishlist = [];

    // 1. Check Firestore data
    if (firestoreData && Array.isArray(firestoreData.cart)) {
      savedCart = firestoreData.cart;
    } else {
      try {
        const local = localStorage.getItem(`saforio_cart_${uid}`);
        if (local) savedCart = JSON.parse(local);
      } catch (e) {}
    }

    if (firestoreData && Array.isArray(firestoreData.wishlist)) {
      savedWishlist = firestoreData.wishlist;
    } else {
      try {
        const localW = localStorage.getItem(`saforio_wishlist_${uid}`);
        if (localW) savedWishlist = JSON.parse(localW);
      } catch (e) {}
    }

    // Merge active screen cart items so items added right before login are never lost
    if (Array.isArray(cart) && cart.length > 0) {
      cart.forEach(curItem => {
        const cId = curItem.id || curItem.slug || curItem.name;
        const exists = savedCart.some(s => (s.id || s.slug || s.name) === cId);
        if (!exists) {
          savedCart.push(curItem);
        }
      });
    }

    // Process pending action if user attempted to add before login
    const pending = pendingAuthActionRef.current;
    if (pending && pending.product) {
      pendingAuthActionRef.current = null;
      if (pending.type === 'cart') {
        const prodId = pending.product.id || pending.product.slug || pending.product.name;
        const exists = savedCart.some(item =>
          String(item.id || '').trim().toLowerCase() === String(prodId).trim().toLowerCase() ||
          String(item.slug || '').trim().toLowerCase() === String(prodId).trim().toLowerCase() ||
          String(item.name || '').trim().toLowerCase() === String(prodId).trim().toLowerCase()
        );
        if (!exists) {
          savedCart = [...savedCart, { ...pending.product, quantity: pending.product.quantity || 1 }];
          showToast(`Added to Bag: ${pending.product.name}`, 'success', 'Item has been added to your shopping bag.');
        }
      } else if (pending.type === 'wishlist') {
        const exists = savedWishlist.some(item => item.id == pending.product.id);
        if (!exists) {
          savedWishlist = [...savedWishlist, pending.product];
          showToast('Added to Wishlist', 'success', `${pending.product.name} saved to your wishlist.`);
        }
      }
    }

    // Deduplicate savedCart by product id/name and ensure valid quantity
    const uniqueCart = [];
    const seenIds = new Set();
    savedCart.forEach(item => {
      const idKey = String(item.id || item.slug || item.name).trim().toLowerCase();
      if (!seenIds.has(idKey)) {
        seenIds.add(idKey);
        uniqueCart.push({ ...item, quantity: parseInt(item.quantity || 1, 10) });
      }
    });

    setCart(uniqueCart);
    setWishlist(savedWishlist);

    try {
      localStorage.setItem('saforio_cart', JSON.stringify(uniqueCart));
      localStorage.setItem('saforio_wishlist', JSON.stringify(savedWishlist));
      localStorage.setItem(`saforio_cart_${uid}`, JSON.stringify(uniqueCart));
      localStorage.setItem(`saforio_wishlist_${uid}`, JSON.stringify(savedWishlist));
    } catch (e) {}

    // Ensure Firestore reflects the latest merged state
    syncUserCartAndWishlist(uid, uniqueCart, savedWishlist);
  };

  // Helper to process authenticated Firebase user
  const handleAuthSuccess = async (user) => {
    if (!user) return { success: false };

    let uData = {
      name: user.displayName || (user.email ? user.email.split('@')[0] : 'Customer'),
      email: user.email || '',
      phone: user.phoneNumber || '',
      photoURL: user.photoURL || '',
      uid: user.uid,
      role: 'customer'
    };

    if (db) {
      try {
        const userDocRef = db.collection("users").doc(user.uid);
        const doc = await userDocRef.get();
        if (doc.exists) {
          const existing = doc.data() || {};
          uData = { ...existing, ...uData };
          await userDocRef.update({
            lastLogin: new Date().toISOString(),
            photoURL: user.photoURL || existing.photoURL || ''
          });
          restoreUserCartAndWishlist(user.uid, existing);
        } else {
          await userDocRef.set({
            ...uData,
            role: 'customer',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          });
          restoreUserCartAndWishlist(user.uid, null);
        }
      } catch (dbErr) {
        console.warn("Could not sync user to Firestore:", dbErr);
        restoreUserCartAndWishlist(user.uid, null);
      }
    } else {
      restoreUserCartAndWishlist(user.uid, null);
    }

    setCurrentUser(uData);
    try {
      localStorage.setItem('saforio_currentUser', JSON.stringify(uData));
    } catch (e) {}

    return { success: true, user: uData };
  };

  // Check redirect result on startup (if signInWithRedirect fallback occurred)
  useEffect(() => {
    if (!auth) return;
    auth.getRedirectResult().then(async (result) => {
      if (result && result.user) {
        console.log("[StoreContext] Google redirect sign-in completed:", result.user.email);
        await handleAuthSuccess(result.user);
      }
    }).catch((err) => {
      console.warn("[StoreContext] Redirect result check notice:", err);
    });
  }, []);

  // Listen to Auth State
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        if (db) {
          db.collection("users").doc(user.uid).get().then(doc => {
            const data = doc.exists ? doc.data() : {};
            const uData = {
              ...data,
              email: user.email || data.email || '',
              name: user.displayName || data.name || (user.email ? user.email.split('@')[0] : 'Customer'),
              uid: user.uid,
              photoURL: user.photoURL || data.photoURL || null
            };
            setCurrentUser(uData);
            try {
              localStorage.setItem('saforio_currentUser', JSON.stringify(uData));
            } catch (e) {}

            // Restore user's personal cart & wishlist
            restoreUserCartAndWishlist(user.uid, data);
          }).catch((err) => {
            console.warn("Could not fetch user document:", err);
            const uData = {
              email: user.email || '',
              name: user.displayName || (user.email ? user.email.split('@')[0] : 'Customer'),
              uid: user.uid,
              photoURL: user.photoURL || null
            };
            setCurrentUser(uData);
            try {
              localStorage.setItem('saforio_currentUser', JSON.stringify(uData));
            } catch (e) {}
            restoreUserCartAndWishlist(user.uid, null);
          });
        }
      } else {
        // User logged out: clear active screen cart, wishlist, and session
        setCurrentUser(prev => {
          if (!prev || (!prev.isAdmin && prev.loginType !== 'quick')) {
            try {
              localStorage.removeItem('saforio_currentUser');
              localStorage.removeItem('saforio_cart');
              localStorage.removeItem('saforio_wishlist');
            } catch (e) {}
            setCart([]);
            setWishlist([]);
            return null;
          }
          return prev;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Save Cart & Wishlist to localStorage only when user is logged in
  useEffect(() => {
    if (currentUser && (currentUser.uid || currentUser.isAdmin)) {
      localStorage.setItem('saforio_cart', JSON.stringify(cart));
    }
  }, [cart, currentUser]);

  useEffect(() => {
    if (currentUser && (currentUser.uid || currentUser.isAdmin)) {
      localStorage.setItem('saforio_wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, currentUser]);

  // ── ABANDONED CART & WISHLIST EMAIL REMINDER ENGINE ──
  useEffect(() => {
    // Determine target recipient email:
    // 1. currentUser.email (logged in via Google, Quick Access, or Admin)
    // 2. saforio_customer_email (entered during checkout or newsletter)
    // 3. saforio_currentUser in localStorage
    let targetUser = currentUser;
    let targetEmail = (currentUser?.email || '').trim().toLowerCase();

    if (!targetEmail) {
      try {
        const savedCustEmail = localStorage.getItem('saforio_customer_email') || '';
        if (savedCustEmail && savedCustEmail.includes('@')) {
          targetEmail = savedCustEmail.trim().toLowerCase();
          targetUser = { email: targetEmail, name: targetEmail.split('@')[0], uid: 'guest_' + Date.now() };
        }
      } catch (e) {}
    }

    if (!targetEmail) {
      try {
        const savedUser = JSON.parse(localStorage.getItem('saforio_currentUser') || 'null');
        if (savedUser && savedUser.email && savedUser.email.includes('@')) {
          targetEmail = savedUser.email.trim().toLowerCase();
          targetUser = savedUser;
        }
      } catch (e) {}
    }

    // Must have a valid target recipient email and at least 1 item in bag or wishlist
    if (!targetEmail || !targetEmail.includes('@')) {
      console.log('[Reminder Engine] No recipient email identified yet. Sign in or enter email at checkout to activate recovery.');
      return;
    }

    if (cart.length === 0 && wishlist.length === 0) return;

    let reminderTimer = null;
    let isDispatchedInThisSession = false;

    const triggerReminder = (source, force = true) => {
      if (isDispatchedInThisSession && !force) return;
      isDispatchedInThisSession = true;

      console.log(`[Reminder Engine] ⚡ Triggering automated recovery: ${source} for ${targetEmail}`);
      processCartAbandonment({
        user: targetUser || { email: targetEmail, name: targetEmail.split('@')[0] },
        cart,
        wishlist,
        triggerSource: source,
        force: true // Always force delivery during test & actual cart trigger
      }).then(res => {
        if (res && res.success) {
          console.log(`[Abandoned Reminder Engine] ✓ Dispatched to ${res.email}`);
          showToast('📧 Cart Recovery Sent', 'success', `Reminder email sent to ${res.email}`, 3500);
        } else {
          console.warn(`[Abandoned Reminder Engine Notice]`, res?.reason);
        }
      }).catch(err => {
        console.error(`[Abandoned Reminder Engine Error]`, err);
      });
    };

    // 1. Automatic 15-second timer after items are in the shopping bag
    reminderTimer = setTimeout(() => {
      console.log('[Reminder Engine] 15s automatic timer elapsed. Sending recovery email now...');
      triggerReminder('auto_15s_timer', true);
    }, 15 * 1000);

    // 2. Tab switch or window minimized (triggers immediately!)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('[Reminder Engine] Tab switched / hidden. Transmitting recovery email immediately!');
        triggerReminder('tab_hidden_leave', true);
      }
    };

    // 3. Page unload / leave (triggers immediately!)
    const handleBeforeUnload = () => {
      triggerReminder('page_unload_leave', true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (reminderTimer) clearTimeout(reminderTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser, cart, wishlist]);

  // Cart operations
  const isInCart = (productId) => {
    if (!productId) return false;
    const strId = String(productId).trim().toLowerCase();
    return cart.some(item =>
      String(item.id || '').trim().toLowerCase() === strId ||
      String(item.slug || '').trim().toLowerCase() === strId ||
      String(item.name || '').trim().toLowerCase() === strId
    );
  };

  const addToCart = (product) => {
    if (!product) return false;

    // Guest protection: user must be signed in to add products to bag
    if (!isUserLoggedIn()) {
      pendingAuthActionRef.current = { type: 'cart', product };
      showToast('Sign In Required', 'warning', 'Please sign in to add items to your shopping bag.', 1500);
      try {
        window.dispatchEvent(new CustomEvent('saforio:open-auth', { detail: { mode: 'login' } }));
      } catch (e) {}
      return false;
    }

    const prodId = product.id || product.slug || product.name;
    if (isInCart(prodId)) {
      showToast('Already in Bag', 'info', `${product.name} is a single exclusive piece and is already in your bag.`);
      return false;
    }
    const cleanProduct = { ...product, quantity: 1 };
    const nextCart = [...cart, cleanProduct];
    setCart(nextCart);
    try {
      localStorage.setItem('saforio_cart', JSON.stringify(nextCart));
    } catch (e) {}

    // Save to user account if logged in
    if (currentUser && currentUser.uid && !currentUser.isAdmin) {
      syncUserCartAndWishlist(currentUser.uid, nextCart, undefined);
    }

    showToast(`Added to Bag: ${product.name}`, 'success', 'Item has been added to your shopping bag.');
    return true;
  };

  // Helper: Retrieve active customer's email for recovery sync
  const getTargetCustomerEmail = () => {
    let target = (currentUser?.email || '').trim().toLowerCase();
    if (!target) {
      try {
        const saved = localStorage.getItem('saforio_customer_email');
        if (saved && saved.includes('@')) target = saved.trim().toLowerCase();
      } catch (e) {}
    }
    if (!target) {
      try {
        const savedUser = JSON.parse(localStorage.getItem('saforio_currentUser') || 'null');
        if (savedUser && savedUser.email && savedUser.email.includes('@')) {
          target = savedUser.email.trim().toLowerCase();
        }
      } catch (e) {}
    }
    return target;
  };

  const getTargetCustomerUser = (targetEmail) => {
    if (currentUser && currentUser.email) return currentUser;
    if (targetEmail) {
      return {
        email: targetEmail,
        name: targetEmail.split('@')[0],
        uid: 'guest_' + targetEmail.replace(/[^a-zA-Z0-9]/g, '')
      };
    }
    return null;
  };

  const removeFromCart = (index) => {
    const nextCart = cart.filter((_, i) => i !== index);
    setCart(nextCart);
    try {
      localStorage.setItem('saforio_cart', JSON.stringify(nextCart));
    } catch (e) {}

    if (currentUser && currentUser.uid && !currentUser.isAdmin) {
      syncUserCartAndWishlist(currentUser.uid, nextCart, undefined);
    }

    // Real-time synchronization with Abandoned Reminders Hub
    const targetEmail = getTargetCustomerEmail();
    if (targetEmail) {
      if (nextCart.length === 0 && wishlist.length === 0) {
        // Bag & wishlist are completely empty -> Purge from Admin Panel
        removeAbandonedCartRecord(targetEmail);
      } else {
        // Cart updated with remaining items -> Update Admin Panel in real time
        updateAbandonedCartRecord({
          user: getTargetCustomerUser(targetEmail),
          cart: nextCart,
          wishlist
        });
      }
    }

    showToast('Removed from Bag', 'info', 'Item has been removed from your shopping bag.');
  };

  const clearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem('saforio_cart');
    } catch (e) {}

    if (currentUser && currentUser.uid && !currentUser.isAdmin) {
      syncUserCartAndWishlist(currentUser.uid, [], undefined);
    }

    const targetEmail = getTargetCustomerEmail();
    if (targetEmail) {
      if (wishlist.length === 0) {
        // Completely empty -> Purge from Admin Panel
        removeAbandonedCartRecord(targetEmail);
      } else {
        updateAbandonedCartRecord({
          user: getTargetCustomerUser(targetEmail),
          cart: [],
          wishlist
        });
      }
    }
  };

  // Wishlist operations
  const addToWishlist = (product) => {
    if (!product) return false;

    // Guest protection: user must be signed in to save products to wishlist
    if (!isUserLoggedIn()) {
      pendingAuthActionRef.current = { type: 'wishlist', product };
      showToast('Sign In Required', 'warning', 'Please sign in to save items to your wishlist.', 1500);
      try {
        window.dispatchEvent(new CustomEvent('saforio:open-auth', { detail: { mode: 'login' } }));
      } catch (e) {}
      return false;
    }

    const exists = wishlist.some(item => item.id == product.id);
    let nextWishlist;
    if (exists) {
      nextWishlist = wishlist.filter(item => item.id != product.id);
      setWishlist(nextWishlist);
      try {
        localStorage.setItem('saforio_wishlist', JSON.stringify(nextWishlist));
      } catch (e) {}

      if (currentUser && currentUser.uid && !currentUser.isAdmin) {
        syncUserCartAndWishlist(currentUser.uid, undefined, nextWishlist);
      }

      // Real-time synchronization with Abandoned Reminders Hub
      const targetEmail = getTargetCustomerEmail();
      if (targetEmail) {
        if (cart.length === 0 && nextWishlist.length === 0) {
          removeAbandonedCartRecord(targetEmail);
        } else {
          updateAbandonedCartRecord({
            user: getTargetCustomerUser(targetEmail),
            cart,
            wishlist: nextWishlist
          });
        }
      }

      showToast('Removed from Wishlist', 'info', `${product.name} removed from your wishlist.`);
      return false;
    } else {
      nextWishlist = [...wishlist, product];
      setWishlist(nextWishlist);
      try {
        localStorage.setItem('saforio_wishlist', JSON.stringify(nextWishlist));
      } catch (e) {}

      if (currentUser && currentUser.uid && !currentUser.isAdmin) {
        syncUserCartAndWishlist(currentUser.uid, undefined, nextWishlist);
      }

      showToast('Added to Wishlist', 'success', `${product.name} saved to your wishlist.`);
      return true;
    }
  };

  const removeFromWishlist = (index) => {
    const nextWishlist = wishlist.filter((_, i) => i !== index);
    setWishlist(nextWishlist);
    try {
      localStorage.setItem('saforio_wishlist', JSON.stringify(nextWishlist));
    } catch (e) {}

    if (currentUser && currentUser.uid && !currentUser.isAdmin) {
      syncUserCartAndWishlist(currentUser.uid, undefined, nextWishlist);
    }

    // Real-time synchronization with Abandoned Reminders Hub
    const targetEmail = getTargetCustomerEmail();
    if (targetEmail) {
      if (cart.length === 0 && nextWishlist.length === 0) {
        removeAbandonedCartRecord(targetEmail);
      } else {
        updateAbandonedCartRecord({
          user: getTargetCustomerUser(targetEmail),
          cart,
          wishlist: nextWishlist
        });
      }
    }
  };

  const wishToCart = (index) => {
    if (!isUserLoggedIn()) {
      showToast('Sign In Required', 'warning', 'Please sign in to manage your bag.', 1500);
      try {
        window.dispatchEvent(new CustomEvent('saforio:open-auth', { detail: { mode: 'login' } }));
      } catch (e) {}
      return;
    }
    const item = wishlist[index];
    if (item) {
      const added = addToCart(item);
      if (added) {
        removeFromWishlist(index);
      }
    }
  };

  const moveAllToCart = () => {
    if (!isUserLoggedIn()) {
      showToast('Sign In Required', 'warning', 'Please sign in to manage your bag.', 1500);
      try {
        window.dispatchEvent(new CustomEvent('saforio:open-auth', { detail: { mode: 'login' } }));
      } catch (e) {}
      return;
    }
    if (wishlist.length === 0) return;
    const existingKeys = new Set(cart.map(i => String(i.id || i.slug || i.name).trim().toLowerCase()));
    const newItems = wishlist
      .filter(w => !existingKeys.has(String(w.id || w.slug || w.name).trim().toLowerCase()))
      .map(w => ({ ...w, quantity: 1 }));
    const nextCart = [...cart, ...newItems];
    setCart(nextCart);
    setWishlist([]);
    try {
      localStorage.setItem('saforio_cart', JSON.stringify(nextCart));
      localStorage.removeItem('saforio_wishlist');
    } catch (e) {}

    if (currentUser && currentUser.uid && !currentUser.isAdmin) {
      syncUserCartAndWishlist(currentUser.uid, nextCart, []);
    }

    showToast('Items Moved to Bag', 'success');
  };

  // User Auth Actions
  const login = async (email, password) => {
    const adminEmail = 'admin';
    const adminPassword = 'rokea@2025';

    if (email === adminEmail && password === adminPassword) {
      const adminUser = {
        name: 'Boutique Admin',
        email: adminEmail,
        isAdmin: true,
        uid: 'admin-super'
      };
      setCurrentUser(adminUser);
      localStorage.setItem('saforio_currentUser', JSON.stringify(adminUser));
      return { success: true, isAdmin: true };
    }

    if (!auth) throw new Error("Firebase Auth is not initialized.");
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    return { success: true, user: userCredential.user };
  };

  const loginWithGoogle = async () => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    const provider = googleProvider || new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const userCredential = await auth.signInWithPopup(provider);
      const user = userCredential.user;
      if (user) {
        return await handleAuthSuccess(user);
      }
      return { success: false };
    } catch (popupErr) {
      console.warn("[StoreContext] Google popup sign-in error:", popupErr?.code, popupErr?.message);

      // If popup was blocked or closed due to cross-origin cookie partition:
      if (
        popupErr.code === 'auth/popup-blocked' ||
        popupErr.code === 'auth/popup-closed-by-user' ||
        popupErr.code === 'auth/cancelled-popup-request'
      ) {
        try {
          console.log("[StoreContext] Falling back to signInWithRedirect...");
          await auth.signInWithRedirect(provider);
          return { redirecting: true };
        } catch (redirErr) {
          throw redirErr;
        }
      }
      throw popupErr;
    }
  };

  // Instant Customer Sign-In (Works on any browser/device with zero OAuth blocks)
  const quickCustomerLogin = async (name, email, phone = '') => {
    if (!email) throw new Error("Please enter your email address.");
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || '').trim() || cleanEmail.split('@')[0];
    const uid = 'cust_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');

    let uData = {
      name: cleanName,
      email: cleanEmail,
      phone: (phone || '').trim(),
      uid,
      role: 'customer',
      loginType: 'quick',
      createdAt: new Date().toISOString()
    };

    if (db) {
      try {
        const userDocRef = db.collection("users").doc(uid);
        const doc = await userDocRef.get();
        if (doc.exists) {
          const existing = doc.data() || {};
          uData = { ...existing, ...uData };
          restoreUserCartAndWishlist(uid, existing);
        } else {
          await userDocRef.set(uData);
          restoreUserCartAndWishlist(uid, null);
        }
      } catch (e) {
        restoreUserCartAndWishlist(uid, null);
      }
    } else {
      restoreUserCartAndWishlist(uid, null);
    }

    setCurrentUser(uData);
    try {
      localStorage.setItem('saforio_currentUser', JSON.stringify(uData));
    } catch (e) {}

    return { success: true, user: uData };
  };

  const register = async (name, email, phone, password) => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    const userData = { name, email, phone, date: new Date().toISOString() };

    if (db) {
      await db.collection("users").doc(user.uid).set(userData);
    }
    const uData = { ...userData, uid: user.uid };
    setCurrentUser(uData);
    localStorage.setItem('saforio_currentUser', JSON.stringify(uData));
    restoreUserCartAndWishlist(user.uid, null);
    return { success: true, user };
  };

  const logout = async () => {
    // 1. If logged in, save latest cart & wishlist to Firestore before clearing
    if (currentUser && currentUser.uid && !currentUser.isAdmin) {
      syncUserCartAndWishlist(currentUser.uid, cart, wishlist);
    }

    // 2. Sign out of Firebase Auth
    if (auth) {
      try {
        await auth.signOut();
      } catch (e) {}
    }

    // 3. Clear active screen cart & wishlist immediately
    setCart([]);
    setWishlist([]);
    try {
      localStorage.removeItem('saforio_cart');
      localStorage.removeItem('saforio_wishlist');
      localStorage.removeItem('saforio_currentUser');
    } catch (e) {}

    // 4. Reset user
    setCurrentUser(null);
    showToast('Signed Out', 'info', 'Your cart & wishlist have been safely saved to your account.');
  };

  // Admin Product Actions
  const addProduct = async (productData) => {
    const newProd = {
      ...productData,
      id: Date.now().toString(),
      slug: generateSlug(productData.name),
      position: products.length + 1
    };
    if (db) {
      await db.collection("products").doc(newProd.id).set(newProd);
    }
    setProducts(prev => [newProd, ...prev]);
    showToast('Product Added', 'success');
  };

  const updateProduct = async (id, updatedFields) => {
    if (updatedFields.name) {
      updatedFields.slug = generateSlug(updatedFields.name);
    }
    if (db) {
      await db.collection("products").doc(id.toString()).update(updatedFields);
    }
    setProducts(prev => prev.map(p => (p.id == id ? { ...p, ...updatedFields } : p)));
    showToast('Product Updated', 'success');
  };

  const deleteProduct = async (id) => {
    if (db) {
      await db.collection("products").doc(id.toString()).delete();
    }
    setProducts(prev => prev.filter(p => p.id != id));
    showToast('Product Deleted', 'info');
  };

  const reorderProducts = async (newOrder) => {
    const updated = newOrder.map((p, idx) => ({ ...p, position: idx + 1 }));
    setProducts(updated);
    localStorage.setItem('saforio_products', JSON.stringify(updated));

    if (db) {
      const batch = db.batch();
      updated.forEach(p => {
        const ref = db.collection("products").doc(p.id.toString());
        batch.update(ref, { position: p.position });
      });
      await batch.commit();
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        cart,
        wishlist,
        currentUser,
        toasts,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        addToWishlist,
        removeFromWishlist,
        wishToCart,
        moveAllToCart,
        showToast,
        removeToast,
        login,
        loginWithGoogle,
        quickCustomerLogin,
        register,
        logout,
        processCartAbandonment,
        removeAbandonedCartRecord,
        updateAbandonedCartRecord,
        addProduct,
        updateProduct,
        deleteProduct,
        reorderProducts
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
