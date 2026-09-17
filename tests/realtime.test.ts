import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createRealtimeConnection,
  VOICE_PLAYBACK_RATE,
  type ConnectionCallbacks,
} from '../lib/realtime/createRealtimeConnection';
import { initialState } from '../lib/chat/chatMachine';
const callbacks = (): ConnectionCallbacks => ({
  status: () => {},
  error: () => {},
  transcript: () => {},
  transfer: () => {},
  audioBlocked: () => {},
});
void test('late microphone permission after close immediately stops capture', async () => {
  let resolve!: (v: MediaStream) => void,
    stopped = 0;
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      mediaDevices: {
        getUserMedia: () =>
          new Promise<MediaStream>((r) => {
            resolve = r;
          }),
      },
    },
    configurable: true,
  });
  Object.defineProperty(globalThis, 'RTCPeerConnection', {
    value: class {},
    configurable: true,
  });
  const c = createRealtimeConnection(
    initialState().context,
    'phone-demo',
    callbacks(),
  );
  const pending = c.start();
  c.close();
  resolve({
    getTracks: () => [
      {
        stop() {
          stopped++;
        },
      },
    ],
  } as unknown as MediaStream);
  await pending;
  assert.equal(stopped, 1);
});
void test('mute toggles track, context is sent, interruption keeps mic on, close cleans resources', async () => {
  let stopped = 0,
    paused = 0,
    removed = 0,
    peerClosed = 0,
    channelClosed = 0;
  const track = {
    enabled: true,
    stop() {
      stopped++;
    },
  };
  let sentBody = '';
  const dc = {
    readyState: 'open',
    onopen: null as null | (() => void),
    onmessage: null as null | ((e: { data: string }) => void),
    onclose: null,
    onerror: null,
    send: () => {},
    close() {
      channelClosed++;
    },
  };
  const pc = {
    ontrack: null,
    onconnectionstatechange: null,
    connectionState: 'connected',
    addTrack: () => {},
    createDataChannel: () => dc,
    createOffer: async () => ({ sdp: 'v=0\nm=audio' }),
    setLocalDescription: async () => {},
    setRemoteDescription: async () => {
      dc.onopen?.();
    },
    close() {
      peerClosed++;
    },
  };
  const audio = {
    autoplay: false,
    playbackRate: 1,
    defaultPlaybackRate: 1,
    preservesPitch: false,
    srcObject: null,
    setAttribute: () => {},
    play: async () => {},
    pause() {
      paused++;
    },
    remove() {
      removed++;
    },
  };
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      mediaDevices: {
        getUserMedia: async () => ({
          getTracks: () => [track],
          getAudioTracks: () => [track],
        }),
      },
    },
    configurable: true,
  });
  Object.defineProperty(globalThis, 'RTCPeerConnection', {
    value: function () {
      return pc;
    },
    configurable: true,
  });
  Object.defineProperty(globalThis, 'document', {
    value: { createElement: () => audio },
    configurable: true,
  });
  const original = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    sentBody = typeof init?.body === 'string' ? init.body : '';
    return new Response('v=0\nm=audio');
  };
  try {
    const c = createRealtimeConnection(
      initialState().context,
      'phone-demo',
      callbacks(),
    );
    await c.start();
    assert.ok(sentBody.includes('handoffContext'));
    assert.equal(audio.playbackRate, VOICE_PLAYBACK_RATE);
    assert.equal(audio.defaultPlaybackRate, VOICE_PLAYBACK_RATE);
    assert.equal(audio.preservesPitch, true);
    c.setMuted(true);
    assert.equal(track.enabled, false);
    c.setMuted(false);
    assert.equal(track.enabled, true);
    dc.onmessage?.({
      data: JSON.stringify({ type: 'input_audio_buffer.speech_started' }),
    });
    assert.equal(track.enabled, true);
    c.close();
    c.close();
    assert.deepEqual(
      [stopped, paused, removed, peerClosed, channelClosed],
      [1, 1, 1, 1, 1],
    );
    assert.equal(audio.srcObject, null);
    assert.equal(dc.onmessage, null);
  } finally {
    globalThis.fetch = original;
  }
});
void test('permission failure is sanitized', async () => {
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      mediaDevices: {
        getUserMedia: async () => {
          throw new DOMException('private details', 'NotAllowedError');
        },
      },
    },
    configurable: true,
  });
  let error = '';
  const cb = callbacks();
  cb.error = (m) => {
    error = m;
  };
  await createRealtimeConnection(
    initialState().context,
    'phone-demo',
    cb,
  ).start();
  assert.equal(error, 'Microphone access is required for voice support.');
});

