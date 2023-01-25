
export const playIntervalOrChord = async (sampler, midiNoteNameSequence, noteDuration) => {
  sampler.triggerAttackRelease(midiNoteNameSequence, noteDuration.current / 1000);
  await new Promise(res => {
    setTimeout(() => {
      res();
    }, noteDuration.current);
  });
};
