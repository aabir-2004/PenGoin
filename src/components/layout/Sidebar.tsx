"use client";

import { useEditor, track, TLPage } from "tldraw";
import { Plus, Trash2 } from "lucide-react";
import { useNotesStore } from "@/store/useNotesStore";

/**
 * Sidebar — shows tldraw pages as slides.
 * Must be rendered inside a <Tldraw> tree so useEditor() works.
 */
const Sidebar = track(function Sidebar() {
  const editor = useEditor();
  const isReadOnly = useNotesStore((s) => s.isReadOnly);
  const pages = editor.getPages();
  const currentPage = editor.getCurrentPage();

  const addPage = () => {
    const name = `Page ${pages.length + 1}`;
    editor.createPage({ name });
    // createPage adds the page and makes it current automatically
  };

  const goToPage = (page: TLPage) => {
    editor.setCurrentPage(page);
  };

  const deletePage = (e: React.MouseEvent, page: TLPage) => {
    e.stopPropagation();
    if (pages.length <= 1) return; // keep at least one page
    editor.deletePage(page);
  };

  return (
    <div className="flex flex-col h-full w-[220px] shrink-0 border-r border-[#26262B] bg-[#161619] text-[#F4F4F6] z-50 relative">
      {/* Header */}
      <div className="flex flex-col gap-3 p-4">
        <h1 className="text-lg font-semibold tracking-tight text-white">Pages</h1>
        <button
          type="button"
          onClick={addPage}
          disabled={isReadOnly}
          className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-[#202024] hover:bg-[#28282D] disabled:hover:bg-[#202024] text-xs text-[#F4F4F6] border border-[#2E2E33] rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={14} />
          Add page
        </button>
      </div>

      {/* Page list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-1.5">
        {pages.map((page, index) => {
          const isActive = page.id === currentPage.id;
          return (
            <div
              key={page.id}
              onClick={() => goToPage(page)}
              className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border transition-colors duration-150 cursor-pointer ${
                isActive
                  ? "border-[#36363B] bg-[#202024]"
                  : "border-transparent hover:bg-[#1E1E22] hover:border-[#26262B]"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Slide number badge */}
                <span className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold bg-[#2a2a30] text-[#9A9A9F]">
                  {index + 1}
                </span>
                <span className="text-xs font-medium text-[#F4F4F6] truncate">
                  {page.name}
                </span>
              </div>
              {pages.length > 1 && !isReadOnly && (
                <button
                  type="button"
                  onClick={(e) => deletePage(e, page)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 text-[#5F5F64] hover:text-red-400 transition-all"
                  title="Delete page"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default Sidebar;
