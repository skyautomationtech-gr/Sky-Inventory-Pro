import { db, OperationType, handleFirestoreError } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc,
  increment 
} from 'firebase/firestore';

export interface LoyaltyCustomer {
  id?: string;
  phone: string;
  points: number;
  lastUpdated: string;
}

const COLLECTION_NAME = 'loyalty_customers';

/**
 * Gets loyalty points for a customer by phone number.
 */
export async function getCustomerPointsByPhone(phone: string): Promise<LoyaltyCustomer | null> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('phone', '==', phone));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Assuming phone is unique in this collection
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as LoyaltyCustomer;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
    return null;
  }
}

/**
 * Updates loyalty points for a customer.
 * If the customer doesn't exist, it creates a new record.
 */
export async function updateCustomerPoints(phone: string, pointsChange: number): Promise<void> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('phone', '==', phone));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Create new
      await setDoc(doc(collection(db, COLLECTION_NAME)), {
        phone,
        points: pointsChange,
        lastUpdated: new Date().toISOString()
      });
    } else {
      // Update existing
      const customerDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, COLLECTION_NAME, customerDoc.id), {
        points: increment(pointsChange),
        lastUpdated: new Date().toISOString()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, COLLECTION_NAME);
  }
}

export async function addLoyaltyTransaction(transaction: {
  phone: string;
  pointsAdded: number;
  invoiceNo: string;
  date: string;
}): Promise<void> {
  try {
    await setDoc(doc(collection(db, 'loyalty_transactions')), transaction);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'loyalty_transactions');
  }
}
