/**
 * 派对危机游戏音效管理器
 * 
 * 功能：
 * - 背景音乐循环播放
 * - 倒计时最后10秒音效
 * - 杀手出现静音效果
 * - 杀手脚步声
 */

class GameAudioManager {
    constructor() {
        // Web Audio API 缓冲区（所有音频都用Web Audio API）
        this.audioBuffers = {
            bgm: null,
            cisha: null,
            jingdi: null,
            win: null,
            defeat: null
        };
        
        // 当前播放的声源
        this.currentSources = {
            bgm: null,
            cisha: null,
            jingdi: null,
            win: null,
            defeat: null
        };
        
        this.footsteps = null;        // 脚步声
        
        // 音频上下文
        this.audioContext = null;
        
        // 状态
        this.isInitialized = false;
        this.isMuted = false;
        this.currentPhase = null;
        this.countdownInterval = null;
        this.footstepIntervalId = null;
        this._interactionListenerActive = false;
        this.audioUnlocked = false;
        
        // 音量设置
        this.volumes = {
            bgm: 0.3,
            countdown: 0.5,
            footsteps: 0.4,
            sfx: 0.6  // 音效音量
        };
        
        this.init();
        this.setupMobileAudioUnlock();
    }
    
    /**
     * 初始化音频系统
     */
    async init() {
        console.log('[音效管理器] 🎵 开始初始化...');
        
        try {
            // 创建AudioContext
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('[音效管理器] ✅ AudioContext已创建');
            
            // 加载所有音频文件
            await this.loadAllAudio();
            
            // 创建脚步声音效
            this.createFootstepsAudio();
            console.log('[音效管理器] ✅ 脚步声音效已创建');
            
            this.isInitialized = true;
            console.log('[音效管理器] ✅ 初始化完成!');
        } catch (error) {
            console.error('[音效管理器] ❌ 初始化失败:', error);
        }
    }
    
    /**
     * 加载所有音频文件
     */
    async loadAllAudio() {
        const audioFiles = [
            { key: 'bgm', url: 'audio/game-bgm.aac' },
            { key: 'cisha', url: 'audio/cisha.aac' },
            { key: 'jingdi', url: 'audio/jingdi.aac' },
            { key: 'win', url: 'audio/win.aac' },
            { key: 'defeat', url: 'audio/defeat.aac' }
        ];
        
        console.log('[音效管理器] 📦 开始加载音频文件...');
        
        for (const file of audioFiles) {
            try {
                const buffer = await this.loadAudioBuffer(file.url);
                this.audioBuffers[file.key] = buffer;
                console.log(`[音效管理器] ✅ ${file.key} 加载成功`);
            } catch (error) {
                console.error(`[音效管理器] ❌ ${file.key} 加载失败:`, error);
            }
        }
    }
    
    /**
     * 加载单个音频文件
     */
    async loadAudioBuffer(url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return await this.audioContext.decodeAudioData(arrayBuffer);
    }
    
    /**
     * 设置移动端音频解锁（监听用户首次交互）
     */
    setupMobileAudioUnlock() {
        const unlockAudio = () => {
            if (this.audioUnlocked) return;
            
            console.log('[音效管理器] 🔓 检测到用户交互，解锁AudioContext...');
            
            // 解锁AudioContext
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            this.audioUnlocked = true;
            console.log('[音效管理器] ✅ AudioContext已解锁');
            
            // 移除监听器
            document.removeEventListener('touchstart', unlockAudio);
            document.removeEventListener('touchend', unlockAudio);
            document.removeEventListener('click', unlockAudio);
        };
        
        // 监听多种交互事件
        document.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
        document.addEventListener('touchend', unlockAudio, { once: true, passive: true });
        document.addEventListener('click', unlockAudio, { once: true });
        
        console.log('[音效管理器] 📱 移动端音频解锁监听器已设置');
    }
    
