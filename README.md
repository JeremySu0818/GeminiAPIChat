# GeminiAPIChat

透明、自由、優雅的 AI 聊天室

<img width="2468" height="1756" alt="image" src="https://github.com/user-attachments/assets/a472fa24-437f-4a52-8546-8067c870f2d3" />
![Uploading image.png…]()



---

## 專案理念
GeminiAPIChat 並不是另一個商業化的 AI 客戶端。  
它的核心理念是：

- 拒絕黑箱：程式碼完全開源、透明化  
- 反商業化：不需要綁定信用卡、不被高額訂閱限制  
- 美學設計：採用 Liquid Glass / macOS 風格 UI，讓使用 AI 也能賞心悅目  

---

## 功能特色
- 單一檔案 EXE，雙擊即可使用  
- 內建 FastAPI + 前端 UI，不需外部依賴  
- 內建 API 管理，支援多組金鑰設定  
- 使用滿額度時，自動 Fallback 切換至可用 API  
- 支援對話紀錄、自動快取模型列表  
- 可自由擴充 API Key（支援多帳號轉盤模式）  
- 開源透明，所有程式碼可檢視、可修改  

---

## 安裝與執行

### 方式一：直接下載
前往 [Releases](../../releases) 下載最新的 `GeminiChat.exe`，雙擊即可使用。

### 方式二：從原始碼執行
```bash
# 1. 下載 repo
git clone https://github.com/JeremySu0818/GeminiAPIChat.git
cd GeminiAPIChat

# 2. 安裝依賴
pip install -r requirements.txt

# 3. 啟動後端
python main.py

# 4. 啟動前端（Electron）
npm install
npm start
