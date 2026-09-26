/**
 * ============================================================
 * SINGLE PRODUCT E-COMMERCE ENGINE — BANGLADESH (app.js)
 * Mobile-First • Vanilla JavaScript • Conversion Optimized
 * ============================================================
 */

/* ============================================================
   1. CENTRALIZED CONFIGURATIONS
   ============================================================ */

const API_CONFIG = {
  // Replace this with your deployed Google Apps Script Web App URL
  baseUrl: "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL"
};

const APP_CONFIG = {
  storeName: "বিডি গ্যাজেট জোন",
  helplinePhone: "01700-000000",
  whatsapp: "8801700000000",
  currency: "৳",
  timezone: "Asia/Dhaka"
};

const DELIVERY_CONFIG = {
  insideDhaka: 80,
  outsideDhaka: 120
};

const PRODUCT_CONFIG = {
  id: "PROD-ULTRA-01",
  name: "আল্ট্রা প্রিমিয়াম স্মার্টওয়াচ (AMOLED Display & Bluetooth Calling)",
  shortDescription: "টাইটানিয়াম অ্যালয় বডি, স্পষ্ট ব্লুটুথ কলিং ও দীর্ঘস্থায়ী ব্যাটারি ব্যাকআপ সহ প্রিমিয়াম স্মার্টওয়াচ।",
  description: "আল্ট্রা প্রিমিয়াম স্মার্টওয়াচটিতে রয়েছে ২.০২ ইঞ্চি সুপার ব্রাইট অ্যামোলেড ডিসপ্লে, ব্লুটুথ ৫.২ এইচডি কলিং, মাল্টি-স্পোর্টস হেলথ ট্র্যাকিং এবং ওয়্যারলেস ফাস্ট চার্জিং।",
  originalPrice: 1500,
  salePrice: 999,
  discountPercent: 34,
  stock: true,

  images: [
    "assets/images/product-1.svg",
    "assets/images/product-2.svg",
    "assets/images/product-3.svg",
    "assets/images/product-4.svg"
  ],

  variants: [
    { name: "অরেঞ্জ আলপাইন (Orange Alpine)", color: "Orange", inStock: true },
    { name: "মিডনাইট ব্ল্যাক (Midnight Black)", color: "Black", inStock: true },
    { name: "ওশান ব্লু (Ocean Blue)", color: "Blue", inStock: true }
  ],

  offer: {
    enabled: true,
    title: "সীমিত সময়ের বিশেষ অফার",
    text: "আজকের অর্ডারে পাচ্ছেন ৩৪% বিশেষ ছাড় এবং নিশ্চিত ক্যাশ অন ডেলিভারি!"
  }
};

/* ============================================================
   2. APPLICATION STATE
   ============================================================ */

const appState = {
  currentImgIndex: 0,
  selectedColor: "অরেঞ্জ আলপাইন (Orange Alpine)",
  quantity: 1,
  selectedDivision: "",
  selectedDistrict: "",
  selectedUpazila: "",
  deliveryCharge: DELIVERY_CONFIG.insideDhaka,
  isInsideDhaka: true,
  isSubmitting: false,
  lastSubmittedOrderId: null,
  touchStartX: 0,
  touchEndX: 0
};

/* ============================================================
   3. INITIALIZATION & LIVE SETTINGS SYNC
   ============================================================ */

