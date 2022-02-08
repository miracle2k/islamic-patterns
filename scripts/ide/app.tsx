import React, {useEffect, useRef, useState} from 'react';
import {makeConfig} from "../makeConfig";
import ReactDOM from 'react-dom';
import {Canvas, CanvasDef} from "./canvas";
import {getSeed, randomSeed} from "../utils/random";


const storage = window.localStorage['genpattern-configs'];


export function App() {
  const [canvases, setCanvases] = useState<CanvasDef[]>([]);
  const maxIdx = useRef(10);

  const makeNewCanvas = () => {
    const config =  makeConfig(randomSeed());
    const newCanvases = [{config, idx: maxIdx.current, seed: getSeed()}, ...canvases];
    maxIdx.current += 1;
    while (newCanvases.length > 5) {
      newCanvases.splice(newCanvases.length-1, 1)
    }
    setCanvases(newCanvases);
  }

  const handleChange = (idx: number, newCanvas) => {
    const newCanvases = [...canvases];
    newCanvases[idx] = newCanvas;
    setCanvases(newCanvases);
  }

  useEffect(() => {
    window.localStorage['genpattern-configs'] = JSON.stringify(canvases);
  }, [canvases])

  // Load saved canvases, or create an initial canvas
  const loadfromLocalStorage = true;

  useEffect(() => {
    const canvases: CanvasDef[] = storage ? JSON.parse(storage) : null;
    maxIdx.current = Math.max(...canvases.map(c => (c.idx || 0))) + 1;
    if (!canvases || !canvases.length || !loadfromLocalStorage) {
      makeNewCanvas();
    } else {
      // remove any duplicate ids
      const filteredCanvases = canvases.filter((c, idx) => canvases.findIndex(d => d.idx == c.idx) == idx)
      setCanvases(filteredCanvases)
    }
  }, []);

  return <div>
    {canvases.slice(0, 1).map((canvas, idx) => {
      return <Canvas
          def={canvas}
          key={canvas.idx}
          onClick={makeNewCanvas}
          onChange={c => handleChange(idx, c)}
          interactive={idx == 0}
      />
    })}
  </div>
}


export function setupReactApp() {
  const root = document.querySelector(".app");
  ReactDOM.render(<App />, root)
}


setupReactApp();
