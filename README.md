# সিঙ্গেল প্রোডাক্ট ই-কমার্স অর্ডারিং সিস্টেম (বাংলাদেশ)
### Single Product E-commerce Ordering System for Bangladesh with Google Sheets Database

একটি আধুনিক, মোবাইল-ফার্স্ট এবং ফেসবুক ভিডিও/বিজ্ঞাপন ট্রাফিকের জন্য সর্বোচ্চ কনভার্সন অপটিমাইজড সিঙ্গেল প্রোডাক্ট সেলস ল্যান্ডিং পেজ এবং এডমিন ড্যাশবোর্ড। ডেটাবেজ হিসেবে ব্যবহৃত হয়েছে **Google Sheets** এবং ব্যাকএন্ড হিসেবে **Google Apps Script Web App**। পেমেন্ট সম্পূর্ণ **Cash on Delivery (ক্যাশ অন ডেলিভারি)**।

---

## 📁 প্রজেক্ট আর্কিটেকচার (Project Architecture)

```text
/
│
├── index.html          # সিঙ্গেল প্রোডাক্ট সেলস ল্যান্ডিং পেজ (গ্রাহক ইন্টারফেস)
├── admin.html          # সুরক্ষিত এডমিন অর্ডার ম্যানেজমেন্ট ড্যাশবোর্ড
├── style.css           # আধুনিক রেসপন্সিভ সিএসএস ডিজাইন সিস্টেম
├── app.js              # ফ্রন্টএন্ড কন্ট্রোলার ও অর্ডার লজিক
├── admin.js            # এডমিন অথেন্টিকেশন ও অর্ডার প্রসেসিং কন্ট্রোলার
├── location-data.js    # বাংলাদেশের ৮ বিভাগ, ৬৪ জেলা ও সকল উপজেলার ডেটাবেজ
├── Code.gs             # গুগল অ্যাপস স্ক্রিপ্ট ব্যাকএন্ড ও এপিআই
├── README.md           # সম্পূর্ণ সেটআপ ও ডিপ্লয়মেন্ট গাইড
│
└── assets/
    └── images/         # প্রিমিয়াম ভেক্টর প্রোডাক্ট ছবি ও ফিচার আর্টওয়ার্ক
        ├── product-1.svg
        ├── product-2.svg
        ├── product-3.svg
        └── product-4.svg
```

---

## 🛠️ প্রযুক্তি ও ফ্রেমওয়ার্ক (Technologies Used)

- **ফ্রন্টএন্ড**: পিওর HTML5, আধুনিক CSS3 (Variables, Flexbox, Grid), ভ্যানিলা JavaScript (ES6+)।
- **কোনো ফ্রেমওয়ার্ক নির্ভরতা নেই**: No React, No Vue, No jQuery — দ্রুত লোডিং ও সর্বোচ্চ মোবাইল পারফরম্যান্স।
- **ডেটাবেজ**: Google Sheets (রিয়েলটাইম স্প্রেডশিট ডেটাবেজ)।
- **ব্যাকএন্ড ও এপিআই**: Google Apps Script (Web App, ContentService, LockService)।
- **পেমেন্ট পদ্ধতি**: Cash on Delivery (COD)।
- **হোস্টিং সাপোর্ট**: GitHub Pages, Netlify, Render Static Site, Cloudflare Pages।

---

## 📋 গুগল স্প্রেডশিট ডেটাবেজ স্ট্রাকচার (Google Sheets Database)

একটি নতুন গুগল স্প্রেডশিট তৈরি করুন এবং নিচের **৬টি শিট (Tabs)** তৈরি করুন। প্রতিটি শিটের ১ম সারিতে হুবহু এই হেডারগুলো পেস্ট করুন:

### শিট ১: `Orders`
হেডারসমূহ (A1 থেকে X1):
```text
Order ID | Created At | Updated At | Customer Name | Phone | Division | District | Upazila | Full Address | Product Name | Variant | Color | Size | Quantity | Unit Price | Subtotal | Discount | Delivery Charge | Total Amount | Payment Method | Order Status | Customer Note | Admin Note | Client Request ID
```

### শিট ২: `Settings`
হেডারসমূহ (A1 থেকে B1):
```text
Key | Value
```
*ডিফল্ট মানসমূহ (Row 2 onwards):*
- `STORE_NAME` : `বিডি গ্যাজেট জোন`
- `PRODUCT_NAME` : `আল্ট্রা প্রিমিয়াম স্মার্টওয়াচ`
- `SALE_PRICE` : `999`
- `ORIGINAL_PRICE` : `1500`
- `INSIDE_DHAKA_DELIVERY` : `80`
- `OUTSIDE_DHAKA_DELIVERY` : `120`
- `WHATSAPP_NUMBER` : `8801700000000`

### শিট ৩: `Admins`
হেডারসমূহ (A1 থেকে F1):
```text
Admin ID | Username | Password Hash | Role | Active | Created At
```
*নোট:* কখনো প্লেইনটেক্সট পাসওয়ার্ড রাখবেন না। `setupDatabase()` ফাংশন রান করলে স্বয়ংক্রিয়ভাবে SHA-256 হ্যাশ সহ `admin` / `admin123` তৈরি হবে।