function loadSavedSettings() {
  try {
    const savedSettings = localStorage.getItem('ecommerce_store_settings');
    if (savedSettings) {
      const s = JSON.parse(savedSettings);
      if (s.storeName) APP_CONFIG.storeName = s.storeName;
      if (s.helplinePhone) APP_CONFIG.helplinePhone = s.helplinePhone;
      if (s.whatsappNumber) APP_CONFIG.whatsapp = s.whatsappNumber;
      if (s.deliveryInsideDhaka !== undefined && s.deliveryInsideDhaka !== "") {
        DELIVERY_CONFIG.insideDhaka = Number(s.deliveryInsideDhaka);
      }
      if (s.deliveryOutsideDhaka !== undefined && s.deliveryOutsideDhaka !== "") {
        DELIVERY_CONFIG.outsideDhaka = Number(s.deliveryOutsideDhaka);
      }
      if (s.gasApiUrl) API_CONFIG.baseUrl = s.gasApiUrl;
    }

    const savedProd = localStorage.getItem('ecommerce_product_config');
    if (savedProd) {
      const p = JSON.parse(savedProd);
      if (p.name) PRODUCT_CONFIG.name = p.name;
      if (p.shortDescription) PRODUCT_CONFIG.shortDescription = p.shortDescription;
      if (p.description) PRODUCT_CONFIG.description = p.description;
      if (p.originalPrice !== undefined) PRODUCT_CONFIG.originalPrice = Number(p.originalPrice);
      if (p.salePrice !== undefined) PRODUCT_CONFIG.salePrice = Number(p.salePrice);
      if (p.discountPercent !== undefined) PRODUCT_CONFIG.discountPercent = Number(p.discountPercent);
      if (Array.isArray(p.images) && p.images.length > 0) PRODUCT_CONFIG.images = p.images;
      if (Array.isArray(p.variants) && p.variants.length > 0) {
        PRODUCT_CONFIG.variants = p.variants;
        appState.selectedColor = p.variants[0].name;
      }
      if (p.offer) PRODUCT_CONFIG.offer = p.offer;
    }
  } catch (e) {
    console.warn("Could not load dynamic settings:", e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadSavedSettings();
  appState.deliveryCharge = DELIVERY_CONFIG.insideDhaka;
  initStoreBrand();
  initProductInfo();
  initGallery();
  initLocationDropdowns();
  initColorVariants();
  initQuantityControls();
  initFaqAccordion();
  initStickyCta();
  initFormSubmission();
  initSuccessModal();
  calculateTotals();
});

/* ============================================================
   4. BRAND & PRODUCT RENDERING
   ============================================================ */

function initStoreBrand() {
  const storeNameEls = [
    document.getElementById("headerStoreName"),
    document.getElementById("footerStoreTitle")
  ];
  storeNameEls.forEach(el => {
    if (el) el.textContent = APP_CONFIG.storeName;
  });

  const phoneEls = [
    document.getElementById("headerPhoneText"),
    document.getElementById("footerPhone")
  ];
  phoneEls.forEach(el => {
    if (el) el.textContent = APP_CONFIG.helplinePhone;
  });

  const headerPhoneLink = document.getElementById("headerPhoneLink");
  if (headerPhoneLink) {
    headerPhoneLink.href = `tel:${APP_CONFIG.helplinePhone.replace(/[^0-9]/g, '')}`;
  }

  const footerWhatsapp = document.getElementById("footerWhatsapp");
  if (footerWhatsapp) {
    footerWhatsapp.textContent = APP_CONFIG.helplinePhone;
  }
}

function initProductInfo() {
  // Title & Tagline
  const titleEl = document.getElementById("productTitle");
  if (titleEl) titleEl.textContent = PRODUCT_CONFIG.name;

  const taglineEl = document.getElementById("productTagline");
  if (taglineEl) taglineEl.textContent = PRODUCT_CONFIG.shortDescription;

  const summaryNameEl = document.getElementById("summaryProductName");
  if (summaryNameEl) summaryNameEl.textContent = PRODUCT_CONFIG.name;

  // Pricing
  const salePriceEls = [
    document.getElementById("heroSalePrice"),
    document.getElementById("stickyPriceText")
  ];
  salePriceEls.forEach(el => {
    if (el) el.textContent = `${APP_CONFIG.currency}${toBengaliNumerals(PRODUCT_CONFIG.salePrice)}`;
  });

  const origPriceEl = document.getElementById("heroOriginalPrice");
  if (origPriceEl) {
    origPriceEl.textContent = `${APP_CONFIG.currency}${toBengaliNumerals(PRODUCT_CONFIG.originalPrice)}`;
  }

  const discountEl = document.getElementById("heroDiscountBadge");
  if (discountEl) {
    discountEl.textContent = `${toBengaliNumerals(PRODUCT_CONFIG.discountPercent)}% ছাড়`;
  }

  const offerTextEl = document.getElementById("offerBannerText");
  if (offerTextEl && PRODUCT_CONFIG.offer) {
    offerTextEl.textContent = PRODUCT_CONFIG.offer.text;
  }

  const unitPriceEl = document.getElementById("summaryUnitPrice");
  if (unitPriceEl) {
    unitPriceEl.textContent = toBengaliNumerals(PRODUCT_CONFIG.salePrice);
  }
}

/* ============================================================
   5. IMAGE GALLERY WITH SWIPE & ZOOM
   ============================================================ */

function initGallery() {
  const mainImg = document.getElementById("mainProductImg");
  const thumbsRow = document.getElementById("thumbnailsRow");
  const prevBtn = document.getElementById("prevImgBtn");
  const nextBtn = document.getElementById("nextImgBtn");
  const mainContainer = document.getElementById("mainImageContainer");

  if (!thumbsRow || !mainImg) return;

  // Clear & populate thumbnails
  thumbsRow.innerHTML = "";
  PRODUCT_CONFIG.images.forEach((imgSrc, idx) => {
    const thumb = document.createElement("div");
    thumb.className = `thumb-item ${idx === 0 ? "active" : ""}`;
    thumb.setAttribute("role", "tab");
    thumb.setAttribute("aria-selected", idx === 0 ? "true" : "false");
    thumb.innerHTML = `<img src="${imgSrc}" alt="থাম্বনেইল ${idx + 1}" loading="lazy" />`;
    thumb.addEventListener("click", () => switchImage(idx));
    thumbsRow.appendChild(thumb);
  });

  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navigateGallery(-1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navigateGallery(1);
    });
  }

  // Click to Zoom Toggle
  if (mainContainer) {
    mainContainer.addEventListener("click", () => {
      mainImg.classList.toggle("zoomed");
    });

    // Touch Swipe Gesture for Mobile
    mainContainer.addEventListener("touchstart", (e) => {
      appState.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    mainContainer.addEventListener("touchend", (e) => {
      appState.touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
  }
}

function handleSwipe() {
  const diffX = appState.touchEndX - appState.touchStartX;
  if (Math.abs(diffX) > 40) {
    if (diffX < 0) {
      navigateGallery(1); // Swipe left -> next
    } else {
      navigateGallery(-1); // Swipe right -> prev
    }
  }
}

function switchImage(index) {
  if (index < 0 || index >= PRODUCT_CONFIG.images.length) return;
  appState.currentImgIndex = index;

  const mainImg = document.getElementById("mainProductImg");
  if (mainImg) {
    mainImg.classList.remove("zoomed");
    mainImg.src = PRODUCT_CONFIG.images[index];
  }

  // Update active thumbnail
  const thumbs = document.querySelectorAll(".thumb-item");
  thumbs.forEach((thumb, idx) => {
    if (idx === index) {
      thumb.classList.add("active");
      thumb.setAttribute("aria-selected", "true");
      thumb.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
    } else {
      thumb.classList.remove("active");
      thumb.setAttribute("aria-selected", "false");
    }
  });

  // Update summary thumb
  const summaryThumb = document.getElementById("summaryThumb");
  if (summaryThumb) {
    summaryThumb.src = PRODUCT_CONFIG.images[index];
  }
}

function navigateGallery(direction) {
  let newIndex = appState.currentImgIndex + direction;
  if (newIndex < 0) newIndex = PRODUCT_CONFIG.images.length - 1;
  if (newIndex >= PRODUCT_CONFIG.images.length) newIndex = 0;
  switchImage(newIndex);
}

/* ============================================================
   6. BANGLADESH DEPENDENT DROPDOWNS
   ============================================================ */

function initLocationDropdowns() {
  const divisionSelect = document.getElementById("orderDivision");
  const districtSelect = document.getElementById("orderDistrict");
  const upazilaSelect = document.getElementById("orderUpazila");

  if (!divisionSelect || !districtSelect || !upazilaSelect) return;

  if (typeof BANGLADESH_LOCATIONS === "undefined") {
    console.error("BANGLADESH_LOCATIONS object is not defined. Ensure location-data.js is loaded.");
    return;
  }

  // 1. Populate Divisions
  divisionSelect.innerHTML = `<option value="">-- বিভাগ নির্বাচন করুন --</option>`;
  Object.keys(BANGLADESH_LOCATIONS).forEach(division => {
    const opt = document.createElement("option");
    opt.value = division;
    opt.textContent = division;
    divisionSelect.appendChild(opt);
  });

  // 2. Division Change Event
  divisionSelect.addEventListener("change", () => {
    const selectedDiv = divisionSelect.value;
    appState.selectedDivision = selectedDiv;
    divisionSelect.classList.remove("is-invalid");

    // Reset District & Upazila
    districtSelect.innerHTML = `<option value="">-- জেলা নির্বাচন করুন --</option>`;
    upazilaSelect.innerHTML = `<option value="">-- প্রথমে জেলা নির্বাচন করুন --</option>`;
    upazilaSelect.disabled = true;

    if (!selectedDiv) {
      districtSelect.disabled = true;
      districtSelect.innerHTML = `<option value="">-- প্রথমে বিভাগ নির্বাচন করুন --</option>`;
      updateDeliveryAreaAndCharge();
      return;
    }

    const districtsObj = BANGLADESH_LOCATIONS[selectedDiv] || {};
    Object.keys(districtsObj).forEach(district => {
      const opt = document.createElement("option");
      opt.value = district;
      opt.textContent = district;
      districtSelect.appendChild(opt);
    });

    districtSelect.disabled = false;
    updateDeliveryAreaAndCharge();
  });

  // 3. District Change Event
  districtSelect.addEventListener("change", () => {
    const selectedDist = districtSelect.value;
    appState.selectedDistrict = selectedDist;
    districtSelect.classList.remove("is-invalid");

    upazilaSelect.innerHTML = `<option value="">-- উপজেলা / থানা নির্বাচন করুন --</option>`;

    if (!selectedDist || !appState.selectedDivision) {
      upazilaSelect.disabled = true;
      upazilaSelect.innerHTML = `<option value="">-- প্রথমে জেলা নির্বাচন করুন --</option>`;
      updateDeliveryAreaAndCharge();
      return;
    }

    const upazilas = BANGLADESH_LOCATIONS[appState.selectedDivision]?.[selectedDist] || [];
    upazilas.forEach(upazila => {
      const opt = document.createElement("option");
      opt.value = upazila;
      opt.textContent = upazila;
      upazilaSelect.appendChild(opt);
    });

    upazilaSelect.disabled = false;
    updateDeliveryAreaAndCharge();
  });

  // 4. Upazila Change Event
  upazilaSelect.addEventListener("change", () => {
    appState.selectedUpazila = upazilaSelect.value;
    upazilaSelect.classList.remove("is-invalid");
  });
}

function updateDeliveryAreaAndCharge() {
  const district = appState.selectedDistrict;
  const division = appState.selectedDivision;

  // Logic: "ঢাকা" district is Inside Dhaka (৳80), all other districts are Outside Dhaka (৳120)
  // If user selected Dhaka division and Dhaka district, charge inside Dhaka
  if (district === "ঢাকা") {
    appState.deliveryCharge = DELIVERY_CONFIG.insideDhaka;
    appState.isInsideDhaka = true;
  } else if (district) {
    appState.deliveryCharge = DELIVERY_CONFIG.outsideDhaka;
    appState.isInsideDhaka = false;
  } else {
    // Default fallback before selection
    appState.deliveryCharge = (division === "ঢাকা") ? DELIVERY_CONFIG.insideDhaka : DELIVERY_CONFIG.outsideDhaka;
    appState.isInsideDhaka = (division === "ঢাকা");
  }

  // Update summary delivery text
  const deliveryAreaEl = document.getElementById("summaryDeliveryArea");
  if (deliveryAreaEl) {
    deliveryAreaEl.textContent = appState.isInsideDhaka ? "ঢাকা সিটি" : "ঢাকার বাইরে";
  }

  const deliveryPriceEl = document.getElementById("summaryDelivery");
  if (deliveryPriceEl) {
    deliveryPriceEl.textContent = toBengaliNumerals(appState.deliveryCharge);
  }

  calculateTotals();
}

/* ============================================================
   7. COLOR VARIANTS & QUANTITY CONTROLS
   ============================================================ */

function initColorVariants() {
  const chips = document.querySelectorAll(".variant-chip");
  const formColorSelect = document.getElementById("formColorSelect");

  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      const selected = chip.getAttribute("data-color");
      appState.selectedColor = selected;

      // Sync form select
      if (formColorSelect) formColorSelect.value = selected;
      updateVariantSummary();
    });
  });

  if (formColorSelect) {
    formColorSelect.addEventListener("change", () => {
      const selected = formColorSelect.value;
      appState.selectedColor = selected;

      // Sync chips
      chips.forEach(chip => {
        if (chip.getAttribute("data-color") === selected) {
          chip.classList.add("active");
        } else {
          chip.classList.remove("active");
        }
      });
      updateVariantSummary();
    });
  }
}

