"use client";

import React, { useCallback } from "react";
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
  SharedStyle,
  StyleProp,
  TLArrowShapeArrowheadStyle,
  TLDefaultColorTheme,
  TldrawUiButtonLabel,
  TldrawUiMenuContextProvider,
  TLUiTranslationKey,
  TldrawUiPopover,
  TldrawUiPopoverContent,
  TldrawUiPopoverTrigger,
  TldrawUiButtonIcon,
  TldrawUiButtonPicker,
  TldrawUiToolbar,
  TldrawUiToolbarButton,
  getDefaultColorTheme,
  kickoutOccludedShapes,
  tlmenus,
  useEditor,
  useIsDarkMode,
  useRelevantStyles,
  useTranslation,
  useUiEvents,
  useValue,
} from "tldraw";
import { useNotesStore } from "@/store/useNotesStore";
import {
  getMappedTextSize,
  getShapeTextSize,
  TEXT_SIZE_OPTIONS,
} from "@/components/board/textStyles";

type StyleValuesForUi<T extends string> = readonly {
  readonly value: T;
  readonly icon: string;
}[];

const STYLES = {
  color: [
    { value: "black", icon: "color" },
    { value: "grey", icon: "color" },
    { value: "light-violet", icon: "color" },
    { value: "violet", icon: "color" },
    { value: "blue", icon: "color" },
    { value: "light-blue", icon: "color" },
    { value: "yellow", icon: "color" },
    { value: "orange", icon: "color" },
    { value: "green", icon: "color" },
    { value: "light-green", icon: "color" },
    { value: "light-red", icon: "color" },
    { value: "red", icon: "color" },
  ],
  fill: [
    { value: "none", icon: "fill-none" },
    { value: "semi", icon: "fill-semi" },
    { value: "solid", icon: "fill-solid" },
    { value: "pattern", icon: "fill-pattern" },
  ],
  dash: [
    { value: "draw", icon: "dash-draw" },
    { value: "dashed", icon: "dash-dashed" },
    { value: "dotted", icon: "dash-dotted" },
    { value: "solid", icon: "dash-solid" },
  ],
  size: [
    { value: "s", icon: "size-small" },
    { value: "m", icon: "size-medium" },
    { value: "l", icon: "size-large" },
    { value: "xl", icon: "size-extra-large" },
  ],
  font: [
    { value: "draw", icon: "font-draw" },
    { value: "sans", icon: "font-sans" },
    { value: "serif", icon: "font-serif" },
    { value: "mono", icon: "font-mono" },
  ],
  textAlign: [
    { value: "start", icon: "text-align-left" },
    { value: "middle", icon: "text-align-center" },
    { value: "end", icon: "text-align-right" },
  ],
  horizontalAlign: [
    { value: "start", icon: "horizontal-align-start" },
    { value: "middle", icon: "horizontal-align-middle" },
    { value: "end", icon: "horizontal-align-end" },
  ],
  verticalAlign: [
    { value: "start", icon: "vertical-align-start" },
    { value: "middle", icon: "vertical-align-middle" },
    { value: "end", icon: "vertical-align-end" },
  ],
  geo: [
    { value: "rectangle", icon: "geo-rectangle" },
    { value: "ellipse", icon: "geo-ellipse" },
    { value: "triangle", icon: "geo-triangle" },
    { value: "diamond", icon: "geo-diamond" },
    { value: "star", icon: "geo-star" },
    { value: "pentagon", icon: "geo-pentagon" },
    { value: "hexagon", icon: "geo-hexagon" },
    { value: "octagon", icon: "geo-octagon" },
    { value: "rhombus", icon: "geo-rhombus" },
    { value: "rhombus-2", icon: "geo-rhombus-2" },
    { value: "oval", icon: "geo-oval" },
    { value: "trapezoid", icon: "geo-trapezoid" },
    { value: "arrow-left", icon: "geo-arrow-left" },
    { value: "arrow-up", icon: "geo-arrow-up" },
    { value: "arrow-down", icon: "geo-arrow-down" },
    { value: "arrow-right", icon: "geo-arrow-right" },
    { value: "cloud", icon: "geo-cloud" },
    { value: "x-box", icon: "geo-x-box" },
    { value: "check-box", icon: "geo-check-box" },
    { value: "heart", icon: "geo-heart" },
  ],
  arrowKind: [
    { value: "arc", icon: "arrow-arc" },
    { value: "elbow", icon: "arrow-elbow" },
  ],
  arrowheadStart: [
    { value: "none", icon: "arrowhead-none" },
    { value: "arrow", icon: "arrowhead-arrow" },
    { value: "triangle", icon: "arrowhead-triangle" },
    { value: "square", icon: "arrowhead-square" },
    { value: "dot", icon: "arrowhead-dot" },
    { value: "diamond", icon: "arrowhead-diamond" },
    { value: "inverted", icon: "arrowhead-triangle-inverted" },
    { value: "bar", icon: "arrowhead-bar" },
  ],
  arrowheadEnd: [
    { value: "none", icon: "arrowhead-none" },
    { value: "arrow", icon: "arrowhead-arrow" },
    { value: "triangle", icon: "arrowhead-triangle" },
    { value: "square", icon: "arrowhead-square" },
    { value: "dot", icon: "arrowhead-dot" },
    { value: "diamond", icon: "arrowhead-diamond" },
    { value: "inverted", icon: "arrowhead-triangle-inverted" },
    { value: "bar", icon: "arrowhead-bar" },
  ],
  spline: [
    { value: "line", icon: "spline-line" },
    { value: "cubic", icon: "spline-cubic" },
  ],
} as const satisfies Record<string, StyleValuesForUi<string>>;

