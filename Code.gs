/**
 * ============================================================
 * SINGLE PRODUCT E-COMMERCE ENGINE — GOOGLE APPS SCRIPT BACKEND
 * File: Code.gs
 * Timezone: Asia/Dhaka
 * Database: Google Sheets (6 Tabular Sheets)
 * ============================================================
 */

// 1. CONFIGURATION
// If left empty, ScriptApp uses the Spreadsheet bound to this script (ActiveSpreadsheet).
// Or paste your Google Sheet ID here:
const CONFIG = {
  SPREADSHEET_ID: "", // e.g. "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" or leave empty if bound
  TIMEZONE: "Asia/Dhaka",
  JWT_SECRET: "BD_SHOP_SECRET_SALT_2026_KEY", // Used for token signature
  TOKEN_EXPIRY_HOURS: 24,

  // Fallback financial settings (Overridden by 'Settings' sheet if configured)
  DEFAULT_SALE_PRICE: 999,
  DEFAULT_ORIGINAL_PRICE: 1500,
  DEFAULT_INSIDE_DHAKA_DELIVERY: 80,
  DEFAULT_OUTSIDE_DHAKA_DELIVERY: 120,
  DEFAULT_STORE_NAME: "বিডি গ্যাজেট জোন",
  DEFAULT_WHATSAPP: "8801700000000"
};

// 2. SHEET NAMES
const SHEETS = {
  ORDERS: "Orders",
  SETTINGS: "Settings",
  ADMINS: "Admins",
  REVIEWS: "Reviews",
  FAQ: "FAQ",
  PRODUCTS: "Products"
};

/* ============================================================
   ROUTING: doGet and doPost
   ============================================================ */

/**
 * Handles HTTP GET Requests
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = params.action || "";

    switch (action) {
      case "getSettings":
        return jsonResponse(getSettings());

      case "getProduct":
        return jsonResponse(getProduct());

      case "getOrders":
        return handleGetOrders(params.token);

      case "getOrder":
        return handleGetOrder(params.id, params.token);

      case "ping":
        return jsonResponse({ status: "online", time: getFormattedTimestamp() });

      default:
        return jsonResponse({
          service: "BD Single Product E-commerce Backend",
          status: "ready",
          version: "1.0.0"
        });
    }
  } catch (err) {
    return errorResponse("GET Error: " + err.toString());
  }
}

/**
 * Handles HTTP POST Requests
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        // Form encoded fallback
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || "";

    switch (action) {
      case "createOrder":
        return handleCreateOrder(payload);

      case "adminLogin":
        return handleAdminLogin(payload);

      case "updateOrderStatus":
        return handleUpdateStatus(payload);

      case "updateAdminNote":
        return handleUpdateAdminNote(payload);

      case "updateOrderFull":
        return handleUpdateOrderFull(payload);

      case "deleteOrder":
        return handleDeleteOrder(payload);

      case "saveSettings":
        return handleSaveSettings(payload);

      case "saveProduct":
        return handleSaveProduct(payload);

      default:
        return errorResponse("Invalid or missing action in request");
    }
  } catch (err) {
    return errorResponse("POST Error: " + err.toString());
  }
}

/* ============================================================
   ORDER CREATION HANDLER (CRITICAL SECURITY & PRICING)
   ============================================================ */

