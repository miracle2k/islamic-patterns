import React, {useCallback, useMemo, useState} from 'react';
import ReactDOM from "react-dom";
import {useEffect, useRef} from "react";
import {makeConfig} from "../makeConfig";
import {Canvas, CanvasRaw} from "./canvas";
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';


export function App() {
  const container = useRef();
  const popup = useRef();
  const [single, setSingle] = useState(null);
  const [cellWidth, setCellWidth] = useState(250);
  const [configs, setConfigs] = useState([]);

  const addSome = useCallback((howMany?: number) => {
    let result: any = [];
    for (let i = 0; i < (howMany ?? 20); i++) {
      const config = makeConfig();
      console.log(config.colors.foreground)
      result.push(config)
    }
    setConfigs((existing) => ([...existing, ...result]));
  }, []);

  useEffect(() => {
    addSome();
  }, []);

  useEffect(() => {
    if (single) {
      disableBodyScroll(popup.current);
    }
    return () => {
      enableBodyScroll(popup.current);
    }
  }, [single])

  return <div>
    {single ? <>
      <div className={"controls"}>
        Controls: Press i or space. &nbsp;
        <a href={"#"}  onClick={async (e) => {

        }}>Copy Config</a> &bull;&nbsp;
        <a href={"#"}  onClick={(e) => {
          e.preventDefault();
          setSingle(null)
        }}>Close</a>
      </div>
    </> : <>
      <div className={"controls"}>
        Rendering 20. Please wait.&nbsp;

        <a href={"#"} onClick={(e) => {
          e.preventDefault();
          setCellWidth(x => x * 1.2);
        }}>Larger</a> &bull;&nbsp;
        <a href={"#"} onClick={(e) => {
          e.preventDefault();
          setCellWidth(x => x / 1.2);
        }}>Smaller</a> &bull;&nbsp;
        <a href={"#"}  onClick={(e) => {
          e.preventDefault();
          addSome(5);
        }}>More</a>
      </div>
    </>}
    <div className={"grid"} style={{
      // @ts-ignore
      "--cellwidth": `${cellWidth}px`
    }}>
      {configs.map((config, idx) => {
        const isSingle = idx == single;
        let style;
        if (isSingle) {
          style = {
            background: 'white',
            position: 'fixed',
            left: 0,
            top: 30,
            bottom: 0,
            right: 0
          }
        }
        return <div  style={style} ref={popup}>
          <CanvasRaw interactive={isSingle} config={config} onClick={() => {
            if (single !== null) {
              setSingle(null);
            } else {
              setSingle(idx);
            }
          }} />
        </div>
      })}
    </div>
  </div>
}


export function setupReactApp() {
  const root = document.querySelector(".app");
  ReactDOM.render(<App />, root)
}


setupReactApp();