function updateVariantSummary() {
  const summaryVariantText = document.getElementById("summaryVariantText");
  if (summaryVariantText) {
    summaryVariantText.textContent = `কালার: ${appState.selectedColor}`;
  }
}

function initQuantityControls() {
  const minusBtn = document.getElementById("qtyMinus");
  const plusBtn = document.getElementById("qtyPlus");
  const qtyInput = document.getElementById("orderQty");

  if (!minusBtn || !plusBtn || !qtyInput) return;

  minusBtn.addEventListener("click", () => {
    if (appState.quantity > 1) {
      appState.quantity--;
      qtyInput.value = appState.quantity;
      calculateTotals();
    }
  });

  plusBtn.addEventListener("click", () => {
    if (appState.quantity < 10) {
      appState.quantity++;
      qtyInput.value = appState.quantity;
      calculateTotals();
    }
  });
}

/* ============================================================
   8. REAL-TIME PRICE & ORDER CALCULATION
   ============================================================ */

function calculateTotals() {
  const unitPrice = PRODUCT_CONFIG.salePrice;
  const qty = appState.quantity;
  const subtotal = unitPrice * qty;
  const delivery = appState.deliveryCharge;
  const total = subtotal + delivery;

  // Summary Card
  const qtyEl = document.getElementById("summaryDisplayQty");
  if (qtyEl) qtyEl.textContent = toBengaliNumerals(qty);

  const subtotalEl = document.getElementById("summarySubtotal");
  if (subtotalEl) subtotalEl.textContent = toBengaliNumerals(subtotal);

  const totalEl = document.getElementById("summaryTotal");
  if (totalEl) totalEl.textContent = toBengaliNumerals(total);

  // Submit button total text
  const btnTotalText = document.getElementById("btnTotalText");
  if (btnTotalText) btnTotalText.textContent = toBengaliNumerals(total);
}