function handleCreateOrder(payload) {
  // Concurrency Lock: Prevent duplicate Order IDs or race conditions
  const lock = LockService.getScriptLock();
  const hasLock = lock.tryLock(10000); // 10 seconds timeout

  if (!hasLock) {
    return errorResponse("সার্ভার ব্যস্ত রয়েছে। অনুগ্রহ করে ৫ সেকেন্ড পর আবার চেষ্টা করুন।");
  }

  try {
    const cust = payload.customer || {};
    const prod = payload.product || {};
    const clientRequestId = payload.clientRequestId || "";

    // 1. Validation
    const validation = validateOrderData(cust, prod);
    if (!validation.valid) {
      return errorResponse(validation.message);
    }

    const sheet = getSheet(SHEETS.ORDERS);
    if (!sheet) {
      return errorResponse("Orders sheet is not found. Please run setupDatabase() first.");
    }

    // 2. Anti-duplicate Check via Client Request ID
    if (clientRequestId && isDuplicateRequest(sheet, clientRequestId)) {
      return jsonResponse({
        success: true,
        message: "অর্ডার ইতিমধ্যে গৃহীত হয়েছে (Duplicate prevented).",
        data: { clientRequestId: clientRequestId }
      });
    }

    // 3. Independent Server-Side Financial Recalculation
    // NEVER TRUST CLIENT-SENT PRICES OR TOTALS!
    const settings = getSettingsMap();
    const salePrice = settings.SALE_PRICE ? Number(settings.SALE_PRICE) : CONFIG.DEFAULT_SALE_PRICE;
    const qty = Math.max(1, Math.min(10, parseInt(prod.quantity, 10) || 1));
    const subtotal = salePrice * qty;

    // Delivery charge calculation
    const insideDhakaFee = settings.INSIDE_DHAKA_DELIVERY ? Number(settings.INSIDE_DHAKA_DELIVERY) : CONFIG.DEFAULT_INSIDE_DHAKA_DELIVERY;
    const outsideDhakaFee = settings.OUTSIDE_DHAKA_DELIVERY ? Number(settings.OUTSIDE_DHAKA_DELIVERY) : CONFIG.DEFAULT_OUTSIDE_DHAKA_DELIVERY;
    
    const isInsideDhaka = (cust.district === "ঢাকা" || cust.division === "ঢাকা");
    const deliveryCharge = isInsideDhaka ? insideDhakaFee : outsideDhakaFee;
    const discount = 0; // Server-controlled discount if applicable
    const totalAmount = subtotal + deliveryCharge - discount;

    // 4. Generate Server-Side Unique Order ID
    const orderId = generateOrderId(sheet);
    const now = getFormattedTimestamp();

    // 5. Append Row to Orders Sheet
    // Column Order:
    // Order ID | Created At | Updated At | Customer Name | Phone | Division | District | Upazila | Full Address | Product Name | Variant | Color | Size | Quantity | Unit Price | Subtotal | Discount | Delivery Charge | Total Amount | Payment Method | Order Status | Customer Note | Admin Note | Client Request ID
    const rowData = [
      orderId,
      now,
      now,
      cust.name,
      cust.phone,
      cust.division,
      cust.district,
      cust.upazila,
      cust.address,
      prod.name || settings.PRODUCT_NAME || "আল্ট্রা প্রিমিয়াম স্মার্টওয়াচ",
      prod.variant || "Standard",
      prod.color || "-",
      prod.size || "-",
      qty,
      salePrice,
      subtotal,
      discount,
      deliveryCharge,
      totalAmount,
      "Cash on Delivery",
      "Pending", // Authoritative initial status
      payload.note || "",
      "", // Initial Admin Note
      clientRequestId
    ];

    sheet.appendRow(rowData);

    return jsonResponse({
      success: true,
      message: "অর্ডার সফলভাবে গ্রহণ করা হয়েছে",
      data: {
        orderId: orderId,
        totalAmount: totalAmount,
        deliveryCharge: deliveryCharge,
        createdAt: now
      }
    });

  } catch (err) {
    return errorResponse("Order creation failed: " + err.toString());
  } finally {
    lock.releaseLock();
  }
}

/**
 * Checks if a clientRequestId has already been written
 */
function isDuplicateRequest(sheet, clientRequestId) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return false;
  const clientReqIdCol = 23; // 24th column (0-indexed 23)
  for (let i = 1; i < data.length; i++) {
    if (data[i][clientReqIdCol] === clientRequestId) {
      return true;
    }
  }
  return false;
}

/**
 * Generates authoritative sequential Order ID
 * Format: SP-YYYYMMDD-XXXXXX
 */
function generateOrderId(sheet) {
  const dateStr = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd");
  const lastRow = sheet.getLastRow();
  let nextSeq = 1;

  if (lastRow > 1) {
    const prevOrders = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = prevOrders.length - 1; i >= 0; i--) {
      const id = String(prevOrders[i][0]);
      if (id.startsWith("SP-" + dateStr)) {
        const parts = id.split("-");
        if (parts.length === 3) {
          const num = parseInt(parts[2], 10);
          if (!isNaN(num)) {
            nextSeq = num + 1;
            break;
          }
        }
      }
    }
  }

  const seqStr = String(nextSeq).padStart(6, "0");
  return "SP-" + dateStr + "-" + seqStr;
}

/* ============================================================
   ADMIN AUTHENTICATION & MANAGEMENT
   ============================================================ */

