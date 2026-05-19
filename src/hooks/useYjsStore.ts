import { useState, useEffect, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';

/**
 * Yjs ↔ Excalidraw sync hook.
 * 
 * Architecture:
 * - yDoc.getMap('excalidraw-elements') stores the canonical element state
 * - yDoc.getMap('meta') stores presenter/camera metadata
 * - Local changes flow: Excalidraw onChange → Yjs map
 * - Remote changes flow: Yjs observe → setElements callback
 */

interface YjsSyncState {
  status: 'loading' | 'synced' | 'error';
  yDoc: Y.Doc | null;
  provider: HocuspocusProvider | null;
  initialElements: ExcalidrawElement[];
  pushElements: (elements: readonly ExcalidrawElement[]) => void;
  onRemoteChange: (callback: (elements: ExcalidrawElement[]) => void) => () => void;
}

export function useYjsStore({ roomId, hostUrl: defaultHostUrl }: { roomId: string; hostUrl: string }): YjsSyncState {
  const [state, setState] = useState<YjsSyncState>({
    status: 'loading',
    yDoc: null,
    provider: null,
    initialElements: [],
    pushElements: () => {},
    onRemoteChange: () => () => {},
  });

  // Track whether we're currently pushing local changes to prevent echo
  const isPushingRef = useRef(false);

  useEffect(() => {
    const yDoc = new Y.Doc();
    const yElements = yDoc.getMap<ExcalidrawElement>('excalidraw-elements');

    // Resolve WebSocket URL
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const providerUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 
      (isLocalhost ? defaultHostUrl : 'wss://dearfatty-pengoin-backend.hf.space');

    const provider = new HocuspocusProvider({
      url: providerUrl,
      name: roomId,
      document: yDoc,
    });

    // Push local Excalidraw elements into Yjs
    const pushElements = (elements: readonly ExcalidrawElement[]) => {
      isPushingRef.current = true;
      yDoc.transact(() => {
        // Build a set of current element IDs
        const currentIds = new Set(elements.map(el => el.id));
        
        // Remove elements that no longer exist
        for (const key of Array.from(yElements.keys())) {
          if (!currentIds.has(key)) {
            yElements.delete(key);
          }
        }

        // Add/update elements
        for (const el of elements) {
          const existing = yElements.get(el.id);
          // Only update if element actually changed (compare version)
          if (!existing || existing.version !== el.version || existing.updated !== el.updated) {
            yElements.set(el.id, el);
          }
        }
      }, 'local');
      // Use microtask to reset flag after Yjs processes the transaction
      queueMicrotask(() => { isPushingRef.current = false; });
    };

    // Subscribe to remote changes
    const onRemoteChange = (callback: (elements: ExcalidrawElement[]) => void) => {
      const observer = (event: Y.YMapEvent<ExcalidrawElement>) => {
        // Skip if this was triggered by our own local push
        if (event.transaction.local) return;
        if (isPushingRef.current) return;

        const elements = Array.from(yElements.values());
        callback(elements);
      };

      yElements.observe(observer);
      return () => yElements.unobserve(observer);
    };

    // Handle initial sync
    const handleSync = () => {
      const elements = Array.from(yElements.values());
      setState({
        status: 'synced',
        yDoc,
        provider,
        initialElements: elements,
        pushElements,
        onRemoteChange,
      });
    };

    provider.on('synced', handleSync);

    // Handle connection errors
    provider.on('disconnect', () => {
      console.warn('Hocuspocus disconnected, attempting reconnect...');
    });

    return () => {
      provider.destroy();
      yDoc.destroy();
    };
  }, [roomId, defaultHostUrl]);

  return state;
}
