/* =========================================================
   Gemini Chat 前端腳本（完整版本，無任何省略）
   ---------------------------------------------------------
   • 修正 HTMX target 參數，解決 UI 不刷新問題
   • 新增「雙擊標題重新命名」功能
   • 保持原有複製、動畫、自訂捲軸、textarea 調整等邏輯
   ========================================================= */

let aiGenerating = false; // true = AI 正在回覆


// ====================== 複製訊息 ======================
function copyMessage(buttonElement) {
    const isCodeBlockCopy = buttonElement.classList.contains('code-block-copy-button');
    let textToCopy;
    let messageContentElement;

    if (isCodeBlockCopy) {
        // 程式碼區塊
        messageContentElement = buttonElement.closest('pre').querySelector('code');
        textToCopy = messageContentElement ? messageContentElement.innerText : '';
    } else {
        // 聊天訊息
        const isMessageCopy = buttonElement.classList.contains('message-copy-button');
        if (!isMessageCopy) return;

        const messageDiv = buttonElement.closest('div.message-bubble');
        messageContentElement = messageDiv ? messageDiv.querySelector('.message-content') : null;
        textToCopy = messageContentElement ? messageContentElement.innerText : '';
    }

    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
        const originalSvg = buttonElement.innerHTML;
        const originalAriaLabel = buttonElement.getAttribute('aria-label');

        // ✔ icon
        buttonElement.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white" class="copy-button-icon" style="width: 1rem; height: 1rem;">
                <path d="M20.285 6.708a1 1 0 0 0-1.414-1.416L9 15.167l-3.871-3.87a1 1 0 0 0-1.414 1.414l4.578 4.579a1 1 0 0 0 1.414 0l10.578-10.582z"/>
            </svg>`;
        buttonElement.setAttribute('aria-label', '已複製！');
        buttonElement.classList.add('copied-success-anim');

        const totalDisplayDuration = 1500;
        const fadeOutDuration = 300;
        const fadeOutStartDelay = totalDisplayDuration - fadeOutDuration;

        setTimeout(() => {
            buttonElement.querySelector('.copy-button-icon')?.classList.add('fade-out');
        }, fadeOutStartDelay);

        setTimeout(() => {
            buttonElement.innerHTML = originalSvg;
            buttonElement.setAttribute('aria-label', originalAriaLabel);
            buttonElement.classList.remove('copied-success-anim');
        }, totalDisplayDuration);
    }).catch(err => {
        console.error('複製失敗:', err);
        alert('複製失敗，請手動複製。');
    });
}

// ====================== 訊息動畫初始化 ======================
function initMessageEffects(root = document) {
    const newMessages = root.querySelectorAll('.message-wrapper:not([data-initialized])');

    newMessages.forEach(msgDiv => {
        const innerBubble = msgDiv.querySelector('.message-bubble');
        if (!innerBubble) return;

        if (msgDiv.classList.contains('user-message')) {
            innerBubble.classList.add('animate-slide-in-right');
        } else if (msgDiv.classList.contains('model-message')) {
            innerBubble.classList.add('animate-slide-in-left');
        }
        msgDiv.setAttribute('data-initialized', 'true');
    });
}

// ====================== 自訂捲軸 ======================
const chatBox = document.getElementById('chat-box');
const customScrollbarThumb = document.getElementById('customScrollbarThumb');
const customScrollbarTrack = document.getElementById('customScrollbarTrack');
const customScrollbarContainer = document.getElementById('customScrollbarContainer');

if (!chatBox || !customScrollbarThumb || !customScrollbarTrack || !customScrollbarContainer) {
    console.warn('部分聊天相關元素未找到，自定義捲軸或聊天功能可能無法正常初始化。');
} else {
    let isDragging = false;
    let startY;
    let startScrollTop;

    function updateScrollbar() {
        const contentHeight = chatBox.scrollHeight;
        const visibleHeight = chatBox.clientHeight;
        const scrollRatio = visibleHeight / contentHeight;

        if (scrollRatio >= 1) {
            customScrollbarContainer.style.display = 'none';
            return;
        }
        customScrollbarContainer.style.display = 'block';

        const trackHeight = customScrollbarTrack.clientHeight;
        const thumbHeight = Math.max(visibleHeight * scrollRatio, 30);
        const thumbTravelRange = trackHeight - thumbHeight;
        const scrollableRange = contentHeight - visibleHeight;
        const thumbPosition = (chatBox.scrollTop / scrollableRange) * thumbTravelRange;

        customScrollbarThumb.style.height = `${thumbHeight}px`;
        customScrollbarThumb.style.top = `${thumbPosition}px`;
    }

    chatBox.addEventListener('scroll', updateScrollbar);
    window.addEventListener('resize', updateScrollbar);

    customScrollbarThumb.addEventListener('mousedown', e => {
        isDragging = true;
        startY = e.clientY;
        startScrollTop = chatBox.scrollTop;
        customScrollbarThumb.style.cursor = 'grabbing';
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('mousemove', e => {
        if (!isDragging) return;

        const deltaY = e.clientY - startY;
        const contentHeight = chatBox.scrollHeight;
        const visibleHeight = chatBox.clientHeight;
        const trackHeight = customScrollbarTrack.clientHeight;
        const thumbHeight = customScrollbarThumb.clientHeight;

        const thumbTravelRange = trackHeight - thumbHeight;
        const scrollableRange = contentHeight - visibleHeight;
        const newScrollTop = startScrollTop + (deltaY / thumbTravelRange) * scrollableRange;

        chatBox.scrollTop = newScrollTop;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        customScrollbarThumb.style.cursor = 'grab';
    });

    customScrollbarTrack.addEventListener('click', e => {
        if (e.target === customScrollbarThumb) return;

        const trackRect = customScrollbarTrack.getBoundingClientRect();
        const clickY = e.clientY - trackRect.top;
        const thumbHalfHeight = customScrollbarThumb.clientHeight / 2;

        const contentHeight = chatBox.scrollHeight;
        const visibleHeight = chatBox.clientHeight;
        const trackHeight = customScrollbarTrack.clientHeight;
        const thumbTravelRange = trackHeight - customScrollbarThumb.clientHeight;
        const scrollableRange = contentHeight - visibleHeight;

        let newThumbTop = clickY - thumbHalfHeight;
        newThumbTop = Math.max(0, Math.min(newThumbTop, thumbTravelRange));

        const newScrollTop = (newThumbTop / thumbTravelRange) * scrollableRange;
        chatBox.scrollTo({ top: newScrollTop, behavior: 'smooth' });
    });
}

// ====================== 調整 textarea 高度 ======================
const userInput = document.getElementById('user_input');
if (userInput) {
    function adjustTextareaHeight() {
        userInput.style.height = 'auto';
        const currentScrollHeight = userInput.scrollHeight;
        const maxHeight = 200;

        if (currentScrollHeight > maxHeight) {
            userInput.style.height = `${maxHeight}px`;
            userInput.style.overflowY = 'auto';
        } else {
            userInput.style.height = 'auto';
            userInput.style.overflowY = 'hidden';
        }
    }
    userInput.addEventListener('input', adjustTextareaHeight);
} else {
    console.warn('user_input 元素未找到，自動調整輸入框高度功能可能無法正常初始化。');
}

// ====================== Code block copy buttons ======================
function addCodeBlockCopyButtons() {
    document.querySelectorAll('pre code').forEach(codeBlock => {
        if (codeBlock.querySelector('.copy-button.code-block-copy-button')) return;

        const button = document.createElement('button');
        button.className = 'copy-button code-block-copy-button';
        button.setAttribute('aria-label', '複製程式碼');
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="copy-button-icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
            </svg>`;
        button.addEventListener('click', () => copyMessage(button));
        codeBlock.appendChild(button);
    });
}

