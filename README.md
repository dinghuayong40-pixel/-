# 传统俄罗斯方块

一个纯前端的传统俄罗斯方块小游戏，支持桌面键盘和手机触控按钮，可以直接部署到 GitHub Pages。

## 本地运行

在项目目录执行：

```bash
python3 -m http.server 8000
```

然后打开 `http://127.0.0.1:8000/`。

## 操作说明

- 电脑：`←` `→` 移动，`↑` 旋转，`↓` 加速下落，`空格` 直接落底，`P` 暂停
- 手机：使用页面上的触控按钮操作

## GitHub Pages 部署

项目已经包含 GitHub Actions 工作流：[`.github/workflows/deploy-pages.yml`](file:///Users/bytedance/Documents/trae_projects/.github/workflows/deploy-pages.yml)

你只需要：

1. 在 GitHub 新建一个仓库
2. 把当前目录推送到仓库
3. 进入仓库 `Settings` -> `Pages`
4. 在 `Source` 里选择 `GitHub Actions`
5. 推送到 `main` 或 `master` 分支后，Actions 会自动发布

发布完成后，访问地址通常是：

```text
https://<你的用户名>.github.io/<仓库名>/
```

## 推送示例

把下面的 `<你的仓库地址>` 替换成自己的 GitHub 仓库地址：

```bash
git add .
git commit -m "feat: add tetris game"
git branch -M main
git remote add origin <你的仓库地址>
git push -u origin main
```
