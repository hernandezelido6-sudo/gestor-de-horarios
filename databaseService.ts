import { db, auth, OperationType, handleFirestoreError } from './firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { TeacherAvailability, ClassData, Message, SystemSettings, Sector } from './types';

class DatabaseService {
  // --- GENERAL STORAGE CACHE (LOCALSTORAGE FALLBACK) ---
  private getLocal<T>(key: string): T[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(`cache_${key}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocal<T>(key: string, data: T[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(data));
    } catch (e) {
      console.error('Local cache error:', e);
    }
  }

  // --- AVAILABILITIES OPERATIONS ---
  public async getAvailabilities(sector?: Sector): Promise<TeacherAvailability[]> {
    try {
      const snapshot = await getDocs(collection(db, 'availabilities'));
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          subject: data.subject || '',
          subjects: data.subjects || [],
          slots: data.slots || [],
          sector: data.sector || Sector.PREPARATORY,
          timestamp: data.timestamp && typeof data.timestamp.toDate === 'function'
            ? data.timestamp.toDate()
            : (data.timestamp ? new Date(data.timestamp) : new Date())
        } as TeacherAvailability;
      });
      this.saveLocal('availabilities', list);
      const filtered = sector ? list.filter(t => !t.sector || t.sector === sector) : list;
      return filtered;
    } catch (err) {
      console.warn('Firestore load availabilities failed, using local cache', err);
      const list = this.getLocal<TeacherAvailability>('availabilities');
      const filtered = sector ? list.filter(t => !t.sector || t.sector === sector) : list;
      return filtered;
    }
  }

  public async saveAvailability(record: TeacherAvailability): Promise<void> {
    const dataToSend = {
      name: record.name,
      subject: record.subject || '',
      subjects: Array.isArray(record.subjects) ? record.subjects : (record.subject ? [record.subject] : []),
      slots: record.slots || [],
      sector: record.sector || Sector.PREPARATORY,
      timestamp: record.timestamp ? record.timestamp.toISOString() : new Date().toISOString()
    };

    // Keep cache updated
    const current = this.getLocal<TeacherAvailability>('availabilities');
    const index = current.findIndex(t => t.id === record.id);
    if (index >= 0) {
      current[index] = { ...record };
    } else {
      current.push({ ...record });
    }
    this.saveLocal('availabilities', current);

    // Write to Firestore
    try {
      const firestorePayload = {
        id: record.id,
        name: record.name,
        subject: record.subject || '',
        subjects: dataToSend.subjects,
        slots: record.slots || [],
        sector: record.sector || Sector.PREPARATORY,
        timestamp: record.timestamp || new Date()
      };
      await setDoc(doc(db, 'availabilities', record.id), firestorePayload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `availabilities/${record.id}`);
    }
  }

  public async deleteAvailability(id: string): Promise<void> {
    // Keep cache updated
    const current = this.getLocal<TeacherAvailability>('availabilities');
    const filtered = current.filter(t => t.id !== id);
    this.saveLocal('availabilities', filtered);

    // Delete in Firestore
    try {
      await deleteDoc(doc(db, 'availabilities', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `availabilities/${id}`);
    }
  }

  // --- CLASSES OPERATIONS ---
  public async getClasses(): Promise<ClassData[]> {
    try {
      const snapshot = await getDocs(collection(db, 'classes'));
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData));
      this.saveLocal('classes', list);
      return list;
    } catch (err) {
      console.warn('Firestore load classes failed, using local cache', err);
      return this.getLocal<ClassData>('classes');
    }
  }

  public async saveClasses(newClasses: ClassData[], oldClasses: ClassData[]): Promise<void> {
    const oldClassIds = oldClasses.map(c => c.id);
    const newClassIds = new Set(newClasses.map(c => c.id));
    const deletedIds = oldClassIds.filter(id => !newClassIds.has(id));

    // Save in Local cache
    this.saveLocal('classes', newClasses);

    // Firestore writes
    try {
      let batch = writeBatch(db);
      let count = 0;

      for (const id of deletedIds) {
        batch.delete(doc(db, 'classes', id));
        count++;
        if (count >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }

      for (const classItem of newClasses) {
        batch.set(doc(db, 'classes', classItem.id), classItem);
        count++;
        if (count >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'classes');
    }
  }

  public async deleteClassesBySector(sector: Sector, currentClasses: ClassData[]): Promise<void> {
    const docsToDelete = currentClasses.filter(c => c.sector === sector);
    const newClasses = currentClasses.filter(c => c.sector !== sector);
    
    this.saveLocal('classes', newClasses);

    // From Firestore
    try {
      for (const d of docsToDelete) {
        await deleteDoc(doc(db, 'classes', d.id));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'classes');
    }
  }

  // --- MESSAGES OPERATIONS ---
  public async getMessages(): Promise<Message[]> {
    try {
      const snapshot = await getDocs(collection(db, 'messages'));
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          sender: data.sender,
          content: data.content,
          isOfficial: data.isOfficial || false,
          timestamp: data.timestamp?.toDate() || new Date()
        } as Message;
      });
      const sorted = list.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      this.saveLocal('messages', sorted);
      return sorted;
    } catch (err) {
      console.warn('Firestore load messages failed, using local cache', err);
      return this.getLocal<Message>('messages').sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
  }

  public async saveMessage(message: Message): Promise<void> {
    // Cache update
    const current = this.getLocal<Message>('messages');
    current.push(message);
    this.saveLocal('messages', current);

    // Save in Firestore
    try {
      const firestorePayload = {
        id: message.id,
        sender: message.sender,
        content: message.content,
        isOfficial: message.isOfficial || false,
        timestamp: message.timestamp
      };
      await setDoc(doc(db, 'messages', message.id), firestorePayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `messages/${message.id}`);
    }
  }

  // --- SETTINGS OPERATIONS ---
  public async getSettings(): Promise<SystemSettings> {
    const defaultSettings: SystemSettings = {
      hours: ['7:00-8:00', '8:00-9:00', '9:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00'],
      hoursPreparatory: [
        '7:20 - 8:10', '8:10 - 9:00', '9:00 - 9:50', '9:50 - 10:40',
        '10:40 - 11:30', '11:30 - 12:20', '12:20 - 13:10', '13:10 - 13:20', '13:20 - 14:10'
      ],
      recessesPreparatory: ['13:10 - 13:20'],
      hoursSecondary: [
        '7:00 - 7:50', '7:50 - 8:40', '8:40 - 9:10', '9:10 - 10:00', '10:00 - 10:10',
        '10:10 - 11:00', '11:00 - 11:50', '11:50 - 12:40', '12:40 - 12:50', '12:50 - 13:40'
      ],
      recessesSecondary: ['8:40 - 9:10', '10:00 - 10:10', '12:40 - 12:50']
    };

    try {
      const snapshot = await getDocs(collection(db, 'settings'));
      const globalDoc = snapshot.docs.find(d => d.id === 'global');
      if (globalDoc) {
        const data = globalDoc.data() as SystemSettings;
        // Merge so we don't lose the arrays if they weren't configured previously
        // Migrate legacy configurations that are missing the new recesses
        const savedHoursSecondary = data.hoursSecondary && data.hoursSecondary.length > 3 ? data.hoursSecondary : defaultSettings.hoursSecondary;
        const validHoursSecondary = savedHoursSecondary.includes('8:40 - 9:10') ? savedHoursSecondary : defaultSettings.hoursSecondary;

        const savedRecessesSecondary = data.recessesSecondary && data.recessesSecondary.length > 0 ? data.recessesSecondary : defaultSettings.recessesSecondary;
        const validRecessesSecondary = savedRecessesSecondary.includes('8:40 - 9:10') ? savedRecessesSecondary : defaultSettings.recessesSecondary;

        return {
          ...defaultSettings,
          ...data,
          // Only use the user-saved hoursPreparatory if they explicitly have 13 items (our default union) or if they intentionally modified it
          hoursPreparatory: data.hoursPreparatory && data.hoursPreparatory.length > 3 ? data.hoursPreparatory : defaultSettings.hoursPreparatory,
          hoursSecondary: validHoursSecondary,
          recessesSecondary: validRecessesSecondary
        };
      }
    } catch (err) {
      console.warn('Firestore load settings failed', err);
    }

    return defaultSettings;
  }

  public async saveSettings(settings: SystemSettings): Promise<void> {
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/global');
    }
  }
}

export const databaseService = new DatabaseService();
