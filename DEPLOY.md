# 🚀 Zeabur 部署指南

## 步骤 1: 创建 GitHub 仓库

1. 访问 [GitHub](https://github.com/new)
2. 创建新仓库:
   - **Repository name**: `DBP-Frontend` (或其他名称)
   - **Description**: Debear Party - Frontend Application
   - **Public** (推荐) 或 Private
   - **不要** 初始化 README/gitignore (已有)
3. 点击 "Create repository"

## 步骤 2: 推送代码到 GitHub

在当前目录运行以下命令:

```bash
# 添加远程仓库 (替换为你的 GitHub 用户名)
git remote add origin https://github.com/你的用户名/DBP-Frontend.git

# 重命名分支为 main
git branch -M main

# 推送代码
git push -u origin main
```

## 步骤 3: 在 Zeabur 部署

1. **登录 Zeabur**
   - 访问: https://zeabur.com
   - 使用 GitHub 账号登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择区域 (建议选择离用户最近的)

3. **添加服务**
   - 点击 "Add Service"
   - 选择 "Git"
   - 选择你的 `DBP-Frontend` 仓库
   - 点击 "Deploy"

4. **配置部署**
   - Zeabur 会自动检测到静态站点
   - 无需额外配置,自动使用 `zeabur.json` 配置

5. **绑定域名 (可选)**
   - 点击服务 → "Networking"
   - 可以使用 Zeabur 提供的免费域名
   - 或绑定自定义域名

## 步骤 4: 访问网站

部署完成后:
- ✅ 点击 Zeabur 提供的域名
- ✅ 你的网站已上线!

## 📝 后续更新

每次修改代码后:

```bash
# 添加修改的文件
git add .

# 提交
git commit -m "描述你的修改"

# 推送到 GitHub
git push origin main
```

Zeabur 会**自动检测更新并重新部署**! 🎉

## 🔧 故障排查

### 问题 1: 推送失败
```bash
# 如果遇到网络问题,可以尝试使用 SSH
git remote set-url origin git@github.com:你的用户名/DBP-Frontend.git
```

### 问题 2: 部署失败
- 检查 Zeabur 日志
- 确认 `zeabur.json` 配置正确
- 确认所有文件路径正确(区分大小写)

### 问题 3: 页面 404
- 确认 `index.html` 在根目录
- 检查其他 HTML 文件路径

## 📂 项目文件说明

- `zeabur.json` - Zeabur 部署配置
- `zbpack.json` - Zeabur 构建配置
- `.gitignore` - Git 忽略文件
- `README.md` - 项目说明
- 其他 `.html` - 应用页面

## 🎯 性能优化建议

1. **CDN 加速** - Zeabur 自动提供
2. **图片优化** - 压缩图片文件
3. **代码压缩** - 可选,目前为开发版本

---

**部署愉快! 🚀**