function handleAdminLogin(payload) {
  const username = (payload.username || "").trim();
  const password = (payload.password || "").trim();

  if (!username || !password) {
    return errorResponse("Username and password are required.");
  }

  const sheet = getSheet(SHEETS.ADMINS);
  if (!sheet) {
    return errorResponse("Admins table not found.");
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return errorResponse("No registered admins found. Run setupDatabase().");
  }

  const hashedInput = hashPassword(password);
  let authenticatedAdmin = null;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const uName = String(row[1]).trim();
    const passHash = String(row[2]).trim();
    const role = row[3];
    const active = row[4];

    if (uName.toLowerCase() === username.toLowerCase() && (active === true || active === "TRUE" || active === 1)) {
      if (passHash === hashedInput) {
        authenticatedAdmin = {
          id: row[0],
          username: uName,
          role: role
        };
        break;
      }
    }
  }

  if (!authenticatedAdmin) {
    return errorResponse("ভুল ইউজারনেম অথবা পাসওয়ার্ড!");
  }

  // Generate short-lived token
  const token = generateToken(authenticatedAdmin.username, authenticatedAdmin.role);

  return jsonResponse({
    success: true,
    message: "Login successful",
    data: {
      token: token,
      admin: authenticatedAdmin
    }
  });
}

function handleGetOrders(token) {
  const auth = verifyToken(token);
  if (!auth.valid) {
    return errorResponse("Unauthorized: Invalid or expired token", 401);
  }

  const sheet = getSheet(SHEETS.ORDERS);
  if (!sheet) return errorResponse("Orders sheet not found");

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return jsonResponse({ success: true, data: { orders: [] } });
  }

  const headers = data[0];
  const orders = [];

  // Iterate in reverse for latest first
  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    if (!row[0]) continue; // Skip empty rows
    const orderObj = {};
    for (let h = 0; h < headers.length; h++) {
      let val = row[h];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
      }
      orderObj[headers[h]] = val;
    }
    orders.push(orderObj);
  }

  return jsonResponse({
    success: true,
    data: { orders: orders }
  });
}

function handleGetOrder(orderId, token) {
  const auth = verifyToken(token);
  if (!auth.valid) return errorResponse("Unauthorized", 401);

  const sheet = getSheet(SHEETS.ORDERS);
  if (!sheet) return errorResponse("Orders sheet not found");

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === orderId) {
      const orderObj = {};
      for (let h = 0; h < headers.length; h++) {
        let val = data[i][h];
        if (val instanceof Date) {
          val = Utilities.formatDate(val, CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
        }
        orderObj[headers[h]] = val;
      }
      return jsonResponse({ success: true, data: { order: orderObj } });
    }
  }

  return errorResponse("Order not found with ID: " + orderId);
}

function handleUpdateStatus(payload) {
  const auth = verifyToken(payload.token);
  if (!auth.valid) return errorResponse("Unauthorized", 401);

  const orderId = payload.orderId;
  const newStatus = payload.status;

  const validStatuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"];
  if (!validStatuses.includes(newStatus)) {
    return errorResponse("Invalid status value");
  }

  const sheet = getSheet(SHEETS.ORDERS);
  const data = sheet.getDataRange().getValues();
  const statusCol = 21; // 'Order Status' (1-based index 21, 0-based 20)
  const updatedCol = 3; // 'Updated At' (1-based index 3, 0-based 2)

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === orderId) {
      const now = getFormattedTimestamp();
      sheet.getRange(i + 1, statusCol).setValue(newStatus);
      sheet.getRange(i + 1, updatedCol).setValue(now);

      return jsonResponse({
        success: true,
        message: "Status updated to " + newStatus,
        data: { orderId: orderId, status: newStatus, updatedAt: now }
      });
    }
  }

  return errorResponse("Order not found");
}

function handleUpdateAdminNote(payload) {
  const auth = verifyToken(payload.token);
  if (!auth.valid) return errorResponse("Unauthorized", 401);

  const orderId = payload.orderId;
  const adminNote = payload.adminNote || "";

  const sheet = getSheet(SHEETS.ORDERS);
  const data = sheet.getDataRange().getValues();
  const noteCol = 23; // 'Admin Note' (1-based index 23)
  const updatedCol = 3;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === orderId) {
      const now = getFormattedTimestamp();
      sheet.getRange(i + 1, noteCol).setValue(adminNote);
      sheet.getRange(i + 1, updatedCol).setValue(now);

      return jsonResponse({
        success: true,
        message: "Admin note saved",
        data: { orderId: orderId, adminNote: adminNote, updatedAt: now }
      });
    }
  }

  return errorResponse("Order not found");
}

