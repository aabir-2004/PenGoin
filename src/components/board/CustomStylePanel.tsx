"use client";

import { useCallback } from "react";
import {
  ArrowShapeArrowheadEndStyle,
  ArrowShapeArrowheadStartStyle,
  ArrowShapeKindStyle,
  DefaultColorStyle,
  DefaultDashStyle,
  DefaultFillStyle,
  DefaultFontStyle,
  DefaultHorizontalAlignStyle,
  DefaultSizeStyle,
  DefaultStylePanel,
  DefaultTextAlignStyle,
  DefaultVerticalAlignStyle,
  GeoShapeGeoStyle,
  LineShapeSplineStyle,
  OpacitySlider,
  ReadonlySharedStyleMap,
  StyleProp,
  TLArrowShapeArrowheadStyle,
  TLDefaultColorTheme,
  TldrawUiButtonIcon,
  TldrawUiButtonPicker,
  TldrawUiToolbar,
  TldrawUiToolbarButton,
  getDefaultColorTheme,
  kickoutOccludedShapes,
  useEditor,
  useIsDarkMode,
  useRelevantStyles,
  useTranslation,
  useUiEvents,
  useValue,
} from "tldraw";
// These helpers are not re-exported from the package root, so we import the
// built JS modules directly to keep the side-panel UI aligned with tldraw.
// @ts-expect-error Internal tldraw helper module.
import { STYLES } from "tldraw/dist-cjs/lib/styles.js";
// @ts-expect-error Internal tldraw helper module.
import { DoubleDropdownPicker } from "tldraw/dist-cjs/lib/ui/components/StylePanel/DoubleDropdownPicker.js";
// @ts-expect-error Internal tldraw helper module.
import { DropdownPicker } from "tldraw/dist-cjs/lib/ui/components/StylePanel/DropdownPicker.js";
import { useNotesStore } from "@/store/useNotesStore";
import {
  getMappedTextSize,
  getShapeTextSize,
  TEXT_SIZE_OPTIONS,
} from "@/components/board/textStyles";

function useStyleChangeCallback() {
  const editor = useEditor();
  const trackEvent = useUiEvents();

  return useCallback(
    function handleStyleChange<T>(style: StyleProp<T>, value: T) {
      editor.run(() => {
        if (editor.isIn("select")) {
          editor.setStyleForSelectedShapes(style, value);
        }
        editor.setStyleForNextShapes(style, value);
        editor.updateInstanceState({ isChangingStyle: true });
      });

      trackEvent("set-style", {
        source: "style-panel",
        id: style.id,
        value: value as string,
      });
    },
    [editor, trackEvent]
  );
}

function ArrowStylePickerSet({
  styles,
}: {
  styles: ReadonlySharedStyleMap;
}) {
  const msg = useTranslation();
  const handleValueChange = useStyleChangeCallback();

  const arrowKind = styles.get(ArrowShapeKindStyle);
  if (arrowKind === undefined) return null;

  return (
    <TldrawUiToolbar label={msg("style-panel.arrow-kind")}>
      <DropdownPicker
        id="arrow-kind"
        type="menu"
        label="style-panel.arrow-kind"
        uiType="arrow-kind"
        stylePanelType="arrow-kind"
        style={ArrowShapeKindStyle}
        items={STYLES.arrowKind}
        value={arrowKind}
        onValueChange={handleValueChange}
      />
    </TldrawUiToolbar>
  );
}

function ArrowheadStylePickerSet({
  styles,
}: {
  styles: ReadonlySharedStyleMap;
}) {
  const handleValueChange = useStyleChangeCallback();

  const arrowheadEnd = styles.get(ArrowShapeArrowheadEndStyle);
  const arrowheadStart = styles.get(ArrowShapeArrowheadStartStyle);
  if (!arrowheadEnd || !arrowheadStart) return null;

  return (
    <DoubleDropdownPicker<TLArrowShapeArrowheadStyle>
      label="style-panel.arrowheads"
      uiTypeA="arrowheadStart"
      styleA={ArrowShapeArrowheadStartStyle}
      itemsA={STYLES.arrowheadStart}
      valueA={arrowheadStart}
      uiTypeB="arrowheadEnd"
      styleB={ArrowShapeArrowheadEndStyle}
      itemsB={STYLES.arrowheadEnd}
      valueB={arrowheadEnd}
      onValueChange={handleValueChange}
      labelA="style-panel.arrowhead-start"
      labelB="style-panel.arrowhead-end"
    />
  );
}