// ====================== HTMX 事件處理 ======================
document.body.addEventListener('htmx:afterSwap', () => {
    initMessageEffects(chatBox);
    if (chatBox) chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    if (typeof updateScrollbar === 'function') updateScrollbar();
    hljs.highlightAll();
    addCodeBlockCopyButtons();
    if (userInput) {
        userInput.value = '';
        userInput.style.height = 'auto';
        userInput.style.overflowY = 'hidden';
        userInput.focus();
        adjustTextareaHeight();
    }
});

document.body.addEventListener('htmx:beforeRequest', e => {
    if (e.target.id === 'chat-form') aiGenerating = true;
});
document.body.addEventListener('htmx:afterSwap', e => {
    if (e.target.id === 'chat-box') aiGenerating = false;
});

// ====================== 初始載入 ======================
window.onload = () => {
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    initMessageEffects();
    if (typeof updateScrollbar === 'function') updateScrollbar();
    if (userInput) adjustTextareaHeight();
    hljs.highlightAll();
    addCodeBlockCopyButtons();
};

// ====================== Modal 與系統按鍵 ======================
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutBtn');
    const resetButton = document.getElementById('resetBtn');
    const confirmResetBtn = document.getElementById('confirmResetBtn');
    const cancelResetBtn = document.getElementById('cancelResetBtn');
    const closeGeneratingBtn = document.getElementById('closeGeneratingBtn');

    const customConfirmModal = document.getElementById('customConfirmModal');
    const generatingModal = document.getElementById('generatingModal');

    logoutButton?.addEventListener('click', () => window.location.href = '/logout');
    resetButton?.addEventListener('click', () => customConfirmModal.style.display = 'flex');
    confirmResetBtn?.addEventListener('click', () => {
        window.location.href = '/reset';
        customConfirmModal.style.display = 'none';
    });
    cancelResetBtn?.addEventListener('click', () => customConfirmModal.style.display = 'none');
    closeGeneratingBtn?.addEventListener('click', () => generatingModal.style.display = 'none');

    customConfirmModal?.addEventListener('click', e => {
        if (e.target === customConfirmModal) customConfirmModal.style.display = 'none';
    });
    generatingModal?.addEventListener('click', e => {
        if (e.target === generatingModal) generatingModal.style.display = 'none';
    });

    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        if (customConfirmModal?.style.display === 'flex') customConfirmModal.style.display = 'none';
        if (generatingModal?.style.display === 'flex') generatingModal.style.display = 'none';
    });
});

