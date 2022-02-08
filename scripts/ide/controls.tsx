import React, {useCallback, useRef} from 'react';
import { useState, useEffect } from 'react'
import {supabase} from "./supabase";
import {Config, RoughMode} from "../types";


export default function Controls(props: {
  config: Config,
  remoteId?: number,
  onRemoteIdChanged: (id: number) => void,
  onChangeConfig: (c: Config) => void,
}) {
  const remoteId = useRef<number|null>(props.remoteId);

  const [configAsString, setConfigAsString] = useState("");
  const [editorExpanded, setEditorExpanded] = useState(false);

  useEffect(() => {
    setConfigAsString(JSON.stringify(props.config, null, 4))
  }, [props.config]);

  // Make sure we have an id
  const ensureSaved = async () => {
    if (remoteId.current) {
      return remoteId.current;
    }
    const result = await supabase.from('outputs').upsert({config: props.config}, {
      returning: 'representation',   // Don't return the value after inserting
    })
    remoteId.current = result.data[0].id;
    props.onRemoteIdChanged(remoteId.current);
    return remoteId.current;
  }

  const storeOpinion = async (opts: {good: boolean}) => {
    const dbid = await ensureSaved();
    await supabase.from('outputs').update({
      id: dbid,
      opinion: !!(opts.good)
    }).match({id: dbid})
  }

  const storeNote = async (msg: string) => {
    const dbid = await ensureSaved();
    await supabase.from('outputs').update({
      note: msg
    }).match({id: dbid})
  }

  const handleConfigChange = useCallback((e) => {
    setConfigAsString(e.target.value);
    try {
      const parsed = JSON.parse(e.target.value);
      props.onChangeConfig(parsed);
    } catch (e) {
      console.log(e);
    }
  }, [setConfigAsString, props.onChangeConfig]);

  const toggleRough = useCallback(() => {
    const current = props.config.rough?.mode ?? 'off';
    const next: RoughMode = current == 'off' ? 'on' : 'off';
    props.onChangeConfig(
        {...props.config, rough: {...props.config.rough, mode: next}}
    );
  }, [props.onChangeConfig, props.config]);

  useEffect(() => {
    const l = (e) => {
      if (editorExpanded) {
        return;
      }
      if (e.key == 'r') {
        toggleRough();
      }
    };
    window.addEventListener('keypress', l)
    return () => {
      return window.removeEventListener('keypress', l);
    }
  }, [editorExpanded, props.onChangeConfig, toggleRough])

  const edit = () => {
    setEditorExpanded(!editorExpanded);
  }

  return <>
      <div style={{
        'width': 100,
      }}>
        <div style={{
          'padding': '8px',
          'height': '40px',
          'boxSizing': 'border-box',
          'background': '#f8f8f8',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <button style={bs} onClick={() => storeOpinion({good: true})}>good</button>
          <button style={bs} onClick={() => storeOpinion({good: false})}>bad</button>
          <button style={bs} onClick={() => storeNote(prompt("note?"))}>note</button>
          <button style={bs} onClick={() => edit()}>edit</button>
          <div style={{height: '20px'}}>&nbsp;</div>
          <button style={bs} onClick={() => toggleRough()}>toggle rough</button>
          {remoteId.current}
        </div>
      </div>

    {editorExpanded ?
      <div
        style={{padding: '5px', background: 'white', position: 'absolute', left: 0, right: 100, top: 0, zIndex: 9999}}
        onClick={e => e.stopPropagation()}
      >
            <textarea style={{
              width: '100%', height: '300px',
              fontSize: '20px',
              outline: 'none', resize: 'none', border: 'none',
            }}
                      value={configAsString}
                      onChange={handleConfigChange}
            />
      </div> : null}

    {editorExpanded ?
        <div style={{position: 'fixed',  zIndex: 1, left: 0, top: 0, bottom: 0, right: 0}}
             onClick={() => setEditorExpanded(false)}>
        </div> : null}
  </>
}


const bs = {
  height: '100px',
  padding: '20px 0 20px'
}
