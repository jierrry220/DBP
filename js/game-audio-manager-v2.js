/**
 * 派对危机游戏音效管理器 v2
 * 完全使用Web Audio API，移动端兼容性更好
 */

class GameAudioManager {
    constructor() {
        // 音频上下文
        this.audioContext = null;
        
        // 音频缓冲区
        this.audioBuffers = {
            bgm: null,
            cisha: null,
            jingdi: null,
            win: null,
            defeat: null
        };
        
        // 当前播放的声源
        this.currentSources = {
            bgm: null
        };
        
        // 增益节点（用于音量控制）
        this.gainNodes = {
            bgm: null,
            sfx: null
        };
        
        // 状态
        this.isInitialized = false;
        this.isMuted = false;
        this.currentPhase = null;
        this.countdownInterval = null;
        this.audioUnlocked = false;
        
        // 音量设置
        this.volumes = {
            bgm: 0.3,
            countdown: 0.5,
            footsteps: 0.4,
            sfx: 0.6
        };
        
        this.init();
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
            
            // 创建主增益节点
            this.gainNodes.bgm = this.audioContext.createGain();
            this.gainNodes.bgm.gain.value = this.volumes.bgm;
            this.gainNodes.bgm.connect(this.audioContext.destination);
            
            this.gainNodes.sfx = this.audioContext.createGain();
            this.gainNodes.sfx.gain.value = this.volumes.sfx;
            this.gainNodes.sfx.connect(this.audioContext.destination);
            
            // 加载所有音频文件
            await this.loadAllAudio();
            
            // 设置移动端解锁
            this.setupMobileUnlock();
            
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
            { key: 'bgm', url: 'audio/game-bgm.mp3' },
            { key: 'cisha', url: 'audio/cisha.mp3' },
            { key: 'jingdi', url: 'audio/jingdi.mp3' },
            { key: 'win', url: 'audio/win.mp3' },
            { key: 'defeat', url: 'audio/defeat.mp3' }
        ];
        
        console.log('[音效管理器] 📦 开始加载音频文件...');
        
        const loadPromises = audioFiles.map(async (file) => {
            try {
                const response = await fetch(file.url);
                const arrayBuffer = await response.arrayBuffer();
                this.audioBuffers[file.key] = await this.audioContext.decodeAudioData(arrayBuffer);
                console.log(`[音效管理器] ✅ ${file.key} 加载成功`);
            } catch (error) {
                console.error(`[音效管理器] ❌ ${file.key} 加载失败:`, error);
            }
        });
        
