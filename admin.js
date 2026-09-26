/**
 * ============================================================
 * ADMIN DASHBOARD CONTROLLER — BANGLADESH (admin.js)
 * Full A to Z Control:
 * 1. Complete Order Editing & Deletion (Every Field Editable)
 * 2. Product Name, Price, Discount, Images & Description Editor
 * 3. Store Name, Helpline, Delivery Fees & Apps Script Web App URL
 * 4. Dual Sync: Works immediately with Local Storage & Google Sheets
 * ============================================================
 */

const API_CONFIG = {
  // Centralized Google Apps Script Web App URL (Loaded dynamically from storage if updated)
  baseUrl: localStorage.getItem("bd_shop_api_url") || "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL"
};

const adminState = {
  token: sessionStorage.getItem("bd_shop_admin_token") || null,
  adminUser: JSON.parse(sessionStorage.getItem("bd_shop_admin_user") || "null"),
  orders: [],
  filteredOrders: [],
  selectedOrder: null,
  isDemoMode: false,
  activeTab: "tabOrders"
};

// Seed sample orders for initial demo preview if user hasn't created live orders yet
const DEFAULT_DEMO_ORDERS = [
  {
    orderId: "SP-20260926-000101",
    createdAt: "2026-09-26 10:15:30",
    updatedAt: "2026-09-26 10:15:30",
    customer: {
      name: "তানভীর আহমেদ",
      phone: "01712345678",
      division: "ঢাকা",
      district: "ঢাকা",
      upazila: "ধানমন্ডি",
      address: "বাড়ি ১২, রোড ৫, ধানমন্ডি"
    },
    product: {
      name: "আল্ট্রা প্রিমিয়াম স্মার্টওয়াচ",
      variant: "অরেঞ্জ আলপাইন (Orange Alpine)",
      color: "Orange",
      quantity: 1,
      unitPrice: 999
    },
    financial: {
      unitPrice: 999,
      subtotal: 999,
      discount: 0,
      deliveryCharge: 80,
      totalAmount: 1079
    },
    paymentMethod: "Cash on Delivery",
    orderStatus: "Confirmed",
    customerNote: "বিকালে ডেলিভারি দিলে ভালো হয়",
    adminNote: "গ্রাহককে কল দিয়ে অর্ডার কনফার্ম করা হয়েছে।",
    clientRequestId: "REQ-1727341234-DEMO1"
  },
  {
    orderId: "SP-20260926-000102",
    createdAt: "2026-09-26 11:45:00",
    updatedAt: "2026-09-26 12:00:15",
    customer: {
      name: "সোহেল রানা",
      phone: "01898765432",
      division: "চট্টগ্রাম",
      district: "চট্টগ্রাম",
      upazila: "পাঁচলাইশ",
      address: "ফ্ল্যাট ৩বি, ও আর নিজাম রোড"
    },
    product: {
      name: "আল্ট্রা প্রিমিয়াম স্মার্টওয়াচ",
      variant: "মিডনাইট ব্ল্যাক (Midnight Black)",
      color: "Black",
      quantity: 2,
      unitPrice: 999
    },
    financial: {
      unitPrice: 999,
      subtotal: 1998,
      discount: 0,
      deliveryCharge: 120,
      totalAmount: 2118
    },
    paymentMethod: "Cash on Delivery",
    orderStatus: "Shipped",
    customerNote: "",
    adminNote: "Steadfast Courier Tracking ID: ST-889922",
    clientRequestId: "REQ-1727344567-DEMO2"
  },
  {
    orderId: "SP-20260926-000103",
    createdAt: "2026-09-26 12:30:10",
    updatedAt: "2026-09-26 12:30:10",
    customer: {
      name: "ফারহানা ইয়াসমিন",
      phone: "01911223344",
      division: "রাজশাহী",
      district: "বগুড়া",
      upazila: "বগুড়া সদর",
      address: "রেলওয়ে কলোনি, জলেশ্বরীতলা"
    },
    product: {
      name: "আল্ট্রা প্রিমিয়াম স্মার্টওয়াচ",
      variant: "ওশান ব্লু (Ocean Blue)",
      color: "Blue",
      quantity: 1,
      unitPrice: 999
    },
    financial: {
      unitPrice: 999,
      subtotal: 999,
      discount: 0,
      deliveryCharge: 120,
      totalAmount: 1119
    },
    paymentMethod: "Cash on Delivery",
    orderStatus: "Pending",
    customerNote: "কল না ধরে প্রোডাক্ট পাঠাবেন না",
    adminNote: "",
    clientRequestId: "REQ-1727348910-DEMO3"
  }
];

