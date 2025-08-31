import os
import sqlite3
from datetime import datetime

# ================== 路徑設定 ==================
# 使用者家目錄 (自動抓 C:\Users\<username>\)
USER_HOME = os.path.expanduser("~")

# 在使用者家目錄下建立 GeminiChat 資料夾
APP_DIR = os.path.join(USER_HOME, "GeminiChat")
os.makedirs(APP_DIR, exist_ok=True)

# DB 檔案路徑
DB_PATH = os.path.join(APP_DIR, "chat_data.db")
# =================================================


def init_db():
    """初始化資料庫，建立 users / conversations / messages 表格（如果不存在）。"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 使用者表
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL
        )
        """
    )

    # 會話表
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )

    # 訊息表
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            text TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            FOREIGN KEY(conversation_id) REFERENCES conversations(id)
        )
        """
    )
    conn.commit()
    conn.close()


# ----------------- user helpers -----------------


def get_or_create_user(username: str) -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    if row:
        uid = row[0]
    else:
        cursor.execute("INSERT INTO users (username) VALUES (?)", (username,))
        uid = cursor.lastrowid
        conn.commit()
    conn.close()
    return uid


# ----------------- conversation helpers -----------------


def create_conversation(user_id: int, title: str) -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    ts = datetime.utcnow().isoformat()
    cursor.execute(
        "INSERT INTO conversations (user_id, title, created_at) VALUES (?, ?, ?)",
        (user_id, title, ts),
    )
    cid = cursor.lastrowid
    conn.commit()
    conn.close()
    return cid


def load_conversations(user_id: int, offset: int = 0, limit: int = 20) -> list[dict]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, title, created_at
        FROM conversations WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
        """,
        (user_id, limit, offset),
    )
    rows = cursor.fetchall()
    conn.close()
    return [{"id": cid, "title": title, "created_at": ts} for cid, title, ts in rows]


def get_conversation(cid: int) -> dict | None:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, title, created_at FROM conversations WHERE id = ?", (cid,)
    )
    row = cursor.fetchone()
    conn.close()
    if row:
        return {"id": row[0], "title": row[1], "created_at": row[2]}
    return None


# ----------------- message helpers -----------------


def save_message(conversation_id: int, role: str, text: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    ts = datetime.utcnow().isoformat()
    cursor.execute(
        "INSERT INTO messages (conversation_id, role, text, timestamp) VALUES (?, ?, ?, ?)",
        (conversation_id, role, text, ts),
    )
    conn.commit()
    conn.close()


def load_messages(
    conversation_id: int, before_ts: str | None = None, limit: int = 50
) -> list[dict]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    if before_ts:
        cursor.execute(
            """
            SELECT role, text, timestamp
            FROM messages
            WHERE conversation_id = ? AND timestamp < ?
            ORDER BY timestamp DESC
            LIMIT ?
            """,
            (conversation_id, before_ts, limit),
        )
    else:
        cursor.execute(
            """
            SELECT role, text, timestamp
            FROM messages
            WHERE conversation_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
            """,
            (conversation_id, limit),
        )
    rows = cursor.fetchall()
    conn.close()
    return [
        {"role": role, "text": text, "timestamp": ts}
        for role, text, ts in reversed(rows)
    ]


def delete_user_messages(user_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM conversations WHERE user_id = ?", (user_id,))
    conv_ids = [row[0] for row in cursor.fetchall()]

    if conv_ids:
        cursor.execute(
            f"DELETE FROM messages WHERE conversation_id IN ({','.join('?'*len(conv_ids))})",
            conv_ids,
        )
        cursor.execute("DELETE FROM conversations WHERE user_id = ?", (user_id,))

    conn.commit()
    conn.close()


def update_conversation_title(cid: int, new_title: str) -> None:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("UPDATE conversations SET title = ? WHERE id = ?", (new_title, cid))
    conn.commit()
    conn.close()


def delete_conversation(cid: int) -> None:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("DELETE FROM messages       WHERE conversation_id = ?", (cid,))
    cur.execute("DELETE FROM conversations  WHERE id = ?", (cid,))
    conn.commit()
    conn.close()


import os
import sqlite3
from datetime import datetime

# ================== 路徑設定 ==================
# 使用者家目錄 (自動抓 C:\Users\<username>\)
USER_HOME = os.path.expanduser("~")

# 在使用者家目錄下建立 GeminiChat 資料夾
APP_DIR = os.path.join(USER_HOME, "GeminiChat")
os.makedirs(APP_DIR, exist_ok=True)

# DB 檔案路徑
DB_PATH = os.path.join(APP_DIR, "chat_data.db")
# =================================================


def init_db():
    """初始化資料庫，建立 users / conversations / messages 表格（如果不存在）。"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 使用者表
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL
        )
        """
    )

    # 會話表
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )

    # 訊息表
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            text TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            FOREIGN KEY(conversation_id) REFERENCES conversations(id)
        )
        """
    )
    conn.commit()
    conn.close()


# ----------------- user helpers -----------------


def get_or_create_user(username: str) -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    if row:
        uid = row[0]
    else:
        cursor.execute("INSERT INTO users (username) VALUES (?)", (username,))
        uid = cursor.lastrowid
        conn.commit()
    conn.close()
    return uid


# ----------------- conversation helpers -----------------


def create_conversation(user_id: int, title: str) -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    ts = datetime.utcnow().isoformat()
    cursor.execute(
        "INSERT INTO conversations (user_id, title, created_at) VALUES (?, ?, ?)",
        (user_id, title, ts),
    )
    cid = cursor.lastrowid
    conn.commit()
    conn.close()
    return cid


def load_conversations(user_id: int, offset: int = 0, limit: int = 20) -> list[dict]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, title, created_at
        FROM conversations WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
        """,
        (user_id, limit, offset),
    )
    rows = cursor.fetchall()
    conn.close()
    return [{"id": cid, "title": title, "created_at": ts} for cid, title, ts in rows]


