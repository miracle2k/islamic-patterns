import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Config} from "../types";
import {P5Renderer} from "../draw/renderP5js";
import {makePatternFromConfig} from "../makePatternFromConfig";
import Controls from "./controls";


export type CanvasDef = {
  config: Config,
  idx: number,
  remoteId?: number
};


export function Canvas(props: {
  def: CanvasDef,
  onClick: any,
  onChange: (canvasDef: CanvasDef) => void,
  interactive?: boolean
}) {
  const config = props.def.config;

  const handleChangeConfig = (config: Config) => {
    props.onChange({
      ...props.def,
      config: config
    })
  }

   return <div style={{
     display: 'flex',
     flexDirection: 'row',
     position: "relative",
   }}>
     <CanvasRaw
       config={config}
       onClick={props.onClick}
       style={{
         flex: 1
       }}
       interactive={props.interactive}
     />
     <Controls
        config={config}
        onChangeConfig={handleChangeConfig}
        remoteId={props.def.remoteId}
        onRemoteIdChanged={newId => props.onChange({...props.def, remoteId: newId})}
     />
   </div>
}


export function CanvasRaw(props: {
  config: Config,
  onClick?: any,
  style?: any,
  interactive?: boolean
}) {
  const config = props.config;
  const root = useRef();

  const initialRenderDone = useRef(true);
  const [p5, setP5] = useState(null);

  const pattern = useMemo(() => {
    try {
      return makePatternFromConfig(config.pattern);
    }
    catch(e) {
      console.log(e);
      return null;
    }
  }, [config]);

  useEffect(() => {
    // Hot-reloading in parcel would otherwise create a second one
    if (root.current) {
      // @ts-ignore
      root.current.innerHTML = "";
    }

    setP5(new P5Renderer(config, pattern, root.current));
    initialRenderDone.current = true;
  }, []);

  useEffect(() => {
    if (!p5) {
      return;
    }
    if (props.interactive) {
      return p5.setupInteractiveHandlers();
    }
  }, [props.interactive, p5])

  const scheduledRedraw = useRef<any>();

  useEffect(() => {
    if (!p5 || !config) { return; }
    if (!initialRenderDone.current) { return; }
    p5.config = config;
    p5.pattern = pattern;
    window.clearTimeout(scheduledRedraw.current);
    scheduledRedraw.current = window.setTimeout(() => {
      p5.draw();
      console.log('draw done')
    }, 200);
  }, [config, pattern, p5])

  return <div
    ref={root}
    onClick={props.onClick}
    className="canvasContainer"
    style={props.style}
  />
}