// ====================== 送出表單時阻擋重複輸入 ======================
const chatForm = document.getElementById('chat-form');
chatForm?.addEventListener('submit', e => {
    if (aiGenerating) {
        e.preventDefault();
        document.getElementById('generatingModal').style.display = 'flex';
    }
});
document.getElementById('closeGeneratingBtn')?.addEventListener('click', () => {
    document.getElementById('generatingModal').style.display = 'none';
});

// ====================== Sidebar toggle & conversation switch ======================
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleSidebar');
toggleBtn && sidebar && toggleBtn.addEventListener('click', () => sidebar.classList.toggle('collapsed'));

// ====================== 建立新對話 ======================
// 使用事件代理來處理動態加載的按鈕
document.body.addEventListener('click', async e => {
    const newConvBtn = e.target.closest('#newConvBtn');
    if (!newConvBtn) return;
    e.preventDefault();
    const cid = await (await fetch('/conversation', { method: 'POST' })).text();
    htmx.ajax('GET', '/conversations', { target: '#conversationList' });
    htmx.ajax('GET', `/conversation/${cid}`, { target: '#chat-box' });
});

// ====================== 刪除對話功能：改用自訂彈出視窗 ======================
document.body.addEventListener('click', function (e) {
    const deleteBtn = e.target.closest('.delete-button');
    if (!deleteBtn) return;

    e.preventDefault();
    e.stopPropagation(); // 阻止事件冒泡到父層 li

    const convItem = deleteBtn.closest('.conv-item');
    if (!convItem) return;
    const cid = convItem.dataset.cid;

    const deleteModal = document.getElementById('deleteConfirmModal');
    if (deleteModal) {
        deleteModal.style.display = 'flex';
        deleteModal.dataset.cid = cid;
    }
});

const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', function () {
        const deleteModal = document.getElementById('deleteConfirmModal');
        const cid = deleteModal.dataset.cid;
        if (!cid) {
            console.error('未找到對話 ID。');
            return;
        }

        const convItem = document.querySelector(`[data-cid="${cid}"]`);
        if (!convItem) {
            console.error('未找到對應的對話項目。');
            return;
        }

        // 使用 HTMX 發送刪除請求
        htmx.ajax('DELETE', '/conversation/' + cid, {
            swap: 'outerHTML',
            target: convItem
        }).then(() => {
            // 請求成功後，首先隱藏刪除彈窗
            if (deleteModal) {
                deleteModal.style.display = 'none';
            }
            location.reload();
        }).catch(err => {
            console.error('刪除對話失敗:', err);
            alert('刪除對話失敗，請稍後再試。');
        });
    });
}