void test('starting twice requests one microphone; a closed connection never requests access', async () => {
  let requests = 0,
    stopped = 0,
    resolve!: (value: MediaStream) => void;
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      mediaDevices: {
        getUserMedia: () => {
          requests++;
          return new Promise<MediaStream>((r) => {
            resolve = r;
          });
        },
      },
    },
    configurable: true,
  });
  const c = createRealtimeConnection(
    initialState().context,
    'phone-demo',
    callbacks(),
  );
  const pending = c.start();
  await c.start();
  assert.equal(requests, 1);
  c.close();
  resolve({
    getTracks: () => [
      {
        stop() {
          stopped++;
        },
      },
    ],
  } as unknown as MediaStream);
  await pending;
  await c.start();
  assert.equal(requests, 1);
  assert.equal(stopped, 1);
  const unused = createRealtimeConnection(
    initialState().context,
    'phone-demo',
    callbacks(),
  );
  unused.close();
  await unused.start();
  assert.equal(requests, 1);
});

void test('delayed closing audio finishes before capture stops and malformed tool events are ignored', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let stopped = 0,
    transfers = 0;
  const statuses: string[] = [];
  const track = {
    enabled: true,
    stop() {
      stopped++;
    },
  };
  const dc = {
    readyState: 'open',
    onopen: null as null | (() => void),
    onmessage: null as null | ((e: { data: string }) => void),
    onclose: null,
    onerror: null,
    send: () => {},
    close: () => {},
  };
  const pc = {
    ontrack: null,
    onconnectionstatechange: null,
    addTrack: () => {},
    createDataChannel: () => dc,
    createOffer: async () => ({ sdp: 'v=0\nm=audio' }),
    setLocalDescription: async () => {},
    setRemoteDescription: async () => {
      dc.onopen?.();
    },
    close: () => {},
  };
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      mediaDevices: {
        getUserMedia: async () => ({
          getTracks: () => [track],
          getAudioTracks: () => [track],
        }),
      },
    },
    configurable: true,
  });
  Object.defineProperty(globalThis, 'RTCPeerConnection', {
    value: function () {
      return pc;
    },
    configurable: true,
  });
  Object.defineProperty(globalThis, 'document', {
    value: {
      createElement: () => ({
        setAttribute: () => {},
        play: async () => {},
        pause: () => {},
        remove: () => {},
      }),
    },
    configurable: true,
  });
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response('v=0\nm=audio');
  const c = createRealtimeConnection(initialState().context, 'phone-demo', {
    ...callbacks(),
    status: (s) => statuses.push(s),
    transfer: () => {
      transfers++;
    },
  });
  const event = (value: unknown) =>
    dc.onmessage?.({ data: JSON.stringify(value) });
  try {
    await c.start();
    event(null);
    event([]);
    event({
      type: 'response.function_call_arguments.done',
      name: 'request_human_transfer',
      arguments: 'null',
      call_id: 'bad',
    });
    event({
      type: 'response.function_call_arguments.done',
      name: 'request_human_transfer',
      arguments: '{"reason":"help","customerSummary":"help"}',
    });
    assert.equal(transfers, 0);
    event({
      type: 'response.function_call_arguments.done',
      name: 'end_call',
      arguments: '{}',
      call_id: 'end',
    });
    t.mock.timers.tick(1000);
    event({ type: 'output_audio_buffer.started' });
    t.mock.timers.tick(2000);
    assert.equal(stopped, 0);
    assert.equal(statuses.at(-1), 'assistant speaking');
    event({ type: 'output_audio_buffer.stopped' });
    assert.equal(stopped, 1);
    assert.equal(statuses.at(-1), 'ended');
  } finally {
    c.close();
    globalThis.fetch = original;
  }
});