/* ============================================================
   9. PHONE NUMBER VALIDATION & NORMALIZATION
   ============================================================ */

/**
 * Validates and normalizes Bangladeshi phone numbers
 * Formats: 01XXXXXXXXX, +8801XXXXXXXXX, 8801XXXXXXXXX
 * Normalizes to standard 11-digit 01XXXXXXXXX
 */
function normalizeBDPhone(phoneStr) {
  if (!phoneStr) return null;
  // Remove spaces, hyphens, and parentheses
  let cleaned = phoneStr.replace(/[\s\-\(\)]/g, "");

  // Convert Bengali numerals if typed
  const bengaliToEnglish = { "০":"0", "১":"1", "২":"2", "৩":"3", "৪":"4", "৫":"5", "৬":"6", "৭":"7", "৮":"8", "৯":"9" };
  cleaned = cleaned.replace(/[০-৯]/g, match => bengaliToEnglish[match]);

  // Strip international prefix
  if (cleaned.startsWith("+88")) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith("88")) {
    cleaned = cleaned.substring(2);
  }

  // Must start with 01 and be exactly 11 digits
  // Mobile operators in BD: 013, 014, 015, 016, 017, 018, 019
  const bdPhoneRegex = /^01[3-9]\d{8}$/;
  if (bdPhoneRegex.test(cleaned)) {
    return cleaned;
  }
  return null;
}

