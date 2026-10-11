Here is the complete technical and visual breakdown extracted from the slides and live product demonstration in the video [**Bee Bridge | SIH 2026 — Honey Chain Blockchain & AI Based Honey Traceability Platform**](http://www.youtube.com/watch?v=XmmKML2IPFE).

### **1\. Project Background & Context**

* **Project Name:** Bee Bridge (*"Authenticity Through Technology"*)  
* **Hackathon:** Smart India Hackathon (SIH) 2026 \[[00:00](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D0)\]  
* **Problem Statement ID:** SIH26021 \[[00:08](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D8)\]  
* **Problem Title:** *Honey Chain: A blockchain-based System for honey traceability and smart beekeeping Management*  
* **Organization / Ministry Context:** Ministry of MSME / KVIC (Khadi and Village Industries Commission) Honey Mission  
* **Team:** OmniTrix1987 (Team ID: 166008), Sri Sairam Institute of Technology, Chennai \[[00:00](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D0)\]  
* **Core Problem Identified:** \[[00:17](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D17)\]  
  1. **Authenticity Gap:** Rampant honey adulteration; consumers have no tamper-proof method to verify purity or origin before buying.  
  2. **Hive Health Gap:** Bee colony diseases (e.g., Varroa destructor mite, deformed wing virus) remain undetected until irreversible damage occurs.  
  3. **Market Intermediaries:** Beekeepers are forced to sell through middlemen at unfair prices with zero direct digital market access.  
  4. **Regulatory / KVIC Support:** Lack of a centralized digital system for remote beekeeper verification (e-KYC) and batch tracking.

### **2\. Complete Technical Stack**

From Slide 3 (*Technical Approach & Technical Stack*) \[[01:06](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D66)\] and the live demo:

| Layer | Technologies Used | Purpose |
| :---- | :---- | :---- |
| **Frontend** | **React.js, TypeScript, Tailwind CSS** \[[01:09](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D69)\] | Modern reactive web UI, responsive components, stepper forms, dashboard metrics. |
| **UI Components & Icons** | Lucide React / Feather Icons, Canvas Confetti | Visual dashboards, status badges, celebratory checkout animations. |
| **Backend & API** | **Node.js, Express.js** \[[01:09](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D69)\] | REST API gateway, route handling, third-party service bridging. |
| **Database & Auth** | **Supabase (PostgreSQL)** \[[01:18](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D78)\] | Relational data storage, Row-Level Security (RLS), Google OAuth & Email/Password authentication. |
| **Cloud Storage** | **Supabase Storage Buckets** \[[01:18](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D78)\] | Hosting uploaded hive inspection images, Aadhaar/KVIC ID proofs, and QR labels. |
| **Blockchain / Web3** | **Polygon Amoy Testnet (Chain ID 80002\)**, **Solidity, Hardhat** \[[01:18](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D78)\] | Immutable batch registry smart contracts, 7-way cryptographic hash verification. |
| **AI / Computer Vision** | **TensorFlow, MobileNetV2 CNN, Python** \[[01:28](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D88)\] | Image classification for honeybee brood diseases (Varroa Destructor mite detection, wing health). |
| **IoT Architecture** | **ESP32, DHT22 (Temp & Humidity), Weight Sensors (HX711)** \[[01:06](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D66)\] | Continuous hive telemetry to detect sudden temperature/humidity spikes (swarming/ventilation risks). |
| **Payments** | **Razorpay Payment Gateway** \[[01:06](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D66)\] | End-to-end checkout processing with test and live payment flow. |
| **Deployment & Hosting** | **Vercel** (beebridge.vercel.app, beebridge-sh.vercel.app) \[[01:31](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D91)\] | Continuous integration and production web hosting. |

### **3\. Application Workflow & Architecture**

#### **Architecture Pipeline \[[04:26](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D266)\]**

Plaintext  
\[ Consumers / Buyers \]        \[ Beekeepers / Farmers \]       \[ KVIC Admin / Lab \]  
         │                               │                             │  
         ▼                               ▼                             ▼  
┌────────────────────────────────────────────────────────────────────────────────┐  
│                    Frontend UI: React.js \+ Tailwind CSS                        │  
│          (/home, /verify, /hive-monitoring, /seller, /shop, /cart)             │  
└──────────────────────────────────────┬─────────────────────────────────────────┘  
                                       │ HTTP / REST  
                                       ▼  
┌────────────────────────────────────────────────────────────────────────────────┐  
│                         Backend: Node.js \+ Express.js                          │  
│                               (API Gateway)                                    │  
└──────┬───────────────────┬───────────────────┬───────────────────┬─────────────┘  
       │                   │                   │                   │  
       ▼                   ▼                   ▼                   ▼  
┌──────────────┐   ┌──────────────┐   ┌─────────────────┐   ┌─────────────────┐  
│ Supabase DB  │   │  Supabase    │   │ Polygon Amoy    │   │ TensorFlow      │  
│ (PostgreSQL) │   │  Auth & S3   │   │ Smart Contract  │   │ MobileNetV2     │  
│ Users, Hives │   │ Google OAuth │   │ Batch Proofs    │   │ Brood Disease   │  
│ Orders, IoT  │   │ ID Documents │   │ Immutable State │   │ Classifier      │  
└──────────────┘   └──────────────┘   └─────────────────┘   └─────────────────┘

#### **Core Operational Workflows:**

> 1. **Beekeeper Onboarding (e-KYC):**  
   * Beekeeper registers via Supabase Auth (Email or Google OAuth) \[[02:04](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D124)\].  
   * Submits Personal Info, Apiary Address, Phone, and Govt Agriculture/Aadhaar ID image.  
   * Grants browser geolocation access to pin hive coordinates \[[02:30](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D150)\].  
   * Once approved, their account is granted verified status to log hives and honey batches.  
> 2. **Honey Harvesting & Blockchain Anchoring:**  
   * When a harvest occurs, the beekeeper creates a batch record (e.g., HB-2026-000001) \[[02:37](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D157)\].  
   * Metadata includes: Hive ID, harvest date, floral source, extraction method, moisture content, lab purity score.  
   * Data is hashed and written to a Solidity smart contract deployed on the Polygon Amoy Testnet.  
   * A unique tamper-proof QR code is generated linking directly to the public verification URL.  
> 3. **Consumer Verification (Zero-Login Public Access):**  
   * A consumer scans the QR code on the honey jar, opening /verify?hb=\<BATCH\_ID\> \[[02:37](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D157)\].  
   * The system runs a 7-way cryptographic check against the Polygon blockchain and renders a verifiable authenticity certificate with lab specs, apiary location, and transaction hashes.  
> 4. **AI Hive Health Monitoring:**  
   * Beekeeper uploads an image of a hive frame or brood \[[02:57](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D177)\].  
   * The MobileNetV2 model classifies the frame into: *Healthy Colony*, *Varroa Infested*, or *Low Confidence / Glare (Manual Inspection Required)*.  
   * If confidence is below 75%, it alerts the beekeeper to inspect manually.  
> 5. **Direct E-Commerce & Checkout:**  
   * Consumers browse raw honey listed by verified beekeepers \[[03:15](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D195)\].  
   * Adds to cart, inputs shipping details, applies discount coupons, and completes payment through Razorpay modal.  
   * Generates a downloadable PDF receipt and order confirmation.

### **4\. Page-by-Page Frontend Design & UI Specification**

Here is the exact visual hierarchy, component layout, and styling needed to reproduce the frontend:

#### **1\. Authentication Screen (/login) \[[01:31](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D91)\]**

* **Layout:** Centered split card (50/50 desktop layout) on an off-white background (bg-slate-50).  
* **Left Section:**  
  * Header: "Hello Again\!" (Bold, Dark Gray text-gray-900), subtext: "Welcome back to BeeBridge".  
  * Inputs: Email Address, Password (with toggle eye icon), "Forgot Password?" link.  
  * Primary Button: Amber-yellow button (bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg) labeled **"SIGN IN"**.  
  * Social Login: Divider "Or continue with", followed by a branded Google Sign-In button redirecting to Supabase OAuth.  
* **Right Section:** Clean vector illustration of a person interacting with a mobile/web security dashboard.

#### **2\. Landing / Home Page (/home) \[[01:51](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D111)\]**

* **Navigation Bar:**  
  * Left: BeeBridge brand logo (stylized Honeybee icon \+ "BeeBridge" logotype).  
  * Center Links: HOME, SHOP, AI MONITORING (accented with a pink "HOT" / "NEW" badge), VERIFY HONEY (accented with a yellow/green "VERIFY" badge), ABOUT, SELLER, CONTACT, SUBSCRIPTION.  
  * Right: Cart icon with counter badge 0, Profile avatar, Settings cog icon.  
* **Hero Section:**  
  * Background: Scenic illustration of green rolling hills, wildflowers, and wooden beehives.  
  * Pill Badge: Translucent white pill: Farm-to-Home Honey Marketplace.  
  * Headline: Large serif/display typography: *"We're the bridge between the farmer's field, the beekeeper's hive, to the honey in your home."*  
  * Call-to-Action (CTA) Buttons:  
    1. **"Shop Now"** (Purple gradient button: bg-gradient-to-r from-purple-600 to-indigo-600).  
    2. **"AI Hive Health"** (Violet pill with sparkle icon).  
    3. **"Verify Honey Batch"** (Emerald green pill with checkmark icon: bg-emerald-500).

#### **3\. Seller / Beekeeper Multi-Step Registration (/seller) \[[02:07](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D127)\]**

* **Aesthetic Theme:** Dripping honey accent graphic along the top and bottom borders.  
* **Header Stepper:** 4 step progression pills:  
  1. Personal Information (Active)  
  2. Address  
  3. Contact  
  4. Proof  
* **Step Fields Breakdown:**  
  * *Step 1:* Email, Full Name, Profile Picture file upload (input\[type="file"\]), Checkbox: *"I accept the Terms & Conditions of BeeBridge"*, "Next \>" button.  
  * *Step 2:* City, State, ZIP code.  
  * *Step 3:* Mobile Phone Number, ID Proof upload (e.g., Aadhaar card image / KVIC registration certificate).  
  * *Step 4:* Location Access permission card with a prominent button: **"Detect My Location"** (using the browser's navigator.geolocation API) \[[02:30](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D150)\] followed by **"Complete Registration"**.

#### **4\. Blockchain Verification Dashboard (/verify?hb=HB-2026-000001) \[[02:37](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D157)\]**

* **Loading State:** Centered card with animated spinner: *"Verifying Authenticity On-Chain... Executing 7-way cryptographic verification against Polygon Amoy Blockchain and Bee Bridge Honey Registry"* \[[02:37](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D157)\].  
* **Verification Certificate Layout:**  
  * **Top Certificate Header:**  
    * Left: "BEE BRIDGE HONEY AUTHENTICITY — Verified Honey \[CERTIFIED\]" with a verified gold seal.  
    * Subtext: 100% Pure & Farm-Traceable \- Cryptographically Verified on Polygon Amoy.  
    * Right Pill: SIH 2026 Traceability.  
  * **Metric Grid (4 Rounded Cards):**  
    * **BATCH ID:** HB-2026-000001 (Raw Multifloral Forest Honey).  
    * **HIVE ID:** HIVE-000001 (Apis cerana indica colony).  
    * **HARVEST DATE:** 15 September 2026 (Unprocessed & Cold-extracted).  
    * **QUALITY STATUS:** Premium Grade A (99.4% Purity Score).  
  * **Tamper-Proof QR Code Seal Card:**  
    * Centered high-resolution QR code.  
    * Explanatory badge: *"This QR code is affixed to every jar of batch HB-2026-000001. Customers scan this QR code on the physical jar to instantly verify farm-to-bottle traceability, blockchain consensus, and lab purity without logging in."*  
    * Actions: Download QR (PNG), Print 4x4 Jar Label, Copy Public URL.  
  * **Verified Beekeeper of Origin Card:**  
    * Beekeeper Name: M. Shanmugam (Nilgiris High-Altitude Bee Farm).  
    * Source Location: Nilgiris Forest Apiary, Ooty, Tamil Nadu.  
    * Status Badge: Govt Agriculture ID Proof: Verified Beekeeper ✓.  
  * **Laboratory Quality Parameters (FSSAI & AGMARK Compliant):**  
    * 4 Stat Cards: Purity 99.4%, Moisture 17.2%, Natural Sugars 79.5%, pH Level 3.85.  
  * **Blockchain Immutable Proof Card:**  
    * Deep indigo/purple card with Explorer button.  
    * Transaction Hash: 0x8c9cf2588383a45110e05139a6e60b12bc1fc81b49aa2bf41e053a6f959c9d7d.  
    * Block Details: 28 September 2026 \- Block \#12842034 (Consensus confirmed on-chain).  
  * **Farm-to-Jar Traceability Journey (Timeline):**  
    1. *Batch Harvested* (15 Sept 2026, Nilgiris Apiary \#1) — Verified  
    2. *Lab Quality Inspection* (18 Sept 2026, Food Testing Lab, Nilgiris) — Verified  
    3. *Smart Contract Anchored* (20 Sept 2026, Polygon Amoy Testnet Proof of State) — Verified  
    4. *Tamper-Evident Sealed & Packed* (22 Sept 2026, Bee Bridge Processing Hub) — Verified

#### **5\. AI Hive Monitoring & Health Screening (/hive-monitoring) \[[02:57](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D177)\]**

* **Navigation Sub-Tabs:**  
  1. AI Image Screening (Active)  
  2. Colony Health Analytics  
  3. IoT Environmental Telemetry  
  4. Alerts & Notifications (2)  
* **Left Panel — Image Ingestion:**  
  * Title: "Upload Bee / Brood Image (Screen for Varroa Destructor and deformed wing virus)".  
  * Dashed dropzone area: *"Click to upload or drag & drop hive image (JPEG, PNG, or WEBP up to 10MB)"*.  
  * **Quick Demo Test Presets:** 3 buttons for rapid evaluation:  
    * Sample 1: Healthy Colony  
    * Sample 2: Varroa Infested  
    * Sample 3: Low / Conf  
* **Right Panel — Screening Results:**  
  * **When Sample 1 (Healthy) is selected:** \[[03:07](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D187)\]  
    * Badge: Healthy \- 95.8% Confidence (Emerald Green).  
    * Details: *"Colony bees exhibit healthy wing morphology and normal coloration. No visible Varroa destructor infestation detected."*  
    * Confidence progress bar: Healthy 95.8%, Varroa Risk 4.2%.  
  * **When Sample 3 (Low Confidence) is selected:** \[[03:13](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D193)\]  
    * Badge: Manual Inspection Recommended \- 68.2% Confidence (Amber/Orange).  
    * Details: *"AI screening confidence is below threshold (75%). High motion blur or ambient glare detected. Manual inspection recommended by beekeeper."*

#### **6\. E-Commerce Cart & Razorpay Checkout (/cart, /checkout) \[[03:15](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D195)\]**

* **Progress Breadcrumb:** Cart \> Information \> Shipping \> Payment.  
* **Checkout Form:** Email, First Name, Last Name, Shipping Address, City, State, PIN code, Phone number.  
* **Order Summary Card:**  
  * Product: Wildflower Honey (Qty: 1\) — ₹1,350.00.  
  * Subtotal: ₹1,350.00 | Shipping: FREE (₹0.00) | Total: ₹1,350.00.  
  * Coupon Code input (e.g., typing "OFFER" \-\> triggers alert toast).  
  * CTA Button: **"Pay with Razorpay"**.  
* **Razorpay Modal:** Standard Razorpay iFrame modal overlay with mobile number, email, and Netbanking/UPI simulator (Success / Failure buttons) \[[03:36](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D216)\].  
* **Success View:** Full-screen celebratory confetti animation redirecting to /my-orders \[[03:44](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D224)\].

#### **7\. Orders & Receipt View (/my-orders) \[[03:45](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D225)\]**

* Receipt ID: \#BB-20260911-82585.  
* Actions: Download PDF, Print, View Receipt.  
* Breakdown of order status (Paid), shipping address, product list, Razorpay payment ID, and estimated delivery date.

#### **8\. User Profile View (/profile) \[[03:48](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D228)\]**

* Avatar with "Change profile picture" overlay.  
* Form fields: Name, Age, City/Location, Pincode, Email, Phone, Full Address.  
* Action: "Save Profile" button triggering a green toast alert: *"Profile saved successfully\!"* \[[04:14](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D254)\].

### **5\. Database Schema Blueprint (PostgreSQL / Supabase)**

To replicate the backend data model in Supabase:

SQL  
\-- 1\. Profiles & Roles  
CREATE TABLE profiles (  
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,  
    full\_name TEXT,  
    email TEXT UNIQUE,  
    phone TEXT,  
    role TEXT CHECK (role IN ('consumer', 'beekeeper', 'admin')) DEFAULT 'consumer',  
    avatar\_url TEXT,  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);

\-- 2\. Beekeeper / Seller Verification  
CREATE TABLE beekeepers (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    user\_id UUID REFERENCES profiles(id) ON DELETE CASCADE,  
    farm\_name TEXT NOT NULL,  
    address TEXT,  
    city TEXT,  
    state TEXT,  
    pincode TEXT,  
    latitude DOUBLE PRECISION,  
    longitude DOUBLE PRECISION,  
    id\_proof\_url TEXT,  
    is\_verified BOOLEAN DEFAULT FALSE,  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);

\-- 3\. Hives  
CREATE TABLE hives (  
    id TEXT PRIMARY KEY, \-- e.g. 'HIVE-000001'  
    beekeeper\_id UUID REFERENCES beekeepers(id),  
    species TEXT DEFAULT 'Apis cerana indica',  
    location\_description TEXT,  
    status TEXT CHECK (status IN ('healthy', 'at\_risk', 'diseased')) DEFAULT 'healthy',  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);

\-- 4\. Honey Batches (Blockchain Linked)  
CREATE TABLE honey\_batches (  
    batch\_id TEXT PRIMARY KEY, \-- e.g. 'HB-2026-000001'  
    hive\_id TEXT REFERENCES hives(id),  
    beekeeper\_id UUID REFERENCES beekeepers(id),  
    honey\_type TEXT NOT NULL, \-- e.g. 'Raw Multifloral Forest Honey'  
    harvest\_date DATE NOT NULL,  
    purity\_score NUMERIC(5,2), \-- e.g. 99.40  
    moisture\_percentage NUMERIC(5,2), \-- e.g. 17.20  
    natural\_sugars\_percentage NUMERIC(5,2), \-- e.g. 79.50  
    ph\_level NUMERIC(4,2), \-- e.g. 3.85  
    blockchain\_tx\_hash TEXT,  
    blockchain\_block\_number BIGINT,  
    qr\_code\_url TEXT,  
    is\_certified BOOLEAN DEFAULT TRUE,  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);

\-- 5\. Orders & Payments  
CREATE TABLE orders (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    receipt\_no TEXT UNIQUE, \-- e.g. 'BB-20260911-82585'  
    user\_id UUID REFERENCES profiles(id),  
    total\_amount NUMERIC(10,2) NOT NULL,  
    payment\_status TEXT CHECK (payment\_status IN ('pending', 'paid', 'failed')),  
    razorpay\_order\_id TEXT,  
    razorpay\_payment\_id TEXT,  
    shipping\_address JSONB,  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);

### **6\. Smart Contract Architecture (Solidity)**

A minimal Hardhat/Solidity contract (HoneyChain.sol) deployed to the Polygon Amoy testnet:

Solidity  
// SPDX-License-Identifier: MIT  
pragma solidity ^0.8.20;

contract HoneyChainRegistry {  
    address public admin;

    struct Batch {  
        string batchId;  
        string hiveId;  
        string beekeeperName;  
        string originLocation;  
        uint256 harvestTimestamp;  
        uint256 purityScore; // Multiplied by 100 (e.g., 9940 \= 99.40%)  
        string ipfsLabReportHash;  
        bool exists;  
    }

    mapping(string \=\> Batch) private batches;  
    event BatchAnchored(string indexed batchId, string hiveId, uint256 timestamp);

    modifier onlyAdmin() {  
        require(msg.sender \== admin, "Unauthorized");  
        \_;  
    }

    constructor() {  
        admin \= msg.sender;  
    }

    function registerHoneyBatch(  
        string memory \_batchId,  
        string memory \_hiveId,  
        string memory \_beekeeperName,  
        string memory \_originLocation,  
        uint256 \_harvestTimestamp,  
        uint256 \_purityScore,  
        string memory \_ipfsLabReportHash  
    ) external onlyAdmin {  
        require(\!batches\[\_batchId\].exists, "Batch ID already registered");

        batches\[\_batchId\] \= Batch({  
            batchId: \_batchId,  
            hiveId: \_hiveId,  
            beekeeperName: \_beekeeperName,  
            originLocation: \_originLocation,  
            harvestTimestamp: \_harvestTimestamp,  
            purityScore: \_purityScore,  
            ipfsLabReportHash: \_ipfsLabReportHash,  
            exists: true  
        });

        emit BatchAnchored(\_batchId, \_hiveId, \_harvestTimestamp);  
    }

    function getBatch(string memory \_batchId) external view returns (Batch memory) {  
        require(batches\[\_batchId\].exists, "Batch not found");  
        return batches\[\_batchId\];  
    }  
}

### **7\. AI Model Implementation (MobileNetV2)**

The video states that **MobileNetV2** is used to classify hive frames for Varroa destructor mite detection \[[01:28](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D88)\].

* **Model Input:** 224x224 RGB image normalized to \[-1, 1\].  
* **Classes:**  
  1. Healthy Colony  
  2. Varroa Infested  
  3. Deformed Wing Virus  
* **Inference Logic:**  
  * If confidence \< 0.75: Return status **Manual Inspection Recommended** (flagging motion blur/lighting artifacts) \[[03:13](https://www.google.com/search?q=https://www.youtube.com/watch?v%3DXmmKML2IPFE%26t%3D193)\].  
  * If confidence \>= 0.75: Return status **Healthy** or **Infection Alert** along with treatment guidance.

### **Next Steps for Implementation**

Review the workflow, schema, and page designs above. Whenever you are ready, let me know and I will:

> 1. Compile the **Visual Slide & Frontend Screenshot Dossier PDF** containing all slide graphics and UI layouts.  
> 2. Compile the **Full Developer Architecture & Replication Guide PDF** containing the code templates, Solidity contracts, and API routes.