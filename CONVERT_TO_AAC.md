# 音频转换为AAC格式指南

## 方案1: 使用FFmpeg（推荐）

### 安装FFmpeg
下载地址: https://www.gyan.dev/ffmpeg/builds/
1. 下载 ffmpeg-release-essentials.zip
2. 解压到 `C:\ffmpeg`
3. 添加 `C:\ffmpeg\bin` 到系统环境变量PATH

### 转换命令
```powershell
# 在项目目录下运行
Get-ChildItem -Path ".\audio" -Filter *.mp3 | ForEach-Object {
    $outputFile = $_.FullName -replace '\.mp3$', '.aac'
    & "C:\ffmpeg\bin\ffmpeg.exe" -i $_.FullName -c:a aac -b:a 128k $outputFile
    Write-Host "已转换: $($_.Name) -> $([System.IO.Path]::GetFileName($outputFile))"
}
```

## 方案2: 使用在线工具

### CloudConvert (推荐)
https://cloudconvert.com/mp3-to-aac
- 支持批量转换
- 设置: AAC, 128kbps, 44.1kHz

### FreeConvert
https://www.freeconvert.com/mp3-to-aac
- 免费批量转换
- 建议设置: 质量选择"High Quality"

## 需要转换的文件
- audio/cisha.mp3 (117.35 KB)
- audio/defeat.mp3 (88.78 KB)
- audio/game-bgm.mp3 (5360.18 KB)
- audio/jingdi.mp3 (217.35 KB)
- audio/win.mp3 (167.14 KB)

**总大小**: ~5.9 MB
**预计转换后**: ~4.1-4.7 MB (节省20-30%)

## 转换后操作
转换完成后，将AAC文件放入 `audio/` 文件夹，代码已更新为使用AAC格式。
