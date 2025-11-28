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
        // 音频元素
        this.bgm = null;              // 背景音乐
        this.cishaAudio = null;       // 刺杀音效
        this.jingdiAudio = null;      // 惊笛音效（逃离）
        this.winAudio = null;         // 胜利音效
        this.defeatAudio = null;      // 失败音效
        this.countdownBeep = null;    // 倒计时哔哔声
        this.footsteps = null;        // 脚步声
        
        // 音频上下文（用于生成倒计时音效）
        this.audioContext = null;
        
        // 状态
        this.isInitialized = false;
        this.isMuted = false;
        this.currentPhase = null;
        this.countdownInterval = null;
        this.footstepIntervalId = null; // 接近脚步声定时器
        this._interactionListenerActive = false; // 用户交互监听器状态
        
        // 音量设置
        this.volumes = {
            bgm: 0.3,           // 正常BGM音量
            countdown: 0.5,     // 倒计时音效音量
            footsteps: 0.4      // 脚步声音量
        };
        
        this.init();
    }
    
    /**
     * 初始化音频系统
     */
    init() {
        console.log('[音效管理器] 🎵 开始初始化...');
        
        try {
            // 创建BGM音频元素
            this.bgm = new Audio('audio/game-bgm.mp3');
            this.bgm.loop = true;
            this.bgm.volume = this.volumes.bgm;
            console.log('[音效管理器] ✅ BGM音频元素已创建:', this.bgm.src);
            
            // 创建刺杀音效
            this.cishaAudio = new Audio('audio/cisha.mp3');
            this.cishaAudio.volume = 0.6; // 刺杀音效音量
            console.log('[音效管理器] ✅ 刺杀音效已创建:', this.cishaAudio.src);
            
            // 创建惊笛音效（逃离）
            this.jingdiAudio = new Audio('audio/jingdi.mp3');
            this.jingdiAudio.volume = 0.5; // 惊笛音效音量
            console.log('[音效管理器] ✅ 惊笛音效已创建:', this.jingdiAudio.src);
            
            // 创建胜利音效
            this.winAudio = new Audio('audio/win.mp3');
            this.winAudio.volume = 0.6; // 胜利音效音量
            console.log('[音效管理器] ✅ 胜利音效已创建:', this.winAudio.src);
            
            // 创建失败音效
            this.defeatAudio = new Audio('audio/defeat.mp3');
            this.defeatAudio.volume = 0.6; // 失败音效音量
            console.log('[音效管理器] ✅ 失败音效已创建:', this.defeatAudio.src);
            
            // 创建音频上下文（用于生成音效）
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('[音效管理器] ✅ AudioContext已创建');
            
            // 创建脚步声音效
            this.createFootstepsAudio();
            console.log('[音效管理器] ✅ 脚步声音效已创建');
            
            this.isInitialized = true;
            console.log('[音效管理器] ✅ 初始化完成!');
            console.log('[音效管理器] 状态: BGM音量=' + this.volumes.bgm + ', 静音=' + this.isMuted);
        } catch (error) {
            console.error('[音效管理器] ❌ 初始化失败:', error);
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
     * 播放哔哔声（倒计时音效）
     */
    playBeep() {
        if (this.isMuted) return;
        
        const duration = 0.15;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime); // 高频哔声
        
        gainNode.gain.setValueAtTime(this.volumes.countdown, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    /**
     * 游戏开始 - 播放BGM
     */
    onGameStart() {
        console.log('[音效] 游戏开始，播放BGM');
        console.log('[音效] 当前静音状态:', this.isMuted);
        console.log('[音效] BGM对象:', this.bgm);
        console.log('[音效] BGM src:', this.bgm ? this.bgm.src : 'null');
        
        if (!this.bgm) {
            console.error('[音效] BGM对象不存在!');
            return;
        }
        
        if (this.isMuted) {
            console.log('[音效] 当前静音，不播放BGM');
            this.currentPhase = 'betting';
            return;
        }
        
        // 停止倒计时音效
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        
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
                console.warn('[音效] 这是正常的浏览器安全策略，需要用户交互才能播放音频');
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
            console.log('[音效] 当前静音，不恢复音效');
            this.currentPhase = phase;
            return;
        }
        
        // 根据阶段恢复音效
        if (phase === 'betting') {
            // 投注阶段
            if (countdown <= 10 && countdown > 0) {
                // 最后10秒，直接播放倒计时音效
                console.log('[音效] 恢复：倒计时最后10秒，播放哔哔声');
                this.currentPhase = 'countdown_critical';
                this.bgm.pause();
                
                // 清理旧的倒计时
                if (this.countdownInterval) clearInterval(this.countdownInterval);
                
                // 启动倒计时音效
                this.countdownInterval = setInterval(() => {
                    this.playBeep();
                }, 1000);
                
                // 立即播放一次
                this.playBeep();
            } else {
                // 正常投注阶段，直接播放BGM
                console.log('[音效] 恢复：投注阶段，播放BGM');
                this.currentPhase = 'betting';
                this.bgm.volume = this.volumes.bgm;
                
                // 直接播放，如果被阻止则监听用户交互
                const playPromise = this.bgm.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log('[音效] ✅ BGM 恢复播放成功');
                    }).catch(err => {
                        console.warn('[音效] ⚠️ BGM播放被阻止:', err.message);
                        this.setupUserInteractionListener();
                    });
                }
            }
        } else if (phase === 'killer_moving' || phase === 'settling') {
            // 杀手/结算阶段，保持静音
            console.log('[音效] 恢复：杀手/结算阶段，保持静音');
            this.currentPhase = phase;
            this.bgm.pause();
            
            if (this.countdownInterval) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
            }
        } else {
            // 其他阶段（如 waiting）
            console.log('[音效] 恢复：其他阶段 (' + phase + ')，不播放音效');
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
        // 最后10秒：BGM淡出 + 播放哔哔声
        if (countdown <= 10 && countdown > 0) {
            if (this.currentPhase !== 'countdown_critical') {
                console.log('[音效] 倒计时最后10秒，BGM开始淡出');
                this.currentPhase = 'countdown_critical';
                
                // 开始播放倒计时哔哔声
                if (this.countdownInterval) clearInterval(this.countdownInterval);
                this.countdownInterval = setInterval(() => {
                    this.playBeep();
                }, 1000); // 每秒一次
            }
            
            // BGM淡出：从10秒到1秒，音量从30%逐渐降到0%
            if (!this.isMuted) {
                const fadeProgress = (10 - countdown) / 9; // 0 到 1
                const targetVolume = this.volumes.bgm * (1 - fadeProgress);
                this.bgm.volume = Math.max(0, targetVolume);
                
                // 当倒计时1秒时，完全停止BGM
                if (countdown === 1) {
                    console.log('[音效] BGM淡出完毕，停止播放');
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
        // 8秒:       刺杀音效（cisha.mp3）
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
     * 播放胜利音效
     */
    playWinSound() {
        if (this.isMuted || !this.winAudio) return;
        
        console.log('[音效] 🎉 播放胜利音效');
        
        this.winAudio.currentTime = 0;
        const playPromise = this.winAudio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('[音效] ✅ 胜利音效播放中');
            }).catch(err => {
                console.warn('[音效] 胜利音效播放失败:', err);
            });
        }
    }
    
    /**
     * 播放失败音效
     */
    playDefeatSound() {
        if (this.isMuted || !this.defeatAudio) return;
        
        console.log('[音效] 💀 播放失败音效');
        
        this.defeatAudio.currentTime = 0;
        const playPromise = this.defeatAudio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('[音效] ✅ 失败音效播放中');
            }).catch(err => {
                console.warn('[音效] 失败音效播放失败:', err);
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