const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', function () {
        const deleteModal = document.getElementById('deleteConfirmModal');
        if (deleteModal) {
            deleteModal.style.display = 'none';
        }
    });
}


// ====================== 自訂模態視窗 (重新命名) ======================
document.addEventListener('DOMContentLoaded', () => {
    // 獲取所有需要的 DOM 元素
    const renameModal = document.getElementById('renameModal');
    const renameInput = document.getElementById('renameInput');
    const confirmRenameBtn = document.getElementById('confirmRenameBtn');
    const cancelRenameBtn = document.getElementById('cancelRenameBtn');

    let currentConversationId = null;
    let currentTitleSpan = null;

    // 處理點擊重新命名按鈕的事件
    document.addEventListener('click', (e) => {
        const renameButton = e.target.closest('.rename-button');
        if (renameButton) {
            e.stopPropagation(); // 防止事件冒泡到父層 li
            const listItem = renameButton.closest('.conv-item');
            currentConversationId = listItem.dataset.cid;
            currentTitleSpan = listItem.querySelector('.conv-title');
            const currentTitle = currentTitleSpan.textContent;

            // 顯示模態視窗並預填舊標題
            renameInput.value = currentTitle;
            renameModal.style.display = 'flex';
            renameInput.focus();
        }
    });

    // 處理對話列表項目點擊事件
    document.addEventListener('click', (e) => {
        const convItem = e.target.closest('.conv-item');
        if (convItem && !e.target.closest('.action-button')) {
            const cid = convItem.dataset.cid;
            htmx.ajax('GET', `/conversation/${cid}`, { target: '#chat-box' });
        }
    });

    // 取消按鈕邏輯
    cancelRenameBtn.addEventListener('click', () => {
        renameModal.style.display = 'none';
    });

    // 確定按鈕邏輯
    confirmRenameBtn.addEventListener('click', () => {
        const newTitle = renameInput.value.trim();
        if (newTitle && currentConversationId) {
            // 使用 HTMX 發送 POST 請求來更新標題
            htmx.ajax('POST', `/rename_conversation/${currentConversationId}`, {
                headers: { 'Content-Type': 'application/json' },
                source: confirmRenameBtn,
                values: { new_title: newTitle },
                handler: (data) => {
                    // 伺服器回傳成功後更新 UI
                    if (currentTitleSpan) {
                        typewriterEffect(currentTitleSpan, newTitle);
                    }
                }
            }).then(() => {
                renameModal.style.display = 'none';
            }).catch(error => {
                console.error('重新命名失敗:', error);
                alert('重新命名失敗，請重試。');
                renameModal.style.display = 'none';
            });
        }
    });

    // Enter 鍵觸發確定按鈕
    renameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            confirmRenameBtn.click();
        }
    });
});


// ====================== 首次載入時標記 active 對話 ======================
function initSidebarActiveState() {
    const currentCid = document.body.dataset.currentCid;
    if (!currentCid) return;
    const activeLi = document.querySelector(`[data-cid="${currentCid}"]`);
    activeLi?.classList.add('active');
}
initSidebarActiveState();

// --- 新增：HTMX 請求後更新對話標題 ---
document.body.addEventListener('htmx:afterRequest', (e) => {
    if (e.detail.requestConfig.path === '/chat') {
        const raw = e.detail.xhr.getResponseHeader('X-New-Conversation-Title');
        if (raw) {
            // decode percent‑encoded 標題
            const newTitle = decodeURIComponent(raw);
            const cid = document.getElementById('chat-form')
                .querySelector('input[name="conversation_id"]').value;
            const titleSpan = document.querySelector(`[data-cid="${cid}"] .conv-title`);

            // 在這裡呼叫逐字稿函式
            if (titleSpan) {
                setTimeout(() => {
                    typewriterEffect(titleSpan, newTitle);
                }, 1000); // 1000 毫秒 = 1 秒

            }
        }
    }
});

// 新增逐字稿效果函式
function typewriterEffect(element, text, delay = 50) {
    let i = 0;
    // 先清空原本的文字
    element.textContent = '';
    const interval = setInterval(() => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
        } else {
            // 逐字稿完成後清除定時器
            clearInterval(interval);
        }
    }, delay);
}

