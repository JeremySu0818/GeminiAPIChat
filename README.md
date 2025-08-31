# GeminiAPIChat

透明、自由、優雅的 AI 聊天室

<img width="1200" alt="chatroom" src="https://github.com/user-attachments/assets/61b6ee9f-6c25-4427-957c-00a4508513b1" />

---

## 專案理念
GeminiAPIChat 並非另一個商業化的 AI 客戶端，而是一個開源、自由且透明的替代方案。  
核心理念包括：

- **拒絕黑箱**：程式碼完整開源，確保透明化  
- **反商業化**：不需綁定信用卡，避免高額訂閱費用  
- **美學設計**：採用 Liquid Glass / macOS 風格 UI，兼顧功能與美觀  

<img width="1200" alt="login" src="https://github.com/user-attachments/assets/ebbf50b6-6ba3-47cc-9020-04dc10ca3627" />

---

## 功能特色
- 單一檔案 EXE，開箱即用  
- **免額外設定**，內建 API 管理機制  
- **免付費 API**，支援多帳號轉盤模式  
- 當金鑰達到額度上限時，自動 Fallback 切換至可用 API  
- 內建 FastAPI 與前端 UI，無需額外依賴  
- 對話紀錄與模型列表快取，提升使用效率  
- 開源透明，可自由檢視與修改程式碼  
- UI 採用 Liquid Glass / macOS 風格設計  

---

## 安裝與執行

### 方式一：直接下載
前往 [Releases](../../releases) 下載最新版本的 `GeminiChat.exe`，即可直接執行。

### 方式二：從原始碼執行
```bash
# 1. 下載專案
git clone https://github.com/JeremySu0818/GeminiAPIChat.git
cd GeminiAPIChat

# 2. 安裝 Python 依賴
pip install -r requirements.txt

# 3. 啟動後端服務
python main.py

# 4. 啟動前端（Electron）
npm install
npm start