function SplineStylePickerSet({
  styles,
}: {
  styles: ReadonlySharedStyleMap;
}) {
  const spline = styles.get(LineShapeSplineStyle);
  const handleValueChange = useStyleChangeCallback();
  if (spline === undefined) return null;

  return (
    <TldrawUiToolbar label="Spline">
      <DropdownPicker
        id="spline"
        type="menu"
        label="style-panel.spline"
        uiType="spline"
        stylePanelType="spline"
        style={LineShapeSplineStyle}
        items={STYLES.spline}
        value={spline}
        onValueChange={handleValueChange}
      />
    </TldrawUiToolbar>
  );
}

function GeoStylePickerSet({
  styles,
}: {
  styles: ReadonlySharedStyleMap;
}) {
  const geo = styles.get(GeoShapeGeoStyle);
  const handleValueChange = useStyleChangeCallback();
  if (geo === undefined) return null;

  return (
    <TldrawUiToolbar label="Shape">
      <DropdownPicker
        id="geo"
        type="menu"
        label="style-panel.geo"
        uiType="geo"
        stylePanelType="geo"
        style={GeoShapeGeoStyle}
        items={STYLES.geo}
        value={geo}
        onValueChange={handleValueChange}
      />
    </TldrawUiToolbar>
  );
}

function NumericTextSizeControl() {
  const editor = useEditor();
  const trackEvent = useUiEvents();
  const preferredTextSize = useNotesStore((s) => s.preferredTextSize);
  const setPreferredTextSize = useNotesStore((s) => s.setPreferredTextSize);
  const selectedShapes = useValue(
    "selected-text-shapes",
    () => editor.getSelectedShapes(),
    [editor]
  );

  const selectedTextShape = selectedShapes.find((shape) => shape.type === "text");
  const resolvedValue = getShapeTextSize(selectedTextShape, preferredTextSize);

  const handleChange = (value: number) => {
    const mapped = getMappedTextSize(value);
    setPreferredTextSize(value);

    editor.run(() => {
      editor.setStyleForNextShapes(DefaultSizeStyle, mapped.size);
      editor.updateInstanceState({ isChangingStyle: true });

      const updates = editor
        .getSelectedShapes()
        .filter((shape) => shape.type === "text")
        .map((shape) => ({
          id: shape.id,
          type: "text" as const,
          props: {
            size: mapped.size,
            scale: mapped.scale,
          },
        }));

      if (updates.length > 0) {
        editor.updateShapes(updates);
      }
    });

    trackEvent("set-style", {
      source: "style-panel",
      id: "font-size",
      value: String(value),
    });
  };

  return (
    <TldrawUiToolbar label="Text size">
      <label className="flex w-full items-center gap-2 rounded-md border border-[#2E2E33] bg-[#202024] px-2 py-1.5">
        <span className="text-[10px] uppercase tracking-wide text-[#9A9A9F]">
          Size
        </span>
        <select
          value={resolvedValue}
          onChange={(e) => handleChange(parseInt(e.target.value, 10))}
          className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none"
          title="Text size"
        >
          {TEXT_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size} className="bg-[#202024] text-white">
              {size}
            </option>
          ))}
        </select>
      </label>
    </TldrawUiToolbar>
  );
}