/**
 * FULL A TO Z ORDER DETAILS UPDATE
 * Allows editing all customer info, product info, pricing, delivery, notes, and status
 */
function handleUpdateOrderFull(payload) {
  const auth = verifyToken(payload.token);
  if (!auth.valid) return errorResponse("Unauthorized", 401);

  const orderId = payload.orderId;
  if (!orderId) return errorResponse("Order ID is required");

  const sheet = getSheet(SHEETS.ORDERS);
  if (!sheet) return errorResponse("Orders sheet not found");

  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(orderId)) {
      rowIndex = i + 1; // 1-based index in Sheet
      break;
    }
  }

  if (rowIndex === -1) {
    return errorResponse("Order not found with ID: " + orderId);
  }

  const cust = payload.customer || {};
  const prod = payload.product || {};
  const financial = payload.financial || {};
  const now = getFormattedTimestamp();

  // Column Order (1-based index):
  // 1: Order ID | 2: Created At | 3: Updated At | 4: Customer Name | 5: Phone |
  // 6: Division | 7: District | 8: Upazila | 9: Full Address | 10: Product Name |
  // 11: Variant | 12: Color | 13: Size | 14: Quantity | 15: Unit Price |
  // 16: Subtotal | 17: Discount | 18: Delivery Charge | 19: Total Amount |
  // 20: Payment Method | 21: Order Status | 22: Customer Note | 23: Admin Note | 24: Client Request ID

  if (cust.name) sheet.getRange(rowIndex, 4).setValue(cust.name);
  if (cust.phone) sheet.getRange(rowIndex, 5).setValue(cust.phone);
  if (cust.division) sheet.getRange(rowIndex, 6).setValue(cust.division);
  if (cust.district) sheet.getRange(rowIndex, 7).setValue(cust.district);
  if (cust.upazila) sheet.getRange(rowIndex, 8).setValue(cust.upazila);
  if (cust.address) sheet.getRange(rowIndex, 9).setValue(cust.address);

  if (prod.name) sheet.getRange(rowIndex, 10).setValue(prod.name);
  if (prod.variant !== undefined) sheet.getRange(rowIndex, 11).setValue(prod.variant);
  if (prod.color !== undefined) sheet.getRange(rowIndex, 12).setValue(prod.color);
  if (prod.size !== undefined) sheet.getRange(rowIndex, 13).setValue(prod.size);
  if (prod.quantity !== undefined) sheet.getRange(rowIndex, 14).setValue(Number(prod.quantity));

  if (financial.unitPrice !== undefined) sheet.getRange(rowIndex, 15).setValue(Number(financial.unitPrice));
  if (financial.subtotal !== undefined) sheet.getRange(rowIndex, 16).setValue(Number(financial.subtotal));
  if (financial.discount !== undefined) sheet.getRange(rowIndex, 17).setValue(Number(financial.discount));
  if (financial.deliveryCharge !== undefined) sheet.getRange(rowIndex, 18).setValue(Number(financial.deliveryCharge));
  if (financial.totalAmount !== undefined) sheet.getRange(rowIndex, 19).setValue(Number(financial.totalAmount));

  if (payload.paymentMethod) sheet.getRange(rowIndex, 20).setValue(payload.paymentMethod);
  if (payload.orderStatus) sheet.getRange(rowIndex, 21).setValue(payload.orderStatus);
  if (payload.customerNote !== undefined) sheet.getRange(rowIndex, 22).setValue(payload.customerNote);
  if (payload.adminNote !== undefined) sheet.getRange(rowIndex, 23).setValue(payload.adminNote);

  // Update timestamp
  sheet.getRange(rowIndex, 3).setValue(now);

  return jsonResponse({
    success: true,
    message: "অর্ডারের সমস্ত তথ্য (A to Z) সফলভাবে আপডেট করা হয়েছে",
    data: { orderId: orderId, updatedAt: now }
  });
}

/**
 * DELETE ORDER ROW
 */