/* ============================================================
   1. DOM READY & ROUTE HANDLING
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  checkBackendStatus();
  initLoginHandlers();
  initDashboardControls();
  initDetailModalHandlers();
  initTabNavigation();
  initProductConfigForm();
  initStoreSettingsForm();

  // If already authenticated via session token, show dashboard
  if (adminState.token) {
    showDashboardView();
  } else {
    showLoginView();
  }
});

function checkBackendStatus() {
  const customUrl = localStorage.getItem("bd_shop_api_url");
  if (customUrl) {
    API_CONFIG.baseUrl = customUrl;
  }

  const isPlaceholder = !API_CONFIG.baseUrl || 
                        API_CONFIG.baseUrl.includes("YOUR_GOOGLE_APPS_SCRIPT") || 
                        API_CONFIG.baseUrl.trim() === "";
  adminState.isDemoMode = isPlaceholder;

  const badge = document.getElementById("backendBadge");
  if (badge) {
    if (adminState.isDemoMode) {
      badge.textContent = "ডেমো মোড (লোকাল স্টোরেজ)";
      badge.style.background = "#FEF3C7";
      badge.style.color = "#B45309";
      badge.title = "Google Apps Script URL এখনও সেট করা হয়নি। ডেমো ও লোকাল স্টোরেজে ডেটা সেভ হচ্ছে।";
    } else {
      badge.textContent = "● লাইভ গুগল শিটস কানেক্টেড";
      badge.style.background = "#DCFCE7";
      badge.style.color = "#15803D";
      badge.title = "সরাসরি Google Apps Script API এর সাথে সংযুক্ত";
    }
  }
}

/* ============================================================
   2. TAB NAVIGATION
   ============================================================ */

function initTabNavigation() {
  const tabBtns = document.querySelectorAll(".admin-tab-btn");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTabId = btn.getAttribute("data-tab");
      switchTab(targetTabId);
    });
  });
}

function switchTab(tabId) {
  adminState.activeTab = tabId;

  // Update Buttons
  document.querySelectorAll(".admin-tab-btn").forEach(btn => {
    const isTarget = btn.getAttribute("data-tab") === tabId;
    btn.classList.toggle("active", isTarget);
    btn.setAttribute("aria-selected", isTarget ? "true" : "false");
  });

  // Update Content Containers
  document.querySelectorAll(".admin-tab-content").forEach(c => {
    c.style.display = "none";
    c.classList.remove("active");
  });

  const targetContent = document.getElementById(tabId);
  if (targetContent) {
    targetContent.style.display = "block";
    targetContent.classList.add("active");
  }

  // Load configs if opening product or settings tab
  if (tabId === "tabProduct") {
    loadProductConfigIntoForm();
  } else if (tabId === "tabSettings") {
    loadStoreSettingsIntoForm();
  }
}

/* ============================================================
   3. AUTHENTICATION & LOGIN FLOW
   ============================================================ */

function initLoginHandlers() {
  const form = document.getElementById("loginForm");
  const logoutBtn = document.getElementById("logoutBtn");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const user = document.getElementById("adminUsername").value.trim();
      const pass = document.getElementById("adminPassword").value.trim();

      if (!user || !pass) {
        showToast("ইউজারনেম ও পাসওয়ার্ড দুটিই প্রয়োজন।", "error");
        return;
      }

      setLoginLoading(true);

      try {
        let result;

        if (adminState.isDemoMode) {
          // Demo fallback: default credentials admin / admin123
          await new Promise(r => setTimeout(r, 500));
          if (user === "admin" && pass === "admin123") {
            const fakeToken = "SESSION-TOKEN-" + Math.random().toString(36).substring(2) + Date.now();
            result = {
              success: true,
              data: {
                token: fakeToken,
                admin: { username: "admin", role: "SuperAdmin" }
              }
            };
          } else {
            result = { success: false, message: "ভুল ইউজারনেম অথবা পাসওয়ার্ড! (ডিফল্ট: admin / admin123)" };
          }
        } else {
          // Real backend verification via Google Apps Script
          const res = await fetch(API_CONFIG.baseUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
              action: "adminLogin",
              username: user,
              password: pass
            })
          });

          if (!res.ok) throw new Error(`সার্ভার প্রতিক্রিয়া ব্যর্থ (HTTP ${res.status})`);
          result = await res.json();
        }

        if (result && result.success) {
          adminState.token = result.data.token;
          adminState.adminUser = result.data.admin;

          // Store ONLY token and admin info in sessionStorage (Never store raw password!)
          sessionStorage.setItem("bd_shop_admin_token", adminState.token);
          sessionStorage.setItem("bd_shop_admin_user", JSON.stringify(adminState.adminUser));

          showToast("লগইন সফল হয়েছে!", "success");
          showDashboardView();
        } else {
          showToast(result.message || "লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করুন।", "error");
        }
      } catch (err) {
        console.error("Login Error:", err);
        showToast(`লগইন সম্পন্ন করা যায়নি: ${err.message}`, "error");
      } finally {
        setLoginLoading(false);
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      adminState.token = null;
      adminState.adminUser = null;
      sessionStorage.removeItem("bd_shop_admin_token");
      sessionStorage.removeItem("bd_shop_admin_user");
      showToast("আপনি সফলভাবে লগআউট হয়েছেন।", "info");
      showLoginView();
    });
  }
}

function showLoginView() {
  document.getElementById("loginView").style.display = "flex";
  document.getElementById("dashboardView").style.display = "none";
  document.getElementById("adminPassword").value = "";
}

