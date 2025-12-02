# AAC转MP3批量转换脚本
# 使用前请先安装 ffmpeg: https://www.gyan.dev/ffmpeg/builds/

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "   Debear Party - 音频格式转换脚本" -ForegroundColor Cyan
Write-Host "   AAC → MP3 (iPhone兼容)" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# 检查ffmpeg是否已安装
try {
    $null = ffmpeg -version 2>&1
    Write-Host "✅ ffmpeg 已安装" -ForegroundColor Green
} catch {
    Write-Host "❌ ffmpeg 未安装!" -ForegroundColor Red
    Write-Host ""
    Write-Host "请按以下步骤安装 ffmpeg:" -ForegroundColor Yellow
    Write-Host "1. 访问: https://www.gyan.dev/ffmpeg/builds/" -ForegroundColor Yellow
    Write-Host "2. 下载 'ffmpeg-release-essentials.zip'" -ForegroundColor Yellow
    Write-Host "3. 解压到 C:\ffmpeg" -ForegroundColor Yellow
    Write-Host "4. 添加 C:\ffmpeg\bin 到系统PATH环境变量" -ForegroundColor Yellow
    Write-Host "5. 重启 PowerShell 后重新运行此脚本" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "或者使用在线工具: https://cloudconvert.com/aac-to-mp3" -ForegroundColor Cyan
    exit 1
}

# 音频文件配置
$audioFiles = @(
    @{ input = "audio\game-bgm.aac"; output = "audio\game-bgm.mp3"; bitrate = "128k"; channels = "2" },
    @{ input = "audio\cisha.aac"; output = "audio\cisha.mp3"; bitrate = "96k"; channels = "1" },
    @{ input = "audio\jingdi.aac"; output = "audio\jingdi.mp3"; bitrate = "96k"; channels = "1" },
    @{ input = "audio\win.aac"; output = "audio\win.mp3"; bitrate = "96k"; channels = "1" },
    @{ input = "audio\defeat.aac"; output = "audio\defeat.mp3"; bitrate = "96k"; channels = "1" }
)

Write-Host "开始转换音频文件..." -ForegroundColor Cyan
Write-Host ""

$success = 0
$failed = 0

foreach ($file in $audioFiles) {
    if (Test-Path $file.input) {
        Write-Host "🔄 转换: $($file.input) → $($file.output)" -ForegroundColor Yellow
        Write-Host "   参数: $($file.bitrate), $($file.channels) channels" -ForegroundColor Gray
        
        try {
            # 转换命令
            $args = @(
                "-i", $file.input,
                "-codec:a", "libmp3lame",
                "-b:a", $file.bitrate,
                "-ac", $file.channels,
                "-y",  # 覆盖已存在文件
                $file.output
            )
            
            $process = Start-Process -FilePath "ffmpeg" -ArgumentList $args -NoNewWindow -Wait -PassThru
            
            if ($process.ExitCode -eq 0) {
                Write-Host "   ✅ 成功!" -ForegroundColor Green
                $success++
                
                # 显示文件大小对比
                $oldSize = (Get-Item $file.input).Length / 1KB
                $newSize = (Get-Item $file.output).Length / 1KB
                $reduction = [math]::Round((1 - $newSize/$oldSize) * 100, 1)
                Write-Host "   📊 AAC: $([math]::Round($oldSize, 1)) KB → MP3: $([math]::Round($newSize, 1)) KB (减小 $reduction%)" -ForegroundColor Cyan
            } else {
                Write-Host "   ❌ 转换失败!" -ForegroundColor Red
                $failed++
            }
        } catch {
            Write-Host "   ❌ 错误: $_" -ForegroundColor Red
            $failed++
        }
        Write-Host ""
    } else {
        Write-Host "⚠️  文件不存在: $($file.input)" -ForegroundColor Yellow
        Write-Host ""
    }
}

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "转换完成!" -ForegroundColor Green
Write-Host "成功: $success 个文件" -ForegroundColor Green
if ($failed -gt 0) {
    Write-Host "失败: $failed 个文件" -ForegroundColor Red
}
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 提示: 转换完成后可以删除原 .aac 文件" -ForegroundColor Yellow
Write-Host "   Remove-Item audio\*.aac" -ForegroundColor Gray
