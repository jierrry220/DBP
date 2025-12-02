import os
from PIL import Image
import shutil

# 配置
MAX_SIZE_KB = 500  # 目标大小
QUALITY = 80       # JPG 质量
MAX_WIDTH = 1920   # 最大宽度限制

def get_size_kb(path):
    return os.path.getsize(path) / 1024

def compress_image(file_path):
    try:
        file_size = get_size_kb(file_path)
        if file_size < MAX_SIZE_KB:
            return False

        print(f"Compressing {file_path} ({file_size:.1f} KB)...")
        
        # 备份原文件
        backup_path = file_path + ".bak"
        if not os.path.exists(backup_path):
            shutil.copy2(file_path, backup_path)

        with Image.open(file_path) as img:
            # 调整尺寸
            if img.width > MAX_WIDTH:
                ratio = MAX_WIDTH / img.width
                new_height = int(img.height * ratio)
                img = img.resize((MAX_WIDTH, new_height), Image.Resampling.LANCZOS)
            
            # 保存
            ext = os.path.splitext(file_path)[1].lower()
            if ext in ['.jpg', '.jpeg']:
                # 如果是 RGBA，转换为 RGB (JPG 不支持透明)
                if img.mode == 'RGBA':
                    # 创建白色背景
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[3]) # 使用 alpha 通道作为 mask
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                    
                img.save(file_path, quality=QUALITY, optimize=True)
            elif ext == '.png':
                # PNG 压缩比较难，尝试 optimize=True 和减少颜色数（如果是 P 模式）
                # 对于大 PNG，如果不需要透明度，转 JPG 是最好的，但这里保守处理
                if img.mode == 'RGBA':
                    # 尝试量化为带透明度的 256 色 PNG (Pillow 9+ 支持)
                    try:
                        img = img.quantize(colors=256, method=2)
                    except:
                        pass
                    img.save(file_path, optimize=True)
                else:
                    # 尝试转 P 模式减少颜色（有损但体积小）
                    img = img.convert('P', palette=Image.ADAPTIVE, colors=256)
                    img.save(file_path, optimize=True)
            
        new_size = get_size_kb(file_path)
        print(f"Done. New size: {new_size:.1f} KB (Saved {file_size - new_size:.1f} KB)")
        return True

    except Exception as e:
        print(f"Error compressing {file_path}: {e}")
        return False

def scan_and_compress(root_dir):
    extensions = ['.jpg', '.jpeg', '.png']
    count = 0
    saved_kb = 0
    
    for root, dirs, files in os.walk(root_dir):
        if '.git' in root:
            continue
            
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in extensions:
                full_path = os.path.join(root, file)
                original_size = get_size_kb(full_path)
                
                if compress_image(full_path):
                    count += 1
                    saved_kb += (original_size - get_size_kb(full_path))

    print(f"\nTotal compressed: {count} images")
    print(f"Total space saved: {saved_kb/1024:.2f} MB")

if __name__ == '__main__':
    # 扫描当前目录
    scan_and_compress('.')