    /**
     * 播放音频（使用Web Audio API）
     * @param {string} key - 音频键名
     * @param {boolean} loop - 是否循环播放
     * @param {number} volume - 音量 (0-1)
     */
    playAudioBuffer(key, loop = false, volume = 1) {
        if (this.isMuted || !this.audioBuffers[key]) return null;
        
        // 恢复AudioContext
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // 停止当前正在播放的同一音频
        if (this.currentSources[key]) {
            try {
                this.currentSources[key].stop();
            } catch (e) {}
        }
        
        // 创建新的声源
        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffers[key];
        source.loop = loop;
        
        // 创建音量控制
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = volume;
        
        // 连接节点
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 播放
        source.start(0);
        
        // 保存当前声源
        this.currentSources[key] = source;
        
        // 自动清理
        source.onended = () => {
            if (this.currentSources[key] === source) {
                this.currentSources[key] = null;
            }
        };
        
        return source;
    }
    
    /**
     * 停止音频
     */
    stopAudioBuffer(key) {
        if (this.currentSources[key]) {
            try {
                this.currentSources[key].stop();
                this.currentSources[key] = null;
            } catch (e) {}
        }
    }
    
    /**
     * 生成脚步声音效（使用Web Audio API）
     */
    createFootstepsAudio() {
        // 沉重脚步声（接近）
        this.footsteps = {
            play: () => {
                if (this.isMuted) return;
                
                const duration = 0.3;
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(80, this.audioContext.currentTime); // 低频
                
                gainNode.gain.setValueAtTime(this.volumes.footsteps, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + duration);
            }
        };
        
        // 快速逃离脚步声（更急促）
        this.fastFootsteps = {
            play: () => {
                if (this.isMuted) return;
                
                const duration = 0.15;
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime); // 稍高频，更急促
                
                gainNode.gain.setValueAtTime(this.volumes.footsteps * 0.8, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + duration);
            }
        };
    }
    
    /**
     * 惊恐叫声 "Oh no!"
     */
    playScream() {
        if (this.isMuted) return;
        
        console.log('[音效] 😱 播放惊恐叫声');
        
        // 使用下降的频率模拟 "Oh no!"
        const startTime = this.audioContext.currentTime;
        const duration = 0.8;
        
        // 第一个音 "Oh"
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(600, startTime);
        osc1.frequency.exponentialRampToValueAtTime(400, startTime + 0.3);
        gain1.gain.setValueAtTime(0.3, startTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        osc1.connect(gain1);
        gain1.connect(this.audioContext.destination);
        osc1.start(startTime);
        osc1.stop(startTime + 0.3);
        
        // 第二个音 "No!"
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(500, startTime + 0.35);
        osc2.frequency.exponentialRampToValueAtTime(200, startTime + 0.8);
        gain2.gain.setValueAtTime(0.35, startTime + 0.35);
        gain2.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8);
        osc2.connect(gain2);
        gain2.connect(this.audioContext.destination);
        osc2.start(startTime + 0.35);
        osc2.stop(startTime + 0.8);
    }
    
    /**
     * 刀光剑影音效（快速挥刀）
     */
    playSlash() {
        if (this.isMuted) return;
        
        console.log('[音效] 🗡️ 播放刀光音效');
        
        const startTime = this.audioContext.currentTime;
        
        // 使用白噪声模拟刀声
        const bufferSize = this.audioContext.sampleRate * 0.3;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成白噪声
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize); // 逐渐衰减
        }
        
        const noise = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        noise.buffer = buffer;
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2000, startTime); // 高频
        noiseGain.gain.setValueAtTime(0.4, startTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);
        
        noise.start(startTime);
        noise.stop(startTime + 0.3);
    }
    
    /**
     * 角色倒地音效
     */
    playFall() {
        if (this.isMuted) return;
        
        console.log('[音效] 💀 播放倒地音效');
        
        const startTime = this.audioContext.currentTime;
        
        // 低频重击声
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, startTime);
        osc.frequency.exponentialRampToValueAtTime(30, startTime + 0.4);
        
        gain.gain.setValueAtTime(0.5, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start(startTime);
        osc.stop(startTime + 0.4);
    }
    
    /**
     * 播放哔哔声(倒计时音效)
     * @param {boolean} silent - 是否静音模式(前50秒使用)
     */
    playBeep(silent = false) {
        if (this.isMuted) return;
        
        const duration = 0.15;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime); // 高频哔声
        
        // 如果是静音模式,音量设置为极小值(0.005),否则正常音量
        const initialVolume = silent ? 0.005 : this.volumes.countdown;
        gainNode.gain.setValueAtTime(initialVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    /**
     * 游戏开始 - 播放BGM + 启动全程倒计时音效(前50秒静音)
     */
    onGameStart() {
        console.log('[音效] 游戏开始,播放BGM + 启动全程倒计时(前50秒静音)');
        console.log('[音效] 当前静音状态:', this.isMuted);
        console.log('[音效] BGM对象:', this.bgm);
        console.log('[音效] BGM src:', this.bgm ? this.bgm.src : 'null');
        
        if (!this.bgm) {
            console.error('[音效] BGM对象不存在!');
            return;
        }
        
        if (this.isMuted) {
            console.log('[音效] 当前静音,不播放BGM');
            this.currentPhase = 'betting';
            return;
        }
        
        // 移动端:恢复AudioContext
        this.resumeAudioContext();
        
        // 停止旧的倒计时音效
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        
        // 🎯 启动全程60秒倒计时音效(前50秒静音,后10秒正常)
        // 用于解锁移动端音频播放
        this.currentCountdown = 60; // 初始化倒计时
        this.countdownInterval = setInterval(() => {
            if (this.currentCountdown > 0) {
                // 前50秒使用静音模式,后10秒正常音量
                const isSilent = this.currentCountdown > 10;
                this.playBeep(isSilent);
                this.currentCountdown--;
            }
        }, 1000);
        
        // 立即播放一次(静音)
        this.playBeep(true);
        console.log('[音效] 🔓 启动全程倒计时音效(前50秒静音),解锁移动端音频播放');
        
        // 恢复正常音量
        this.bgm.volume = this.volumes.bgm;
        console.log('[音效] 设置BGM音量为:', this.volumes.bgm);
        
        // 从头播放BGM
        this.bgm.currentTime = 0;
        console.log('[音效] 尝试播放BGM...');
        
        const playPromise = this.bgm.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('[音效] ✅ BGM 播放成功!');
            }).catch(err => {
                console.warn('[音效] ⚠️ BGM播放被浏览器阻止 (autoplay policy):', err.message);
                console.warn('[音效] 这是正常的浏览器安全策略,需要用户交互才能播放音频');
                this.setupUserInteractionListener();
            });
        }
        
        this.currentPhase = 'betting';
    }
    
    /**
     * 恢复游戏状态 - 用于页面刷新后恢复音效
     * @param {string} phase - 游戏阶段 (betting, killer_moving, settling)
     * @param {number} countdown - 剩余倒计时
     */
    restoreGameState(phase, countdown) {
        console.log(`[音效] 🔄 恢复游戏状态: 阶段=${phase}, 倒计时=${countdown}s`);
        
        if (this.isMuted) {
            console.log('[音效] 当前静音,不恢复音效');
            this.currentPhase = phase;
            return;
        }
        
        // 根据阶段恢复音效
        if (phase === 'betting') {
            // 投注阶段 - 启动全程倒计时音效
            console.log('[音效] 恢复:投注阶段,启动全程倒计时音效');
            this.currentPhase = countdown <= 10 ? 'countdown_critical' : 'betting';
            
            // 清理旧的倒计时
            if (this.countdownInterval) clearInterval(this.countdownInterval);
            
            // 🎯 启动全程倒计时音效(根据剩余时间判断静音/正常)
            this.currentCountdown = countdown;
            this.countdownInterval = setInterval(() => {
                if (this.currentCountdown > 0) {
                    const isSilent = this.currentCountdown > 10;
                    this.playBeep(isSilent);
                    this.currentCountdown--;
                }
            }, 1000);
            
            // 立即播放一次
            const isSilent = countdown > 10;
            this.playBeep(isSilent);
            console.log('[音效] 🔓 启动倒计时音效(剩余' + countdown + '秒, ' + (isSilent ? '静音模式' : '正常模式') + ')');
            
            // 播放BGM(如果不是最后10秒)
            if (countdown > 10) {
                this.bgm.volume = this.volumes.bgm;
                const playPromise = this.bgm.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log('[音效] ✅ BGM 恢复播放成功');
                    }).catch(err => {
                        console.warn('[音效] ⚠️ BGM播放被阻止:', err.message);
                        this.setupUserInteractionListener();
                    });
                }
            } else {
                // 最后10秒,BGM已经淡出
                this.bgm.pause();
            }
        } else if (phase === 'killer_moving' || phase === 'settling') {
            // 杀手/结算阶段,保持静音
            console.log('[音效] 恢复:杀手/结算阶段,保持静音');
            this.currentPhase = phase;
            this.bgm.pause();
            
            if (this.countdownInterval) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
            }
        } else {
            // 其他阶段(如 waiting)
            console.log('[音效] 恢复:其他阶段 (' + phase + '),不播放音效');
            this.currentPhase = phase;
            this.bgm.pause();
        }
    }
    
    /**
     * 设置用户交互监听器 - 用于解决浏览器自动播放限制
     */
    setupUserInteractionListener() {
        if (this._interactionListenerActive) {
            console.log('[音效] 用户交互监听器已经激活，跳过');
            return;
        }
        
        console.log('[音效] 📢 设置用户交互监听器，等待用户点击以启动BGM');
        this._interactionListenerActive = true;
        
        const resumeAudio = () => {
            console.log('[音效] 💡 检测到用户交互事件');
            console.log('[音效] 当前阶段:', this.currentPhase, '静音:', this.isMuted);
            
            if (this.currentPhase === 'betting' && !this.isMuted) {
                console.log('[音效] 尝试恢复BGM播放...');
                this.bgm.play().then(() => {
                    console.log('[音效] ✅ BGM 恢复播放成功!');
                }).catch(err => {
                    console.error('[音效] ❌ BGM仍无法播放:', err);
                });
            } else {
                console.log('[音效] 当前不是投注阶段或已静音，不恢复BGM');
            }
            
            // 移除监听器
            document.removeEventListener('click', resumeAudio);
            document.removeEventListener('touchstart', resumeAudio);
            document.removeEventListener('keydown', resumeAudio);
            this._interactionListenerActive = false;
            console.log('[音效] 用户交互监听器已移除');
        };
        
        // 监听多种交互事件
        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('touchstart', resumeAudio, { once: true });
        document.addEventListener('keydown', resumeAudio, { once: true });
        console.log('[音效] 已添加用户交互监听器 (click, touchstart, keydown)');
    }
    
    /**
     * 倒计时更新
     * @param {number} countdown - 剩余秒数
     */
    onCountdownUpdate(countdown) {
        // 同步倒计时值
        this.currentCountdown = countdown;
        
        // 最后10秒:BGM淡出(声音已经在onGameStart中全程播放)
        if (countdown <= 10 && countdown > 0) {
            if (this.currentPhase !== 'countdown_critical') {
                console.log('[音效] 倒计时最后10秒,BGM开始淡出');
                this.currentPhase = 'countdown_critical';
                // 注意:倒计时音效已经在onGameStart中启动,无需再次启动
            }
            
            // BGM淡出:从10秒到1秒,音量从30%逐渐降到0%
            if (!this.isMuted) {
                const fadeProgress = (10 - countdown) / 9; // 0 到 1
                const targetVolume = this.volumes.bgm * (1 - fadeProgress);
                this.bgm.volume = Math.max(0, targetVolume);
                
                // 当倒计时1秒时,完全停止BGM
                if (countdown === 1) {
                    console.log('[音效] BGM淡出完毕,停止播放');
                    this.bgm.pause();
                }
            }
        }
    }
    
    /**
     * 杀手出现 - 全场静音
     */
    onKillerAppear() {
        console.log('[音效] 杀手出现，全场静音');
        
        // 停止BGM
        this.bgm.pause();
        
        // 停止倒计时音效
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        
        this.currentPhase = 'killer_silent';
    }
    
    /**
     * 杀手移动 - 完整的声音时间轴
     * @param {number} steps - 移动步数（路径点数量）
     */
    onKillerMove(steps) {
        console.log('[音效] 💀 杀手行动开始，播放完整音效序列');
        
        this.currentPhase = 'killer_moving';
        
        // === 声音时间轴 ===
        // 0-8秒:     沉重脚步声（接近）
        // 8秒:       刺杀音效（cisha.aac）
        // 刺杀音频结束后: 快速逃离脚步声
        
        // 清理旧的定时器
        if (this.footstepIntervalId) clearInterval(this.footstepIntervalId);
        
        // 1. 沉重脚步声（0-8秒）
        const approachDuration = 8000;
        const approachInterval = 500;
        let approachCount = 0;
        const totalApproachSteps = Math.floor(approachDuration / approachInterval);
        
        this.footstepIntervalId = setInterval(() => {
            if (approachCount >= totalApproachSteps) {
                clearInterval(this.footstepIntervalId);
                this.footstepIntervalId = null;
                return;
            }
            this.footsteps.play();
            approachCount++;
        }, approachInterval);
        
        // 2. 刺杀音效（8秒）
        setTimeout(() => {
            if (this.isMuted) return;
            
            console.log('[音效] 🔪 播放刺杀音效');
            
            // 移动端：恢复AudioContext
            this.resumeAudioContext();
            
            // 从头播放刺杀音效
            this.cishaAudio.currentTime = 0;
            const playPromise = this.cishaAudio.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('[音效] 刺杀音效播放中...');
                    
                    // 监听音频结束事件，然后播放逃离脚步声
                    this.cishaAudio.onended = () => {
                        console.log('[音效] 刺杀音效结束，开始逃离脚步声');
                        this.playEscapeFootsteps();
                    };
                }).catch(err => {
                    console.warn('[音效] 刺杀音效播放失败:', err);
                    // 如果播放失败，仍然播放逃离脚步声
                    setTimeout(() => this.playEscapeFootsteps(), 2000);
                });
            }
        }, 8000);
        
        console.log('[音效] 声音时间轴: 0-8s 脚步 → 8s 刺杀音效 → 结束后 逃离脚步');
    }
    
    /**
     * 播放逃离音效（惊笛）
     */
    playEscapeFootsteps() {
        if (this.isMuted) return;
        
        console.log('[音效] 🚨 开始播放逃离音效（惊笛）');
        
        // 移动端：恢复AudioContext
        this.resumeAudioContext();
        
        // 从头播放惊笛音效
        this.jingdiAudio.currentTime = 0;
        const playPromise = this.jingdiAudio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('[音效] 惊笛音效播放中...');
                
                // 监听音频结杞
                this.jingdiAudio.onended = () => {
                    console.log('[音效] 🏃 杀手音效序列完毕');
                };
            }).catch(err => {
                console.warn('[音效] 惊笛音效播放失败:', err);
            });
        }
    }
    
    /**
     * 游戏结算
     */
    onGameSettling() {
        console.log('[音效] 游戏结算，立即停止所有音效');
        
        // 结算阶段保持静音，不播放BGM
        // BGM会在下一局游戏开始时重新播放
        
        // 停止刺杀音效（如果还在播放）
        if (this.cishaAudio) {
            this.cishaAudio.pause();
            this.cishaAudio.currentTime = 0;
        }
        
        // 停止惊笛音效（如果还在播放）
        if (this.jingdiAudio) {
            this.jingdiAudio.pause();
            this.jingdiAudio.currentTime = 0;
            console.log('[音效] ✅ 已停止惊笛音效');
        }
        
        this.currentPhase = 'settling';
    }
    
    /**
     * 恢复AudioContext（移动端需要）
     */
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log('[音效] AudioContext已恢复');
            }).catch(err => {
                console.warn('[音效] AudioContext恢复失败:', err);
            });
        }
    }
    
    /**
     * 播放胜利音效
     */
    playWinSound() {
        if (this.isMuted || !this.winAudio) return;
        
        console.log('[音效] 🎉 播放胜利音效');
        
        // 移动端：恢复AudioContext
        this.resumeAudioContext();
        
        this.winAudio.currentTime = 0;
        const playPromise = this.winAudio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('[音效] ✅ 胜利音效播放中');
            }).catch(err => {
                console.warn('[音效] 胜利音效播放失败:', err);
                // 移动端重试
                setTimeout(() => {
                    this.winAudio.play().catch(e => console.error('[音效] 重试失败:', e));
                }, 100);
            });
        }
    }
    
    /**
     * 播放失败音效
     */
    playDefeatSound() {
        if (this.isMuted || !this.defeatAudio) return;
        
        console.log('[音效] 💀 播放失败音效');
        
        // 移动端：恢复AudioContext
        this.resumeAudioContext();
        
        this.defeatAudio.currentTime = 0;
        const playPromise = this.defeatAudio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('[音效] ✅ 失败音效播放中');
            }).catch(err => {
                console.warn('[音效] 失败音效播放失败:', err);
                // 移动端重试
                setTimeout(() => {
                    this.defeatAudio.play().catch(e => console.error('[音效] 重试失败:', e));
                }, 100);
            });
        }
    }
    
    /**
     * 切换静音
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            this.bgm.volume = 0;
            console.log('[音效] 已静音');
        } else {
            // 只有在投注阶段且不是倒计时最后10秒时才恢复音量
            if (this.currentPhase === 'betting') {
                this.bgm.volume = this.volumes.bgm;
            }
            console.log('[音效] 取消静音');
        }
        
        return this.isMuted;
    }
    
    /**
     * 设置音量
     * @param {string} type - 音频类型 (bgm, countdown, footsteps)
     * @param {number} volume - 音量 (0-1)
     */
    setVolume(type, volume) {
        if (type === 'bgm') {
            this.volumes.bgm = volume;
            if (this.currentPhase === 'betting' && !this.isMuted) {
                this.bgm.volume = volume;
            }
        } else if (type === 'countdown') {
            this.volumes.countdown = volume;
        } else if (type === 'footsteps') {
            this.volumes.footsteps = volume;
        }
    }
    
    /**
     * 清理资源
     */
    destroy() {
        if (this.bgm) {
            this.bgm.pause();
            this.bgm = null;
        }
        
        if (this.cishaAudio) {
            this.cishaAudio.pause();
            this.cishaAudio = null;
        }
        
        if (this.jingdiAudio) {
            this.jingdiAudio.pause();
            this.jingdiAudio = null;
        }
        
        if (this.winAudio) {
            this.winAudio.pause();
            this.winAudio = null;
        }
        
        if (this.defeatAudio) {
            this.defeatAudio.pause();
            this.defeatAudio = null;
        }
        
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        
        if (this.footstepIntervalId) {
            clearInterval(this.footstepIntervalId);
            this.footstepIntervalId = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        console.log('[音效管理器] 已清理');
    }
}

// 导出全局实例
window.gameAudioManager = new GameAudioManager();
