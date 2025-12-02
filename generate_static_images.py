from PIL import Image
import os

def extract_first_frame(gif_path, output_path):
    try:
        with Image.open(gif_path) as im:
            # 确保是第一帧
            im.seek(0)
            # 保存为PNG
            im.save(output_path, 'PNG')
            print(f"Successfully created {output_path}")
    except Exception as e:
        print(f"Error processing {gif_path}: {e}")

# 确保 images 目录存在
if not os.path.exists('images'):
    print("Error: images directory not found")
    exit(1)

# 转换右走动画
extract_first_frame('images/player-walk-right.gif', 'images/player-static-right.png')

# 转换左走动画 (如果有的话，或者直接镜像)
if os.path.exists('images/player-walk-left.gif'):
    extract_first_frame('images/player-walk-left.gif', 'images/player-static-left.png')
else:
    print("player-walk-left.gif not found, skipping")