/* ============================================================
   10. ORDER FORM VALIDATION & SUBMISSION
   ============================================================ */

function initFormSubmission() {
  const form = document.getElementById("orderForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (appState.isSubmitting) return;

    // Validate Fields
    const isValid = validateOrderForm();
    if (!isValid) {
      showToast("অনুগ্রহ করে সব প্রয়োজনীয় ঘর সঠিক তথ্য দিয়ে পূরণ করুন।", "error");
      return;
    }

    const nameInput = document.getElementById("custName");
    const phoneInput = document.getElementById("custPhone");
    const addressInput = document.getElementById("custAddress");
    const noteInput = document.getElementById("custNote");

    const normalizedPhone = normalizeBDPhone(phoneInput.value.trim());

    // Generate Client Request ID for anti-duplicate tracking
    const clientRequestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const orderPayload = {
      action: "createOrder",
      clientRequestId: clientRequestId,
      customer: {
        name: nameInput.value.trim(),
        phone: normalizedPhone,
        division: appState.selectedDivision,
        district: appState.selectedDistrict,
        upazila: appState.selectedUpazila,
        address: addressInput.value.trim()
      },
      product: {
        id: PRODUCT_CONFIG.id,
        name: PRODUCT_CONFIG.name,
        variant: appState.selectedColor,
        color: appState.selectedColor,
        quantity: appState.quantity
      },
      note: noteInput ? noteInput.value.trim() : ""
    };

    // UI Loading State
    setSubmitLoading(true);

    try {
      let result;

      // Check if API URL is configured or if we are in demo/preview mode
      const isPlaceholder = !API_CONFIG.baseUrl || 
                            API_CONFIG.baseUrl.includes("YOUR_GOOGLE_APPS_SCRIPT") || 
                            API_CONFIG.baseUrl.trim() === "";

      if (isPlaceholder) {
        // Simulated local fallback for instant testing before user attaches Google Apps Script
        await new Promise(resolve => setTimeout(resolve, 800));
        const fakeOrderId = generateFallbackOrderId();
        result = {
          success: true,
          message: "অর্ডার সফলভাবে গ্রহণ করা হয়েছে (ডেমো মোড)। Google Apps Script URL কনফিগার করলে এটি সরাসরি Google Sheets-এ সেভ হবে।",
          data: {
            orderId: fakeOrderId,
            totalAmount: (PRODUCT_CONFIG.salePrice * appState.quantity) + appState.deliveryCharge,
            createdAt: new Date().toISOString()
          }
        };
        // Also save to localStorage demo orders so admin.html can preview it immediately!
        saveDemoOrderLocally({
          ...orderPayload,
          orderId: fakeOrderId,
          totalAmount: result.data.totalAmount,
          createdAt: new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
          status: "Pending",
          paymentMethod: "Cash on Delivery"
        });
      } else {
        // Real POST to Google Apps Script Web App
        // Note: Using text/plain prevents CORS preflight issues with Apps Script
        const response = await fetch(API_CONFIG.baseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify(orderPayload)
        });

        if (!response.ok) {
          throw new Error(`সার্ভার প্রতিক্রিয়া দিতে ব্যর্থ হয়েছে (HTTP ${response.status})`);
        }

        result = await response.json();
      }

      if (result && result.success) {
        const orderId = result.data?.orderId || generateFallbackOrderId();
        appState.lastSubmittedOrderId = orderId;

        // Reset form
        form.reset();
        appState.quantity = 1;
        document.getElementById("orderQty").value = "1";
        document.getElementById("orderDistrict").disabled = true;
        document.getElementById("orderUpazila").disabled = true;

        // Open Success Modal
        showSuccessModal(orderPayload, orderId);
        showToast("আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে!", "success");
      } else {
        throw new Error(result.message || "অর্ডার প্রক্রিয়াকরণে সমস্যা হয়েছে");
      }

    } catch (err) {
      console.error("Order Submission Error:", err);
      showToast(`অর্ডার সম্পন্ন করা যায়নি: ${err.message || 'দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন'}`, "error");
    } finally {
      setSubmitLoading(false);
    }
  });
}

