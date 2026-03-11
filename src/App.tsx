import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import closedChest from './assets/treasure_closed.png';
import treasureChest from './assets/treasure_opened.png';
import skeletonChest from './assets/treasure_opened_skeleton.png';
import chestOpenSound from './audios/chest_open.mp3';
import evilLaughSound from './audios/chest_open_with_evil_laugh.mp3';
import keyCursor from './assets/key.png';
import { login, register, saveScore, getLeaderboard } from './api';

interface Box {
  id: number;
  isOpen: boolean;
  hasTreasure: boolean;
}

interface User {
  email: string;
}

interface LeaderboardEntry {
  email: string;
  score: number;
  created_at: string;
}

type AuthMode = 'login' | 'register';

export default function App() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const [showWelcome, setShowWelcome] = useState(true);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // 從 localStorage 還原登入狀態
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedEmail = localStorage.getItem('email');
    if (savedToken && savedEmail) {
      setToken(savedToken);
      setUser({ email: savedEmail });
      setShowWelcome(false);
      fetchLeaderboard();
    }
  }, []);

  const fetchLeaderboard = async () => {
    const data = await getLeaderboard();
    if (Array.isArray(data)) setLeaderboard(data);
  };

  const initializeGame = () => {
    const treasureBoxIndex = Math.floor(Math.random() * 3);
    const newBoxes: Box[] = Array.from({ length: 3 }, (_, index) => ({
      id: index,
      isOpen: false,
      hasTreasure: index === treasureBoxIndex,
    }));
    setBoxes(newBoxes);
    setScore(0);
    setGameEnded(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const openBox = (boxId: number) => {
    if (gameEnded) return;

    setBoxes(prevBoxes => {
      const updatedBoxes = prevBoxes.map(box => {
        if (box.id === boxId && !box.isOpen) {
          new Audio(box.hasTreasure ? chestOpenSound : evilLaughSound).play();
          const newScore = box.hasTreasure ? score + 150 : score - 50;
          setScore(newScore);
          return { ...box, isOpen: true };
        }
        return box;
      });

      const treasureFound = updatedBoxes.some(box => box.isOpen && box.hasTreasure);
      const allOpened = updatedBoxes.every(box => box.isOpen);
      if (treasureFound || allOpened) {
        setGameEnded(true);
      }

      return updatedBoxes;
    });
  };

  // 遊戲結束時儲存分數
  useEffect(() => {
    if (gameEnded && token && user) {
      saveScore(score, token).then(() => fetchLeaderboard());
    }
    if (gameEnded) fetchLeaderboard();
  }, [gameEnded]);

  const handleAuth = async () => {
    setAuthError('');
    const fn = authMode === 'login' ? login : register;
    const res = await fn(email, password);
    if (res.error) {
      setAuthError(res.error);
      return;
    }
    localStorage.setItem('token', res.token);
    localStorage.setItem('email', res.user.email);
    setToken(res.token);
    setUser(res.user);
    setShowAuthDialog(false);
    setShowWelcome(false);
    setIsGuest(false);
    fetchLeaderboard();
  };

  const handleGuest = () => {
    setIsGuest(true);
    setShowWelcome(false);
    fetchLeaderboard();
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setToken(null);
    setUser(null);
    setIsGuest(false);
    setShowWelcome(true);
  };

  const openLoginDialog = (mode: AuthMode) => {
    setAuthMode(mode);
    setEmail('');
    setPassword('');
    setAuthError('');
    setShowWelcome(false);
    setShowAuthDialog(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-8">

      {/* 歡迎彈窗 */}
      <Dialog open={showWelcome} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl text-amber-900">🏴‍☠️ 歡迎來到尋寶遊戲</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => openLoginDialog('login')}>登入</Button>
            <Button variant="outline" className="border-amber-500 text-amber-800" onClick={() => openLoginDialog('register')}>註冊</Button>
            <Button variant="ghost" className="text-amber-600" onClick={handleGuest}>訪客遊玩（分數不儲存）</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 登入/註冊彈窗 */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-amber-900">{authMode === 'login' ? '登入' : '註冊'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} type="email" />
            <Input placeholder="密碼" value={password} onChange={e => setPassword(e.target.value)} type="password"
              onKeyDown={e => e.key === 'Enter' && handleAuth()} />
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleAuth}>
              {authMode === 'login' ? '登入' : '註冊'}
            </Button>
            <button className="text-sm text-amber-600 underline" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
              {authMode === 'login' ? '還沒有帳號？點此註冊' : '已有帳號？點此登入'}
            </button>
            <button className="text-sm text-gray-400" onClick={() => { setShowAuthDialog(false); setShowWelcome(true); }}>返回</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 標題區 */}
      <div className="w-full max-w-3xl flex justify-between items-start mb-8">
        <div className="text-center flex-1">
          <h1 className="text-4xl mb-4 text-amber-900">🏴‍☠️ Treasure Hunt Game 🏴‍☠️</h1>
          <p className="text-amber-800 mb-4">Click on the treasure chests to discover what's inside!</p>
          <p className="text-amber-700 text-sm">💰 Treasure: +$150 | 💀 Skeleton: -$50</p>
        </div>
        <div className="flex flex-col items-end gap-2 min-w-32">
          {user ? (
            <>
              <span className="text-sm text-amber-700">{user.email}</span>
              <Button variant="outline" className="text-xs border-amber-400 text-amber-700" onClick={handleSignOut}>登出</Button>
            </>
          ) : isGuest ? (
            <>
              <span className="text-sm text-gray-500">訪客</span>
              <Button variant="outline" className="text-xs border-amber-400 text-amber-700" onClick={() => openLoginDialog('login')}>登入</Button>
            </>
          ) : null}
        </div>
      </div>

      {/* 分數區 */}
      <div className="mb-8 flex items-center gap-4">
        <div className="text-2xl text-center p-4 bg-amber-200/80 backdrop-blur-sm rounded-lg shadow-lg border-2 border-amber-400">
          <span className="text-amber-900">Current Score: </span>
          <span className={`${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>${score}</span>
        </div>
        {gameEnded && (
          <div className={`text-2xl font-bold p-4 rounded-lg shadow-lg border-2 ${
            score > 0 ? 'bg-green-100 border-green-400 text-green-700'
            : score < 0 ? 'bg-red-100 border-red-400 text-red-700'
            : 'bg-gray-100 border-gray-400 text-gray-700'
          }`}>
            {score > 0 ? '贏' : score < 0 ? '輸' : '平手'}
          </div>
        )}
      </div>

      {/* 寶箱區 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {boxes.map((box) => (
          <motion.div
            key={box.id}
            className="flex flex-col items-center cursor-pointer"
            style={!box.isOpen && !gameEnded ? { cursor: `url(${keyCursor}) 16 16, pointer` } : {}}
            whileHover={{ scale: box.isOpen ? 1 : 1.05 }}
            whileTap={{ scale: box.isOpen ? 1 : 0.95 }}
            onClick={() => openBox(box.id)}
          >
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{ rotateY: box.isOpen ? 180 : 0, scale: box.isOpen ? 1.1 : 1 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="relative"
            >
              <img
                src={box.isOpen ? (box.hasTreasure ? treasureChest : skeletonChest) : closedChest}
                alt={box.isOpen ? (box.hasTreasure ? 'Treasure!' : 'Skeleton!') : 'Treasure Chest'}
                className="w-48 h-48 object-contain drop-shadow-lg"
              />
              {box.isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                >
                  {box.hasTreasure ? (
                    <div className="text-2xl animate-bounce">✨💰✨</div>
                  ) : (
                    <div className="text-2xl animate-pulse">💀👻💀</div>
                  )}
                </motion.div>
              )}
            </motion.div>
            <div className="mt-4 text-center">
              {box.isOpen ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className={`text-lg p-2 rounded-lg ${
                    box.hasTreasure
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}
                >
                  {box.hasTreasure ? '+$150' : '-$50'}
                </motion.div>
              ) : (
                <div className="text-amber-700 p-2">Click to open!</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 遊戲結束 */}
      {gameEnded && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center w-full max-w-lg"
        >
          <div className="mb-4 p-6 bg-amber-200/80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-amber-400">
            <h2 className="text-2xl mb-2 text-amber-900">Game Over!</h2>
            <p className="text-lg text-amber-800">
              Final Score: <span className={`${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>${score}</span>
            </p>
            <p className="text-sm text-amber-600 mt-2">
              {boxes.some(box => box.isOpen && box.hasTreasure)
                ? 'Treasure found! Well done, treasure hunter! 🎉'
                : 'No treasure found this time! Better luck next time! 💀'}
            </p>
            {isGuest && (
              <p className="text-sm text-amber-700 mt-2">
                登入後可上傳分數至排行榜！
                <button className="ml-1 underline text-amber-900" onClick={() => openLoginDialog('login')}>立即登入</button>
              </p>
            )}
          </div>

          <Button
            onClick={initializeGame}
            className="text-lg px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white mb-8"
          >
            Play Again
          </Button>

          {/* 排行榜 */}
          {leaderboard.length > 0 && (
            <div className="mt-4 bg-amber-100/80 rounded-xl border-2 border-amber-400 shadow-lg p-4">
              <h3 className="text-xl text-amber-900 mb-3">🏆 排行榜 Top 10</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-amber-800">名次</TableHead>
                    <TableHead className="text-amber-800">玩家</TableHead>
                    <TableHead className="text-amber-800 text-right">分數</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((entry, i) => (
                    <TableRow key={i} className={entry.email === user?.email ? 'bg-amber-200' : ''}>
                      <TableCell className="text-amber-900">{i + 1}</TableCell>
                      <TableCell className="text-amber-900">{entry.email}</TableCell>
                      <TableCell className={`text-right font-bold ${entry.score >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        ${entry.score}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