function handleDeleteOrder(payload) {
  const auth = verifyToken(payload.token);
  if (!auth.valid) return errorResponse("Unauthorized", 401);

  const orderId = payload.orderId;
  if (!orderId) return errorResponse("Order ID is required");

  const sheet = getSheet(SHEETS.ORDERS);
  if (!sheet) return errorResponse("Orders sheet not found");

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(orderId)) {
      sheet.deleteRow(i + 1);
      return jsonResponse({
        success: true,
        message: "অর্ডার " + orderId + " সফলভাবে ডিলিট করা হয়েছে"
      });
    }
  }

  return errorResponse("Order not found with ID: " + orderId);
}

/**
 * SAVE STORE & DELIVERY SETTINGS
 */
function handleSaveSettings(payload) {
  const auth = verifyToken(payload.token);
  if (!auth.valid) return errorResponse("Unauthorized", 401);

  const settings = payload.settings || {};
  const sheet = getSheet(SHEETS.SETTINGS);
  if (!sheet) return errorResponse("Settings sheet not found");

  const existingData = sheet.getDataRange().getValues();
  const keyRowMap = {};
  for (let i = 1; i < existingData.length; i++) {
    const k = String(existingData[i][0]).trim();
    if (k) keyRowMap[k] = i + 1; // 1-based row index
  }

  Object.keys(settings).forEach(key => {
    const val = settings[key];
    if (keyRowMap[key]) {
      sheet.getRange(keyRowMap[key], 2).setValue(val);
    } else {
      sheet.appendRow([key, val]);
    }
  });

  return jsonResponse({
    success: true,
    message: "শপ ও ডেলিভারি সেটিংস সফলভাবে সেভ করা হয়েছে",
    data: { settings: settings }
  });
}

/**
 * SAVE PRODUCT A-Z SETTINGS
 */
function handleSaveProduct(payload) {
  const auth = verifyToken(payload.token);
  if (!auth.valid) return errorResponse("Unauthorized", 401);

  const product = payload.product || {};
  const sheet = getSheet(SHEETS.PRODUCTS);
  if (!sheet) return errorResponse("Products sheet not found");

  // Headers: Product ID | Name | Description | Original Price | Sale Price | Discount | Stock | Active
  const lastRow = sheet.getLastRow();
  const rowData = [
    product.id || "PROD-01",
    product.name || "",
    product.description || "",
    Number(product.originalPrice || 0),
    Number(product.salePrice || 0),
    product.discount || "",
    product.stock !== false,
    product.active !== false
  ];

  if (lastRow > 1) {
    sheet.getRange(2, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  // Also sync core keys into Settings sheet for fast lookup
  const settingsSheet = getSheet(SHEETS.SETTINGS);
  if (settingsSheet) {
    const existing = settingsSheet.getDataRange().getValues();
    const map = {};
    for (let i = 1; i < existing.length; i++) {
      map[String(existing[i][0]).trim()] = i + 1;
    }

    const updates = {
      "PRODUCT_NAME": product.name || "",
      "SALE_PRICE": product.salePrice || "",
      "ORIGINAL_PRICE": product.originalPrice || ""
    };

    Object.keys(updates).forEach(k => {
      if (map[k]) {
        settingsSheet.getRange(map[k], 2).setValue(updates[k]);
      } else {
        settingsSheet.appendRow([k, updates[k]]);
      }
    });
  }

  return jsonResponse({
    success: true,
    message: "পণ্যের সমস্ত তথ্য সফলভাবে সেভ করা হয়েছে",
    data: { product: product }
  });
}

/* ============================================================
   VALIDATION, SETTINGS & PRODUCTS
   ============================================================ */

function validateOrderData(customer, product) {
  if (!customer.name || customer.name.toString().trim().length < 2) {
    return { valid: false, message: "গ্রাহকের নাম সঠিকভাবে পূরণ করুন।" };
  }

  const phone = (customer.phone || "").toString().replace(/[\s\-\(\)]/g, "");
  // Normalized 11 digits starting with 01
  const bdRegex = /^01[3-9]\d{8}$/;
  if (!bdRegex.test(phone)) {
    return { valid: false, message: "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।" };
  }

  if (!customer.division || !customer.district || !customer.upazila) {
    return { valid: false, message: "বিভাগ, জেলা এবং উপজেলা সঠিকভাবে নির্বাচন করুন।" };
  }

  if (!customer.address || customer.address.toString().trim().length < 5) {
    return { valid: false, message: "বিস্তারিত ডেলিভারি ঠিকানা প্রদান করুন।" };
  }

  const qty = parseInt(product.quantity, 10);
  if (isNaN(qty) || qty < 1 || qty > 10) {
    return { valid: false, message: "পরিমাণ ১ থেকে ১০ এর মধ্যে হতে হবে।" };
  }

  return { valid: true };
}

function getSettings() {
  const map = getSettingsMap();
  return { success: true, data: { settings: map } };
}

function getSettingsMap() {
  const sheet = getSheet(SHEETS.SETTINGS);
  const map = {};
  if (!sheet) return map;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0]).trim();
    const val = data[i][1];
    if (key) map[key] = val;
  }
  return map;
}