// ====================== 側邊欄切換功能 ======================
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const appShell = document.querySelector('.app-shell');

if (toggleSidebarBtn && appShell && sidebar) {
    toggleSidebarBtn.addEventListener('click', () => {
        appShell.classList.toggle('collapsed');
    });
}
// ====================== 自製捲軸（側欄對話列表） ======================
(function initSidebarScrollbarFactory() {
    const container = document.getElementById('sidebarScrollbarContainer');
    const track = document.getElementById('sidebarScrollbarTrack');
    const thumb = document.getElementById('sidebarScrollbarThumb');

    let listEl = null;
    let dragging = false;
    let startY = 0;
    let startScrollTop = 0;

    function findList() {
        listEl = document.querySelector('#conversationList .conversation-list');
        return !!listEl;
    }

    function updateSidebarScrollbar() {
        if (!listEl || !container || !track || !thumb) return;

        const contentHeight = listEl.scrollHeight;
        const visibleHeight = listEl.clientHeight;
        const ratio = visibleHeight / contentHeight;

        if (ratio >= 1) {
            container.style.display = 'none';
            return;
        }
        container.style.display = 'block';

        const trackHeight = track.clientHeight;
        const thumbHeight = Math.max(visibleHeight * ratio, 30);
        const thumbTravelRange = trackHeight - thumbHeight;
        const scrollableRange = contentHeight - visibleHeight;
        const thumbTop = (listEl.scrollTop / scrollableRange) * thumbTravelRange;

        thumb.style.height = `${thumbHeight}px`;
        thumb.style.top = `${thumbTop}px`;
    }

    function onScroll() { updateSidebarScrollbar(); }
    function onResize() { updateSidebarScrollbar(); }

    function bindSidebarScrollbar() {
        if (!findList()) return;

        listEl.addEventListener('scroll', onScroll);
        window.addEventListener('resize', onResize);

        thumb.addEventListener('mousedown', (e) => {
            dragging = true;
            startY = e.clientY;
            startScrollTop = listEl.scrollTop;
            thumb.style.cursor = 'grabbing';
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('mousemove', (e) => {
            if (!dragging) return;

            const deltaY = e.clientY - startY;
            const contentHeight = listEl.scrollHeight;
            const visibleHeight = listEl.clientHeight;

            const trackHeight = track.clientHeight;
            const currentThumbHeight = thumb.clientHeight;
            const thumbTravelRange = trackHeight - currentThumbHeight;
            const scrollableRange = contentHeight - visibleHeight;

            const newScrollTop = startScrollTop + (deltaY / thumbTravelRange) * scrollableRange;
            listEl.scrollTop = newScrollTop;
        });

        document.addEventListener('mouseup', () => {
            dragging = false;
            thumb.style.cursor = 'grab';
        });

        track.addEventListener('click', (e) => {
            if (e.target === thumb) return;

            const rect = track.getBoundingClientRect();
            const clickY = e.clientY - rect.top;
            const thumbHalf = thumb.clientHeight / 2;

            const trackHeight = track.clientHeight;
            const maxThumbTop = trackHeight - thumb.clientHeight;
            let newThumbTop = clickY - thumbHalf;
            newThumbTop = Math.max(0, Math.min(newThumbTop, maxThumbTop));

            const contentHeight = listEl.scrollHeight;
            const visibleHeight = listEl.clientHeight;
            const scrollableRange = contentHeight - visibleHeight;

            const newScrollTop = (newThumbTop / maxThumbTop) * scrollableRange;
            listEl.scrollTo({ top: newScrollTop, behavior: 'smooth' });
        });

        updateSidebarScrollbar();
    }

    // 初次載入（HTMX 會在 onload 時把對話列表塞進 #conversationList）
    document.addEventListener('DOMContentLoaded', bindSidebarScrollbar);

    // 列表被 HTMX 重新渲染後，重綁與更新
    document.body.addEventListener('htmx:afterSwap', (e) => {
        if (e.target && e.target.id === 'conversationList') {
            if (listEl) listEl.removeEventListener('scroll', onScroll); // 清舊 listener
            listEl = null;
            bindSidebarScrollbar();
        }
        // 新增 / 刪除對話後也更新
        if (e.target && (e.target.id === 'conversationList' || e.target.id === 'chat-box')) {
            updateSidebarScrollbar();
        }
    });
})();