### শিট ৪: `Reviews`
হেডারসমূহ (A1 থেকে G1):
```text
ID | Customer Name | Rating | Review | Image | Active | Created At
```

### শিট ৫: `FAQ`
হেডারসমূহ (A1 থেকে E1):
```text
ID | Question | Answer | Active | Sort Order
```

### শিট ৬: `Products`
হেডারসমূহ (A1 থেকে H1):
```text
Product ID | Name | Description | Original Price | Sale Price | Discount | Stock | Active
```

---

## 🚀 গুগল অ্যাপস স্ক্রিপ্ট ব্যাকএন্ড সেটআপ ধাপসমূহ (Apps Script Setup)

### ধাপ ১: স্প্রেডশিট ওপেন করুন
Google Sheets ওপেন করে উপরে মেনু থেকে **Extensions → Apps Script** এ ক্লিক করুন।

### ধাপ ২: Code.gs কোড পেস্ট করুন
`Code.gs` ফাইলে থাকা সকল কোড কপি করে Apps Script এডিটরে পেস্ট করুন।

### ধাপ ৩: অটোমেটিক ডেটাবেজ ইনিশিয়ালাইজ করুন
Apps Script এডিটরের ওপরের ড্রপডাউন থেকে **`setupDatabase`** সিলেক্ট করে **Run** বাটনে ক্লিক করুন।
- প্রথমবার Google একাউন্ট পারমিশন চাইলে "Advanced" এ ক্লিক করে "Go to (unsafe)" এবং "Allow" দিন।
- এই ফাংশনটি স্বয়ংক্রিয়ভাবে আপনার গুগল শিটে সবকটি ট্যাব ও কলাম হেডার সাজিয়ে দেবে!

### ধাপ ৪: টাইমজোন সেট করুন
Apps Script এডিটরে বাম পাশের গিয়ার আইকন (⚙️ Project Settings) এ যান।
- `Time zone` চেক করুন যেন **`(GMT+06:00) Bangladesh Time (Dhaka)`** থাকে।

### ধাপ ৫: ওয়েব অ্যাপ হিসেবে ডিপ্লয় করুন (Deploy as Web App)
১. উপরে ডানপাশে নীল **Deploy** বাটনে ক্লিক করে **New deployment** সিলেক্ট করুন।  
২. বামপাশে গিয়ার আইকন থেকে **Web app** নির্বাচন করুন।  
৩. কনফিগারেশন দিন:
   - **Description**: `BD Order Engine v1`
   - **Execute as**: `Me (আপনার গুগল ইমেইল)`
   - **Who has access**: `Anyone` *(জরুরি: পাবলিক গ্রাহক যাতে লগইন ছাড়াই অর্ডার করতে পারে)*
৪. **Deploy** বাটনে ক্লিক করুন।  
৫. ডিপ্লয় শেষ হলে **Web app URL** কপি করুন (এটি দেখতে এরকম হবে: `https://script.google.com/macros/s/AKfycb.../exec`)।

---

## ⚙️ ফ্রন্টএন্ড কনফিগারেশন (API & Product Config)

### ১. এপিআই ইউআরএল সেট করা:
`app.js` এবং `admin.js` ফাইলের শীর্ষে থাকা `API_CONFIG.baseUrl` এ আপনার কপি করা Web App URL বসান:
```javascript
const API_CONFIG = {
  baseUrl: "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
};
```

### ২. প্রোডাক্ট ও শপ ইনফো পরিবর্তন:
`app.js` ফাইলের `PRODUCT_CONFIG` এবং `APP_CONFIG` পরিবর্তন করুন:
```javascript
const APP_CONFIG = {
  storeName: "আপনার শপের নাম",
  helplinePhone: "01700-000000",
  whatsapp: "8801700000000",
  currency: "৳",
  timezone: "Asia/Dhaka"
};

const PRODUCT_CONFIG = {
  name: "আপনার পণ্যের নাম",
  originalPrice: 1500,
  salePrice: 999,
  images: [ ... ]
};
```

### ৩. ডেলিভারি চার্জ পরিবর্তন:
`app.js` এর `DELIVERY_CONFIG`:
```javascript
const DELIVERY_CONFIG = {
  insideDhaka: 80,
  outsideDhaka: 120
};
```

---

## 🔒 এডমিন ড্যাশবোর্ড ও সিকিউরিটি গাইড (Admin Security)

- **ড্যাশবোর্ড লিঙ্ক**: `/admin.html`
- **ডিফল্ট ইউজারনেম**: `admin`
- **ডিফল্ট পাসওয়ার্ড**: `admin123`