function showDashboardView() {
  document.getElementById("loginView").style.display = "none";
  document.getElementById("dashboardView").style.display = "block";

  const adminNameEl = document.getElementById("loggedInAdminName");
  if (adminNameEl && adminState.adminUser) {
    adminNameEl.textContent = adminState.adminUser.username || "এডমিন";
  }

  fetchOrders();
  loadProductConfigIntoForm();
  loadStoreSettingsIntoForm();
}

function setLoginLoading(isLoading) {
  const btn = document.getElementById("loginBtn");
  if (!btn) return;
  const text = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".btn-spinner");

  btn.disabled = isLoading;
  if (text) text.style.display = isLoading ? "none" : "inline";
  if (spinner) spinner.style.display = isLoading ? "inline-flex" : "none";
}

/* ============================================================
   4. DATA FETCHING & SYNCHRONIZATION
   ============================================================ */

async function fetchOrders() {
  const loadingEl = document.getElementById("tableLoadingState");
  const emptyEl = document.getElementById("tableEmptyState");
  const tbody = document.getElementById("ordersTableBody");

  if (loadingEl) loadingEl.style.display = "block";
  if (emptyEl) emptyEl.style.display = "none";
  if (tbody) tbody.innerHTML = "";

  try {
    let orderList = [];

    if (adminState.isDemoMode) {
      await new Promise(r => setTimeout(r, 300));
      // Load any orders submitted through front store during this session, plus default demos
      const localStored = JSON.parse(localStorage.getItem("bd_shop_demo_orders") || "[]");
      
      const combined = [...localStored];
      // Add defaults if not already present
      DEFAULT_DEMO_ORDERS.forEach(demo => {
        if (!combined.some(o => (o.orderId || o["Order ID"]) === demo.orderId)) {
          combined.push(demo);
        }
      });

      // Normalize format
      orderList = combined.map(o => normalizeOrderData(o));
    } else {
      // Fetch from Google Apps Script Web App
      const url = `${API_CONFIG.baseUrl}?action=getOrders&token=${encodeURIComponent(adminState.token)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const json = await res.json();

      if (!json.success) {
        if (json.message && json.message.toLowerCase().includes("unauthorized")) {
          sessionStorage.clear();
          showToast("সেশন মেয়াদোত্তীর্ণ হয়েছে। পুনরায় লগইন করুন।", "error");
          showLoginView();
          return;
        }
        throw new Error(json.message || "অর্ডার লোড করা যায়নি");
      }

      orderList = (json.data?.orders || []).map(o => normalizeOrderData(o));
    }

    adminState.orders = orderList;
    applyFiltersAndRender();
    updateMetrics();

  } catch (err) {
    console.error("Fetch Orders Error:", err);
    showToast(`অর্ডার লোড করতে ব্যর্থ: ${err.message}`, "error");
  } finally {
    if (loadingEl) loadingEl.style.display = "none";
  }
}

function normalizeOrderData(raw) {
  return {
    orderId: raw.orderId || raw["Order ID"] || "UNKNOWN",
    createdAt: raw.createdAt || raw["Created At"] || "-",
    updatedAt: raw.updatedAt || raw["Updated At"] || "-",
    customer: {
      name: raw.customer?.name || raw["Customer Name"] || "অজ্ঞাত",
      phone: raw.customer?.phone || raw["Phone"] || "-",
      division: raw.customer?.division || raw["Division"] || "-",
      district: raw.customer?.district || raw["District"] || "-",
      upazila: raw.customer?.upazila || raw["Upazila"] || "-",
      address: raw.customer?.address || raw["Full Address"] || "-"
    },
    product: {
      name: raw.product?.name || raw["Product Name"] || "স্মার্টওয়াচ",
      variant: raw.product?.variant || raw["Variant"] || "-",
      color: raw.product?.color || raw["Color"] || "-",
      size: raw.product?.size || raw["Size"] || "-",
      quantity: parseInt(raw.product?.quantity || raw["Quantity"] || 1, 10),
      unitPrice: parseFloat(raw.financial?.unitPrice || raw["Unit Price"] || 999)
    },
    financial: {
      unitPrice: parseFloat(raw.financial?.unitPrice || raw["Unit Price"] || 999),
      subtotal: parseFloat(raw.financial?.subtotal || raw["Subtotal"] || 999),
      discount: parseFloat(raw.financial?.discount || raw["Discount"] || 0),
      deliveryCharge: parseFloat(raw.financial?.deliveryCharge || raw["Delivery Charge"] || 80),
      totalAmount: parseFloat(raw.financial?.totalAmount || raw.totalAmount || raw["Total Amount"] || 1079)
    },
    paymentMethod: raw.paymentMethod || raw["Payment Method"] || "Cash on Delivery",
    orderStatus: raw.orderStatus || raw.status || raw["Order Status"] || "Pending",
    customerNote: raw.customerNote || raw.note || raw["Customer Note"] || "",
    adminNote: raw.adminNote || raw["Admin Note"] || "",
    clientRequestId: raw.clientRequestId || raw["Client Request ID"] || ""
  };
}

/* ============================================================
   5. METRICS & COUNTERS
   ============================================================ */

function updateMetrics() {
  const orders = adminState.orders;
  const counts = {
    total: orders.length,
    Pending: 0,
    Confirmed: 0,
    Processing: 0,
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0,
    Returned: 0
  };

  orders.forEach(order => {
    const status = order.orderStatus;
    if (counts.hasOwnProperty(status)) {
      counts[status]++;
    }
  });

  const toBn = n => toBengaliNumerals(n);

  document.getElementById("metricTotal").textContent = toBn(counts.total);
  document.getElementById("metricPending").textContent = toBn(counts.Pending);
  document.getElementById("metricConfirmed").textContent = toBn(counts.Confirmed);
  document.getElementById("metricProcessing").textContent = toBn(counts.Processing);
  document.getElementById("metricShipped").textContent = toBn(counts.Shipped);
  document.getElementById("metricDelivered").textContent = toBn(counts.Delivered);
  document.getElementById("metricCancelled").textContent = toBn(counts.Cancelled);
  document.getElementById("metricReturned").textContent = toBn(counts.Returned);
}

/* ============================================================
   6. FILTERS, SEARCH & SORTING
   ============================================================ */

function initDashboardControls() {
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const divisionFilter = document.getElementById("divisionFilter");
  const sortFilter = document.getElementById("sortFilter");
  const refreshBtn = document.getElementById("refreshBtn");
  const exportCsvBtn = document.getElementById("exportCsvBtn");

  if (searchInput) searchInput.addEventListener("input", () => applyFiltersAndRender());
  if (statusFilter) statusFilter.addEventListener("change", () => applyFiltersAndRender());
  if (divisionFilter) divisionFilter.addEventListener("change", () => applyFiltersAndRender());
  if (sortFilter) sortFilter.addEventListener("change", () => applyFiltersAndRender());

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      fetchOrders();
      showToast("অর্ডার তালিকা রিফ্রেশ করা হয়েছে", "info");
    });
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", () => exportOrdersToCsv());
  }
}

function applyFiltersAndRender() {
  const searchTerm = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();
  const selectedStatus = document.getElementById("statusFilter")?.value || "ALL";
  const selectedDivision = document.getElementById("divisionFilter")?.value || "ALL";
  const sortOrder = document.getElementById("sortFilter")?.value || "newest";

  let filtered = [...adminState.orders];

  if (searchTerm) {
    filtered = filtered.filter(o => 
      o.orderId.toLowerCase().includes(searchTerm) ||
      o.customer.name.toLowerCase().includes(searchTerm) ||
      o.customer.phone.includes(searchTerm)
    );
  }

  if (selectedStatus !== "ALL") {
    filtered = filtered.filter(o => o.orderStatus === selectedStatus);
  }

  if (selectedDivision !== "ALL") {
    filtered = filtered.filter(o => o.customer.division === selectedDivision);
  }

  filtered.sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortOrder === "oldest") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (sortOrder === "highest_val") {
      return b.financial.totalAmount - a.financial.totalAmount;
    } else if (sortOrder === "lowest_val") {
      return a.financial.totalAmount - b.financial.totalAmount;
    }
    return 0;
  });

  adminState.filteredOrders = filtered;
  renderTable(filtered);
}

function renderTable(orders) {
  const tbody = document.getElementById("ordersTableBody");
  const emptyState = document.getElementById("tableEmptyState");

  if (!tbody) return;
  tbody.innerHTML = "";

  if (orders.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  orders.forEach(order => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <strong style="font-family: monospace; color: var(--text-main); font-size: 0.85rem;">${order.orderId}</strong>
      </td>
      <td style="white-space: nowrap; font-size: 0.825rem; color: var(--text-light);">
        ${formatDate(order.createdAt)}
      </td>
      <td>
        <div style="font-weight: 600; color: var(--text-main);">${escapeHtml(order.customer.name)}</div>
      </td>
      <td>
        <a href="tel:${order.customer.phone}" style="color: var(--brand-primary); font-weight: 500;">${order.customer.phone}</a>
      </td>
      <td style="font-size: 0.85rem;">
        <div>${order.customer.division} · ${order.customer.district}</div>
        <div style="font-size: 0.775rem; color: var(--text-light);">${order.customer.upazila}</div>
      </td>
      <td style="font-size: 0.85rem;">
        <div>${escapeHtml(order.product.name)}</div>
        <div style="font-size: 0.775rem; color: var(--text-light);">${order.product.variant}</div>
      </td>
      <td style="text-align: center; font-weight: 600;">
        ${order.product.quantity}
      </td>
      <td style="font-weight: 700; color: var(--brand-accent); white-space: nowrap;">
        ৳${order.financial.totalAmount}
      </td>
      <td style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap;">
        ${order.paymentMethod}
      </td>
      <td>
        <span class="status-badge ${order.orderStatus}">${order.orderStatus}</span>
      </td>
      <td style="white-space: nowrap;">
        <button type="button" class="btn btn-outline btn-sm view-order-btn" data-id="${order.orderId}">
          ✏️ এডিট / বিস্তারিত
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  tbody.querySelectorAll(".view-order-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const orderId = btn.getAttribute("data-id");
      openOrderDetailModal(orderId);
    });
  });
}

/* ============================================================
   7. FULL A TO Z ORDER DETAILS MODAL (ALL FIELDS EDITABLE)
   ============================================================ */

function initDetailModalHandlers() {
  const modal = document.getElementById("detailModal");
  const closeBtn = document.getElementById("closeDetailModalBtn");
  const cancelBtn = document.getElementById("cancelEditBtn");
  const form = document.getElementById("orderFullEditForm");
  const autoRecalcBtn = document.getElementById("autoRecalcBtn");
  const deleteOrderBtn = document.getElementById("deleteOrderBtn");

  if (closeBtn && modal) closeBtn.addEventListener("click", () => closeDetailModal());
  if (cancelBtn && modal) cancelBtn.addEventListener("click", () => closeDetailModal());

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeDetailModal();
    });
  }

  // Auto recalculate total button inside order edit modal
  if (autoRecalcBtn) {
    autoRecalcBtn.addEventListener("click", () => {
      const qty = parseInt(document.getElementById("editProdQty")?.value || 1, 10);
      const unit = parseFloat(document.getElementById("editUnitPrice")?.value || 0);
      const delivery = parseFloat(document.getElementById("editDeliveryCharge")?.value || 0);
      const total = (qty * unit) + delivery;
      document.getElementById("editTotalAmount").value = total;
      showToast(`মোট হিসাব সম্পন্ন: ৳${total}`, "info");
    });
  }

  // Handle Full Form Save (A to Z)
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleSaveAllOrderChanges();
    });
  }

  // Delete Order
  if (deleteOrderBtn) {
    deleteOrderBtn.addEventListener("click", async () => {
      if (!adminState.selectedOrder) return;
      const orderId = adminState.selectedOrder.orderId;
      const confirmDelete = window.confirm(`আপনি কি নিশ্চিতভাবে অর্ডার ${orderId} ডিলিট করতে চান? এই ক্রিয়াটি অপরিবর্তনীয়।`);
      if (!confirmDelete) return;

      await handleDeleteOrderAction(orderId);
    });
  }
}

function openOrderDetailModal(orderId) {
  const order = adminState.orders.find(o => o.orderId === orderId);
  if (!order) return;

  adminState.selectedOrder = order;

  document.getElementById("detailOrderId").textContent = order.orderId;
  
  const statusBadge = document.getElementById("detailStatusBadge");
  if (statusBadge) {
    statusBadge.className = `status-badge ${order.orderStatus}`;
    statusBadge.textContent = order.orderStatus;
  }

  // Populate Editable Customer Fields
  document.getElementById("editCustName").value = order.customer.name || "";
  document.getElementById("editCustPhone").value = order.customer.phone || "";
  document.getElementById("editCustDivision").value = order.customer.division || "ঢাকা";
  document.getElementById("editCustDistrict").value = order.customer.district || "";
  document.getElementById("editCustUpazila").value = order.customer.upazila || "";
  document.getElementById("editCustAddress").value = order.customer.address || "";

  const phoneLink = document.getElementById("detailCustPhoneLink");
  if (phoneLink) {
    phoneLink.href = `tel:${order.customer.phone}`;
  }

  // Populate Editable Product & Financial Fields
  document.getElementById("editProdName").value = order.product.name || "";
  document.getElementById("editProdVariant").value = order.product.variant || "";
  document.getElementById("editProdQty").value = order.product.quantity || 1;
  document.getElementById("editUnitPrice").value = order.financial.unitPrice || 999;
  document.getElementById("editDeliveryCharge").value = order.financial.deliveryCharge || 80;
  document.getElementById("editTotalAmount").value = order.financial.totalAmount || 1079;
  document.getElementById("editPaymentMethod").value = order.paymentMethod || "Cash on Delivery";

  // Customer Note, Status & Admin Note
  document.getElementById("editCustNote").value = order.customerNote || "";
  document.getElementById("detailStatusSelect").value = order.orderStatus || "Pending";
  document.getElementById("detailAdminNote").value = order.adminNote || "";

  // Timestamps
  document.getElementById("detailCreatedAt").textContent = order.createdAt;
  document.getElementById("detailUpdatedAt").textContent = order.updatedAt;

  const modal = document.getElementById("detailModal");
  if (modal) {
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }
}

function closeDetailModal() {
  const modal = document.getElementById("detailModal");
  if (modal) {
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }
  adminState.selectedOrder = null;
}

/**
 * Saves all edited fields (Customer info, Product, Quantities, Pricing, Notes, Status)
 */
async function handleSaveAllOrderChanges() {
  if (!adminState.selectedOrder) return;
  const orderId = adminState.selectedOrder.orderId;
  const saveBtn = document.getElementById("saveAllOrderChangesBtn");

  const qty = parseInt(document.getElementById("editProdQty").value || 1, 10);
  const unitPrice = parseFloat(document.getElementById("editUnitPrice").value || 0);
  const deliveryCharge = parseFloat(document.getElementById("editDeliveryCharge").value || 0);
  const subtotal = qty * unitPrice;
  const totalAmount = parseFloat(document.getElementById("editTotalAmount").value || (subtotal + deliveryCharge));
  const newStatus = document.getElementById("detailStatusSelect").value;

  const updatedPayload = {
    action: "updateOrderFull",
    token: adminState.token,
    orderId: orderId,
    customer: {
      name: document.getElementById("editCustName").value.trim(),
      phone: document.getElementById("editCustPhone").value.trim(),
      division: document.getElementById("editCustDivision").value,
      district: document.getElementById("editCustDistrict").value.trim(),
      upazila: document.getElementById("editCustUpazila").value.trim(),
      address: document.getElementById("editCustAddress").value.trim()
    },
    product: {
      name: document.getElementById("editProdName").value.trim(),
      variant: document.getElementById("editProdVariant").value.trim(),
      color: document.getElementById("editProdVariant").value.trim(),
      quantity: qty
    },
    financial: {
      unitPrice: unitPrice,
      subtotal: subtotal,
      discount: 0,
      deliveryCharge: deliveryCharge,
      totalAmount: totalAmount
    },
    paymentMethod: document.getElementById("editPaymentMethod").value,
    orderStatus: newStatus,
    customerNote: document.getElementById("editCustNote").value.trim(),
    adminNote: document.getElementById("detailAdminNote").value.trim(),
    updatedAt: new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
  };

  saveBtn.disabled = true;
  saveBtn.textContent = "সংরক্ষণ হচ্ছে...";

  try {
    if (adminState.isDemoMode) {
      await new Promise(r => setTimeout(r, 400));
      updateLocalOrderRecord(orderId, updatedPayload);
    } else {
      const res = await fetch(API_CONFIG.baseUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(updatedPayload)
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "আপডেট ব্যর্থ হয়েছে");
    }

    // Update in-memory state
    const idx = adminState.orders.findIndex(o => o.orderId === orderId);
    if (idx !== -1) {
      adminState.orders[idx] = { ...adminState.orders[idx], ...updatedPayload };
    }

    applyFiltersAndRender();
    updateMetrics();
    showToast(`অর্ডার ${orderId}-এর সমস্ত তথ্য সফলভাবে আপডেট হয়েছে!`, "success");
    closeDetailModal();

  } catch (err) {
    console.error("Save all changes error:", err);
    showToast(`আপডেট ব্যর্থ: ${err.message}`, "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "💾 সম্পূর্ণ অর্ডার আপডেট সেভ করুন (Save A-Z)";
  }
}

async function handleDeleteOrderAction(orderId) {
  try {
    if (adminState.isDemoMode) {
      await new Promise(r => setTimeout(r, 300));
      deleteLocalOrderRecord(orderId);
    } else {
      const res = await fetch(API_CONFIG.baseUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "deleteOrder",
          orderId: orderId,
          token: adminState.token
        })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "ডিলিট করা যায়নি");
    }

    adminState.orders = adminState.orders.filter(o => o.orderId !== orderId);
    applyFiltersAndRender();
    updateMetrics();
    closeDetailModal();
    showToast(`অর্ডার ${orderId} সফলভাবে ডিলিট করা হয়েছে।`, "success");

  } catch (err) {
    console.error("Delete order error:", err);
    showToast(`অর্ডার ডিলিট ব্যর্থ: ${err.message}`, "error");
  }
}

function updateLocalOrderRecord(orderId, updates) {
  const localStored = JSON.parse(localStorage.getItem("bd_shop_demo_orders") || "[]");
  const idx = localStored.findIndex(o => (o.orderId || o["Order ID"]) === orderId);
  if (idx !== -1) {
    localStored[idx] = { ...localStored[idx], ...updates };
  } else {
    localStored.unshift({ orderId, ...updates });
  }
  localStorage.setItem("bd_shop_demo_orders", JSON.stringify(localStored));
}

function deleteLocalOrderRecord(orderId) {
  const localStored = JSON.parse(localStorage.getItem("bd_shop_demo_orders") || "[]");
  const filtered = localStored.filter(o => (o.orderId || o["Order ID"]) !== orderId);
  localStorage.setItem("bd_shop_demo_orders", JSON.stringify(filtered));
}

/* ============================================================
   8. TAB 2: PRODUCT A TO Z CONFIGURATION
   ============================================================ */

function initProductConfigForm() {
  const form = document.getElementById("productConfigForm");
  const resetBtn = document.getElementById("resetProductBtn");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleSaveProductConfig();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("আপনি কি ডিফল্ট প্রোডাক্ট কনফিগারেশন রিস্টোর করতে চান?")) {
        localStorage.removeItem("bd_shop_custom_product");
        loadProductConfigIntoForm();
        showToast("ডিফল্ট প্রোডাক্ট রিস্টোর করা হয়েছে।", "info");
      }
    });
  }
}

function loadProductConfigIntoForm() {
  const saved = JSON.parse(localStorage.getItem("bd_shop_custom_product") || "null");

  const defaultProd = {
    name: "আল্ট্রা প্রিমিয়াম স্মার্টওয়াচ (AMOLED Display & Bluetooth Calling)",
    shortDescription: "টাইটানিয়াম অ্যালয় বডি, স্পষ্ট ব্লুটুথ কলিং ও দীর্ঘস্থায়ী ব্যাটারি ব্যাকআপ সহ প্রিমিয়াম স্মার্টওয়াচ।",
    description: "আল্ট্রা প্রিমিয়াম স্মার্টওয়াচটিতে রয়েছে ২.০২ ইঞ্চি সুপার ব্রাইট অ্যামোলেড ডিসপ্লে, ব্লুটুথ ৫.২ এইচডি কলিং, মাল্টি-স্পোর্টস হেলথ ট্র্যাকিং এবং ওয়্যারলেস ফাস্ট চার্জিং।",
    salePrice: 999,
    originalPrice: 1500,
    discount: 34,
    offerTitle: "বিশেষ অফার",
    offerText: "আজকের অর্ডারে পাচ্ছেন ৩৪% বিশেষ ছাড় এবং নিশ্চিত ক্যাশ অন ডেলিভারি!",
    images: [
      "assets/images/product-1.svg",
      "assets/images/product-2.svg",
      "assets/images/product-3.svg",
      "assets/images/product-4.svg"
    ],
    variants: [
      "অরেঞ্জ আলপাইন (Orange Alpine)",
      "মিডনাইট ব্ল্যাক (Midnight Black)",
      "ওশান ব্লু (Ocean Blue)"
    ]
  };

  const p = saved || defaultProd;

  document.getElementById("cfgProductName").value = p.name || "";
  document.getElementById("cfgProductShortDesc").value = p.shortDescription || "";
  document.getElementById("cfgSalePrice").value = p.salePrice || 999;
  document.getElementById("cfgOriginalPrice").value = p.originalPrice || 1500;
  document.getElementById("cfgDiscount").value = p.discount || 34;
  document.getElementById("cfgProductDesc").value = p.description || "";
  document.getElementById("cfgOfferTitle").value = p.offerTitle || p.offer?.title || "";
  document.getElementById("cfgOfferText").value = p.offerText || p.offer?.text || "";
  document.getElementById("cfgImages").value = (p.images || []).join("\n");
  document.getElementById("cfgVariants").value = (p.variants || []).map(v => typeof v === 'string' ? v : v.name).join("\n");
}

async function handleSaveProductConfig() {
  const saveBtn = document.getElementById("saveProductBtn");
  const statusSpan = document.getElementById("productSaveStatus");

  const imagesArr = document.getElementById("cfgImages").value
    .split("\n")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const variantsArr = document.getElementById("cfgVariants").value
    .split("\n")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const productData = {
    id: "PROD-ULTRA-01",
    name: document.getElementById("cfgProductName").value.trim(),
    shortDescription: document.getElementById("cfgProductShortDesc").value.trim(),
    salePrice: parseFloat(document.getElementById("cfgSalePrice").value || 999),
    originalPrice: parseFloat(document.getElementById("cfgOriginalPrice").value || 1500),
    discount: parseFloat(document.getElementById("cfgDiscount").value || 0),
    description: document.getElementById("cfgProductDesc").value.trim(),
    offerTitle: document.getElementById("cfgOfferTitle").value.trim(),
    offerText: document.getElementById("cfgOfferText").value.trim(),
    images: imagesArr.length > 0 ? imagesArr : ["assets/images/product-1.svg"],
    variants: variantsArr.length > 0 ? variantsArr : ["অরেঞ্জ আলপাইন (Orange Alpine)"]
  };

  saveBtn.disabled = true;
  saveBtn.textContent = "সংরক্ষণ হচ্ছে...";

  try {
    // 1. Save in localStorage so landing page updates immediately!
    localStorage.setItem("bd_shop_custom_product", JSON.stringify(productData));

    // 2. If Google Apps Script is configured, save to backend as well
    if (!adminState.isDemoMode) {
      await fetch(API_CONFIG.baseUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "saveProduct",
          token: adminState.token,
          product: productData
        })
      });
    }

    if (statusSpan) {
      statusSpan.style.display = "inline";
      setTimeout(() => statusSpan.style.display = "none", 4000);
    }

    showToast("পণ্য ও মূল্যের সমস্ত পরিবর্তন সফলভাবে সেভ হয়েছে!", "success");

  } catch (err) {
    console.error("Save product error:", err);
    showToast(`পণ্য সেভ ব্যর্থ: ${err.message}`, "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "💾 পণ্য ও মূল্যের তথ্য সেভ করুন";
  }
}

/* ============================================================
   9. TAB 3: STORE & DELIVERY SETTINGS CONFIGURATION
   ============================================================ */

function initStoreSettingsForm() {
  const form = document.getElementById("storeSettingsForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleSaveStoreSettings();
    });
  }
}

function loadStoreSettingsIntoForm() {
  const savedSettings = JSON.parse(localStorage.getItem("bd_shop_custom_settings") || "{}");

  document.getElementById("cfgStoreName").value = savedSettings.storeName || "বিডি গ্যাজেট জোন";
  document.getElementById("cfgHelpline").value = savedSettings.helplinePhone || "01700-000000";
  document.getElementById("cfgWhatsapp").value = savedSettings.whatsapp || "8801700000000";
  document.getElementById("cfgCurrency").value = savedSettings.currency || "৳";
  document.getElementById("cfgDeliveryInside").value = savedSettings.deliveryInside !== undefined ? savedSettings.deliveryInside : 80;
  document.getElementById("cfgDeliveryOutside").value = savedSettings.deliveryOutside !== undefined ? savedSettings.deliveryOutside : 120;
  document.getElementById("cfgApiUrl").value = localStorage.getItem("bd_shop_api_url") || "";
}

async function handleSaveStoreSettings() {
  const saveBtn = document.getElementById("saveSettingsBtn");
  const statusSpan = document.getElementById("settingsSaveStatus");

  const settingsData = {
    storeName: document.getElementById("cfgStoreName").value.trim(),
    helplinePhone: document.getElementById("cfgHelpline").value.trim(),
    whatsapp: document.getElementById("cfgWhatsapp").value.trim(),
    currency: document.getElementById("cfgCurrency").value.trim() || "৳",
    deliveryInside: parseFloat(document.getElementById("cfgDeliveryInside").value || 80),
    deliveryOutside: parseFloat(document.getElementById("cfgDeliveryOutside").value || 120)
  };

  const newApiUrl = document.getElementById("cfgApiUrl").value.trim();

  saveBtn.disabled = true;
  saveBtn.textContent = "সংরক্ষণ হচ্ছে...";

  try {
    // 1. Save locally
    localStorage.setItem("bd_shop_custom_settings", JSON.stringify(settingsData));
    if (newApiUrl) {
      localStorage.setItem("bd_shop_api_url", newApiUrl);
      API_CONFIG.baseUrl = newApiUrl;
    } else {
      localStorage.removeItem("bd_shop_api_url");
    }

    checkBackendStatus();

    // 2. Sync to Google Sheets if connected
    if (!adminState.isDemoMode) {
      await fetch(API_CONFIG.baseUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "saveSettings",
          token: adminState.token,
          settings: {
            STORE_NAME: settingsData.storeName,
            HELPLINE_PHONE: settingsData.helplinePhone,
            WHATSAPP_NUMBER: settingsData.whatsapp,
            INSIDE_DHAKA_DELIVERY: settingsData.deliveryInside,
            OUTSIDE_DHAKA_DELIVERY: settingsData.deliveryOutside
          }
        })
      });
    }

    if (statusSpan) {
      statusSpan.style.display = "inline";
      setTimeout(() => statusSpan.style.display = "none", 4000);
    }

    showToast("শপ ও ডেলিভারি চার্জ সেটিংস সফলভাবে আপডেট হয়েছে!", "success");

  } catch (err) {
    console.error("Save settings error:", err);
    showToast(`সেটিংস সেভ ব্যর্থ: ${err.message}`, "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "💾 শপ ও ডেলিভারি সেটিংস সেভ করুন";
  }
}

/* ============================================================
   10. CSV EXPORT (WITH UTF-8 BOM FOR BENGALI CHARACTERS)
   ============================================================ */

function exportOrdersToCsv() {
  const orders = adminState.filteredOrders;
  if (!orders || orders.length === 0) {
    showToast("এক্সপোর্ট করার জন্য কোনো অর্ডার নেই।", "error");
    return;
  }

  const headers = [
    "Order ID", "Created At", "Customer Name", "Phone", "Division",
    "District", "Upazila", "Full Address", "Product Name", "Variant",
    "Quantity", "Unit Price", "Subtotal", "Delivery Charge", "Total Amount",
    "Payment Method", "Order Status", "Customer Note", "Admin Note"
  ];

  const rows = orders.map(o => [
    o.orderId,
    `"${o.createdAt}"`,
    `"${escapeCsv(o.customer.name)}"`,
    `"${o.customer.phone}"`,
    `"${escapeCsv(o.customer.division)}"`,
    `"${escapeCsv(o.customer.district)}"`,
    `"${escapeCsv(o.customer.upazila)}"`,
    `"${escapeCsv(o.customer.address)}"`,
    `"${escapeCsv(o.product.name)}"`,
    `"${escapeCsv(o.product.variant)}"`,
    o.product.quantity,
    o.financial.unitPrice,
    o.financial.subtotal,
    o.financial.deliveryCharge,
    o.financial.totalAmount,
    `"${o.paymentMethod}"`,
    `"${o.orderStatus}"`,
    `"${escapeCsv(o.customerNote)}"`,
    `"${escapeCsv(o.adminNote)}"`
  ]);

  let csvContent = headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url);
  link.setAttribute("download", `Orders_Export_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("CSV ফাইল সফলভাবে ডাউনলোড হয়েছে।", "success");
}

function escapeCsv(str) {
  if (!str) return "";
  return String(str).replace(/"/g, '""');
}

/* ============================================================
   11. UTILITIES
   ============================================================ */

function toBengaliNumerals(number) {
  if (number === null || number === undefined) return "০";
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return number.toString().replace(/\d/g, d => bengaliDigits[parseInt(d, 10)]);
}

function formatDate(dateStr) {
  if (!dateStr || dateStr === "-") return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return dateStr;
  }
}

function escapeHtml(text) {
  if (!text) return "";
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
