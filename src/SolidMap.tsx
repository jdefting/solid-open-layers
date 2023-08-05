import { Map, type MapBrowserEvent, Overlay, View } from "ol";
import { Zoom } from "ol/control";
import GeoJSON from "ol/format/GeoJSON";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { BingMaps } from "ol/source";
import VectorSource from "ol/source/Vector";
import Fill from "ol/style/Fill";
import Style from "ol/style/Style";
import { Accessor, createEffect, createSignal, onMount } from "solid-js";

/**
 * The key for the Bing Maps base layers in OpenLayers
 */
export const BING_MAPS_KEY = import.meta.env.VITE_BING_MAPS_KEY;

/**
 * Bing Imagery Sets
 *
 * https://learn.microsoft.com/en-us/bingmaps/rest-services/imagery/get-imagery-metadata
 */
export const bingLayers = [
  "RoadOnDemand",
  "Aerial",
  "AerialWithLabelsOnDemand",
  "CanvasLight",
  "CanvasDark",
  "CanvasGray",
] as const;

export type BingLayerOption = (typeof bingLayers)[number];

export type SolidMapProps = {
  class?: string;
  center?: Accessor<[number, number]>;
  onCenterChange?: (center: [number, number]) => void;
  centerAdjust?: Accessor<[number, number]>;
  zoom?: Accessor<number>;
  onZoomChange?: (zoom: number) => void;
  onClick?: (event: MapBrowserEvent<any>) => void;
  baseLayer?: Accessor<BingLayerOption>;
};

export function SolidMap(props: SolidMapProps) {
  let mapElement: HTMLDivElement | undefined = undefined;
  let tooltipElement: HTMLDivElement | undefined = undefined;
  const [tooltipText, setTooltipText] = createSignal<string | undefined>();
  /** Whether the map is moving via interactions (being dragged or zoomed). Don't want to listen
   * to controlled props while this is happening, would cause sluggishness. */
  const [mapIsMoving, setMapIsMoving] = createSignal(false);
  let map: Map = new Map({});

  const baseLayer = new TileLayer({
    source: new BingMaps({
      key: BING_MAPS_KEY,
      imagerySet: props.baseLayer?.() ?? "Aerial",
      maxZoom: 19,
      cacheSize: 100,
    }),
    properties: {
      name: "Base Layer",
    },
  });

  // control base layer
  createEffect(() => {
    if (props.baseLayer) {
      baseLayer.setSource(
        new BingMaps({
          key: BING_MAPS_KEY,
          imagerySet: props.baseLayer(),
          maxZoom: 19,
        }),
      );
    }
  });

  onMount(() => {
    const tooltipOverlay = new Overlay({
      element: tooltipElement,
      offset: [0, -10],
      positioning: "bottom-center",
    });
    // register map and event handlers
    map = new Map({
      target: mapElement,
      layers: [
        baseLayer,
        new VectorLayer({
          source: new VectorSource({
            format: new GeoJSON(),
            url: "src/data/countries.json",
          }),
          properties: {
            name: "countries",
          },
          style: new Style({
            fill: new Fill({
              color: "transparent",
            }),
          }),
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
      overlays: [tooltipOverlay],
      controls: [new Zoom()],
    });

    map.on("movestart", () => {
      setMapIsMoving(true);
    });
    map.on("moveend", () => {
      setMapIsMoving(false);
    });

    map.getView().on("change:center", () => {
      const newCenter = map.getView().getCenter();
      // unfortunately, this change event fires before "movestart" which causes issues
      // need to wait until we start moving before firing these (is a couple ms)
      if (newCenter && mapIsMoving()) {
        props.onCenterChange?.([newCenter[0], newCenter[1]]);
      }
    });
    map.getView().on("change:resolution", () => {
      const zoom = map.getView().getZoom();
      // unfortunately, this change event fires before "movestart" which causes issues
      // need to wait until we start moving before firing these (is a couple ms)
      if (zoom && mapIsMoving()) props.onZoomChange?.(zoom);
    });

    map.on("click", (event) => {
      props.onClick?.(event);
    });

    // tooltips
    map.on("pointermove", (event) => {
      const feature = map.forEachFeatureAtPixel(
        event.pixel,
        (feature) => feature,
      );
      if (feature) {
        tooltipOverlay.setPosition(event.coordinate);
        setTooltipText(feature.get("name"));
      } else {
        setTooltipText(undefined);
      }
    });
  });

  createEffect(() => {
    if (props.zoom && !mapIsMoving()) {
      map.getView().setZoom(props.zoom());
    }
  });

  createEffect(() => {
    if (props.center && !mapIsMoving()) {
      map.getView().setCenter(props.center());
    }
  });

  return (
    <>
      <div ref={mapElement} class={props.class} />
      <div ref={tooltipElement}>
        {tooltipText() !== undefined && (
          <div class="bg-gray-50 p-2 rounded">{tooltipText()}</div>
        )}
      </div>
    </>
  );
}
