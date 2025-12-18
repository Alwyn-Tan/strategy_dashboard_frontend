# dma-frontend

DMA 策略看板前端（React），用于展示行情、均线与交易信号，并与 `dma-strategy-backend` 的 API 对接。

> 当前仓库仍保留了部分 Vite 模板示例页面内容（`src/App.tsx`），可在接入业务 UI 时替换。

## 技术栈

- React 19 + TypeScript + Vite
- UI：Ant Design
- 数据请求：Axios
- 服务端状态：@tanstack/react-query
- 图表（MVP）：TradingView `lightweight-charts`（Candlestick + MA + volume + markers）
- CSV 解析：PapaParse

## 本地开发启动

### 1) 安装依赖

```bash
npm install
```

### 2) 启动开发服务器

```bash
npm run dev
```

Vite 默认监听 `0.0.0.0:5173`（见 `vite.config.ts`），浏览器访问 `http://localhost:5173/`。

开发环境已在 `vite.config.ts` 配置代理：`/api` → `http://127.0.0.1:8000`，因此默认不需要额外配置 CORS 或 baseURL。

## 构建与检查

- 构建：`npm run build`
- 预览：`npm run preview`
- Lint：`npm run lint`

## 环境变量（建议）

建议通过 Vite 环境变量配置后端 API 地址，在项目根目录新建 `.env.local`：

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

代码中可通过 `import.meta.env.VITE_API_BASE_URL` 读取并作为 Axios 的 `baseURL`；若未设置则默认走 Vite 代理（相对路径 `/api`）。

## 与后端对接（参考）

后端默认提供 JWT 认证与以下接口（以 `VITE_API_BASE_URL` 为前缀）：

- `POST /api/token/`：获取 access/refresh token
- `POST /api/token/refresh/`：刷新 token
- `GET /api/stock-data/`：行情与均线数据
- `GET /api/signals/`：交易信号

业务请求需携带：

`Authorization: Bearer <access_token>`

## 目录结构

- `src/main.tsx`：应用入口
- `src/App.tsx`：主页面（目前为模板页，可替换为看板）
- `public/`：静态资源