### সিকিউরিটি প্রিন্সিপল:
1. **Frontend Not Trusted**: ফ্রন্টএন্ড থেকে পাঠানো মোট টাকা, ডিসকাউন্ট বা ডেলিভারি চার্জ গুগল অ্যাপস স্ক্রিপ্ট বিশ্বাস করে না। ব্যাকএন্ড স্বয়ংক্রিয়ভাবে পণ্যের দাম ও জেলা অনুযায়ী সঠিক ডেলিভারি চার্জ হিসাব করে সেভ করে।
2. **Never Store Password in LocalStorage**: কোনো অবস্থাতেই পাসওয়ার্ড ব্রাউজারের লোকালস্টোরেজে রাখা হয় না। ব্যাকএন্ড যাচাই শেষে একটি ক্রিপ্টোগ্রাফিক সেশন টোকেন প্রদান করে যা শুধুমাত্র সেশন চলাকালীন সক্রিয় থাকে।
3. **LockService**: একই মুহূর্তে একাধিক কাস্টমার অর্ডার সাবমিট করলেও কোনো অর্ডার আইডি ডুপ্লিকেট হবে না।
4. **Anti-Duplicate Order Protection**: প্রতি অর্ডারে ইউনিক `clientRequestId` জেনারেট হয়, যা ব্যাকএন্ডে ডাবল এন্ট্রি রোধ করে।

---

## 🌐 হোস্টিং গাইড (Hosting Compatibility)

### ১. GitHub Pages
১. গিটহাবে একটি নতুন রিপোজিটরি তৈরি করুন এবং ফাইলগুলো পুশ করুন।  
২. রিপোজিটরির **Settings → Pages** এ যান।  
৩. Branch: `main`, Folder: `/ (root)` দিয়ে সেভ করুন। সাইট লাইভ হয়ে যাবে।

### ২. Netlify
১. [Netlify.com](https://www.netlify.com) এ লগইন করুন।  
২. ড্র্যাগ-অ্যান্ড-ড্রপ করে প্রজেক্ট ফোল্ডারটি ছেড়ে দিন অথবা গিটহাব কানেক্ট করুন।  
৩. Build command খালি রাখুন, Publish directory: `.` দিন।

### ৩. Render
১. [Render.com](https://render.com) এ **New + → Static Site** সিলেক্ট করুন।  
২. রিপোজিটরি লিঙ্ক করুন, Publish directory দিন `./`।

### ৪. Cloudflare Pages
১. Cloudflare ড্যাশবোর্ডে **Workers & Pages → Create Application → Pages** নির্বাচন করুন।  
২. রিপোজিটরি সিলেক্ট করে ডিপ্লয় দিন।

---

## 🧪 টেস্টিং চেকলিস্ট (Verification Checklist)

- [x] **অর্ডার ফর্ম ড্রপডাউন**: বিভাগ নির্বাচন করলে সংশ্লিষ্ট জেলাসমূহ এবং জেলা নির্বাচন করলে উপজেলাসমূহ লোড হয়।
- [x] **ডেলিভারি চার্জ অটোমেটিক হিসাব**: ঢাকা নির্বাচন করলে ৮০ টাকা এবং ঢাকার বাইরে নির্বাচন করলে ১২০ টাকা লাইভ সামারিতে যুক্ত হয়।
- [x] **মোবাইল ভ্যালিডেশন**: ১১ ডিজিটের ভ্যালিড বাংলাদেশি মোবাইল নম্বর ছাড়া সাবমিট আটকে দেয়।
- [x] **অ্যান্টি-ডুপ্লিকেট সাবমিশন**: সাবমিট বাটনে ক্লিক করার সাথে সাথে বাটন ডিজেবল ও লোডিং স্পিনার প্রদর্শিত হয়।
- [x] **ইউনিক অর্ডার আইডি**: `SP-YYYYMMDD-XXXXXX` ফরম্যাটে অর্ডার আইডি তৈরি হয়।
- [x] **সাকসেস কনফার্মেশন ও হোয়াটসঅ্যাপ**: অর্ডার গ্রহণের পর পপআপে সম্পূর্ণ অর্ডার বিবরণী এবং এক ক্লিকে হোয়াটসঅ্যাপে তথ্য পাঠানোর লিঙ্ক তৈরি হয়।
- [x] **এডমিন লগইন**: ইউজারনেম ও পাসওয়ার্ড যাচাই করে ড্যাশবোর্ড ওপেন হয়।
- [x] **ফিল্টারিং ও সার্চিং**: অর্ডার আইডি, মোবাইল নম্বর, বা স্ট্যাটাস (Pending, Confirmed, Shipped ইত্যাদি) দিয়ে দ্রুত ফিল্টার করা যায়।
- [x] **স্ট্যাটাস ও নোট আপডেট**: এডমিন প্যানেল থেকে স্ট্যাটাস পরিবর্তন এবং অভ্যন্তরীণ নোট সেভ করা যায়।
- [x] **CSV এক্সপোর্ট**: বাংলা অক্ষরের জন্য UTF-8 BOM সহ পূর্ণাঙ্গ এক্সেল/সিএসভি ফাইল ডাউনলোড হয়।
- [x] **মোবাইল বটম স্টিকি সিটিএ**: মোবাইলে স্ক্রল করার সময় নিচে সহজে অর্ডার বাটনে ক্লিক করা যায়।
