import { HTMLContainer, BaseBoxShapeUtil, TLBaseShape, stopEventPropagation } from "tldraw";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";

export type ICodeShape = TLBaseShape<
  "code",
  {
    code: string;
    language: string;
    w: number;
    h: number;
  }
>;

export class CodeShapeUtil extends BaseBoxShapeUtil<ICodeShape> {
  static type = "code" as const;

  getDefaultProps(): ICodeShape["props"] {
    return {
      code: "function helloWorld() {\n  console.log('Hello from PenGoin!');\n}",
      language: "javascript",
      w: 400,
      h: 200,
    };
  }

  component(shape: ICodeShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id;

    if (isEditing) {
      return (
        <HTMLContainer style={{ pointerEvents: "all" }}>
          <div className="w-full h-full p-2 bg-[#1d1f21] border-2 border-indigo-500 rounded-xl shadow-lg flex flex-col pointer-events-auto">
            <div className="flex justify-between items-center mb-2 px-1">
              <div className="text-[10px] uppercase font-bold text-indigo-400">Code Editor</div>
              <select 
                className="bg-[#161619] text-xs text-white border border-[#36363B] rounded outline-none p-1 pointer-events-auto"
                value={shape.props.language}
                onChange={(e) => {
                  this.editor.updateShape({
                    id: shape.id,
                    type: "code",
                    props: { language: e.target.value },
                  });
                }}
                onPointerDown={stopEventPropagation}
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="tsx">React (TSX)</option>
                <option value="python">Python</option>
                <option value="bash">Bash</option>
                <option value="json">JSON</option>
              </select>
            </div>
            <textarea
              className="flex-1 bg-transparent text-[#F4F4F6] resize-none outline-none font-mono text-sm p-1 leading-relaxed pointer-events-auto"
              value={shape.props.code}
              onChange={(e) => {
                this.editor.updateShape({
                  id: shape.id,
                  type: "code",
                  props: { code: e.target.value },
                });
              }}
              onPointerDown={stopEventPropagation}
              onKeyDown={(e) => {
                e.stopPropagation(); // allow all typing, arrows, backspace
              }}
              autoFocus
              spellCheck={false}
            />
          </div>
        </HTMLContainer>
      );
    }

    let html = shape.props.code;
    try {
      if (Prism.languages[shape.props.language]) {
        html = Prism.highlight(
          shape.props.code,
          Prism.languages[shape.props.language],
          shape.props.language
        );
      }
    } catch (e) {
      console.error("Syntax highlight error", e);
    }

    return (
      <HTMLContainer>
        <div className="w-full h-full bg-[#1d1f21] border border-[#36363B] rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="flex items-center px-4 py-2 border-b border-[#36363B] bg-[#161619]">
             <div className="flex gap-1.5 mr-4">
               <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
               <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
               <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
             </div>
             <span className="text-[10px] uppercase font-bold text-[#9A9A9F] tracking-wider">{shape.props.language}</span>
          </div>
          <pre className="flex-1 m-0 p-4 overflow-auto text-sm font-mono leading-relaxed" style={{ background: 'transparent' }}>
            <code dangerouslySetInnerHTML={{ __html: html }} className={`language-${shape.props.language}`} />
          </pre>
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: ICodeShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={12} />;
  }
}
