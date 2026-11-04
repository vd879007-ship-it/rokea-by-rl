import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useModal } from '../../context/ModalContext';
import { db } from '../../services/firebase';
import { optimizeImageUrl, generateSlug } from '../../utils/helpers';
import { processCartAbandonment, generateWhatsAppReminderLink, removeAbandonedCartRecord } from '../../services/reminderService';

export default function AdminModal() {
  const { adminOpen, closeAdmin } = useModal();
  const { products, addProduct, updateProduct, deleteProduct, showToast, logout } = useStore();

  const [activeTab, setActiveTab] = useState('products'); // products, customers, leads, orders
  const [productFilter, setProductFilter] = useState('all'); // all, sarees, imitation

  // Product Form State
  const [editingId, setEditingId] = useState(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('sarees');
  const [prodPrice, setProdPrice] = useState('');
  const [prodImg, setProdImg] = useState('');
  const [prodImgHover, setProdImgHover] = useState('');
  const [prodExtraImgs, setProdExtraImgs] = useState('');
  const [prodStock, setProdStock] = useState('In Stock');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCare, setProdCare] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoKeyword, setSeoKeyword] = useState('');
  const [seoDesc, setSeoDesc] = useState('');

  // Data lists
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [orders, setOrders] = useState([]);
  const [abandonedList, setAbandonedList] = useState([]);
  const [abandonedSearch, setAbandonedSearch] = useState('');
  const [abandonedFilterTab, setAbandonedFilterTab] = useState('all'); // all, bag, wishlist, high_value
  const [abandonedSort, setAbandonedSort] = useState('recent'); // recent, highest_value, most_items
  const [testReminderEmail, setTestReminderEmail] = useState('');
  const [testReminderLoading, setTestReminderLoading] = useState(false);
  const [gmailAppPass, setGmailAppPass] = useState(() => {
    try { return localStorage.getItem('saforio_gmail_app_password') || ''; } catch (e) { return ''; }
  });
  const [showPass, setShowPass] = useState(false);

  // Load records from Firestore when tab changes
  useEffect(() => {
    if (!adminOpen) return;

    if (activeTab === 'customers' && db) {
      db.collection("users").get().then(snap => {
        const uList = [];
        snap.forEach(d => uList.push({ id: d.id, ...d.data() }));
        setCustomers(uList);
      }).catch(console.error);
    } else if (activeTab === 'leads' && db) {
      db.collection("leads").get().then(snap => {
        const lList = [];
        snap.forEach(d => lList.push({ id: d.id, ...d.data() }));
        setLeads(lList);
      }).catch(console.error);
    } else if (activeTab === 'orders') {
      try {
        const localOrders = JSON.parse(localStorage.getItem('saforio_orders')) || [];
        setOrders(localOrders);
      } catch (e) {
        console.error(e);
      }
      if (db) {
        db.collection("orders").get().then(snap => {
          if (!snap.empty) {
            const oList = [];
            snap.forEach(d => oList.push({ id: d.id, ...d.data() }));
            setOrders(oList);
          }
        }).catch(console.error);
      }
    } else if (activeTab === 'abandoned') {
      try {
        const local = JSON.parse(localStorage.getItem('saforio_abandoned_history') || '[]');
        if (Array.isArray(local) && local.length > 0) {
          const uniqueLocal = new Map();
          local.forEach(item => {
            const email = (item.userEmail || item.email || '').toLowerCase().trim();
            if (email && !uniqueLocal.has(email)) {
              uniqueLocal.set(email, item);
            }
          });
          setAbandonedList(Array.from(uniqueLocal.values()));
        }
      } catch (e) {}
      if (db) {
        db.collection("abandoned_reminders").get().then(snap => {
          const rawList = [];
          snap.forEach(d => rawList.push({ id: d.id, ...d.data() }));
          rawList.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

          // Strictly deduplicate by customer email so each customer has ONLY 1 latest record
          const uniqueByEmail = new Map();
          rawList.forEach(item => {
            const email = (item.userEmail || item.email || '').toLowerCase().trim();
            if (email && !uniqueByEmail.has(email)) {
              uniqueByEmail.set(email, item);
            }
          });
          const deduplicated = Array.from(uniqueByEmail.values());
          if (deduplicated.length > 0) {
            setAbandonedList(deduplicated);
          }
        }).catch(console.error);
      }
    }
  }, [adminOpen, activeTab]);

  // Live real-time listener: customer purchased, or removed items from bag/wishlist
  useEffect(() => {
    const handleAbandonedRemoved = (e) => {
      const removedMail = (e.detail?.email || '').toLowerCase().trim();
      if (!removedMail) return;
      console.log(`[AdminModal] Live Event: Removing ${removedMail} from recovery list`);
      setAbandonedList(prev => prev.filter(r => (r.userEmail || r.email || '').toLowerCase().trim() !== removedMail));
    };

    const handleAbandonedUpdated = (e) => {
      const updatedDoc = e.detail?.reminderDoc;
      if (!updatedDoc || !updatedDoc.userEmail) return;
      const targetMail = updatedDoc.userEmail.toLowerCase().trim();
      console.log(`[AdminModal] Live Event: Updating ${targetMail} in recovery list`);
      setAbandonedList(prev => {
        const filtered = prev.filter(r => (r.userEmail || r.email || '').toLowerCase().trim() !== targetMail);
        const hasCart = Array.isArray(updatedDoc.cartItems) && updatedDoc.cartItems.length > 0;
        const hasWish = Array.isArray(updatedDoc.wishlistItems) && updatedDoc.wishlistItems.length > 0;
        if (!hasCart && !hasWish) return filtered;
        return [updatedDoc, ...filtered];
      });
    };

    window.addEventListener('saforio:abandoned_removed', handleAbandonedRemoved);
    window.addEventListener('saforio:abandoned_updated', handleAbandonedUpdated);

    return () => {
      window.removeEventListener('saforio:abandoned_removed', handleAbandonedRemoved);
      window.removeEventListener('saforio:abandoned_updated', handleAbandonedUpdated);
    };
  }, []);

  if (!adminOpen) return null;

  const handleEditProduct = (p) => {
    setEditingId(p.id);
    setProdName(p.name || '');
    setProdCategory(p.category || 'sarees');
    setProdPrice(p.price || '');
    setProdImg(p.image || p.img || '');
    setProdImgHover(p.hoverImage || p.image || '');
    setProdExtraImgs(Array.isArray(p.images) ? p.images.join(', ') : '');
    setProdStock(p.stock || 'In Stock');
    setProdDesc(p.description || '');
    setProdCare(p.care || '');
    setSeoTitle(p.seoTitle || '');
    setSeoKeyword(p.seoKeyword || '');
    setSeoDesc(p.seoDesc || '');

    const formEl = document.getElementById('productForm');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  };

  const handleResetForm = () => {
    setEditingId(null);
    setProdName('');
    setProdCategory('sarees');
    setProdPrice('');
    setProdImg('');
    setProdImgHover('');
    setProdExtraImgs('');
    setProdStock('In Stock');
    setProdDesc('');
    setProdCare('');
    setSeoTitle('');
    setSeoKeyword('');
    setSeoDesc('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const extraArray = prodExtraImgs
      ? prodExtraImgs.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const productPayload = {
      name: prodName,
      category: prodCategory,
      price: parseInt(prodPrice, 10) || 0,
      image: prodImg,
      hoverImage: prodImgHover || prodImg,
      images: extraArray.length > 0 ? [prodImg, ...extraArray] : [prodImg],
      stock: prodStock,
      description: prodDesc,
      care: prodCare,
      seoTitle,
      seoKeyword,
      seoDesc
    };

    if (editingId) {
      await updateProduct(editingId, productPayload);
    } else {
      await addProduct(productPayload);
    }
    handleResetForm();
  };

  const handleGenerateSeo = () => {
    if (!prodName) {
      alert("Please enter a product name first.");
      return;
    }
    const catName = prodCategory === 'sarees' ? 'Luxury Saree' : 'Temple Jewellery';
    setSeoTitle(`${prodName} | Handcrafted ${catName} — ROKEA by RK`);
    setSeoKeyword(`${prodName.toLowerCase()}, best ${catName.toLowerCase()} coimbatore`);
    setSeoDesc(`Explore our handcrafted ${prodName}. Curated with pure artistry, authentic finish, and timeless tradition at ROKEA by RK, Coimbatore.`);
  };

  const handleGenerateAllSlugs = async () => {
    for (const p of products) {
      if (!p.slug) {
        await updateProduct(p.id, { slug: generateSlug(p.name) });
      }
    }
    showToast("Generated Slugs for All Products", "success");
  };

  // Abandoned reminder record management (Cleaned per customer email)
  const handleDeleteAbandoned = async (reminderId, userEmail) => {
    if (!window.confirm('Are you sure you want to delete this reminder record?')) return;
    const cleanMail = (userEmail || '').trim().toLowerCase();
    if (cleanMail) {
      await removeAbandonedCartRecord(cleanMail);
    }
    if (reminderId && db) {
      await db.collection("abandoned_reminders").doc(reminderId).delete().catch(() => {});
    }
    setAbandonedList(prev => prev.filter(r => r.id !== reminderId && (!cleanMail || (r.userEmail || '').toLowerCase() !== cleanMail)));
    showToast('Record Deleted', 'info', 'Abandoned reminder removed');
  };

  const handleClearAllAbandoned = async () => {
    if (abandonedList.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete all ${abandonedList.length} abandoned reminder records? This action cannot be undone.`)) return;

    if (db) {
      try {
        const snap = await db.collection("abandoned_reminders").get();
        const batch = db.batch();
        snap.forEach(d => batch.delete(d.ref));
        await batch.commit();
      } catch (err) {
        console.warn("Batch clear abandoned error:", err);
      }
    }
    try {
      localStorage.removeItem('saforio_abandoned_history');
    } catch (e) {}
    setAbandonedList([]);
    showToast('All Records Cleared', 'info', 'All abandoned reminder history cleared');
  };

  const filteredProducts = products.filter(p => {
    if (productFilter === 'sarees') return p.category === 'sarees';
    if (productFilter === 'imitation') return p.category === 'imitation';
    return true;
  });

  const totalAbandonedValue = abandonedList.reduce((sum, r) => sum + (parseInt(r.cartTotal || 0, 10) || 0), 0);
  const avgAbandonedValue = abandonedList.length > 0 ? Math.round(totalAbandonedValue / abandonedList.length) : 0;
  const highValueCount = abandonedList.filter(r => (parseInt(r.cartTotal || 0, 10) || 0) >= 10000).length;
  const bagItemsCount = abandonedList.filter(r => Array.isArray(r.cartItems) && r.cartItems.length > 0).length;
  const wishlistItemsCount = abandonedList.filter(r => Array.isArray(r.wishlistItems) && r.wishlistItems.length > 0).length;

  const filteredAbandonedList = abandonedList
    .filter(r => {
      // Search query filter
      if (abandonedSearch.trim()) {
        const q = abandonedSearch.toLowerCase();
        const name = (r.userName || '').toLowerCase();
        const email = (r.userEmail || '').toLowerCase();
        const phone = (r.userPhone || '').toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !phone.includes(q)) return false;
      }
      // Tab filter
      if (abandonedFilterTab === 'bag') {
        return Array.isArray(r.cartItems) && r.cartItems.length > 0;
      }
      if (abandonedFilterTab === 'wishlist') {
        return Array.isArray(r.wishlistItems) && r.wishlistItems.length > 0;
      }
      if (abandonedFilterTab === 'high_value') {
        return (parseInt(r.cartTotal || 0, 10) || 0) >= 10000;
      }
      return true;
    })
    .sort((a, b) => {
      if (abandonedSort === 'highest_value') {
        return (parseInt(b.cartTotal || 0, 10) || 0) - (parseInt(a.cartTotal || 0, 10) || 0);
      }
      if (abandonedSort === 'most_items') {
        const countA = (a.cartItems?.length || 0) + (a.wishlistItems?.length || 0);
        const countB = (b.cartItems?.length || 0) + (b.wishlistItems?.length || 0);
        return countB - countA;
      }
      // default: recent
      return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
    });

  return (
    <div className="modal" id="adminModal" style={{ display: 'flex', background: 'var(--cream)', zIndex: 100000 }}>
      <div className="admin-dashboard-layout" style={{ width: '100%', height: '100vh', display: 'flex' }}>
        {/* Sidebar */}
        <div className="admin-sidebar">
          <div className="admin-sidebar-top">
            <div className="nav-logo" aria-label="ROKEA by RK Homepage">
              <img
                src="https://static.wixstatic.com/media/9881b8_16e714ef67304ad7812d38944b0b0b16~mv2.png/v1/fill/w_44,h_44,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/RK-LOGO-final.png"
                alt="Logo"
                style={{ height: 35, width: 'auto' }}
                loading="lazy"
                decoding="async"
                width="800"
                height="800"
              />
              <span className="admin-label" style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#fff' }}>
                ROKEA ADMIN
              </span>
            </div>
          </div>

          <div className="admin-nav-links">
            <div
              className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              Products
            </div>
            <div
              className={`admin-nav-item ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => setActiveTab('customers')}
            >
              Customers
            </div>
            <div
              className={`admin-nav-item ${activeTab === 'leads' ? 'active' : ''}`}
              onClick={() => setActiveTab('leads')}
            >
              Consultation Leads
            </div>
            <div
              className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              Orders &amp; Payments
            </div>
            <div
              className={`admin-nav-item ${activeTab === 'abandoned' ? 'active' : ''}`}
              onClick={() => setActiveTab('abandoned')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span>Abandoned Reminders</span>
              {abandonedList.length > 0 && (
                <span style={{ background: '#D81E5B', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8 }}>
                  {abandonedList.length}
                </span>
              )}
            </div>
            <div
              className="admin-nav-item logout-btn"
              onClick={() => {
                logout();
                closeAdmin();
              }}
              style={{ color: '#ff4d4d' }}
            >
              Logout
            </div>
            <div
              className="admin-nav-item"
              onClick={closeAdmin}
              style={{
                marginTop: 10,
                borderTop: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                cursor: 'pointer'
              }}
            >
              Exit Dashboard
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="admin-main" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
            <h2
              id="adminTabTitle"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 300, fontSize: 32, margin: 0 }}
            >
              {activeTab === 'products' && 'Product Management'}
              {activeTab === 'customers' && 'Customer Records'}
              {activeTab === 'leads' && 'Consultation Leads'}
              {activeTab === 'orders' && 'Order & Payment History'}
              {activeTab === 'abandoned' && 'Abandoned Cart & Wishlist Recovery Reminders'}
            </h2>
            {activeTab === 'products' && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => document.getElementById('productForm')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Add New Product
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleGenerateAllSlugs}
                  style={{ background: '#e67e22', borderColor: '#e67e22' }}
                >
                  Generate Slugs
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: PRODUCTS */}
          {activeTab === 'products' && (
            <div id="viewProducts">
              {/* Product Add / Edit Form */}
              <form
                id="productForm"
                onSubmit={handleFormSubmit}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 20,
                  background: 'var(--ivory)',
                  padding: 30,
                  borderRadius: 8,
                  marginBottom: 40
                }}
              >
                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between' }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--dark)' }}>
                    {editingId ? `Edit Product: ${prodName}` : 'Add New Product'}
                  </h3>
                  {editingId && (
                    <button type="button" onClick={handleResetForm} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}>
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Pure Kanjivaram Bridal Silk Saree"
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select value={prodCategory} onChange={(e) => setProdCategory(e.target.value)}>
                    <option value="sarees">Sarees</option>
                    <option value="imitation">Imitation Jewellery</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="e.g. 12500"
                  />
                </div>

                <div className="form-group">
                  <label>Stock</label>
                  <select value={prodStock} onChange={(e) => setProdStock(e.target.value)}>
                    <option value="In Stock">In Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Main Image URL</label>
                  <input
                    type="text"
                    required
                    value={prodImg}
                    onChange={(e) => setProdImg(e.target.value)}
                    placeholder="https://... or /image.png"
                  />
                </div>

                <div className="form-group">
                  <label>Hover Image URL</label>
                  <input
                    type="text"
                    value={prodImgHover}
                    onChange={(e) => setProdImgHover(e.target.value)}
                    placeholder="Hover image or leave same as main"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Additional Image URLs (Comma Separated)</label>
                  <input
                    type="text"
                    value={prodExtraImgs}
                    onChange={(e) => setProdExtraImgs(e.target.value)}
                    placeholder="https://link1.png, https://link2.png"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Description</label>
                  <textarea
                    style={{ width: '100%', padding: 12, border: '1px solid rgba(201,168,76,0.3)', height: 80, fontFamily: 'inherit' }}
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    placeholder="Enter product story and details..."
                  ></textarea>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Product Care Instructions</label>
                  <textarea
                    style={{ width: '100%', padding: 12, border: '1px solid rgba(201,168,76,0.3)', height: 80, fontFamily: 'inherit' }}
                    value={prodCare}
                    onChange={(e) => setProdCare(e.target.value)}
                    placeholder="e.g. Dry clean only. Store in muslin cloth."
                  ></textarea>
                </div>

                {/* SEO SECTION */}
                <div
                  style={{
                    gridColumn: 'span 2',
                    padding: 20,
                    border: '1px dashed var(--gold)',
                    borderRadius: 8,
                    background: 'rgba(201,168,76,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                    <h4 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: 'var(--gold)' }}>
                      SEO Meta Data
                    </h4>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleGenerateSeo}
                      style={{ padding: '6px 14px', fontSize: 11, background: '#8e44ad', borderColor: '#8e44ad' }}
                    >
                      ✨ Auto Generate SEO
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 15 }}>
                    <div className="form-group">
                      <label>Meta Title</label>
                      <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Focus Keyword</label>
                      <input type="text" value={seoKeyword} onChange={(e) => setSeoKeyword(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Meta Description</label>
                      <textarea
                        style={{ width: '100%', padding: 10, border: '1px solid rgba(201,168,76,0.3)' }}
                        value={seoDesc}
                        onChange={(e) => setSeoDesc(e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn-primary" style={{ padding: '12px 30px' }}>
                    {editingId ? 'Save Changes' : 'Add Product'}
                  </button>
                  {editingId && (
                    <button type="button" className="btn-outline" onClick={handleResetForm}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Product Filtering Bar */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button
                  type="button"
                  className={`admin-tab-btn ${productFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setProductFilter('all')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 20,
                    border: '1px solid var(--gold)',
                    background: productFilter === 'all' ? 'var(--gold)' : 'transparent',
                    color: productFilter === 'all' ? '#fff' : 'var(--dark)',
                    cursor: 'pointer'
                  }}
                >
                  All ({products.length})
                </button>
                <button
                  type="button"
                  className={`admin-tab-btn ${productFilter === 'sarees' ? 'active' : ''}`}
                  onClick={() => setProductFilter('sarees')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 20,
                    border: '1px solid var(--gold)',
                    background: productFilter === 'sarees' ? 'var(--gold)' : 'transparent',
                    color: productFilter === 'sarees' ? '#fff' : 'var(--dark)',
                    cursor: 'pointer'
                  }}
                >
                  Sarees ({products.filter(p => p.category === 'sarees').length})
                </button>
                <button
                  type="button"
                  className={`admin-tab-btn ${productFilter === 'imitation' ? 'active' : ''}`}
                  onClick={() => setProductFilter('imitation')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 20,
                    border: '1px solid var(--gold)',
                    background: productFilter === 'imitation' ? 'var(--gold)' : 'transparent',
                    color: productFilter === 'imitation' ? '#fff' : 'var(--dark)',
                    cursor: 'pointer'
                  }}
                >
                  Jewellery ({products.filter(p => p.category === 'imitation').length})
                </button>
              </div>

              {/* Products Table */}
              <div style={{ background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.06)', color: 'var(--muted)', fontSize: 13 }}>
                      <th style={{ padding: '12px 10px' }}>Preview</th>
                      <th style={{ padding: '12px 10px' }}>Name</th>
                      <th style={{ padding: '12px 10px' }}>Category</th>
                      <th style={{ padding: '12px 10px' }}>Price</th>
                      <th style={{ padding: '12px 10px' }}>Stock</th>
                      <th style={{ padding: '12px 10px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                        <td style={{ padding: '10px' }}>
                          <img
                            src={optimizeImageUrl(p.image || p.img)}
                            alt={p.name}
                            style={{ width: 44, height: 55, objectFit: 'cover', borderRadius: 4 }}
                          />
                        </td>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{p.name}</td>
                        <td style={{ padding: '10px', textTransform: 'uppercase', fontSize: 12 }}>{p.category}</td>
                        <td style={{ padding: '10px', color: 'var(--gold)', fontWeight: 600 }}>
                          ₹{parseInt(p.price || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              background: p.stock === 'Out of Stock' ? 'rgba(233,30,99,0.1)' : 'rgba(46,125,50,0.1)',
                              color: p.stock === 'Out of Stock' ? '#e91e63' : '#2e7d32'
                            }}
                          >
                            {p.stock || 'In Stock'}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <button
                            type="button"
                            onClick={() => handleEditProduct(p)}
                            style={{
                              background: 'none',
                              border: '1px solid var(--gold)',
                              color: 'var(--gold)',
                              padding: '4px 10px',
                              borderRadius: 4,
                              cursor: 'pointer',
                              marginRight: 8,
                              fontSize: 12
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete "${p.name}"?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            style={{
                              background: 'none',
                              border: '1px solid #ff4d4d',
                              color: '#ff4d4d',
                              padding: '4px 10px',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: 12
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOMERS */}
          {activeTab === 'customers' && (
            <div style={{ background: '#fff', borderRadius: 8, padding: 25, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              {customers.length === 0 ? (
                <p style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>No registered customers yet.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.06)', color: 'var(--muted)', fontSize: 13 }}>
                      <th style={{ padding: 12 }}>Name</th>
                      <th style={{ padding: 12 }}>Email</th>
                      <th style={{ padding: 12 }}>Phone</th>
                      <th style={{ padding: 12 }}>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                        <td style={{ padding: 12, fontWeight: 600 }}>{c.name || 'User'}</td>
                        <td style={{ padding: 12 }}>{c.email}</td>
                        <td style={{ padding: 12 }}>{c.phone || '-'}</td>
                        <td style={{ padding: 12, fontSize: 12, color: '#888' }}>
                          {c.date ? new Date(c.date).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 3: LEADS */}
          {activeTab === 'leads' && (
            <div style={{ background: '#fff', borderRadius: 8, padding: 25, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              {leads.length === 0 ? (
                <p style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>No consultation leads recorded yet.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.06)', color: 'var(--muted)', fontSize: 13 }}>
                      <th style={{ padding: 12 }}>Client Name</th>
                      <th style={{ padding: 12 }}>Contact (Phone / Email)</th>
                      <th style={{ padding: 12 }}>Date</th>
                      <th style={{ padding: 12 }}>Slot / Source</th>
                      <th style={{ padding: 12 }}>Service Requested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                        <td style={{ padding: 12, fontWeight: 600 }}>
                          {l.name || (l.email ? l.email.split('@')[0] : 'Visitor')}
                          {l.type === 'newsletter' && (
                            <span style={{ marginLeft: 8, fontSize: 10, background: '#E8F5E9', color: '#2E7D32', padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>
                              Newsletter
                            </span>
                          )}
                        </td>
                        <td style={{ padding: 12 }}>
                          {l.phone && l.phone !== '-' ? (
                            <a href={`https://wa.me/${l.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#25D366', textDecoration: 'none', fontWeight: 500 }}>
                              📞 {l.phone}
                            </a>
                          ) : l.email ? (
                            <a href={`mailto:${l.email}`} style={{ color: 'var(--gold, #C9A84C)', textDecoration: 'underline', fontSize: 13 }}>
                              ✉️ {l.email}
                            </a>
                          ) : '-'}
                        </td>
                        <td style={{ padding: 12 }}>{l.date || (l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN') : '-')}</td>
                        <td style={{ padding: 12, fontSize: 12 }}>{l.time || l.source || '-'}</td>
                        <td style={{ padding: 12, color: 'var(--gold)', fontWeight: 500 }}>{l.service || 'General Lead'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 4: ORDERS */}
          {activeTab === 'orders' && (
            <div style={{ background: '#fff', borderRadius: 8, padding: 25, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              {orders.length === 0 ? (
                <p style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>No orders placed yet.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.06)', color: 'var(--muted)', fontSize: 13 }}>
                      <th style={{ padding: 12 }}>Order ID / Date</th>
                      <th style={{ padding: 12 }}>Customer</th>
                      <th style={{ padding: 12 }}>Items</th>
                      <th style={{ padding: 12 }}>Amount</th>
                      <th style={{ padding: 12 }}>Payment ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                        <td style={{ padding: 12 }}>
                          <div style={{ fontWeight: 600 }}>#{o.id}</div>
                          <div style={{ fontSize: 11, color: '#888' }}>{o.date}</div>
                        </td>
                        <td style={{ padding: 12 }}>
                          <div>{o.customer?.name}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>{o.customer?.phone}</div>
                        </td>
                        <td style={{ padding: 12 }}>{o.items?.length || 0} items</td>
                        <td style={{ padding: 12, color: 'var(--gold)', fontWeight: 600 }}>
                          ₹{parseInt(o.total || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: 12, fontSize: 12, fontFamily: 'monospace' }}>
                          {o.paymentId || 'DIRECT'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 5: ABANDONED CART & WISHLIST REMINDERS */}
          {activeTab === 'abandoned' && (
            <div style={{
              background: '#FFFFFF',
              borderRadius: 14,
              padding: '28px 32px',
              boxShadow: '0 10px 40px rgba(107, 19, 39, 0.05), 0 1px 3px rgba(0,0,0,0.02)',
              border: '1px solid #EFE6DC'
            }}>
              
              {/* ── TOP HERO HEADER & ACTIONS ── */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(212, 175, 55, 0.12)', border: '1px solid rgba(212, 175, 55, 0.35)', padding: '3px 10px', borderRadius: 20, marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: '#8A6510', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        ✨ VIP RECOVERY &amp; CONCIERGE PIPELINE
                      </span>
                    </div>
                    <h3 style={{ margin: '0 0 6px 0', color: '#5B0E1E', fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, letterSpacing: '-0.01em' }}>
                      Automated Cart &amp; Wishlist Recovery Hub
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: '#6E6259', maxWidth: 680, lineHeight: 1.6 }}>
                      High-converting boutique recovery engine. Monitors shoppers who added exclusive handloom sarees or jewels to their bag or wishlist, automatically dispatching personalized VIP reminders.
                    </p>
                  </div>

                  {/* HEADER ACTION BUTTONS */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (db) {
                          db.collection("abandoned_reminders").get().then(snap => {
                            const aList = [];
                            snap.forEach(d => aList.push({ id: d.id, ...d.data() }));
                            aList.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
                            setAbandonedList(aList);
                            showToast('Refreshed', 'info', 'Recovery records synchronized');
                          }).catch(() => {
                            showToast('Sync Notice', 'info', 'Using local records');
                          });
                        } else {
                          try {
                            const local = JSON.parse(localStorage.getItem('saforio_abandoned_history') || '[]');
                            setAbandonedList(local);
                            showToast('Refreshed', 'info', 'Local records reloaded');
                          } catch (e) {}
                        }
                      }}
                      style={{
                        background: '#FAF7F2',
                        border: '1px solid #D4AF37',
                        color: '#6B1327',
                        padding: '9px 15px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                      title="Sync latest customer records"
                    >
                      <span>🔄</span> Sync Records
                    </button>

                    {abandonedList.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllAbandoned}
                        style={{
                          background: 'rgba(211, 47, 47, 0.06)',
                          border: '1px solid #E57373',
                          color: '#C62828',
                          padding: '9px 16px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#C62828'; e.currentTarget.style.color = '#FFF'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(211, 47, 47, 0.06)'; e.currentTarget.style.color = '#C62828'; }}
                        title="Delete all abandoned cart records permanently"
                      >
                        <span>🗑️</span> Clear All Records ({abandonedList.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* ── 4 LUXURY KPI METRIC CARDS ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 22 }}>
                  
                  {/* METRIC 1 */}
                  <div style={{
                    background: 'linear-gradient(135deg, #FAF7F2 0%, #FFFFFF 100%)',
                    border: '1px solid #E8DFD5',
                    borderRadius: 10,
                    padding: '18px 20px',
                    boxShadow: '0 2px 8px rgba(107, 19, 39, 0.03)',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A6510', fontWeight: 700 }}>
                        Abandoned Leads
                      </span>
                      <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(107, 19, 39, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                        🛍️
                      </span>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#5B0E1E', fontFamily: "'Playfair Display', serif" }}>
                      {abandonedList.length}
                    </div>
                    <div style={{ fontSize: 11, color: '#7A6E65', marginTop: 4 }}>
                      High-intent shoppers tracked
                    </div>
                  </div>

                  {/* METRIC 2 */}
                  <div style={{
                    background: 'linear-gradient(135deg, #FAF7F2 0%, #FFFFFF 100%)',
                    border: '1px solid #E8DFD5',
                    borderRadius: 10,
                    padding: '18px 20px',
                    boxShadow: '0 2px 8px rgba(107, 19, 39, 0.03)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A6510', fontWeight: 700 }}>
                        Recoverable Value
                      </span>
                      <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(212, 175, 55, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                        💰
                      </span>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#8A6510', fontFamily: "'Playfair Display', serif" }}>
                      ₹{totalAbandonedValue.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: 11, color: '#7A6E65', marginTop: 4 }}>
                      Avg. Bag: ₹{avgAbandonedValue.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* METRIC 3 */}
                  <div style={{
                    background: 'linear-gradient(135deg, #FAF7F2 0%, #FFFFFF 100%)',
                    border: '1px solid #E8DFD5',
                    borderRadius: 10,
                    padding: '18px 20px',
                    boxShadow: '0 2px 8px rgba(107, 19, 39, 0.03)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A6510', fontWeight: 700 }}>
                        VIP Tier (&gt; ₹10,000)
                      </span>
                      <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(107, 19, 39, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                        👑
                      </span>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#5B0E1E', fontFamily: "'Playfair Display', serif" }}>
                      {highValueCount}
                    </div>
                    <div style={{ fontSize: 11, color: '#7A6E65', marginTop: 4 }}>
                      Premium high-ticket carts
                    </div>
                  </div>

                  {/* METRIC 4 */}
                  <div style={{
                    background: 'linear-gradient(135deg, #F3F9F4 0%, #FFFFFF 100%)',
                    border: '1px solid #C8E6C9',
                    borderRadius: 10,
                    padding: '18px 20px',
                    boxShadow: '0 2px 8px rgba(46, 125, 50, 0.04)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#2E7D32', fontWeight: 700 }}>
                        Auto-Recovery Engine
                      </span>
                      <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(46, 125, 50, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                        ⚡
                      </span>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#2E7D32', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2E7D32', display: 'inline-block' }}></span>
                      <span>100% Active</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 8 }}>
                      Sender: <strong>rokeabyrk@gmail.com</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── OFFICIAL GMAIL SENDER CONSOLE & PROFILE PHOTO HUB ── */}
              <div style={{
                marginBottom: 28,
                padding: '22px 26px',
                background: '#FFFFFF',
                border: '1px solid #D4AF37',
                borderRadius: 12,
                boxShadow: '0 4px 18px rgba(107, 19, 39, 0.04)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #5B0E1E 0%, #360710 100%)',
                      border: '2px solid #D4AF37',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#D4AF37',
                      fontWeight: 700,
                      fontSize: 16,
                      boxShadow: '0 3px 10px rgba(91, 14, 30, 0.25)'
                    }}>
                      R
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, color: '#5B0E1E', fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700 }}>
                          Official Gmail Dispatch Engine: <span style={{ color: '#8A6510' }}>rokeabyrk@gmail.com</span>
                        </h4>
                        <span style={{ fontSize: 10, background: '#E8F5E9', color: '#2E7D32', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                          SSL 465 Verified
                        </span>
                      </div>
                      <p style={{ margin: '3px 0 0 0', fontSize: 12, color: '#6E6259' }}>
                        Customer recovery emails are transmitted directly from Google's authenticated SMTP mail servers.
                      </p>
                    </div>
                  </div>

                  <span style={{
                    fontSize: 11,
                    padding: '6px 14px',
                    borderRadius: 20,
                    background: gmailAppPass ? 'rgba(46,125,50,0.12)' : 'rgba(212,175,55,0.18)',
                    color: gmailAppPass ? '#2e7d32' : '#8A6510',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: gmailAppPass ? '#2e7d32' : '#8A6510' }}></span>
                    {gmailAppPass ? '✓ Gmail App Password Configured' : '⚠ App Password Needed for Direct Gmail Send'}
                  </span>
                </div>

                {/* APP PASSWORD INPUT FIELD */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
                  <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Paste your 16-character Google App Password (e.g. abcd efgh ijkl mnop)..."
                      value={gmailAppPass}
                      onChange={(e) => setGmailAppPass(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #D4AF37',
                        borderRadius: 6,
                        fontSize: 13,
                        boxSizing: 'border-box',
                        letterSpacing: showPass ? 'normal' : '0.15em',
                        fontFamily: showPass ? 'inherit' : 'monospace',
                        outline: 'none',
                        background: '#FAF8F5'
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    style={{
                      padding: '10px 16px',
                      background: '#FFFFFF',
                      border: '1px solid #CCC',
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: 'pointer',
                      fontWeight: 600,
                      color: '#555'
                    }}
                  >
                    {showPass ? '🔒 Hide' : '👁 Show'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const clean = gmailAppPass.trim();
                      try {
                        localStorage.setItem('saforio_gmail_app_password', clean);
                      } catch (e) {}
                      showToast('App Password Saved!', 'success', 'Saved for rokeabyrk@gmail.com');
                    }}
                    style={{
                      padding: '10px 22px',
                      background: 'linear-gradient(135deg, #5B0E1E 0%, #360710 100%)',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(91, 14, 30, 0.25)',
                      letterSpacing: '0.02em'
                    }}
                  >
                    💾 Save Credentials
                  </button>
                </div>

                {/* ── 3 INTERACTIVE SETUP & AVATAR RESOLUTION CARDS ── */}
                <div style={{
                  marginTop: 18,
                  padding: '16px 18px',
                  background: '#FAF7F2',
                  borderRadius: 8,
                  border: '1px solid #E6DCD1'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 16 }}>💡</span>
                    <strong style={{ fontSize: 13, color: '#5B0E1E' }}>
                      Profile Photo Visibility in Customer Inboxes:
                    </strong>
                    <span style={{ fontSize: 11, color: '#777' }}>
                      Follow these 3 quick steps so customers always see the ROKEA luxury logo next to your emails:
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginTop: 10 }}>
                    
                    {/* STEP 1 */}
                    <div style={{ background: '#FFFFFF', border: '1px solid #E0D5C7', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#5B0E1E', color: '#FFF', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          1
                        </span>
                        <strong style={{ fontSize: 12, color: '#333' }}>Set Photo to "Anyone"</strong>
                      </div>
                      <p style={{ margin: '0 0 10px 0', fontSize: 11, color: '#666', lineHeight: 1.4 }}>
                        Google profile privacy must be set to <strong>"Visible to anyone"</strong> so external customer inboxes display your brand logo.
                      </p>
                      <a
                        href="https://myaccount.google.com/profile"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: '#5B0E1E',
                          color: '#FFF',
                          textDecoration: 'none',
                          padding: '6px 12px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600
                        }}
                      >
                        <span>👤</span> Google Profile Settings ↗
                      </a>
                    </div>

                    {/* STEP 2 */}
                    <div style={{ background: '#FFFFFF', border: '1px solid #E0D5C7', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#8A6510', color: '#FFF', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          2
                        </span>
                        <strong style={{ fontSize: 12, color: '#333' }}>Generate App Password</strong>
                      </div>
                      <p style={{ margin: '0 0 10px 0', fontSize: 11, color: '#666', lineHeight: 1.4 }}>
                        Under 2-Step Verification, generate a 16-character password named "ROKEA Boutique" and paste it above.
                      </p>
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: '#FAF5EE',
                          border: '1px solid #D4AF37',
                          color: '#8A6510',
                          textDecoration: 'none',
                          padding: '6px 12px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600
                        }}
                      >
                        <span>🔑</span> Create App Password ↗
                      </a>
                    </div>

                    {/* STEP 3 */}
                    <div style={{ background: '#FFFFFF', border: '1px solid #E0D5C7', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#2E7D32', color: '#FFF', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          3
                        </span>
                        <strong style={{ fontSize: 12, color: '#333' }}>Download Brand Logo</strong>
                      </div>
                      <p style={{ margin: '0 0 10px 0', fontSize: 11, color: '#666', lineHeight: 1.4 }}>
                        Use ROKEA's official high-resolution logo image as your Google profile photo.
                      </p>
                      <a
                        href="https://static.wixstatic.com/media/9881b8_16e714ef67304ad7812d38944b0b0b16~mv2.png/v1/crop/x_0,y_92,w_5000,h_1065/fill/w_800,h_800,al_c,q_95/ROKEA%20horizontal%20logo%20(1).png"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: '#FFFFFF',
                          border: '1px solid #CCC',
                          color: '#444',
                          textDecoration: 'none',
                          padding: '6px 12px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600
                        }}
                      >
                        <span>📥</span> Download Logo ↗
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── LIVE EMAIL DISPATCH TESTER (VIP SANDBOX) ── */}
              <div style={{
                marginBottom: 28,
                padding: '18px 22px',
                background: 'linear-gradient(135deg, #FDFAF6 0%, #FAF5EE 100%)',
                border: '1px dashed #D4AF37',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>🚀</span>
                    <strong style={{ fontSize: 14, color: '#5B0E1E' }}>
                      VIP Live Email Dispatch Sandbox
                    </strong>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#695B50', lineHeight: 1.4 }}>
                    Transmit a sample luxury reminder email right now to any email address to preview the design, typography, and sender profile avatar in a real inbox.
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="email"
                    placeholder="Enter email to test dispatch..."
                    value={testReminderEmail}
                    onChange={(e) => setTestReminderEmail(e.target.value)}
                    style={{
                      padding: '9px 14px',
                      border: '1px solid #D4AF37',
                      borderRadius: 6,
                      fontSize: 13,
                      minWidth: 250,
                      background: '#FFF'
                    }}
                  />
                  <button
                    type="button"
                    disabled={testReminderLoading}
                    onClick={async () => {
                      if (!testReminderEmail || !testReminderEmail.includes('@')) {
                        alert('Please enter a valid email address to test.');
                        return;
                      }
                      setTestReminderLoading(true);
                      const sampleCart = products.slice(0, 2).map(p => ({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        image: p.image || p.img
                      }));
                      const res = await processCartAbandonment({
                        user: { name: 'Valued Customer', email: testReminderEmail },
                        cart: sampleCart.length > 0 ? sampleCart : [{ id: 'sample', name: 'Handloom Pure Silk Saree', price: 18500 }],
                        wishlist: [],
                        triggerSource: 'admin_live_test',
                        force: true
                      });
                      setTestReminderLoading(false);
                      if (res && res.success) {
                        showToast('Live Email Dispatched!', 'success', 'Check your inbox at ' + testReminderEmail);
                      } else {
                        showToast('Dispatch Notice', 'info', res?.reason || 'Email queued');
                      }
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #5B0E1E 0%, #360710 100%)',
                      color: '#FFF',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: testReminderLoading ? 'not-allowed' : 'pointer',
                      opacity: testReminderLoading ? 0.7 : 1,
                      boxShadow: '0 2px 8px rgba(91, 14, 30, 0.2)'
                    }}
                  >
                    {testReminderLoading ? 'Sending Real Email...' : '✉ Send Real Test Email'}
                  </button>
                </div>
              </div>

              {/* ── FILTER TABS & SEARCH CONTROLS ── */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 18,
                flexWrap: 'wrap',
                gap: 14,
                paddingBottom: 14,
                borderBottom: '1px solid #EFE6DC'
              }}>
                {/* FILTER PILLS */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: `All Records (${abandonedList.length})` },
                    { id: 'bag', label: `🛍️ In Bag (${bagItemsCount})` },
                    { id: 'wishlist', label: `💖 Wishlist (${wishlistItemsCount})` },
                    { id: 'high_value', label: `👑 High Value (${highValueCount})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAbandonedFilterTab(tab.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 20,
                        border: abandonedFilterTab === tab.id ? '1px solid #5B0E1E' : '1px solid #E0D5C7',
                        background: abandonedFilterTab === tab.id ? '#5B0E1E' : '#FAF7F2',
                        color: abandonedFilterTab === tab.id ? '#FFFFFF' : '#695B50',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* SEARCH BAR & SORT */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', minWidth: 240 }}>
                    <input
                      type="text"
                      placeholder="🔍 Search name, email, phone..."
                      value={abandonedSearch}
                      onChange={(e) => setAbandonedSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 30px 7px 12px',
                        border: '1px solid #DDD',
                        borderRadius: 20,
                        fontSize: 12,
                        boxSizing: 'border-box',
                        outline: 'none',
                        background: '#FAF8F5'
                      }}
                    />
                    {abandonedSearch && (
                      <button
                        type="button"
                        onClick={() => setAbandonedSearch('')}
                        style={{
                          position: 'absolute',
                          right: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#888',
                          cursor: 'pointer',
                          fontSize: 12
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* SORT SELECTOR */}
                  <select
                    value={abandonedSort}
                    onChange={(e) => setAbandonedSort(e.target.value)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 6,
                      border: '1px solid #DDD',
                      fontSize: 12,
                      color: '#444',
                      background: '#FFF',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="recent">Sort: Most Recent</option>
                    <option value="highest_value">Sort: Highest Value (₹)</option>
                    <option value="most_items">Sort: Most Items</option>
                  </select>
                </div>
              </div>

              {/* ── RECORDS TABLE / EMPTY STATE ── */}
              {abandonedList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FDFAF6', borderRadius: 12, border: '1px dashed #E0D5C7' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️✨</div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#5B0E1E', fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700 }}>
                    No Abandoned Carts Recorded Yet
                  </h4>
                  <p style={{ margin: '0 auto 20px auto', color: '#7A6E65', fontSize: 13, maxWidth: 520, lineHeight: 1.6 }}>
                    When a customer adds luxury sarees or imitation jewelry to their shopping bag or wishlist and exits without purchasing, their session will automatically appear here with 1-click recovery actions.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTestReminderEmail('test@customer.com')}
                    style={{
                      background: 'linear-gradient(135deg, #5B0E1E 0%, #360710 100%)',
                      color: '#FFF',
                      border: 'none',
                      padding: '9px 20px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(91, 14, 30, 0.25)'
                    }}
                  >
                    Send a Sample Test Record Above ⬆
                  </button>
                </div>
              ) : filteredAbandonedList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888', fontSize: 13 }}>
                  No customer records matched your filter / search query.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #EFE6DC', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 920 }}>
                    <thead>
                      <tr style={{ background: '#FAF7F2', borderBottom: '2px solid #E6DCD1', color: '#5B0E1E', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        <th style={{ padding: '14px 16px', width: '24%' }}>Customer Details</th>
                        <th style={{ padding: '14px 16px', width: '28%' }}>Items Left Behind</th>
                        <th style={{ padding: '14px 16px', width: '14%' }}>Bag Total</th>
                        <th style={{ padding: '14px 16px', width: '14%' }}>Date &amp; Trigger</th>
                        <th style={{ padding: '14px 16px', width: '10%' }}>Status</th>
                        <th style={{ padding: '14px 16px', width: '10%', textAlign: 'center' }}>Concierge Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAbandonedList.map((r, i) => {
                        const total = parseInt(r.cartTotal || 0, 10);
                        const isVip = total >= 10000;
                        return (
                          <tr
                            key={r.id || i}
                            style={{
                              borderBottom: '1px solid #F2ECE5',
                              background: i % 2 === 0 ? '#FFFFFF' : '#FCFAF7',
                              transition: 'background 0.15s ease'
                            }}
                          >
                            {/* 1. CUSTOMER INFO */}
                            <td style={{ padding: '16px', verticalAlign: 'top' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                <div style={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: '50%',
                                  background: isVip ? 'linear-gradient(135deg, #5B0E1E 0%, #360710 100%)' : '#FAF7F2',
                                  border: isVip ? '2px solid #D4AF37' : '1px solid #D4AF37',
                                  color: isVip ? '#D4AF37' : '#8A6510',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: 14,
                                  flexShrink: 0
                                }}>
                                  {(r.userName || r.userEmail || 'C').charAt(0).toUpperCase()}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 700, color: '#2A040B', fontSize: 13 }}>
                                      {r.userName || 'Customer'}
                                    </span>
                                    {isVip && (
                                      <span style={{ fontSize: 10, background: 'rgba(212, 175, 55, 0.15)', color: '#8A6510', padding: '1px 6px', borderRadius: 8, fontWeight: 700, border: '1px solid rgba(212, 175, 55, 0.4)' }}>
                                        👑 VIP
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: 12, color: '#666', marginTop: 3, wordBreak: 'break-all' }}>
                                    <a href={`mailto:${r.userEmail}`} style={{ color: '#5B0E1E', textDecoration: 'none', fontWeight: 500 }} title="Send direct email">
                                      ✉ {r.userEmail}
                                    </a>
                                  </div>
                                  {r.userPhone && (
                                    <div style={{ fontSize: 11, color: '#777', marginTop: 3 }}>
                                      <a href={`tel:${r.userPhone}`} style={{ color: '#777', textDecoration: 'none' }}>
                                        📞 {r.userPhone}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* 2. ITEMS LEFT BEHIND */}
                            <td style={{ padding: '16px', verticalAlign: 'top' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {Array.isArray(r.cartItems) && r.cartItems.length > 0 && (
                                  <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#5B0E1E', textTransform: 'uppercase', marginBottom: 6 }}>
                                      🛍️ Bag Items ({r.cartItems.reduce((sum, itm) => sum + parseInt(itm.quantity || 1, 10), 0)} Total Pcs):
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      {r.cartItems.map((item, idx) => {
                                        const qty = parseInt(item.quantity || 1, 10);
                                        const price = parseInt(item.price || 0, 10);
                                        return (
                                          <div
                                            key={idx}
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 10,
                                              background: '#FFFFFF',
                                              border: '1px solid #E6DCD1',
                                              padding: '6px 10px',
                                              borderRadius: 6,
                                              fontSize: 12,
                                              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                            }}
                                          >
                                            {item.image && (
                                              <img
                                                src={item.image}
                                                alt={item.name}
                                                style={{ width: 34, height: 42, objectFit: 'cover', borderRadius: 4, border: '1px solid #D4AF37', flexShrink: 0 }}
                                              />
                                            )}
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                              <div style={{ color: '#2A040B', fontWeight: 600, fontSize: 12, lineHeight: 1.3 }}>
                                                {item.name}
                                              </div>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                                                <span style={{ fontSize: 11, color: '#8A6510', fontWeight: 700 }}>
                                                  ₹{price.toLocaleString('en-IN')}
                                                </span>
                                                <span style={{
                                                  fontSize: 10,
                                                  background: '#FAF5EE',
                                                  border: '1px solid #D4AF37',
                                                  color: '#6B1327',
                                                  fontWeight: 700,
                                                  padding: '1px 6px',
                                                  borderRadius: 8
                                                }}>
                                                  Qty: {qty}
                                                </span>
                                                {qty > 1 && (
                                                  <span style={{ fontSize: 10, color: '#777', fontWeight: 500 }}>
                                                    (= ₹{(price * qty).toLocaleString('en-IN')})
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {Array.isArray(r.wishlistItems) && r.wishlistItems.length > 0 && (
                                  <div style={{ marginTop: 2 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#8A6510', textTransform: 'uppercase' }}>
                                      💖 Wishlist ({r.wishlistItems.length}):
                                    </span>
                                    <span style={{ fontSize: 11, color: '#666', marginLeft: 6 }}>
                                      {r.wishlistItems.map(w => w.name).slice(0, 2).join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* 3. BAG TOTAL */}
                            <td style={{ padding: '16px', verticalAlign: 'top' }}>
                              <div style={{ color: isVip ? '#5B0E1E' : '#8A6510', fontWeight: 700, fontSize: 16, fontFamily: "'Playfair Display', serif" }}>
                                ₹{total.toLocaleString('en-IN')}
                              </div>
                              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                                {Array.isArray(r.cartItems) ? r.cartItems.reduce((sum, itm) => sum + parseInt(itm.quantity || 1, 10), 0) : r.cartCount || 0} pcs in bag
                              </div>
                            </td>

                            {/* 4. DATE & TRIGGER */}
                            <td style={{ padding: '16px', verticalAlign: 'top', fontSize: 12 }}>
                              <div style={{ color: '#333', fontWeight: 600 }}>
                                {r.formattedDate || (r.timestamp ? new Date(r.timestamp).toLocaleDateString() : '-')}
                              </div>
                              <div style={{ marginTop: 4 }}>
                                <span style={{
                                  fontSize: 10,
                                  background: r.triggerSource === 'idle_timer' ? '#FFF8E1' : '#FAF5EE',
                                  border: r.triggerSource === 'idle_timer' ? '1px solid #FFE082' : '1px solid #E8DFD5',
                                  padding: '3px 8px',
                                  borderRadius: 10,
                                  color: r.triggerSource === 'idle_timer' ? '#F57F17' : '#5B0E1E',
                                  textTransform: 'capitalize',
                                  fontWeight: 700,
                                  display: 'inline-block'
                                }}>
                                  {r.triggerSource === 'idle_timer' ? '⏱️ Inactivity (90s)' :
                                   r.triggerSource === 'beforeunload' ? '🚪 Page Leave' :
                                   r.triggerSource === 'admin_manual_resend' ? '✉ Resent' :
                                   r.triggerSource === 'admin_live_test' ? '🧪 Live Test' :
                                   r.triggerSource?.replace(/_/g, ' ') || 'Auto'}
                                </span>
                              </div>
                            </td>

                            {/* 5. EMAIL DELIVERY */}
                            <td style={{ padding: '16px', verticalAlign: 'top' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                background: 'rgba(46,125,50,0.12)',
                                color: '#2E7D32',
                                padding: '4px 10px',
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 700
                              }}>
                                ✓ Dispatched
                              </span>
                              <div style={{ fontSize: 10, color: '#777', marginTop: 4 }}>
                                via rokeabyrk
                              </div>
                            </td>

                            {/* 6. CONCIERGE ACTIONS */}
                            <td style={{ padding: '16px', verticalAlign: 'top' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'stretch' }}>
                                
                                {/* RESEND EMAIL */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    processCartAbandonment({
                                      user: { name: r.userName, email: r.userEmail, phone: r.userPhone },
                                      cart: r.cartItems || [],
                                      wishlist: r.wishlistItems || [],
                                      triggerSource: 'admin_manual_resend',
                                      force: true
                                    }).then(() => {
                                      showToast('Reminder Email Dispatched', 'success', 'Sent to ' + r.userEmail);
                                    });
                                  }}
                                  style={{
                                    background: '#FFF',
                                    border: '1px solid #5B0E1E',
                                    color: '#5B0E1E',
                                    padding: '6px 10px',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    textAlign: 'center',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title="Resend luxury reminder email to this customer"
                                >
                                  ✉ Resend Email
                                </button>

                                {/* WHATSAPP */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const waUrl = generateWhatsAppReminderLink(r);
                                    window.open(waUrl, '_blank');
                                  }}
                                  style={{
                                    background: 'rgba(37, 211, 102, 0.08)',
                                    border: '1px solid #25D366',
                                    color: '#128C7E',
                                    padding: '6px 10px',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    textAlign: 'center',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title="Open WhatsApp chat with prefilled VIP concierge message"
                                >
                                  💬 WhatsApp
                                </button>

                                {/* DELETE */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAbandoned(r.id, r.userEmail)}
                                  style={{
                                    background: '#FFF',
                                    border: '1px solid #FFCDD2',
                                    color: '#D32F2F',
                                    padding: '6px 10px',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    textAlign: 'center',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = '#D32F2F'; e.currentTarget.style.color = '#FFF'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = '#FFF'; e.currentTarget.style.color = '#D32F2F'; }}
                                  title="Delete this record from system"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}        </div>
      </div>
    </div>
  );
}