interface DropdownPickerProps<T extends string> {
  id: string;
  label?: TLUiTranslationKey | string;
  uiType: string;
  stylePanelType: string;
  style: StyleProp<T>;
  value: SharedStyle<T>;
  items: StyleValuesForUi<T>;
  type: "icon" | "tool" | "menu";
  onValueChange(style: StyleProp<T>, value: T): void;
}

function DropdownPicker<T extends string>({
  id,
  label,
  uiType,
  stylePanelType,
  style,
  items,
  type,
  value,
  onValueChange,
}: DropdownPickerProps<T>) {
  const msg = useTranslation();
  const editor = useEditor();
  const [isOpen, setIsOpen] = React.useState(false);

  const icon = React.useMemo(
    () => items.find((item) => value.type === "shared" && item.value === value.value)?.icon,
    [items, value]
  );

  const stylePanelName = msg(`style-panel.${stylePanelType}` as TLUiTranslationKey);
  const titleStr =
    value.type === "mixed"
      ? msg("style-panel.mixed")
      : `${stylePanelName} — ${msg(`${uiType}-style.${value.value}` as TLUiTranslationKey)}`;
  const labelStr = label ? msg(label as TLUiTranslationKey) : "";
  const popoverId = `style panel ${id}`;

  return (
    <TldrawUiPopover id={popoverId} open={isOpen} onOpenChange={setIsOpen}>
      <TldrawUiPopoverTrigger>
        <TldrawUiToolbarButton
          type={type}
          data-testid={`style.${uiType}`}
          data-direction="left"
          title={titleStr}
        >
          {labelStr && <TldrawUiButtonLabel>{labelStr}</TldrawUiButtonLabel>}
          <TldrawUiButtonIcon icon={icon ?? "mixed"} />
        </TldrawUiToolbarButton>
      </TldrawUiPopoverTrigger>
      <TldrawUiPopoverContent side="left" align="center">
        <TldrawUiToolbar
          label={labelStr}
          className={`tlui-buttons__grid tlui-buttons__${stylePanelType}`}
        >
          <TldrawUiMenuContextProvider type="icons" sourceId="style-panel">
            {items.map((item) => (
              <TldrawUiToolbarButton
                key={item.value}
                type="icon"
                data-testid={`style.${uiType}.${item.value}`}
                title={`${stylePanelName} — ${msg(
                  `${uiType}-style.${item.value}` as TLUiTranslationKey
                )}`}
                isActive={icon === item.icon}
                onClick={() => {
                  editor.markHistoryStoppingPoint("select style dropdown item");
                  onValueChange(style, item.value);
                  tlmenus.deleteOpenMenu(popoverId, editor.contextId);
                  setIsOpen(false);
                }}
              >
                <TldrawUiButtonIcon icon={item.icon} />
              </TldrawUiToolbarButton>
            ))}
          </TldrawUiMenuContextProvider>
        </TldrawUiToolbar>
      </TldrawUiPopoverContent>
    </TldrawUiPopover>
  );
}

interface DoubleDropdownPickerProps<T extends string> {
  uiTypeA: string;
  uiTypeB: string;
  label: TLUiTranslationKey | string;
  labelA: TLUiTranslationKey | string;
  labelB: TLUiTranslationKey | string;
  itemsA: StyleValuesForUi<T>;
  itemsB: StyleValuesForUi<T>;
  styleA: StyleProp<T>;
  styleB: StyleProp<T>;
  valueA: SharedStyle<T>;
  valueB: SharedStyle<T>;
  onValueChange(style: StyleProp<T>, value: T): void;
}