function CustomCommonStylePickerSet({
  styles,
  theme,
  useNumericTextSize,
}: {
  styles: ReadonlySharedStyleMap;
  theme: TLDefaultColorTheme;
  useNumericTextSize: boolean;
}) {
  const msg = useTranslation();
  const editor = useEditor();
  const handleValueChange = useStyleChangeCallback();
  const onHistoryMark = useCallback(
    (id: string) => editor.markHistoryStoppingPoint(id),
    [editor]
  );

  const color = styles.get(DefaultColorStyle);
  const fill = styles.get(DefaultFillStyle);
  const dash = styles.get(DefaultDashStyle);
  const size = styles.get(DefaultSizeStyle);
  const showPickers = fill !== undefined || dash !== undefined || size !== undefined;

  return (
    <>
      <div className="tlui-style-panel__section__common" data-testid="style.panel">
        {color === undefined ? null : (
          <TldrawUiToolbar label={msg("style-panel.color")}>
            <TldrawUiButtonPicker
              title={msg("style-panel.color")}
              uiType="color"
              style={DefaultColorStyle}
              items={STYLES.color}
              value={color}
              onValueChange={handleValueChange}
              theme={theme}
              onHistoryMark={onHistoryMark}
            />
          </TldrawUiToolbar>
        )}
        <OpacitySlider />
      </div>
      {showPickers && (
        <div className="tlui-style-panel__section">
          {fill === undefined ? null : (
            <TldrawUiToolbar label={msg("style-panel.fill")}>
              <TldrawUiButtonPicker
                title={msg("style-panel.fill")}
                uiType="fill"
                style={DefaultFillStyle}
                items={STYLES.fill}
                value={fill}
                onValueChange={handleValueChange}
                theme={theme}
                onHistoryMark={onHistoryMark}
              />
            </TldrawUiToolbar>
          )}
          {dash === undefined ? null : (
            <TldrawUiToolbar label={msg("style-panel.dash")}>
              <TldrawUiButtonPicker
                title={msg("style-panel.dash")}
                uiType="dash"
                style={DefaultDashStyle}
                items={STYLES.dash}
                value={dash}
                onValueChange={handleValueChange}
                theme={theme}
                onHistoryMark={onHistoryMark}
              />
            </TldrawUiToolbar>
          )}
          {size === undefined || useNumericTextSize ? null : (
            <TldrawUiToolbar label={msg("style-panel.size")}>
              <TldrawUiButtonPicker
                title={msg("style-panel.size")}
                uiType="size"
                style={DefaultSizeStyle}
                items={STYLES.size}
                value={size}
                onValueChange={(style, value) => {
                  handleValueChange(style, value);
                  const selectedShapeIds = editor.getSelectedShapeIds();
                  if (selectedShapeIds.length > 0) {
                    kickoutOccludedShapes(editor, selectedShapeIds);
                  }
                }}
                theme={theme}
                onHistoryMark={onHistoryMark}
              />
            </TldrawUiToolbar>
          )}
        </div>
      )}
    </>
  );
}

