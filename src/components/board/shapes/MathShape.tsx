import { HTMLContainer, BaseBoxShapeUtil, TLBaseShape, stopEventPropagation } from "tldraw";
import katex from "katex";
import "katex/dist/katex.min.css";

export type IMathShape = TLBaseShape<
  "math",
  {
    equation: string;
    w: number;
    h: number;
  }
>;

export class MathShapeUtil extends BaseBoxShapeUtil<any> {
  static type = "math" as const;

  getDefaultProps(): IMathShape["props"] {
    return {
      equation: "E = mc^2",
      w: 300,
      h: 150,
    };
  }

  component(shape: IMathShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id;

    if (isEditing) {
      return (
        <HTMLContainer style={{ pointerEvents: "all" }}>
          <div className="w-full h-full p-2 bg-[#161619] border-2 border-indigo-500 rounded-xl shadow-lg flex flex-col">
            <div className="text-[10px] uppercase font-bold text-indigo-400 mb-1 px-1">LaTeX Editor</div>
            <textarea
              className="flex-1 bg-transparent text-[#F4F4F6] resize-none outline-none font-mono text-sm p-1"
              value={shape.props.equation}
              onChange={(e) => {
                this.editor.updateShape({
                  id: shape.id,
                  type: "math",
                  props: { equation: e.target.value },
                } as any);
              }}
              onPointerDown={stopEventPropagation}
              onKeyDown={(e) => {
                e.stopPropagation(); // allow all typing, arrows, backspace
              }}
              autoFocus
            />
          </div>
        </HTMLContainer>
      );
    }

    let html = "";
    try {
      html = katex.renderToString(shape.props.equation || " ", {
        throwOnError: false,
        displayMode: true,
      });
    } catch (e) {
      html = `<div style="color: red; font-size: 12px;">Error parsing LaTeX</div>`;
    }

    return (
      <HTMLContainer>
        <div 
          className="w-full h-full flex items-center justify-center p-4 bg-[#161619]/80 border border-[#36363B] rounded-xl text-white overflow-hidden shadow-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </HTMLContainer>
    );
  }

  indicator(shape: IMathShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={12} />;
  }

  getIndicatorPath(shape: any): any {
    return `M 0 0 L ${shape.props.w} 0 L ${shape.props.w} ${shape.props.h} L 0 ${shape.props.h} Z`;
  }
}
