import { db, OperationType, handleFirestoreError } from '../firebase';
import { 
  collection, 
  addDoc,
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';

export interface WarrantyInformation {
  invoiceNo: string;
  phone: string;
  status: 'Active' | 'Expired';
  periodMonths: number;
  purchaseDate: string;
  expiryDate: string;
  terms: string;
}

const COLLECTION_NAME = 'warranties';

export async function saveWarranty(warranty: WarrantyInformation): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), warranty);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    return null;
  }
}

export async function getWarrantyByInvoice(invoiceNo: string): Promise<WarrantyInformation | null> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('invoiceNo', '==', invoiceNo));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    return querySnapshot.docs[0].data() as WarrantyInformation;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
    return null;
  }
}
