import * as Tone from 'tone';
import { useEffect, useState } from 'react';
import HttpClient from '../../api-clients/http-client.js';
import { create as createId } from '../../utils/unique-id.js';

export function useMidiDevice() {
  const [midiDeviceIsConnected, setMidiDeviceIsConnected] = useState(false);

  useEffect(() => {
    if (midiDeviceIsConnected) {
      return;
    }
    if (typeof document.midiAccessObj !== 'undefined' && document.midiAccessObj.inputs.size > 0) {
      setMidiDeviceIsConnected(true);
      return;
    }
    // Triggers if browser supports MIDI, even when no MIDI device is connected
    function onMIDISuccess(midiAccessObj) {
      if (midiAccessObj.inputs.size > 0) {
        setMidiDeviceIsConnected(true);
      }
      if (!document.midiAccessObj) {
        document.midiAccessObj = midiAccessObj;
      }
    }
    function onMIDIFailure(error) {
      console.log(error);
    }

    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
  }, [midiDeviceIsConnected]);

  return midiDeviceIsConnected;
}

export function useMidiLoader(src) {
  const [midiData, setMidiData] = useState(null);

  useEffect(() => {
    if (!src || midiData) {
      return;
    }
    const httpClient = new HttpClient();
    httpClient.get(src, { responseType: 'arraybuffer' })
      .then(response => {
        setMidiData(response.data);
      });
  }, [src, midiData]);

  return midiData;
}

export function useToneJsSampler(samplesType) {
  const [samplerHasLoaded, setSamplerHasLoaded] = useState(false);
  const [sampler, setSampler] = useState(null);

  useEffect(() => {

    if (document.toneJsSamplers?.[samplesType]) {
      if (!samplerHasLoaded) {
        setSamplerHasLoaded(true);
      }
      return;
    }

    if (!document.toneJsSamplers) {
      document.toneJsSamplers = {};
    }

    document.toneJsSamplers[samplesType] = new Tone.Sampler({
      urls: {
        'A0': 'A0.mp3',
        'C1': 'C1.mp3',
        'D#1': 'Ds1.mp3',
        'F#1': 'Fs1.mp3',
        'A1': 'A1.mp3',
        'C2': 'C2.mp3',
        'D#2': 'Ds2.mp3',
        'F#2': 'Fs2.mp3',
        'A2': 'A2.mp3',
        'C3': 'C3.mp3',
        'D#3': 'Ds3.mp3',
        'F#3': 'Fs3.mp3',
        'A3': 'A3.mp3',
        'C4': 'C4.mp3',
        'D#4': 'Ds4.mp3',
        'F#4': 'Fs4.mp3',
        'A4': 'A4.mp3',
        'C5': 'C5.mp3',
        'D#5': 'Ds5.mp3',
        'F#5': 'Fs5.mp3',
        'A5': 'A5.mp3',
        'C6': 'C6.mp3',
        'D#6': 'Ds6.mp3',
        'F#6': 'Fs6.mp3',
        'A6': 'A6.mp3',
        'C7': 'C7.mp3',
        'D#7': 'Ds7.mp3',
        'F#7': 'Fs7.mp3',
        'A7': 'A7.mp3',
        'C8': 'C8.mp3'
      },
      onload: () => {
        setSamplerHasLoaded(true);
        setSampler(document.toneJsSamplers[samplesType]);
      },
      baseUrl: `https://anmeldung-sprechstunde.herokuapp.com/instrument-samples/${samplesType}/` // Samples better be hosted in project.
    }).toDestination();
  }, [samplerHasLoaded, setSamplerHasLoaded, samplesType]);

  return [sampler, samplerHasLoaded];
}

// Set pianoId which does not start with a number character for use as CSS selector in updateMidiInputSwitches
export function usePianoId(defaultValue) {
  const [pianoId, setPianoId] = useState(defaultValue);

  useEffect(() => {
    const id = `ID${createId()}`;
    setPianoId(id);
  }, []);

  return pianoId;
}
