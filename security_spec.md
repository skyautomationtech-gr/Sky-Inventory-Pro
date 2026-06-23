# Firebase Security Specification & Red-Team Audit Specifications

## 1. Zero-Trust Data Invariants

Our Sky Inventory Pro system relies on the following fundamental data integrity and confidentiality requirements:
1. **No Untrusted Role Changes**: A standard operator user profile (`staff` or unauthenticated) must never be allowed to elevate their own role to `superAdmin` or `admin`.
2. **Strict OTP Isolation**: Clients are prohibited from executing blanket list queries on the `otps` collection. Only direct lookups (`get`) matching their known verification email reference are permitted.
3. **Immutability of OTP Core values**: An OTP code verification payload cannot be altered to inject fresh random OTP values or swap the target destination email. Only `attempts` and `verified` flags are writeable upon state updates.
4. **Data Ownership Bound**: Staff profiles are writable only by the authenticated owner of the profile (`request.auth.uid == userId`) or by a superAdmin.
5. **No Anonymous Writing**: Any state adjustment to inventory logs, sales, products or categories must be performed by active authenticated enterprise operators (`request.auth != null`).

---

## 2. The "Dirty Dozen" Malicious Payloads

The following 12 visual payloads are engineered to bypass security and must be mathematically blocked by `/firestore.rules`:

| Test ID | Collection | Operation | Attack Description | Malicious Payload / ID |
| :--- | :--- | :--- | :--- | :--- |
| **01** | `users` | `UPDATE` | **Self-Promotion escalation**: Attending to self-grant the `'superAdmin'` role on local profile. | Target ID: `usr_123` (Caller: `usr_123`). Updated Payload: `{"role": "superAdmin", "status": "active"}`. |
| **02** | `users` | `UPDATE` | **Unblocking Bypasser**: Attending to unblock/activate a blocked user account as a standard user. | Target ID: `usr_456` (Caller: `usr_123`). Updated Payload: `{"status": "active"}`. |
| **03** | `users` | `CREATE` | **Identity Spoofing**: Attempting to insert a user doc for a different user's UID. | Target ID: `usr_attack_999` (Caller: `usr_123`). Payload: `{"id": "usr_attack_999", "name": "Fake Admin", "role": "staff"}`. |
| **04** | `otps` | `LIST` | **Query Scraping Database harvesting**: Executing collection query to dump all outstanding registration OTPs. | Target Collection: `otps`. Query: `getDocs(collection(db, 'otps'))`. |
| **05** | `otps` | `UPDATE` | **OTP Code Tampering**: Overwriting the active valid registration OTP code to a known code (e.g. `111111`) to bypass verifications. | Target ID: `bob@example.com`. Payload: `{"otp": "111111"}`. |
| **06** | `otps` | `CREATE` | **Email Destination Swap**: Creating an OTP document where the email domain doesn't align with the targeting document path ID. | Target ID: `john@company.com`. Payload: `{"email": "scammer@attacker.com", "otp": "999999", "attempts": 0, "verified": false}`. |
| **07** | `products` | `CREATE` | **Denial of Wallet size overflow attack**: Creating a product document with a massive 1MB string name payload. | Target ID: `prod_666`. Payload: `{"id": "prod_666", "name": "AAA...[1MB String]", "sku": "SKU-99", ...}`. |
| **08** | `products` | `DELETE` | **Staff Rogue Deletion**: Attempting to delete critical inventory products as a standard staff member. | Target ID: `prod_123` (Caller role: `'staff'`). |
| **09** | `products` | `CREATE` | **Negative stock poisoning value**: Injecting negative values inside inventory product stocks to trigger software defects. | Target ID: `prod_abc`. Payload: `{"stockQuantity": -100}`. |
| **10** | `invoices` | `DELETE` | **Sales Audit Erasure**: Standard operators trying to purge audit sales invoices to hide cash theft. | Target ID: `inv_999` (Caller role: `'staff'`). |
| **11** | `inventoryLogs`| `UPDATE` | **Historical Log Manipulation**: Standard operator attempts to alter past stock movement logs manually. | Target ID: `log_777`. Payload: `{"quantity": 500}`. |
| **12** | `categories` | `CREATE` | **Junk Category Injection**: Attempting to inject missing required list items and oversized names. | Target ID: `cat_xyz`. Payload: `{"name": "Trash category", "icon": "SomeIcon", "subcategories": "NotAList"}`. |

---

## 3. Test Runner Definition (`firestore.rules.test.ts`)

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';

describe('Sky Inventory Pro: Zero-Trust Security Rule Suite', () => {
  let testEnv: any;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'sky-inventory-pro-secure-auth',
      firestore: {
        rules: `rules_version = '2'; ...`
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('Blocks Self-Promotion (Test 01)', async () => {
    const unprivilegedContext = testEnv.authenticatedContext('staff_user', { email: 'staff@sky.com' });
    const userDocRef = doc(unprivilegedContext.firestore(), 'users', 'staff_user');
    
    // Attempting to elevate role to superAdmin
    await assertFails(updateDoc(userDocRef, {
      role: 'superAdmin'
    }));
  });

  it('Blocks OTP Scraping / List Operations (Test 04)', async () => {
    const anonContext = testEnv.unauthenticatedContext();
    const otpsRef = collection(anonContext.firestore(), 'otps');
    
    // Blanket list queries on OTPs are strictly forbidden
    await assertFails(getDocs(otpsRef));
  });

  it('Blocks OTP Code Tampering (Test 05)', async () => {
    const anonContext = testEnv.unauthenticatedContext();
    const otpDocRef = doc(anonContext.firestore(), 'otps', 'user@sky.com');
    
    // Raw verification OTP alteration is strictly forbidden
    await assertFails(updateDoc(otpDocRef, {
      otp: '111111'
    }));
  });

  it('Blocks Unprivileged product creations / size limits (Test 07)', async () => {
    const viewerContext = testEnv.unauthenticatedContext(); // Unauthenticated
    const prodDocRef = doc(viewerContext.firestore(), 'products', 'test_prod');
    
    await assertFails(setDoc(prodDocRef, {
      id: 'test_prod',
      name: 'A'.repeat(1000) // Oversized
    }));
  });
});
```
