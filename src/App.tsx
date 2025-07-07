import { useState, useEffect } from 'react';

export default function Home() {
    const [timeLeft, setTimeLeft] = useState(120); // 120초
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [is85, setIs85] = useState(false);
    const [alarmTime, setAlarmTime] = useState('');
    const [isAlarmActive, setIsAlarmActive] = useState(false);
    const [audio] = useState(
        typeof window !== 'undefined' ? new Audio('/notification.mp3') : null
    );

    useEffect(() => {
        const savedIs85 = localStorage.getItem('is85') === 'true';
        setIs85(savedIs85);
    }, []);

    useEffect(() => {
        localStorage.setItem('is85', is85.toString());
    }, [is85]);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isRunning && !isPaused && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prevTime) => {
                    const newTime = prevTime - 1;

                    // 알람 시간에 도달했을 때
                    if (alarmTime && newTime === parseInt(alarmTime) && !isAlarmActive) {
                        setIsAlarmActive(true);
                        if (audio) {
                            audio
                                .play()
                                .catch((e) => console.log('오디오 재생 실패:', e));
                        }
                        if (window.ipcRenderer) {
                            window.ipcRenderer.invoke(
                                'show-toast',
                                '알람 시간!',
                                '설정한 시간이 되었습니다!'
                            );
                        }
                    }

                    return newTime;
                });
            }, 1000);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isRunning, isPaused, timeLeft, alarmTime, isAlarmActive, audio]);

    // 알람 효과를 위한 깜빡임 효과
    useEffect(() => {
        let blinkInterval: NodeJS.Timeout;

        if (isAlarmActive) {
            blinkInterval = setInterval(() => {
                // 깜빡임 효과는 CSS 애니메이션으로 처리
            }, 500);
        }

        return () => {
            if (blinkInterval) {
                clearInterval(blinkInterval);
            }
        };
    }, [isAlarmActive]);

    const startTimer = () => {
        setIsRunning(true);
        setIsPaused(false);
        setIsAlarmActive(false); // 타이머 시작시 알람 비활성화
    };

    const pauseTimer = () => {
        setIsPaused(true);
    };

    const resumeTimer = () => {
        setIsPaused(false);
    };

    const resetTimer = () => {
        setTimeLeft(120);
        setIsRunning(true);
        setIsPaused(false);
        setIsAlarmActive(false); // 리셋시 알람 비활성화
        if (window.ipcRenderer) {
            window.ipcRenderer.invoke(
                'show-toast',
                '타이머 리셋',
                '타이머가 리셋되었습니다!'
            );
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const toggleIs85 = () => {
        setIs85(!is85);
    };

    useEffect(() => {
        const handleKeyboardShortcut = (
            event: Electron.IpcRendererEvent,
            action: string
        ) => {
            switch (action) {
                case 'reset':
                    resetTimer();
                    break;
            }
        };

        // Electron 키보드 단축키 이벤트 리스너 등록
        if (window.ipcRenderer) {
            window.ipcRenderer.on('keyboard-shortcut', handleKeyboardShortcut);
        }

        // 컴포넌트 언마운트시 이벤트 리스너 제거
        return () => {
            if (window.ipcRenderer) {
                window.ipcRenderer.off('keyboard-shortcut', handleKeyboardShortcut);
            }
        };
    }, [isRunning, isPaused]);

    return (
        <div
            className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-all duration-300 ${
                isAlarmActive ? 'animate-pulse' : ''
            }`}
        >
            <div
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md transition-all duration-300 ${
                    isAlarmActive ? 'animate-pulse bg-red-100 dark:bg-red-900/30' : ''
                }`}
            >
                <div
                    className="flex mb-8 flex-col "
                    style={{ backgroundColor: '#bebebe' }}
                >
                    <div className="flex justify-center">
                        <video
                            src="./holysymbol.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-1/2 h-1/2"
                        />
                    </div>
                    <div className="flex justify-center ">
                        {is85 ? (
                            <img
                                src="./manghi85.png"
                                width={100}
                                height={100}
                                className="mb-3"
                            />
                        ) : (
                            <img src="./manghi.png" alt="manghi" width={80} height={80} />
                        )}
                    </div>
                    <div className="flex justify-center items-center ml-5">
                        <img
                            src="./무지개구름l.png"
                            width={23}
                            height={20}
                            alt="무지개"
                        ></img>
                        <span
                            className="flex h-[21px] text-xs text-white false false"
                            style={{
                                backgroundImage: 'url(./무지개구름c.png)',
                                paddingTop: 3,
                            }}
                        >
                            김망히
                        </span>
                        <img
                            src="./무지개구름r.png"
                            width={21}
                            height={20}
                            alt="무지개"
                        ></img>
                    </div>
                </div>

                <div className="flex items-center justify-center mb-6">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-3">
                        케이그
                    </span>
                    <button
                        onClick={toggleIs85}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                            is85 ? 'bg-indigo-600' : 'bg-gray-300'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                is85 ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
                <div className="flex items-center justify-center mb-6">
                    <input
                        type="number"
                        placeholder="몇초 남았을때 알려줄까요?"
                        min={0}
                        max={120}
                        value={alarmTime}
                        onChange={(e) => setAlarmTime(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                </div>

                <div className="text-center mb-8">
                    <div
                        className={`text-6xl font-mono font-bold transition-all duration-300 ${
                            isAlarmActive
                                ? 'text-red-600 dark:text-red-400 animate-pulse'
                                : 'text-indigo-600 dark:text-indigo-400'
                        } mb-4`}
                    >
                        {formatTime(timeLeft)}
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                            className={`h-3 rounded-full transition-all duration-1000 ease-linear ${
                                isAlarmActive
                                    ? 'bg-red-600 animate-pulse'
                                    : 'bg-indigo-600'
                            }`}
                            style={{ width: `${((120 - timeLeft) / 120) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {!isRunning ? (
                        <button
                            onClick={startTimer}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                        >
                            시작
                        </button>
                    ) : (
                        <>
                            {isPaused ? (
                                <button
                                    onClick={resumeTimer}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                                >
                                    재개
                                </button>
                            ) : (
                                <button
                                    onClick={pauseTimer}
                                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                                >
                                    일시정지
                                </button>
                            )}
                        </>
                    )}

                    <button
                        onClick={resetTimer}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                    >
                        리셋 (Ctrl + Space)
                    </button>
                </div>

                {timeLeft === 0 && (
                    <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                        <p className="text-red-800 dark:text-red-200 text-center font-semibold">
                            ⏰ 시간이 종료되었습니다!
                        </p>
                    </div>
                )}

                {isAlarmActive && (
                    <div className="mt-6 p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg animate-pulse">
                        <p className="text-yellow-800 dark:text-yellow-200 text-center font-semibold">
                            🔔 알람 시간입니다!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