function DoubleDropdownPicker<T extends string>({
  label,
  uiTypeA,
  uiTypeB,
  labelA,
  labelB,
  itemsA,
  itemsB,
  styleA,
  styleB,
  valueA,
  valueB,
  onValueChange,
}: DoubleDropdownPickerProps<T>) {
  const editor = useEditor();
  const msg = useTranslation();
  const [isOpenA, setIsOpenA] = React.useState(false);
  const [isOpenB, setIsOpenB] = React.useState(false);

  const iconA = React.useMemo(
    () =>
      itemsA.find((item) => valueA.type === "shared" && valueA.value === item.value)?.icon ??
      "mixed",
    [itemsA, valueA]
  );
  const iconB = React.useMemo(
    () =>
      itemsB.find((item) => valueB.type === "shared" && valueB.value === item.value)?.icon ??
      "mixed",
    [itemsB, valueB]
  );

  const idA = `style panel ${uiTypeA} A`;
  const idB = `style panel ${uiTypeB} B`;

  return (
    <div className="tlui-style-panel__double-select-picker">
      <div title={msg(label as TLUiTranslationKey)} className="tlui-style-panel__double-select-picker-label">
        {msg(label as TLUiTranslationKey)}
      </div>
      <TldrawUiToolbar
        label={msg(label as TLUiTranslationKey)}
        className="tlui-buttons__horizontal"
      >
        <TldrawUiPopover id={idA} open={isOpenA} onOpenChange={setIsOpenA}>
          <TldrawUiPopoverTrigger>
            <TldrawUiToolbarButton
              type="icon"
              data-testid={`style.${uiTypeA}`}
              title={`${msg(labelA as TLUiTranslationKey)} — ${
                valueA.type === "mixed"
                  ? msg("style-panel.mixed")
                  : msg(`${uiTypeA}-style.${valueA.value}` as TLUiTranslationKey)
              }`}
            >
              <TldrawUiButtonIcon icon={iconA} small invertIcon />
            </TldrawUiToolbarButton>
          </TldrawUiPopoverTrigger>
          <TldrawUiPopoverContent side="left" align="center" sideOffset={80} alignOffset={0}>
            <TldrawUiToolbar label={msg(labelA as TLUiTranslationKey)} className="tlui-buttons__grid">
              <TldrawUiMenuContextProvider type="icons" sourceId="style-panel">
                {itemsA.map((item) => (
                  <TldrawUiToolbarButton
                    data-testid={`style.${uiTypeA}.${item.value}`}
                    type="icon"
                    key={item.value}
                    onClick={() => {
                      onValueChange(styleA, item.value);
                      tlmenus.deleteOpenMenu(idA, editor.contextId);
                      setIsOpenA(false);
                    }}
                    title={`${msg(labelA as TLUiTranslationKey)} — ${msg(
                      `${uiTypeA}-style.${item.value}` as TLUiTranslationKey
                    )}`}
                  >
                    <TldrawUiButtonIcon icon={item.icon} invertIcon />
                  </TldrawUiToolbarButton>
                ))}
              </TldrawUiMenuContextProvider>
            </TldrawUiToolbar>
          </TldrawUiPopoverContent>
        </TldrawUiPopover>

        <TldrawUiPopover id={idB} open={isOpenB} onOpenChange={setIsOpenB}>
          <TldrawUiPopoverTrigger>
            <TldrawUiToolbarButton
              type="icon"
              data-testid={`style.${uiTypeB}`}
              title={`${msg(labelB as TLUiTranslationKey)} — ${
                valueB.type === "mixed"
                  ? msg("style-panel.mixed")
                  : msg(`${uiTypeB}-style.${valueB.value}` as TLUiTranslationKey)
              }`}
            >
              <TldrawUiButtonIcon icon={iconB} small />
            </TldrawUiToolbarButton>
          </TldrawUiPopoverTrigger>
          <TldrawUiPopoverContent side="left" align="center" sideOffset={116} alignOffset={0}>
            <TldrawUiToolbar label={msg(labelB as TLUiTranslationKey)} className="tlui-buttons__grid">
              <TldrawUiMenuContextProvider type="icons" sourceId="style-panel">
                {itemsB.map((item) => (
                  <TldrawUiToolbarButton
                    key={item.value}
                    type="icon"
                    title={`${msg(labelB as TLUiTranslationKey)} — ${msg(
                      `${uiTypeB}-style.${item.value}` as TLUiTranslationKey
                    )}`}
                    data-testid={`style.${uiTypeB}.${item.value}`}
                    onClick={() => {
                      onValueChange(styleB, item.value);
                      tlmenus.deleteOpenMenu(idB, editor.contextId);
                      setIsOpenB(false);
                    }}
                  >
                    <TldrawUiButtonIcon icon={item.icon} />
                  </TldrawUiToolbarButton>
                ))}
              </TldrawUiMenuContextProvider>
            </TldrawUiToolbar>
          </TldrawUiPopoverContent>
        </TldrawUiPopover>
      </TldrawUiToolbar>
    </div>
  );
}

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
