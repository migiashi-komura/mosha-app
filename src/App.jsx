import { useState, useEffect, useRef } from 'react';
import './App.css';

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

  // 音（オプション：切り替え時に音を鳴らすなら使う）
  // const audioRef = useRef(null);

  useEffect(() => {
    let interval = null;

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
          <h1>瞬間記憶模写</h1>
          <p>画像を脳に焼き付けてから描くトレーニング</p>

          <div className="input-group">
            <label>
              画像を選択:
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>

          <div className="input-group">
            <label>見る時間（秒）:
              <input type="number" value={observeTime} onChange={(e) => setObserveTime(Number(e.target.value))} />
            </label>
            <label>描く時間（秒）:
              <input type="number" value={drawTime} onChange={(e) => setDrawTime(Number(e.target.value))} />
            </label>
          </div>

          <button className="start-btn" onClick={handleStart}>スタート</button>

          {imageSrc && (
            <div className="preview">
              <p>選択中の画像:</p>
              <img src={imageSrc} alt="Preview" width="200" />
            </div>
          )}
        </div>
      )}

      {/* トレーニング中の画面 */}
      {phase !== 'idle' && (
        <div className="training-view" onClick={togglePause}>

          {/* ポーズ中のオーバーレイ */}
          {phase === 'paused' && (
            <div className="overlay">
              <h2>一時停止中</h2>
              <p>画面タップで再開</p>
              <button onClick={(e) => { e.stopPropagation(); reset(); }}>終了して設定に戻る</button>
            </div>
          )}

          <div className="status-bar">
            {phase === 'observing' && <span className="status-text observing">👀 よく見て記憶してください！</span>}
            {phase === 'drawing' && <span className="status-text drawing">✏️ 思い出して描いて！</span>}
            <span className="timer">{timeLeft}秒</span>
          </div>

          <div className="image-container">
            {/* 描く時間（drawing）のときは画像を隠す（黒で覆う） */}
            {phase === 'drawing' && <div className="blindfold"></div>}
            <img src={imageSrc} alt="Model" className="model-image" />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;