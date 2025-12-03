import { useState, useEffect, useRef } from 'react';
import './App.css';

// "Ping"音のBase64
const SOUND_OBSERVE = "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU";

function App() {
  // アプリの状態
  // 'idle': 待機中, 'observing': 見る時間, 'drawing': 描く時間, 'paused': 一時停止
  const [phase, setPhase] = useState('idle');
  const [prevPhase, setPrevPhase] = useState(null); // ポーズ前の状態を記憶

  // 設定時間（秒）
  const [observeTime, setObserveTime] = useState(30);
  const [drawTime, setDrawTime] = useState(60);

  // タイマー
  const [timeLeft, setTimeLeft] = useState(0);

  // 画像管理
  const [imageSrc, setImageSrc] = useState(null);

  // 音声オブジェクトの作成
  const audioObserveRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3')); // ポーン（通知音）
  const audioDrawRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'));    // カチッ（スイッチ音）

  // 音量を少し下げる
  useEffect(() => {
    audioObserveRef.current.volume = 0.5;
    audioDrawRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    let interval = null;

    // フェーズが切り替わった瞬間に音を鳴らす
    if (phase === 'observing') {
      audioObserveRef.current.currentTime = 0;
      audioObserveRef.current.play().catch(e => console.log("Audio play failed", e));
    } else if (phase === 'drawing') {
      audioDrawRef.current.currentTime = 0;
      audioDrawRef.current.play().catch(e => console.log("Audio play failed", e));
    }

    // タイマーが動く条件：フェーズが「見る」か「描く」の時
    if (phase === 'observing' || phase === 'drawing') {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // 時間切れ -> フェーズ切り替え
            switchPhase();
            return 0; // 一瞬0になるがすぐ上書きされる
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
      // 見る -> 描く
      setPhase('drawing');
      setTimeLeft(drawTime);
    } else if (phase === 'drawing') {
      // 描く -> 見る
      setPhase('observing');
      setTimeLeft(observeTime);
    }
  };

  const handleStart = () => {
    if (!imageSrc) {
      alert("まずは画像を選択してください！");
      return;
    }
    setPhase('observing');
    setTimeLeft(observeTime);
  };

  const togglePause = () => {
    if (phase === 'paused') {
      // 再開
      setPhase(prevPhase);
    } else if (phase === 'observing' || phase === 'drawing') {
      // 一時停止
      setPrevPhase(phase);
      setPhase('paused');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ブラウザ内で完結するURLを生成（サーバーにはアップされません）
      const url = URL.createObjectURL(file);
      setImageSrc(url);
    }
  };

  const reset = () => {
    setPhase('idle');
    setTimeLeft(0);
  };

  return (
    <div className={`app-container ${phase}`}>
      {/* 待機画面（設定画面） */}
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

      {/* トレーニング中の画面 */}
      {phase !== 'idle' && (
        <div className="training-view" onClick={togglePause}>

          {phase === 'paused' && (
            <div className="overlay">
              <h2>PAUSED</h2>
              <p>タップして再開</p>
              <button onClick={(e) => { e.stopPropagation(); reset(); }} className="exit-btn">終了する</button>
            </div>
          )}

          {/* ステータスバー（ここを絶対配置ではなくフレックス配置にします） */}
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

          {/* 画像表示エリア */}
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