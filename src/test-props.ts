import { createShapeId, Editor } from 'tldraw';

const editor = new Editor();
editor.createShape({
  id: createShapeId('1'),
  type: 'text',
  x: 0,
  y: 0,
  props: { text: "Hello" } as any
});

const shape = editor.getShape(createShapeId('1'));
console.log("Shape props:", shape?.props);
