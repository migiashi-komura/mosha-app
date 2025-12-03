import { useState, useEffect, useRef } from 'react';
import './App.css';

// Web Audio APIコンテキストの管理
// ブラウザによってプレフィックスが違うため対応
const AudioContext = window.AudioContext || window.webkitAudioContext;

function App() {
  const [phase, setPhase] = useState('idle');
  const [prevPhase, setPrevPhase] = useState(null);
  const [observeTime, setObserveTime] = useState(30);
  const [drawTime, setDrawTime] = useState(60);
  const [timeLeft, setTimeLeft] = useState(0);
  const [imageSrc, setImageSrc] = useState(null);

  // 音声コンテキスト（スピーカーへのパイプラインのようなもの）
  const audioCtxRef = useRef(null);
  // 読み込んだ音データを保存しておく場所（バッファ）
  const audioBuffersRef = useRef({ observe: null, draw: null });

  // 1. アプリ起動時に音声コンテキストを準備し、音源をロードする
  useEffect(() => {
    // コンテキストの作成
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // 音源のURL
    const soundObserveUrl = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';
    const soundDrawUrl = 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';

    // 音源をダウンロードしてデコード（使える状態にする）関数
    const loadSound = async (url, key) => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
        audioBuffersRef.current[key] = decodedBuffer;
      } catch (e) {
        console.error("音源の読み込みに失敗:", e);
      }
    };

    loadSound(soundObserveUrl, 'observe');
    loadSound(soundDrawUrl, 'draw');

    // クリーンアップ
    return () => {
      ctx.close();
    };
  }, []);

  // 2. 音を鳴らす関数
  const playSound = (key) => {
    const ctx = audioCtxRef.current;
    const buffer = audioBuffersRef.current[key];

    if (ctx && buffer) {
      // 音の「発生源」を作る
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // 音量調整用のノードを作る
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.5; // 音量50%

      // 発生源 -> 音量 -> 出力(スピーカー) と繋ぐ
      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      // 再生！
      source.start(0);
    }
  };

  // 3. タイマー処理（変更なし）
  useEffect(() => {
    let interval = null;

    if (phase === 'observing') {
      playSound('observe'); // 見るフェーズの音
    } else if (phase === 'drawing') {
      playSound('draw');    // 描くフェーズの音
    }

    if (phase === 'observing' || phase === 'drawing') {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            switchPhase();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [phase]);

  const switchPhase = () => {
    if (phase === 'observing') {
      setPhase('drawing');
      setTimeLeft(drawTime);
    } else if (phase === 'drawing') {
      setPhase('observing');
      setTimeLeft(observeTime);
    }
  };

  // ★ここが一番重要です★
  // ユーザーが最初に「START」を押した瞬間に、ブラウザの音声ロックを解除します
  const handleStart = () => {
    if (!imageSrc) {
      alert("まずは画像を選択してください！");
      return;
    }

    const ctx = audioCtxRef.current;

    // コンテキストが「一時停止(suspended)」状態なら「再開(resume)」させる
    // これが「ユーザーの意思による再生」とみなされ、以降の自動再生が許可されます
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        console.log("AudioContext resumed successfully");
        setPhase('observing');
        setTimeLeft(observeTime);
      });
    } else {
      setPhase('observing');
      setTimeLeft(observeTime);
    }
  };

  const togglePause = () => {
    if (phase === 'paused') {
      setPhase(prevPhase);
    } else if (phase === 'observing' || phase === 'drawing') {
      setPrevPhase(phase);
      setPhase('paused');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
    }
  };

  const reset = () => {
    setPhase('idle');
    setTimeLeft(0);
  };

  // UI部分は変更ありません
  return (
    <div className={`app-container ${phase}`}>
      {phase === 'idle' && (
        <div className="setup-box">
          <h1 className="title">瞬間記憶模写</h1>
          <p className="subtitle">画像を脳に焼き付けてから描くトレーニング</p>

          <div className="input-area">
            <div className="file-input-wrapper">
              <label className="file-label">
                画像を選択
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden-input" />
              </label>
              <span className="file-name">{imageSrc ? "画像選択済み" : "未選択"}</span>
            </div>

            <div className="time-settings">
              <div className="time-input">
                <label>見る時間</label>
                <div className="input-row">
                  <input type="number" value={observeTime} onChange={(e) => setObserveTime(Number(e.target.value))} />
                  <span>秒</span>
                </div>
              </div>
              <div className="time-input">
                <label>描く時間</label>
                <div className="input-row">
                  <input type="number" value={drawTime} onChange={(e) => setDrawTime(Number(e.target.value))} />
                  <span>秒</span>
                </div>
              </div>
            </div>
          </div>

          <button className="start-btn" onClick={handleStart}>START</button>

          {imageSrc && (
            <div className="preview">
              <img src={imageSrc} alt="Preview" />
            </div>
          )}
        </div>
      )}

      {phase !== 'idle' && (
        <div className="training-view" onClick={togglePause}>
          {phase === 'paused' && (
            <div className="overlay">
              <h2>PAUSED</h2>
              <p>タップして再開</p>
              <button onClick={(e) => { e.stopPropagation(); reset(); }} className="exit-btn">終了する</button>
            </div>
          )}

          <div className={`status-bar ${phase === 'drawing' ? 'bar-drawing' : 'bar-observing'}`}>
            <div className="status-message">
              {phase === 'observing' && <span>👁️ よく見て記憶してください</span>}
              {phase === 'drawing' && <span>✏️ 思い出して描いてください</span>}
            </div>
            <div className="timer-display">
              <span className="timer-count">{timeLeft}</span>
              <span className="timer-unit">sec</span>
            </div>
          </div>

          <div className="image-container">
            {phase === 'drawing' && <div className="blindfold"></div>}
            <img src={imageSrc} alt="Model" className="model-image" />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;