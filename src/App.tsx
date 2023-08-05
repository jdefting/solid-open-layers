import { createSignal, For } from "solid-js";
import { BingLayerOption, bingLayers, SolidMap } from "./SolidMap.tsx";

function App() {
  const [center, setCenter] = createSignal<[number, number]>([0, 0]);
  const [zoom, setZoom] = createSignal(0);

  const [baseLayer, setBaseLayer] =
    createSignal<BingLayerOption>("CanvasLight");

  return (
    <div class="h-screen w-screen">
      <div class="flex flex-col h-full gap-2">
        <div class="flex flex-col gap-2 m-4">
          <div>Longitude: {center()[0]}</div>
          <div>Latitude: {center()[1]}</div>
          <div class="flex gap-2">
            <div>Imagery: </div>
            <select
              id={"imagery-select"}
              value={baseLayer()}
              onChange={(event) =>
                setBaseLayer(event.target.value as BingLayerOption)
              }
            >
              <For each={bingLayers}>
                {(key) => <option value={key}>{key}</option>}
              </For>
            </select>
          </div>
        </div>
        <div class="flex h-full">
          <div class="h-full flex flex-col w-14 p-2 gap-2">
            <div>Zoom {zoom().toFixed(2)}</div>
            <input
              type="range"
              class="mx-2  grow"
              style={{
                "-webkit-appearance": "slider-vertical",
              }}
              step={0.01}
              min={2.7}
              max={20}
              value={zoom()}
              onInput={(event) => setZoom(event.target.valueAsNumber)}
            />
          </div>
          <SolidMap
            class="flex grow h-full"
            baseLayer={baseLayer}
            center={center}
            onCenterChange={setCenter}
            zoom={zoom}
            onZoomChange={setZoom}
            onClick={(event) => {
              console.log("clicked", event.coordinate);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