        await Promise.all(loadPromises);
    }
    
    /**
     * 设置移动端解锁
     */
    setupMobileUnlock() {
        const unlock = () => {
            if (this.audioUnlocked) return;
            
            console.log('[音效管理器] 🔓 用户交互，解锁AudioContext');
            
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            this.audioUnlocked = true;
            
            // 移除监听器
            document.removeEventListener('touchstart', unlock);
            document.removeEventListener('touchend', unlock);
            document.removeEventListener('click', unlock);
        };
        
        document.addEventListener('touchstart', unlock, { once: true, passive: true });
        document.addEventListener('touchend', unlock, { once: true, passive: true });
        document.addEventListener('click', unlock, { once: true });
    }
    
    /**
     * 播放音频
     */
    playSound(key, loop = false) {
        if (this.isMuted || !this.audioBuffers[key]) {
            console.warn(`[音效] 无法播放 ${key}: 静音=${this.isMuted}, 已加载=${!!this.audioBuffers[key]}`);
            return null;
        }
        
        // 恢复AudioContext
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // 创建声源
        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffers[key];
        source.loop = loop;
        
        // 连接到对应的增益节点
        if (key === 'bgm') {
            source.connect(this.gainNodes.bgm);
            // 保存BGM源用于停止
            if (this.currentSources.bgm) {
                try {
                    this.currentSources.bgm.stop();
                } catch (e) {}
            }
            this.currentSources.bgm = source;
        } else {
            source.connect(this.gainNodes.sfx);
        }
        
        // 播放
        source.start(0);
        console.log(`[音效] ▶️ 播放 ${key}`);
        
        return source;
    }
    
    /**
     * 停止音频
     */
    stopSound(key) {
        if (this.currentSources[key]) {
            try {
                this.currentSources[key].stop();
                this.currentSources[key] = null;
                console.log(`[音效] ⏹️ 停止 ${key}`);
            } catch (e) {}
        }
    }
    
    /**
     * 播放哔哔声（倒计时）
     */
    playBeep() {
        if (this.isMuted) return;
        
        const duration = 0.15;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.value = 800;
        
        gainNode.gain.setValueAtTime(this.volumes.countdown, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    /**
     * 播放脚步声
     */
    playFootstep() {
        if (this.isMuted) return;
        
        const duration = 0.3;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 80;
        
        gainNode.gain.setValueAtTime(this.volumes.footsteps, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    // ==================== 游戏事件处理 ====================
    
    /**
     * 游戏开始
     */
    onGameStart() {
        console.log('[音效] 游戏开始，播放BGM');
        
        if (this.isMuted) {
            this.currentPhase = 'betting';
            return;
        }
        
        // 停止倒计时
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        
        // 播放BGM（循环）
        this.playSound('bgm', true);
        this.currentPhase = 'betting';
    }
    
    /**
     * 倒计时更新
     */
    onCountdownUpdate(countdown) {
        if (countdown <= 10 && countdown > 0) {
            if (this.currentPhase !== 'countdown_critical') {
                console.log('[音效] 倒计时最后10秒，BGM淡出');
                this.currentPhase = 'countdown_critical';
                
                // 开始倒计时音效
                if (this.countdownInterval) clearInterval(this.countdownInterval);
                this.countdownInterval = setInterval(() => {
                    this.playBeep();
                }, 1000);
            }
            
            // BGM淡出
            if (!this.isMuted && this.gainNodes.bgm) {
                const fadeProgress = (10 - countdown) / 9;
                this.gainNodes.bgm.gain.value = this.volumes.bgm * (1 - fadeProgress);
                
                if (countdown === 1) {
                    console.log('[音效] BGM淡出完毕');
                    this.stopSound('bgm');
                }
            }
        }
    }
    
    /**
     * 杀手出现
     */
    onKillerAppear() {
        console.log('[音效] 杀手出现，静音');
        
        // 停止BGM
        this.stopSound('bgm');
        
        // 停止倒计时
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        
        this.currentPhase = 'killer_silent';
    }
    
    /**
     * 杀手移动
     */
    onKillerMove(steps) {
        console.log('[音效] 💀 杀手行动');
        
        this.currentPhase = 'killer_moving';
        
        // 1. 脚步声（0-8秒）
        let stepCount = 0;
        const stepInterval = setInterval(() => {
            if (stepCount >= 16) {
                clearInterval(stepInterval);
                return;
            }
            this.playFootstep();
            stepCount++;
        }, 500);
        
        // 2. 刺杀音效（8秒后）
        setTimeout(() => {
            if (!this.isMuted) {
                console.log('[音效] 🔪 播放刺杀音效');
                const cishaSource = this.playSound('cisha', false);
                
                if (cishaSource) {
                    cishaSource.onended = () => {
                        console.log('[音效] 刺杀音效结束，播放逃离音效');
                        this.playSound('jingdi', false);
                    };
                }
            }
        }, 8000);
    }
    
    /**
     * 游戏结算
     */
    onGameSettling() {
        console.log('[音效] 游戏结算，停止所有音效');
        this.currentPhase = 'settling';
    }
    
    /**
     * 播放胜利音效
     */
    playWinSound() {
        console.log('[音效] 🎉 播放胜利音效');
        this.playSound('win', false);
    }
    
    /**
     * 播放失败音效
     */
    playDefeatSound() {
        console.log('[音效] 💀 播放失败音效');
        this.playSound('defeat', false);
    }
    
    /**
     * 切换静音
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            // 静音所有
            this.gainNodes.bgm.gain.value = 0;
            this.gainNodes.sfx.gain.value = 0;
            console.log('[音效] 已静音');
        } else {
            // 恢复音量
            this.gainNodes.bgm.gain.value = this.volumes.bgm;
            this.gainNodes.sfx.gain.value = this.volumes.sfx;
            console.log('[音效] 取消静音');
        }
        
        return this.isMuted;
    }
    
    /**
     * 恢复游戏状态
     */
    restoreGameState(phase, countdown) {
        console.log(`[音效] 🔄 恢复游戏状态: ${phase}, 倒计时=${countdown}s`);
        
        if (this.isMuted) {
            this.currentPhase = phase;
            return;
        }
        
        if (phase === 'betting') {
            if (countdown <= 10 && countdown > 0) {
                this.currentPhase = 'countdown_critical';
                if (this.countdownInterval) clearInterval(this.countdownInterval);
                this.countdownInterval = setInterval(() => {
                    this.playBeep();
                }, 1000);
                this.playBeep();
            } else {
                this.currentPhase = 'betting';
                this.playSound('bgm', true);
            }
        } else {
            this.currentPhase = phase;
        }
    }
    
    /**
     * 清理资源
     */
    destroy() {
        // 停止所有音频
        Object.keys(this.currentSources).forEach(key => {
            this.stopSound(key);
        });
        
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        console.log('[音效管理器] 已清理');
    }
}

// 导出全局实例
window.gameAudioManager = new GameAudioManager();
