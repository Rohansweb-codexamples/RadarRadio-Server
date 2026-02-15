const { useState, useEffect, useRef } = React;

// REPLACE THESE with your actual Firebase config from your console
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const appId = "radar-dance-radio-v1";

const LOGO_URL = 'https://i.postimg.cc/FKR8GR9k/Gemini-Generated-Image-5oa71q5oa71q5oa7.png';

function App() {
  const [view, setView] = useState('player');
  const [user, setUser] = useState(null);
  const [stationState, setStationState] = useState({
    isPlaying: false,
    currentTrackTitle: 'Station Offline',
    trackUrl: '',
    startedAt: null
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) auth.signInAnonymously();
      else setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const stationRef = db.doc(`artifacts/${appId}/public/data/stationControl/currentState`);
    const unsubscribe = stationRef.onSnapshot((docSnap) => {
      if (docSnap.exists) setStationState(docSnap.data());
    }, (err) => console.error("Firestore Error:", err));
    return () => unsubscribe();
  }, [user]);

  const updateStation = async (newState) => {
    if (!user) return;
    const stationRef = db.doc(`artifacts/${appId}/public/data/stationControl/currentState`);
    await stationRef.set(newState, { merge: true });
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <nav className="flex justify-between items-center p-6 bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} className="h-10 w-10 rounded-full border border-pink-500" />
          <span className="text-xl font-black uppercase text-pink-500">Radar Dance</span>
        </div>
        <div className="flex gap-2 bg-zinc-900 p-1 rounded-full text-xs">
          <button onClick={() => setView('player')} className={`px-4 py-2 rounded-full ${view === 'player' ? 'bg-pink-600' : ''}`}>Player</button>
          <button onClick={() => setView('admin')} className={`px-4 py-2 rounded-full ${view === 'admin' ? 'bg-zinc-700' : ''}`}>Admin</button>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto p-8">
        {view === 'player' ? <PlayerView state={stationState} /> : <AdminView state={stationState} update={updateStation} />}
      </main>
    </div>
  );
}

function PlayerView({ state }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    if (playing) audioRef.current.pause();
    else audioRef.current.play().catch(() => {});
    setPlaying(!playing);
  };

  return (
    <div className="text-center space-y-8 mt-12">
      <img src={LOGO_URL} className={`w-64 h-64 mx-auto rounded-full border-4 border-zinc-800 ${state.isPlaying && playing ? 'animate-[spin_8s_linear_infinite]' : ''}`} />
      <h1 className="text-4xl font-black">{state.currentTrackTitle}</h1>
      <audio ref={audioRef} src={state.trackUrl} />
      <button onClick={toggle} disabled={!state.isPlaying} className="bg-white text-black px-12 py-4 rounded-2xl font-bold uppercase disabled:opacity-30">
        {playing ? 'Stop Listening' : 'Tune In Live'}
      </button>
    </div>
  );
}

function AdminView({ state, update }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const goLive = () => update({ isPlaying: true, currentTrackTitle: title, trackUrl: url, startedAt: Date.now() });
  const stop = () => update({ isPlaying: false, currentTrackTitle: 'Station Offline', trackUrl: '', startedAt: null });

  return (
    <div className="bg-zinc-900 p-8 rounded-3xl space-y-6">
      <h2 className="text-2xl font-bold">Studio Controls</h2>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Track Title" className="w-full bg-black p-4 rounded-xl border border-zinc-800" />
      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Audio URL (Direct Link)" className="w-full bg-black p-4 rounded-xl border border-zinc-800" />
      <div className="flex gap-4">
        <button onClick={goLive} className="flex-1 bg-pink-600 py-4 rounded-xl font-bold">Go Live</button>
        <button onClick={stop} className="px-8 bg-zinc-800 py-4 rounded-xl font-bold">Stop</button>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);