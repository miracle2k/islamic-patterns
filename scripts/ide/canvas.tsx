import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Config} from "../types";
import {P5Renderer} from "../draw/renderP5js";
import {makePatternFromConfig} from "../makePatternFromConfig";
import Controls from "./controls";


export type CanvasDef = {
  config: Config,
  idx: number,
  remoteId?: number,
  seed?: number
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
       seed={props.def.seed}
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
  seed?: number,
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

    let r = new P5Renderer(config, pattern, {
      parent: root.current,
      seed: props.seed,
      size: {
        width: 650 * 2,
        height: 500 * 2
      },
      noAutoInit: true
    });
    setP5(r);
    initialRenderDone.current = true;
  }, []);

  useEffect(() => {
    if (!p5) {
      return;
    }
    if (props.interactive) {
      return p5.setupInteractiveHandlers(root.current);
    }
  }, [props.interactive, p5])

  const scheduledRedraw = useRef<any>();

  useEffect(() => {
    if (!p5 || !config) { return; }
    if (!initialRenderDone.current) { return; }

    // If the config changes, then re-init
    p5.config = config;
    p5.pattern = pattern;
    window.clearTimeout(scheduledRedraw.current);
    scheduledRedraw.current = window.setTimeout(() => {
      console.log('reinit begin, seed=', props.seed)
      p5.init();
      console.log('reinit done, seed=', props.seed)
    }, 200);
  }, [config, pattern, p5])

  return <div
    ref={root}
    onClick={props.onClick}
    className="canvasContainer"
    style={props.style}
  />
}