function CustomTextStylePickerSet({
  styles,
  theme,
  useNumericTextSize,
}: {
  styles: ReadonlySharedStyleMap;
  theme: TLDefaultColorTheme;
  useNumericTextSize: boolean;
}) {
  const msg = useTranslation();
  const handleValueChange = useStyleChangeCallback();
  const editor = useEditor();
  const onHistoryMark = useCallback(
    (id: string) => editor.markHistoryStoppingPoint(id),
    [editor]
  );

  const font = styles.get(DefaultFontStyle);
  const textAlign = styles.get(DefaultTextAlignStyle);
  const labelAlign = styles.get(DefaultHorizontalAlignStyle);
  const verticalLabelAlign = styles.get(DefaultVerticalAlignStyle);

  if (font === undefined && labelAlign === undefined) return null;

  return (
    <div className="tlui-style-panel__section">
      {font === undefined ? null : (
        <TldrawUiToolbar label={msg("style-panel.font")}>
          <TldrawUiButtonPicker
            title={msg("style-panel.font")}
            uiType="font"
            style={DefaultFontStyle}
            items={STYLES.font}
            value={font}
            onValueChange={handleValueChange}
            theme={theme}
            onHistoryMark={onHistoryMark}
          />
        </TldrawUiToolbar>
      )}

      {useNumericTextSize ? <NumericTextSizeControl /> : null}

      {textAlign === undefined ? null : (
        <TldrawUiToolbar
          label={msg("style-panel.align")}
          className="tlui-style-panel__row"
        >
          <TldrawUiButtonPicker
            title={msg("style-panel.align")}
            uiType="align"
            style={DefaultTextAlignStyle}
            items={STYLES.textAlign}
            value={textAlign}
            onValueChange={handleValueChange}
            theme={theme}
            onHistoryMark={onHistoryMark}
          />
          <div className="tlui-style-panel__row__extra-button">
            <TldrawUiToolbarButton
              type="icon"
              title={msg("style-panel.vertical-align")}
              data-testid="vertical-align"
              disabled
            >
              <TldrawUiButtonIcon icon="vertical-align-middle" />
            </TldrawUiToolbarButton>
          </div>
        </TldrawUiToolbar>
      )}

      {labelAlign === undefined ? null : (
        <TldrawUiToolbar
          label={msg("style-panel.label-align")}
          className="tlui-style-panel__row"
        >
          <TldrawUiButtonPicker
            title={msg("style-panel.label-align")}
            uiType="align"
            style={DefaultHorizontalAlignStyle}
            items={STYLES.horizontalAlign}
            value={labelAlign}
            onValueChange={handleValueChange}
            theme={theme}
            onHistoryMark={onHistoryMark}
          />
          <div className="tlui-style-panel__row__extra-button">
            {verticalLabelAlign === undefined ? (
              <TldrawUiToolbarButton
                type="icon"
                title={msg("style-panel.vertical-align")}
                data-testid="vertical-align"
                disabled
              >
                <TldrawUiButtonIcon icon="vertical-align-middle" />
              </TldrawUiToolbarButton>
            ) : (
              <TldrawUiButtonPicker
                title={msg("style-panel.vertical-align")}
                uiType="verticalAlign"
                style={DefaultVerticalAlignStyle}
                items={STYLES.verticalAlign}
                value={verticalLabelAlign}
                onValueChange={handleValueChange}
                theme={theme}
                onHistoryMark={onHistoryMark}
              />
            )}
          </div>
        </TldrawUiToolbar>
      )}
    </div>
  );
}

function CustomStylePanelContent() {
  const editor = useEditor();
  const styles = useRelevantStyles();
  const isDarkMode = useIsDarkMode();
  const selectedShapes = useValue(
    "presentation-selected-shapes",
    () => editor.getSelectedShapes(),
    [editor]
  );
  const currentToolId = useValue(
    "presentation-current-tool",
    () => editor.getCurrentToolId(),
    [editor]
  );

  if (!styles) return null;

  const geo = styles.get(GeoShapeGeoStyle);
  const arrowheadEnd = styles.get(ArrowShapeArrowheadEndStyle);
  const arrowheadStart = styles.get(ArrowShapeArrowheadStartStyle);
  const arrowKind = styles.get(ArrowShapeKindStyle);
  const spline = styles.get(LineShapeSplineStyle);
  const font = styles.get(DefaultFontStyle);
  const hideGeo = geo === undefined;
  const hideArrowHeads = arrowheadEnd === undefined && arrowheadStart === undefined;
  const hideSpline = spline === undefined;
  const hideArrowKind = arrowKind === undefined;
  const hideText = font === undefined;
  const theme = getDefaultColorTheme({ isDarkMode });
  const useNumericTextSize =
    currentToolId === "text" ||
    (selectedShapes.length > 0 && selectedShapes.every((shape) => shape.type === "text"));

  return (
    <>
      <CustomCommonStylePickerSet
        theme={theme}
        styles={styles}
        useNumericTextSize={useNumericTextSize}
      />
      {!hideText && (
        <CustomTextStylePickerSet
          theme={theme}
          styles={styles}
          useNumericTextSize={useNumericTextSize}
        />
      )}
      {!(hideGeo && hideArrowHeads && hideSpline && hideArrowKind) && (
        <div className="tlui-style-panel__section">
          <GeoStylePickerSet styles={styles} />
          <ArrowStylePickerSet styles={styles} />
          <ArrowheadStylePickerSet styles={styles} />
          <SplineStylePickerSet styles={styles} />
        </div>
      )}
    </>
  );
}

export default function CustomStylePanel() {
  return (
    <DefaultStylePanel>
      <CustomStylePanelContent />
    </DefaultStylePanel>
  );
}