function getProduct() {
  const sheet = getSheet(SHEETS.PRODUCTS);
  if (!sheet) return errorResponse("Products sheet not found");

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return errorResponse("No products configured");

  const headers = data[0];
  const products = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const p = {};
    for (let h = 0; h < headers.length; h++) {
      p[headers[h]] = row[h];
    }
    products.push(p);
  }

  return jsonResponse({ success: true, data: { products: products } });
}

/* ============================================================
   SECURITY & TOKEN HELPERS
   ============================================================ */

function hashPassword(password) {
  const rawBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  let hashStr = "";
  for (let i = 0; i < rawBytes.length; i++) {
    let byteVal = rawBytes[i];
    if (byteVal < 0) byteVal += 256;
    let byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = "0" + byteHex;
    hashStr += byteHex;
  }
  return hashStr;
}

function generateToken(username, role) {
  const expiry = Date.now() + (CONFIG.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  const payload = username + "|" + role + "|" + expiry;
  const signature = Utilities.computeHmacSha256Signature(payload, CONFIG.JWT_SECRET);
  const sigHex = Utilities.base64Encode(signature);
  return Utilities.base64Encode(payload) + "." + sigHex;
}

function verifyToken(tokenStr) {
  if (!tokenStr || typeof tokenStr !== "string") return { valid: false };

  const parts = tokenStr.split(".");
  if (parts.length !== 2) return { valid: false };

  try {
    const decodedPayload = Utilities.newBlob(Utilities.base64Decode(parts[0])).getDataAsString();
    const expectedSig = Utilities.base64Encode(Utilities.computeHmacSha256Signature(decodedPayload, CONFIG.JWT_SECRET));

    if (expectedSig !== parts[1]) {
      return { valid: false, message: "Invalid signature" };
    }

    const [username, role, expiryStr] = decodedPayload.split("|");
    const expiry = parseInt(expiryStr, 10);

    if (Date.now() > expiry) {
      return { valid: false, message: "Token expired" };
    }

    return { valid: true, username: username, role: role };
  } catch (e) {
    return { valid: false, message: e.toString() };
  }
}

/* ============================================================
   GOOGLE SPREADSHEET INITIALIZATION / AUTO-SETUP
   ============================================================ */

/**
 * RUN THIS FUNCTION ONCE IN THE APPS SCRIPT EDITOR TO SETUP DATABASE
 */
function setupDatabase() {
  const ss = getSpreadsheet();

  // 1. ORDERS SHEET
  let ordersSheet = ss.getSheetByName(SHEETS.ORDERS);
  if (!ordersSheet) {
    ordersSheet = ss.insertSheet(SHEETS.ORDERS);
  }
  const orderHeaders = [
    "Order ID", "Created At", "Updated At", "Customer Name", "Phone",
    "Division", "District", "Upazila", "Full Address", "Product Name",
    "Variant", "Color", "Size", "Quantity", "Unit Price", "Subtotal",
    "Discount", "Delivery Charge", "Total Amount", "Payment Method",
    "Order Status", "Customer Note", "Admin Note", "Client Request ID"
  ];
  ordersSheet.getRange(1, 1, 1, orderHeaders.length).setValues([orderHeaders]);
  ordersSheet.getRange(1, 1, 1, orderHeaders.length).setFontWeight("bold").setBackground("#F1F5F9");
  ordersSheet.setFrozenRows(1);

  // 2. SETTINGS SHEET
  let settingsSheet = ss.getSheetByName(SHEETS.SETTINGS);
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet(SHEETS.SETTINGS);
  }
  const settingsHeaders = ["Key", "Value"];
  const defaultSettings = [
    ["STORE_NAME", "বিডি গ্যাজেট জোন"],
    ["PRODUCT_NAME", "আল্ট্রা প্রিমিয়াম স্মার্টওয়াচ"],
    ["SALE_PRICE", "999"],
    ["ORIGINAL_PRICE", "1500"],
    ["INSIDE_DHAKA_DELIVERY", "80"],
    ["OUTSIDE_DHAKA_DELIVERY", "120"],
    ["WHATSAPP_NUMBER", "8801700000000"]
  ];
  settingsSheet.getRange(1, 1, 1, 2).setValues([settingsHeaders]).setFontWeight("bold").setBackground("#F1F5F9");
  settingsSheet.getRange(2, 1, defaultSettings.length, 2).setValues(defaultSettings);
  settingsSheet.setFrozenRows(1);

  // 3. ADMINS SHEET
  let adminsSheet = ss.getSheetByName(SHEETS.ADMINS);
  if (!adminsSheet) {
    adminsSheet = ss.insertSheet(SHEETS.ADMINS);
  }
  const adminHeaders = ["Admin ID", "Username", "Password Hash", "Role", "Active", "Created At"];
  // Default admin: username: admin / password: admin123
  const defaultPassHash = hashPassword("admin123");
  const defaultAdmin = [
    ["ADM-001", "admin", defaultPassHash, "SuperAdmin", true, getFormattedTimestamp()]
  ];
  adminsSheet.getRange(1, 1, 1, adminHeaders.length).setValues([adminHeaders]).setFontWeight("bold").setBackground("#F1F5F9");
  adminsSheet.getRange(2, 1, defaultAdmin.length, adminHeaders.length).setValues(defaultAdmin);
  adminsSheet.setFrozenRows(1);

  // 4. REVIEWS SHEET
  let reviewsSheet = ss.getSheetByName(SHEETS.REVIEWS);
  if (!reviewsSheet) {
    reviewsSheet = ss.insertSheet(SHEETS.REVIEWS);
  }
  const reviewHeaders = ["ID", "Customer Name", "Rating", "Review", "Image", "Active", "Created At"];
  reviewsSheet.getRange(1, 1, 1, reviewHeaders.length).setValues([reviewHeaders]).setFontWeight("bold").setBackground("#F1F5F9");
  reviewsSheet.setFrozenRows(1);

  // 5. FAQ SHEET
  let faqSheet = ss.getSheetByName(SHEETS.FAQ);
  if (!faqSheet) {
    faqSheet = ss.insertSheet(SHEETS.FAQ);
  }
  const faqHeaders = ["ID", "Question", "Answer", "Active", "Sort Order"];
  faqSheet.getRange(1, 1, 1, faqHeaders.length).setValues([faqHeaders]).setFontWeight("bold").setBackground("#F1F5F9");
  faqSheet.setFrozenRows(1);

  // 6. PRODUCTS SHEET
  let productsSheet = ss.getSheetByName(SHEETS.PRODUCTS);
  if (!productsSheet) {
    productsSheet = ss.insertSheet(SHEETS.PRODUCTS);
  }
  const productHeaders = ["Product ID", "Name", "Description", "Original Price", "Sale Price", "Discount", "Stock", "Active"];
  const defaultProduct = [
    ["PROD-01", "আল্ট্রা প্রিমিয়াম স্মার্টওয়াচ", "AMOLED Display & Bluetooth Calling", 1500, 999, "34%", true, true]
  ];
  productsSheet.getRange(1, 1, 1, productHeaders.length).setValues([productHeaders]).setFontWeight("bold").setBackground("#F1F5F9");
  productsSheet.getRange(2, 1, defaultProduct.length, productHeaders.length).setValues(defaultProduct);
  productsSheet.setFrozenRows(1);

  Logger.log("Database initialized successfully with all 6 sheets!");
  return "Database initialized successfully!";
}

/* ============================================================
   SHARED UTILITIES
   ============================================================ */

function getSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim() !== "") {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(sheetName) {
  const ss = getSpreadsheet();
  return ss.getSheetByName(sheetName);
}

function getFormattedTimestamp() {
  return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
}

function jsonResponse(obj, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function errorResponse(msg, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify({
    success: false,
    message: msg
  }));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
