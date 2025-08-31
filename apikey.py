import logging

API_KEYS = [
    "AIzaSyAUxoqjeFysqgjS7DwRQPTDceW8dS7w6HM",
    "AIzaSyCWm-5Fu2wGzKEME5t1sM67M-LY_aRZeos",
    "AIzaSyBQWJgYZLMScP5izA6v4RKeUpChE7SYQXI",
    "AIzaSyCD6AWXsMsRfC_RwBJvn5yyiI1FYlrjALY",
    "AIzaSyBWtu0iEvKIywnfmkZvT1HMaI7hEjGH9BI",
    "AIzaSyCJICdRGaH1PLkK71YRaX8-OJTuhIBlilk",
    "AIzaSyBcm2vEl80eAEV1ZcM6edm7aiYECojWkok",
    "AIzaSyBW1WQ1EPIqMrRreHx7657w2TEG_EO-Q6A",
    "AIzaSyDU0Rr_GC5RzTW644-jcIl--oXbpXXjwj0",
    "AIzaSyBDFoFt2IIzt1809FEpy4xleqjggl8NVeg",
    "AIzaSyB-HlOTyzeHkjhlXKu1i5Ym_hNpfuB64do",
    "AIzaSyCYX04qOUgK0y8fMTEL5_yPhVbWY5HUeig",
    "AIzaSyAyV3Uv03jrAMqrdafj3nT-dMmAu8snKug",
]

current_index = 0


def get_api_key() -> str:
    """回傳目前使用中的 API Key"""
    return API_KEYS[current_index]


def switch_to_next_key() -> str:
    """當前 API Key 失效時切換到下一個"""
    global current_index
    prev = current_index
    current_index = (current_index + 1) % len(API_KEYS)
    logging.warning(f"API Key 已切換：{prev} ➜ {current_index}")
    return API_KEYS[current_index]


def get_current_index() -> int:
    """回傳目前使用中的 API Key 索引"""
    return current_index


def get_total_keys() -> int:
    """回傳 API Key 的總數量"""
    return len(API_KEYS)