function validateOrderForm() {
  let valid = true;

  const nameInput = document.getElementById("custName");
  if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
    nameInput.classList.add("is-invalid");
    valid = false;
  } else {
    nameInput.classList.remove("is-invalid");
  }

  const phoneInput = document.getElementById("custPhone");
  const normalizedPhone = normalizeBDPhone(phoneInput.value.trim());
  if (!normalizedPhone) {
    phoneInput.classList.add("is-invalid");
    valid = false;
  } else {
    phoneInput.classList.remove("is-invalid");
  }

  const divSelect = document.getElementById("orderDivision");
  if (!divSelect.value) {
    divSelect.classList.add("is-invalid");
    valid = false;
  } else {
    divSelect.classList.remove("is-invalid");
  }

  const distSelect = document.getElementById("orderDistrict");
  if (!distSelect.value) {
    distSelect.classList.add("is-invalid");
    valid = false;
  } else {
    distSelect.classList.remove("is-invalid");
  }

  const upazilaSelect = document.getElementById("orderUpazila");
  if (!upazilaSelect.value) {
    upazilaSelect.classList.add("is-invalid");
    valid = false;
  } else {
    upazilaSelect.classList.remove("is-invalid");
  }

  const addressInput = document.getElementById("custAddress");
  if (!addressInput.value.trim() || addressInput.value.trim().length < 5) {
    addressInput.classList.add("is-invalid");
    valid = false;
  } else {
    addressInput.classList.remove("is-invalid");
  }

  return valid;
}

