import { useState, useEffect } from 'react';
import { createTLStore, defaultShapeUtils, TLRecord } from 'tldraw';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { MathShapeUtil } from '../components/board/shapes/MathShape';
import { CodeShapeUtil } from '../components/board/shapes/CodeShape';

export function useYjsStore({ roomId, hostUrl: defaultHostUrl }: { roomId: string; hostUrl: string }) {
  const [store] = useState(() => createTLStore({ 
    shapeUtils: [...defaultShapeUtils, MathShapeUtil, CodeShapeUtil] 
  }));
  const [storeWithStatus, setStoreWithStatus] = useState<any>({ status: 'loading' });

  useEffect(() => {
    setStoreWithStatus({ status: 'loading' });

    const yDoc = new Y.Doc();
    const yStore = yDoc.getMap<any>('store');

    const providerUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || defaultHostUrl;

    const provider = new HocuspocusProvider({
      url: providerUrl,
      name: roomId,
      document: yDoc,
    });

    // 1. Sync from Yjs to Tldraw
    yStore.observe((event) => {
      if (event.transaction.local) return; // Ignore local changes

      const recordsToUpdate: TLRecord[] = [];
      const recordsToRemove: TLRecord['id'][] = [];

      event.changes.keys.forEach((change, key) => {
        if (change.action === 'add' || change.action === 'update') {
          const record = yStore.get(key);
          if (record) recordsToUpdate.push(record as TLRecord);
        } else if (change.action === 'delete') {
          recordsToRemove.push(key as TLRecord['id']);
        }
      });

      if (recordsToUpdate.length || recordsToRemove.length) {
        store.mergeRemoteChanges(() => {
          if (recordsToRemove.length) store.remove(recordsToRemove);
          if (recordsToUpdate.length) store.put(recordsToUpdate);
        });
      }
    });

    // 2. Sync from Tldraw to Yjs
    const unsubscribeStore = store.listen(
      ({ changes }) => {
        yDoc.transact(() => {
          Object.values(changes.added).forEach((record) => {
            yStore.set(record.id, record);
          });
          Object.values(changes.updated).forEach(([_, record]) => {
            yStore.set(record.id, record);
          });
          Object.values(changes.removed).forEach((record) => {
            yStore.delete(record.id);
          });
        }, 'local');
      },
      { source: 'user', scope: 'document' } // Only sync user-made, document-scoped changes
    );

    // Initial load handling
    const handleSync = () => {
      const records = Array.from(yStore.values());
      if (records.length === 0) {
        // Initialize Yjs store with current local document records
        yDoc.transact(() => {
          for (const record of store.allRecords()) {
            if (store.schema.types[record.typeName]?.scope === 'document') {
              yStore.set(record.id, record);
            }
          }
        }, 'local');
      } else {
        // Apply remote records to local store
        store.mergeRemoteChanges(() => {
          store.put(records);
        });
      }
      setStoreWithStatus({ status: 'synced', store, yDoc });
    };

    provider.on('synced', handleSync);

    return () => {
      unsubscribeStore();
      provider.destroy();
      yDoc.destroy();
    };
  }, [roomId, hostUrl, store]);

  return storeWithStatus;
}