def get_conversation(cid: int) -> dict | None:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, title, created_at FROM conversations WHERE id = ?", (cid,)
    )
    row = cursor.fetchone()
    conn.close()
    if row:
        return {"id": row[0], "title": row[1], "created_at": row[2]}
    return None


# ----------------- message helpers -----------------


def save_message(conversation_id: int, role: str, text: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    ts = datetime.utcnow().isoformat()
    cursor.execute(
        "INSERT INTO messages (conversation_id, role, text, timestamp) VALUES (?, ?, ?, ?)",
        (conversation_id, role, text, ts),
    )
    conn.commit()
    conn.close()


def load_messages(
    conversation_id: int, before_ts: str | None = None, limit: int = 50
) -> list[dict]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    if before_ts:
        cursor.execute(
            """
            SELECT role, text, timestamp
            FROM messages
            WHERE conversation_id = ? AND timestamp < ?
            ORDER BY timestamp DESC
            LIMIT ?
            """,
            (conversation_id, before_ts, limit),
        )
    else:
        cursor.execute(
            """
            SELECT role, text, timestamp
            FROM messages
            WHERE conversation_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
            """,
            (conversation_id, limit),
        )
    rows = cursor.fetchall()
    conn.close()
    return [
        {"role": role, "text": text, "timestamp": ts}
        for role, text, ts in reversed(rows)
    ]


def delete_user_messages(user_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM conversations WHERE user_id = ?", (user_id,))
    conv_ids = [row[0] for row in cursor.fetchall()]

    if conv_ids:
        cursor.execute(
            f"DELETE FROM messages WHERE conversation_id IN ({','.join('?'*len(conv_ids))})",
            conv_ids,
        )
        cursor.execute("DELETE FROM conversations WHERE user_id = ?", (user_id,))

    conn.commit()
    conn.close()


def update_conversation_title(cid: int, new_title: str) -> None:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("UPDATE conversations SET title = ? WHERE id = ?", (new_title, cid))
    conn.commit()
    conn.close()


def delete_conversation(cid: int) -> None:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("DELETE FROM messages       WHERE conversation_id = ?", (cid,))
    cur.execute("DELETE FROM conversations  WHERE id = ?", (cid,))
    conn.commit()
    conn.close()