function setSubmitLoading(isLoading) {
  appState.isSubmitting = isLoading;
  const submitBtn = document.getElementById("submitOrderBtn");
  if (!submitBtn) return;

  const btnText = submitBtn.querySelector(".btn-text");
  const btnSpinner = submitBtn.querySelector(".btn-spinner");

  if (isLoading) {
    submitBtn.disabled = true;
    if (btnText) btnText.style.display = "none";
    if (btnSpinner) btnSpinner.style.display = "inline-flex";
  } else {
    submitBtn.disabled = false;
    if (btnText) btnText.style.display = "inline";
    if (btnSpinner) btnSpinner.style.display = "none";
  }
}

/* ============================================================
   11. SUCCESS MODAL & WHATSAPP SHARING
   ============================================================ */

function initSuccessModal() {
  const modal = document.getElementById("successModal");
  const closeBtn = document.getElementById("modalCloseBtn");
  const newOrderBtn = document.getElementById("modalNewOrderBtn");

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => closeModal());
  }

  if (newOrderBtn) {
    newOrderBtn.addEventListener("click", () => {
      closeModal();
      scrollToOrderSection();
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }
}

function showSuccessModal(orderData, orderId) {
  const modal = document.getElementById("successModal");
  if (!modal) return;

  const totalAmount = (PRODUCT_CONFIG.salePrice * orderData.product.quantity) + appState.deliveryCharge;

  document.getElementById("modalOrderId").textContent = orderId;
  document.getElementById("modalCustomerName").textContent = orderData.customer.name;
  document.getElementById("modalProductSummary").textContent = `${orderData.product.name} (${orderData.product.quantity}টি, ${orderData.product.variant})`;
  document.getElementById("modalPhone").textContent = orderData.customer.phone;
  document.getElementById("modalAddress").textContent = `${orderData.customer.address}, ${orderData.customer.upazila}, ${orderData.customer.district}`;
  document.getElementById("modalTotal").textContent = toBengaliNumerals(totalAmount);

  // Generate WhatsApp message
  const waBtn = document.getElementById("modalWhatsappBtn");
  if (waBtn) {
    const waText = 
`*নতুন অর্ডার নিশ্চিতকরণ*
━━━━━━━━━━━━━━━━━━━━
*অর্ডার আইডি:* ${orderId}
*গ্রাহকের নাম:* ${orderData.customer.name}
*মোবাইল:* ${orderData.customer.phone}
*পণ্য:* ${orderData.product.name}
*ভ্যারিয়েন্ট:* ${orderData.product.variant}
*পরিমাণ:* ${orderData.product.quantity}টি
*ঠিকানা:* ${orderData.customer.address}, ${orderData.customer.upazila}, ${orderData.customer.district}
*পরিশোধ পদ্ধতি:* Cash on Delivery
*সর্বমোট মূল্য:* ৳${totalAmount}
━━━━━━━━━━━━━━━━━━━━
দয়া করে আমার অর্ডারটি দ্রুত পাঠিয়ে দিন।`;

    const encodedText = encodeURIComponent(waText);
    waBtn.href = `https://wa.me/${APP_CONFIG.whatsapp}?text=${encodedText}`;
  }

  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = document.getElementById("successModal");
  if (modal) {
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }
}

/* ============================================================
   12. FAQ ACCORDION & STICKY CTA
   ============================================================ */

function initFaqAccordion() {
  const items = document.querySelectorAll(".faq-item");
  items.forEach(item => {
    const btn = item.querySelector(".faq-question");
    if (btn) {
      btn.addEventListener("click", () => {
        const isActive = item.classList.contains("active");
        items.forEach(i => i.classList.remove("active"));
        if (!isActive) item.classList.add("active");
      });
    }
  });
}

function initStickyCta() {
  const stickyBtn = document.getElementById("stickyOrderBtn");
  const heroBtn = document.getElementById("heroOrderBtn");

  if (stickyBtn) {
    stickyBtn.addEventListener("click", () => scrollToOrderSection());
  }

  if (heroBtn) {
    heroBtn.addEventListener("click", () => scrollToOrderSection());
  }
}

function scrollToOrderSection() {
  const section = document.getElementById("orderSection");
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      const nameInput = document.getElementById("custName");
      if (nameInput) nameInput.focus();
    }, 450);
  }
}

/* ============================================================
   13. UTILITIES & TOAST NOTIFICATIONS
   ============================================================ */

function toBengaliNumerals(number) {
  if (number === null || number === undefined) return "";
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return number.toString().replace(/\d/g, d => bengaliDigits[parseInt(d, 10)]);
}

function generateFallbackOrderId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randNum = Math.floor(100000 + Math.random() * 900000);
  return `SP-${dateStr}-${randNum}`;
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

/**
 * Saves mock order to localStorage for instant admin dashboard testing
 * before Google Apps Script backend is wired up.
 */
function saveDemoOrderLocally(order) {
  try {
    const existing = JSON.parse(localStorage.getItem("bd_shop_demo_orders") || "[]");
    existing.unshift(order);
    localStorage.setItem("bd_shop_demo_orders", JSON.stringify(existing.slice(0, 50)));
  } catch (e) {
    console.warn("Could not save demo order to localStorage", e);
  }
}
