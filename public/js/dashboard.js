document.addEventListener('DOMContentLoaded', () => {
    // Check auth
    const userData = localStorage.getItem('user');
    let user = JSON.parse(userData || '{}');
    if (user.name) document.getElementById('current-username').textContent = user.name;
    const headerAvatar = document.getElementById('header-avatar');
    if (user.avatarUrl && headerAvatar) {
        headerAvatar.src = user.avatarUrl;
        headerAvatar.style.display = 'inline-block';
    }

    // Verify auth with server
    const checkAuth = async () => {
        try {
            const response = await fetch('./api/auth/me');
            const data = await response.json();
            console.log('the data', data);
            if (data.success && data.user) {
                user = data.user;
                document.getElementById('current-username').textContent = user.name;
                if (user.avatarUrl && headerAvatar) {
                    headerAvatar.src = user.avatarUrl;
                    headerAvatar.style.display = 'inline-block';
                }
                localStorage.setItem('user', JSON.stringify(user));
            } else {
                throw new Error('Not authenticated');
            }
        } catch (err) {
            localStorage.removeItem('user');
            window.location.replace('./index.html');
        }
    };
    checkAuth();

    // Custom Popup Logic
    window.showCustomPopup = (title, message, isConfirm = false, icon = '⚠️') => {
        return new Promise((resolve) => {
            const popupModal = document.getElementById('custom-popup-modal');
            document.getElementById('custom-popup-title').textContent = title;
            document.getElementById('custom-popup-message').textContent = message;
            document.getElementById('popup-icon').textContent = icon;

            const cancelBtn = document.getElementById('custom-popup-cancel');
            const confirmBtn = document.getElementById('custom-popup-confirm');

            cancelBtn.style.display = isConfirm ? 'block' : 'none';
            popupModal.classList.remove('hidden');

            const handleConfirm = () => {
                cleanup();
                resolve(true);
            };
            const handleCancel = () => {
                cleanup();
                resolve(false);
            };
            const cleanup = () => {
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
                popupModal.classList.add('hidden');
            };

            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
        });
    };

    // Logout
    document.getElementById('logout-btn').addEventListener('click', async () => {
        const confirmed = await window.showCustomPopup('Logout', 'Are you sure you want to disconnect from SpaceVote?', true, '🚪');
        if (!confirmed) return;

        try {
            await fetch('./api/auth/logout', { method: 'POST' });
        } catch (err) {
            console.error('Logout failed:', err);
        }
        localStorage.removeItem('user');
        window.location.replace('./index.html');
    });

    // Global helper: download a cross-origin file via fetch → Blob → temporary <a> click
    // This bypasses the browser restriction where the HTML `download` attribute is ignored
    // for cross-origin URLs (Cloudinary is cross-origin).
    window.downloadChatFile = async (url, fileName) => {
        try {
            // Use our backend proxy to avoid CORS issues on raw/pdf Cloudinary resources
            const proxyUrl = `./api/proxy-download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(fileName)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        } catch (err) {
            console.error('Download failed:', err);
            // Fallback: open in new tab
            window.open(url, '_blank');
        }
    };

    // Socket Connection
    const socket = io();

    // State
    let currentPoll = null;
    let typingTimeout = null;

    // DOM Elements
    const pollQuestion = document.getElementById('poll-question');
    const pollOptionsContainer = document.getElementById('poll-options');
    const totalVotesCount = document.getElementById('total-votes-count');

    // Poll Selection & Creation Elements
    const pollPaginationBox = document.getElementById('poll-pagination');
    const navCreatePollBtn = document.getElementById('nav-create-poll-btn');
    const editPollBtn = document.getElementById('edit-poll-btn');
    const deletePollBtn = document.getElementById('delete-poll-btn');

    // Edit Poll Modal Elements
    const editPollModal = document.getElementById('edit-poll-modal');
    const closeEditPollBtn = document.getElementById('close-edit-poll-btn');
    const editPollQuestionInput = document.getElementById('edit-poll-question');
    const editPollOptionsContainer = document.getElementById('edit-poll-options');
    const editAddOptionBtn = document.getElementById('edit-add-option-btn');
    const saveEditPollBtn = document.getElementById('save-edit-poll-btn');

    // Modal Elements
    const createPollModal = document.getElementById('create-poll-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const addOptionBtn = document.getElementById('add-option-btn');
    const submitPollBtn = document.getElementById('submit-poll-btn');
    const newPollOptionsContainer = document.getElementById('new-poll-options');
    const newPollQuestionInput = document.getElementById('new-poll-question');

    const profileBtn = document.getElementById('profile-btn');
    const profileModal = document.getElementById('profile-modal');
    const closeProfileBtn = document.getElementById('close-profile-btn');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const profileNameInput = document.getElementById('profile-name-input');

    const profileAvatarPreview = document.getElementById('profile-avatar-preview');
    const avatarPreviewContainer = document.getElementById('avatar-preview-container');
    const profileAvatarUpload = document.getElementById('profile-avatar-upload');
    const cropperWrapper = document.getElementById('cropper-wrapper');
    const cropperImage = document.getElementById('cropper-image');

    let cropperInstance = null;

    let allPolls = [];

    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const typingIndicator = document.getElementById('typing-indicator');
    const chatFileInput = document.getElementById('chat-file-input');
    const chatAttachBtn = document.getElementById('chat-attach-btn');
    const chatFilePreview = document.getElementById('chat-file-preview');
    const chatFilePreviewName = document.getElementById('chat-file-preview-name');
    const chatFileRemoveBtn = document.getElementById('chat-file-remove-btn');

    let pendingFile = null; // { fileUrl, fileName, fileType }

    // Helper Functions
    const toastContainer = document.getElementById('toast-container');
    const muteBtn = document.getElementById('mute-btn');

    let isMuted = localStorage.getItem('notificationsMuted') === 'true';

    const updateMuteIcon = () => {
        if (muteBtn) {
            muteBtn.textContent = isMuted ? '🔕' : '🔔';
        }
    };
    updateMuteIcon();

    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            isMuted = !isMuted;
            localStorage.setItem('notificationsMuted', isMuted);
            updateMuteIcon();
            showToast(isMuted ? 'Notifications muted' : 'Notifications unmuted', true);
        });
    }

    const showToast = (message, force = false) => {
        if (!toastContainer) return;
        if (isMuted && !force) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <span class="toast-icon">🛎️</span>
            <span>${message}</span>
        `;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3000);
    };

    const renderPoll = (poll) => {
        if (!poll) return;
        currentPoll = poll;
        pollQuestion.textContent = poll.question;
        pollOptionsContainer.innerHTML = '';

        // Calculate total votes
        const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
        totalVotesCount.textContent = totalVotes;

        poll.options.forEach(option => {
            const optionEl = document.createElement('div');
            // Ensure ID comparison works (string vs potentially objectID)
            const userIdStr = user.id || user._id;

            let hasVotedForThis = false;
            let hasVotedForAny = false;

            if (poll.userVotes) {
                const userVote = poll.userVotes.find(v => v.userId === userIdStr);
                if (userVote) {
                    hasVotedForAny = true;
                    if (userVote.optionId === option.id) {
                        hasVotedForThis = true;
                    }
                }
            } else if (poll.votedUserIds) {
                hasVotedForAny = poll.votedUserIds.some(id => id.toString() === userIdStr);
            }

            optionEl.className = `poll-option ${hasVotedForThis ? 'voted' : ''}`;

            const percentage = totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);

            optionEl.innerHTML = `
        <div class="poll-option-fill" style="width: ${percentage}%"></div>
        <div class="poll-option-text">${option.text}</div>
        <div class="poll-option-stats">${option.votes} votes (${percentage}%) ${hasVotedForThis ? '✓' : ''}</div>
      `;

            // Always allow click: it's up to the server to handle toggle/switch logic
            optionEl.addEventListener('click', () => {
                socket.emit('vote', { pollId: poll.id, optionId: option.id, userId: userIdStr });
            });

            pollOptionsContainer.appendChild(optionEl);
        });
    };

    const createMessageElement = (msg) => {
        const userIdStr = user.id || user._id;
        const isSelf = msg.userId === userIdStr;
        const msgEl = document.createElement('div');
        msgEl.className = `message ${isSelf ? 'self' : 'other'}`;
        msgEl.dataset.id = msg.id;

        const timestamp = msg.timestamp || msg.createdAt;
        const timeString = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.name || msg.username || 'Anonymous')}&background=random`;
        let avatarImage = msg.avatarUrl || defaultAvatar;
        if (avatarImage.includes('boringavatars')) {
            avatarImage = defaultAvatar;
        }

        const msgTimeMs = timestamp ? new Date(timestamp).getTime() : Date.now();
        const isEditable = (Date.now() - msgTimeMs) < (15 * 60 * 1000);

        let controlsHTML = '';
        if (isSelf) {
            controlsHTML = `
                <div class="message-actions">
                    <button class="message-actions-trigger" title="Message Options">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div class="dropdown-menu">
                        <button class="dropdown-item copy-btn">Copy</button>
                        ${isEditable ? '<button class="dropdown-item edit-btn">Edit</button>' : ''}
                        <button class="dropdown-item delete-btn" style="color: #ef4444;">Delete</button>
                    </div>
                </div>
            `;
        } else {
            controlsHTML = `
                <div class="message-actions">
                    <button class="message-actions-trigger" title="Message Options">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div class="dropdown-menu">
                        <button class="dropdown-item copy-btn">Copy</button>
                    </div>
                </div>
            `;
        }

        msgEl.innerHTML = `
      <div class="message-meta" style="display: flex; align-items: center; gap: 8px;">
        ${!isSelf ? `<img src="${avatarImage}" class="chat-avatar" alt="Avatar" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.1);">` : ''}
        ${!isSelf ? `<span class="sender-name">${msg.name || msg.username || 'Anonymous'}</span><span style="opacity: 0.5;">•</span>` : ''}
        <span class="timestamp">${timeString}</span>
      </div>
      <div class="message-bubble">${msg.text ? msg.text : ''}
        ${msg.fileUrl && msg.fileType && msg.fileType.startsWith('image/') ? `
          <div style="margin-top:${msg.text ? '8px' : '0'};">
            <img src="${msg.fileUrl}" alt="${msg.fileName || 'image'}" style="max-width:220px; max-height:220px; border-radius:10px; display:block; cursor:pointer;" onclick="window.open('${msg.fileUrl}','_blank')">
          </div>
        ` : msg.fileUrl ? `
          <div style="margin-top:${msg.text ? '8px' : '0'}; display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.07); border-radius:10px; padding:10px 14px; border:1px solid rgba(255,255,255,0.12);">
            <span style="font-size:1.4rem;">📄</span>
            <div style="flex:1; min-width:0;">
              <div style="font-size:0.85rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${msg.fileName || 'File'}</div>
              <div style="font-size:0.75rem; color:#94a3b8;">${msg.fileType || ''}</div>
            </div>
            <button onclick="window.downloadChatFile('${msg.fileUrl}','${(msg.fileName || 'file').replace(/'/g, '&apos;')}')" style="background:none; border:1px solid rgba(99,102,241,0.5); border-radius:6px; color:var(--secondary); font-size:0.8rem; padding:4px 10px; cursor:pointer; white-space:nowrap;">⬇ Download</button>
          </div>
        ` : ''}
        ${controlsHTML}
      </div>
    `;

        const trigger = msgEl.querySelector('.message-actions-trigger');
        const dropdown = msgEl.querySelector('.dropdown-menu');
        if (trigger && dropdown) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    if (menu !== dropdown) menu.classList.remove('show');
                });
                dropdown.classList.toggle('show');
            });
        }

        const copyBtn = msgEl.querySelector('.copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(msg.text).then(() => {
                    dropdown.classList.remove('show');
                    showToast('Message text copied!');
                });
            });
        }

        if (isSelf) {
            const editBtn = msgEl.querySelector('.edit-btn');
            const deleteBtn = msgEl.querySelector('.delete-btn');
            const bubble = msgEl.querySelector('.message-bubble');

            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.remove('show');
                    const currentText = msg.text;
                    bubble.innerHTML = `
                        <textarea class="edit-chat-input" rows="3" style="width: 100%; background: transparent; color: inherit; border: none; outline: none; resize: none; font-family: inherit; font-size: inherit;">${currentText}</textarea>
                        <div style="font-size: 0.75rem; opacity: 0.7; margin-top: 5px; text-align: right;">Press Enter to save, Esc to cancel</div>
                    `;
                    const input = bubble.querySelector('textarea');
                    input.focus();
                    input.setSelectionRange(input.value.length, input.value.length);

                    input.addEventListener('keydown', (submitEvent) => {
                        if (submitEvent.key === 'Enter' && !submitEvent.shiftKey) {
                            submitEvent.preventDefault();
                            const newText = input.value.trim();
                            if (newText && newText !== currentText) {
                                socket.emit('editMessage', { msgId: msg.id, userId: userIdStr, newText });
                            } else {
                                bubble.innerHTML = `${currentText}${controlsHTML}`;
                                socket.emit('editMessage', { msgId: msg.id, userId: userIdStr, newText: currentText });
                            }
                        } else if (submitEvent.key === 'Escape') {
                            bubble.innerHTML = `${currentText}${controlsHTML}`;
                            socket.emit('editMessage', { msgId: msg.id, userId: userIdStr, newText: currentText });
                        }
                    });
                });
            }

            if (deleteBtn) {
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    dropdown.classList.remove('show');
                    const confirmed = await window.showCustomPopup('Delete Message', 'Are you sure you want to permanently delete this message?', true, '🗑️');
                    if (confirmed) {
                        socket.emit('deleteMessage', { msgId: msg.id, userId: userIdStr });
                    }
                });
            }
        }

        return msgEl;
    };

    const scrollToBottom = () => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    // Global click listener to close dropdowns
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.remove('show'));
    });

    // Socket Events
    socket.on('initialData', (data) => {
        if (data.polls && data.polls.length > 0) {
            allPolls = data.polls;
            updatePollPagination();

            // Select newest poll by default
            const newestPoll = data.polls[data.polls.length - 1];
            renderPoll(newestPoll);
            highlightActivePagination(newestPoll.id);
        } else {
            pollQuestion.innerHTML = '<span style="color: #94a3b8; font-weight: 500;">Polls not yet created</span>';
            pollOptionsContainer.innerHTML = '';
            totalVotesCount.textContent = '0';

            if (user.email === 'admin@gmail.com') {
                const addBtn = document.createElement('button');
                addBtn.className = 'btn primary-btn';
                addBtn.textContent = '+ Create First Poll';
                addBtn.style.marginTop = '20px';
                addBtn.addEventListener('click', () => {
                    createPollModal.classList.remove('hidden');
                });
                pollOptionsContainer.appendChild(addBtn);
            }
        }

        if (data.chatHistory) {
            chatMessages.innerHTML = '';
            data.chatHistory.forEach(msg => {
                chatMessages.appendChild(createMessageElement(msg));
            });
            scrollToBottom();
        }
    });

    const updatePollPagination = () => {
        pollPaginationBox.innerHTML = '';
        allPolls.forEach((p, index) => {
            const li = document.createElement('li');
            li.className = 'poll-page-item';
            li.textContent = index + 1;
            li.dataset.id = p.id;
            li.title = p.question;

            li.addEventListener('click', () => {
                renderPoll(p);
                highlightActivePagination(p.id);
            });

            pollPaginationBox.appendChild(li);
        });
        if (currentPoll) {
            highlightActivePagination(currentPoll.id);
        }
    };

    const highlightActivePagination = (id) => {
        Array.from(pollPaginationBox.children).forEach(child => {
            if (child.dataset.id === id) {
                child.classList.add('active');
            } else {
                child.classList.remove('active');
            }
        });
    }

    socket.on('pollUpdated', (updatedPoll) => {
        showToast('A vote was just cast!');

        // Update it in allPolls array
        const index = allPolls.findIndex(p => p.id === updatedPoll.id);
        if (index !== -1) {
            allPolls[index] = updatedPoll;
        }

        if (currentPoll && currentPoll.id === updatedPoll.id) {
            renderPoll(updatedPoll);
        }
    });

    socket.on('pollDeleted', ({ pollId }) => {
        showToast('A poll was deleted by the admin.');
        allPolls = allPolls.filter(p => p.id !== pollId);
        updatePollPagination();

        if (allPolls.length > 0) {
            const nextPoll = allPolls[allPolls.length - 1];
            renderPoll(nextPoll);
            highlightActivePagination(nextPoll.id);
        } else {
            currentPoll = null;
            pollQuestion.innerHTML = '<span style="color: #94a3b8; font-weight: 500;">Polls not yet created</span>';
            pollOptionsContainer.innerHTML = '';
            totalVotesCount.textContent = '0';
            if (user.email === 'admin@gmail.com') {
                const addBtn = document.createElement('button');
                addBtn.className = 'btn primary-btn';
                addBtn.textContent = '+ Create First Poll';
                addBtn.style.marginTop = '20px';
                addBtn.addEventListener('click', () => { createPollModal.classList.remove('hidden'); });
                pollOptionsContainer.appendChild(addBtn);
            }
        }
    });

    socket.on('newPollCreated', (newPoll) => {
        showToast(`New poll launched: "${newPoll.question}"`);
        allPolls.push(newPoll);
        updatePollPagination();
        renderPoll(newPoll);
        highlightActivePagination(newPoll.id);
    });

    socket.on('newMessage', (msg) => {
        chatMessages.appendChild(createMessageElement(msg));
        scrollToBottom();
    });

    socket.on('messageEdited', (updatedMsg) => {
        // Find existing message element and replace it cleanly using the newly architected creation method
        const msgEl = chatMessages.querySelector(`.message[data-id="${updatedMsg.id}"]`);
        if (msgEl) {
            const newEl = createMessageElement(updatedMsg);
            msgEl.replaceWith(newEl);
        }
    });

    socket.on('messageDeleted', ({ msgId }) => {
        const msgEl = chatMessages.querySelector(`.message[data-id="${msgId}"]`);
        if (msgEl) {
            msgEl.remove();
        }
    });

    socket.on('error', (err) => {
        window.showCustomPopup('Error', err.message || 'An error occurred', false, '⚠️');
    });

    // Typing logic
    const typers = new Set();

    const updateTypingIndicator = () => {
        if (typers.size === 0) {
            typingIndicator.textContent = '';
        } else if (typers.size === 1) {
            typingIndicator.textContent = `${Array.from(typers)[0]} is typing...`;
        } else {
            typingIndicator.textContent = 'Several people are typing...';
        }
    };

    socket.on('userTyping', ({ name }) => {
        typers.add(name);
        updateTypingIndicator();
    });

    socket.on('userStoppedTyping', ({ name }) => {
        typers.delete(name);
        updateTypingIndicator();
    });

    // Admin / Modal Logic
    if (navCreatePollBtn) {
        if (user.email !== 'admin@gmail.com') {
            navCreatePollBtn.style.display = 'none';
        } else {
            navCreatePollBtn.addEventListener('click', () => {
                createPollModal.classList.remove('hidden');
            });
        }
    }

    // Admin Edit / Delete poll buttons
    if (user.email === 'admin@gmail.com') {
        if (editPollBtn) editPollBtn.style.display = 'inline-flex';
        if (deletePollBtn) deletePollBtn.style.display = 'inline-flex';
    }

    if (editPollBtn) {
        editPollBtn.addEventListener('click', () => {
            if (!currentPoll) return;
            // Pre-fill the edit modal with the current poll data
            editPollQuestionInput.value = currentPoll.question;
            editPollOptionsContainer.innerHTML = '';
            currentPoll.options.forEach((opt, i) => {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'poll-input option-input';
                input.placeholder = `Option ${i + 1}`;
                input.value = opt.text;
                editPollOptionsContainer.appendChild(input);
            });
            editPollModal.classList.remove('hidden');
        });
    }

    if (closeEditPollBtn) {
        closeEditPollBtn.addEventListener('click', () => {
            editPollModal.classList.add('hidden');
        });
    }

    if (editAddOptionBtn) {
        editAddOptionBtn.addEventListener('click', () => {
            const count = editPollOptionsContainer.children.length + 1;
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'poll-input option-input';
            input.placeholder = `Option ${count}`;
            editPollOptionsContainer.appendChild(input);
        });
    }

    if (saveEditPollBtn) {
        saveEditPollBtn.addEventListener('click', () => {
            if (!currentPoll) return;
            const question = editPollQuestionInput.value.trim();
            const optionInputs = editPollOptionsContainer.querySelectorAll('.option-input');
            const options = Array.from(optionInputs)
                .map(inp => inp.value.trim())
                .filter(v => v.length > 0);

            if (!question) {
                window.showCustomPopup('Missing Info', 'Please enter a question', false, '🤔');
                return;
            }
            if (options.length < 2) {
                window.showCustomPopup('Missing Info', 'Please provide at least 2 options', false, '🤔');
                return;
            }

            socket.emit('editPoll', {
                pollId: currentPoll.id,
                question,
                options,
                userId: user.id || user._id
            });
            editPollModal.classList.add('hidden');
        });
    }

    if (deletePollBtn) {
        deletePollBtn.addEventListener('click', async () => {
            if (!currentPoll) return;
            const confirmed = await window.showCustomPopup(
                'Delete Poll',
                `Are you sure you want to permanently delete "${currentPoll.question}"? All votes will be lost.`,
                true,
                '🗑️'
            );
            if (!confirmed) return;
            socket.emit('deletePoll', { pollId: currentPoll.id, userId: user.id || user._id });
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            createPollModal.classList.add('hidden');
            newPollQuestionInput.value = '';
            newPollOptionsContainer.innerHTML = `
                <input type="text" class="poll-input option-input" placeholder="Option 1">
                <input type="text" class="poll-input option-input" placeholder="Option 2">
            `;
        });
    }

    if (addOptionBtn) {
        addOptionBtn.addEventListener('click', () => {
            const optionCount = newPollOptionsContainer.children.length + 1;
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'poll-input option-input';
            input.placeholder = `Option ${optionCount}`;
            newPollOptionsContainer.appendChild(input);
        });
    }

    if (submitPollBtn) {
        submitPollBtn.addEventListener('click', () => {
            const question = newPollQuestionInput.value.trim();
            const optionInputs = newPollOptionsContainer.querySelectorAll('.option-input');
            const options = Array.from(optionInputs)
                .map(input => input.value.trim())
                .filter(val => val.length > 0);

            if (!question) {
                window.showCustomPopup('Missing Info', 'Please enter a question', false, '🤔');
                return;
            }
            if (options.length < 2) {
                window.showCustomPopup('Missing Info', 'Please provide at least 2 options', false, '🤔');
                return;
            }

            // Close modal immediately and emit
            closeModalBtn.click();
            socket.emit('createPoll', {
                question,
                options,
                userId: user.id || user._id
            });
        });
    }

    // Profile Logic
    const resetProfileModal = () => {
        if (cropperInstance) {
            cropperInstance.destroy();
            cropperInstance = null;
        }
        if (profileAvatarUpload) profileAvatarUpload.value = '';
        if (cropperWrapper) cropperWrapper.style.display = 'none';
        if (avatarPreviewContainer) avatarPreviewContainer.style.display = 'block';

        profileNameInput.value = user.name || '';
        if (user.avatarUrl && profileAvatarPreview) {
            profileAvatarPreview.src = user.avatarUrl;
            profileAvatarPreview.style.display = 'block';
        } else if (profileAvatarPreview) {
            profileAvatarPreview.style.display = 'none';
        }
    };

    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            resetProfileModal();
            profileModal.classList.remove('hidden');
        });
    }

    if (profileAvatarUpload) {
        profileAvatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    avatarPreviewContainer.style.display = 'none';
                    cropperWrapper.style.display = 'block';
                    cropperImage.src = event.target.result;

                    if (cropperInstance) {
                        cropperInstance.destroy();
                    }

                    cropperInstance = new Cropper(cropperImage, {
                        aspectRatio: 1,
                        viewMode: 1,
                        background: false,
                        autoCropArea: 0.8
                    });
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', () => {
            profileModal.classList.add('hidden');
            resetProfileModal();
        });
    }

    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async () => {
            const newName = profileNameInput.value.trim();
            if (!newName) {
                window.showCustomPopup('Error', 'Display name cannot be empty', false, '❌');
                return;
            }

            let updatePayload = { name: newName };

            if (cropperInstance) {
                const canvas = cropperInstance.getCroppedCanvas({
                    width: 256,
                    height: 256,
                    fillColor: '#fff',
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high',
                });
                const base64Data = canvas.toDataURL('image/jpeg', 0.8);

                try {
                    const uploadRes = await fetch('./api/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            data: base64Data,
                            fileName: 'avatar.jpg',
                            fileType: 'image/jpeg',
                            folder: 'spacevote/avatars'
                        })
                    });
                    const uploadData = await uploadRes.json();
                    if (!uploadData.success) {
                        window.showCustomPopup('Error', uploadData.message || 'Failed to upload avatar', false, '❌');
                        return;
                    }
                    updatePayload.avatarPublicId = uploadData.publicId;
                    updatePayload.avatarResourceType = uploadData.resourceType;
                } catch (e) {
                    window.showCustomPopup('Error', 'Network error uploading avatar.', false, '❌');
                    return;
                }
            }

            try {
                const response = await fetch('./api/auth/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatePayload)
                });
                const data = await response.json();
                if (data.success) {
                    user = data.user;
                    localStorage.setItem('user', JSON.stringify(user));
                    document.getElementById('current-username').textContent = user.name;
                    if (user.avatarUrl && document.getElementById('header-avatar')) {
                        document.getElementById('header-avatar').src = user.avatarUrl;
                        document.getElementById('header-avatar').style.display = 'inline-block';
                    } else if (document.getElementById('header-avatar')) {
                        document.getElementById('header-avatar').style.display = 'none';
                    }
                    closeProfileBtn.click();
                    showToast('Profile updated successfully!');
                } else {
                    window.showCustomPopup('Error', data.message || 'Failed to update profile', false, '❌');
                }
            } catch (err) {
                console.error(err);
                window.showCustomPopup('Error', 'An error occurred while updating profile', false, '❌');
            }
        });
    }

    // File attachment logic
    if (chatAttachBtn) {
        chatAttachBtn.addEventListener('click', () => chatFileInput.click());
    }

    if (chatFileInput) {
        chatFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const MAX_SIZE = 10 * 1024 * 1024;
            if (file.size > MAX_SIZE) {
                window.showCustomPopup('File Too Large', 'Please select a file smaller than 10MB.', false, '⚠️');
                chatFileInput.value = '';
                return;
            }

            // Read as local base64 immediately for instant preview
            const reader = new FileReader();
            reader.onload = (ev) => {
                // Create the state object ONCE and keep closure reference to it
                const fileState = {
                    localPreviewUrl: ev.target.result,
                    fileName: file.name,
                    fileType: file.type,
                    uploading: true,
                    publicId: null,
                    resourceType: null
                };
                pendingFile = fileState;  // point pendingFile at the same object
                chatFilePreviewName.textContent = `⏳ Uploading ${file.name}...`;
                chatFilePreview.style.display = 'flex';

                // Upload to Cloudinary via backend
                fetch('./api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: ev.target.result, fileName: file.name, fileType: file.type })
                })
                    .then(r => r.json())
                    .then(result => {
                        if (result.success) {
                            fileState.publicId = result.publicId;
                            fileState.resourceType = result.resourceType;
                            fileState.uploading = false;
                            if (pendingFile === fileState) {
                                chatFilePreviewName.textContent = `📎 ${file.name} (Ready)`;
                            }
                        } else {
                            fileState.uploading = false;
                            if (pendingFile === fileState) {
                                window.showCustomPopup('Upload Failed', result.message || 'Could not upload file.', false, '❌');
                                pendingFile = null;
                                chatFileInput.value = '';
                                chatFilePreview.style.display = 'none';
                            }
                        }
                    })
                    .catch(() => {
                        fileState.uploading = false;
                        if (pendingFile === fileState) {
                            window.showCustomPopup('Upload Error', 'Network error during upload.', false, '❌');
                            pendingFile = null;
                            chatFileInput.value = '';
                            chatFilePreview.style.display = 'none';
                        }
                    });
            };
            reader.readAsDataURL(file);
        });
    }

    if (chatFileRemoveBtn) {
        chatFileRemoveBtn.addEventListener('click', () => {
            pendingFile = null;
            chatFileInput.value = '';
            chatFilePreview.style.display = 'none';
            chatFilePreviewName.textContent = '';
        });
    }

    // Helper: insert a temporary optimistic message in the chat
    const insertOptimisticMessage = (text, file) => {
        const tempId = `optimistic-${Date.now()}`;
        const tempEl = document.createElement('div');
        tempEl.className = 'message self';
        tempEl.dataset.tempId = tempId;

        const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isImage = file && file.fileType && file.fileType.startsWith('image/');

        tempEl.innerHTML = `
            <div class="message-meta" style="display:flex;align-items:center;gap:8px;">
                <span class="timestamp">${timeString}</span>
            </div>
            <div class="message-bubble" style="position:relative;">
                ${text ? `<span>${text}</span>` : ''}
                ${file && file.localPreviewUrl && isImage ? `
                    <div style="margin-top:${text ? '8px' : '0'}; position:relative; display:inline-block;">
                        <img src="${file.localPreviewUrl}" alt="${file.fileName}" style="max-width:220px;max-height:220px;border-radius:10px;display:block;opacity:0.7;">
                        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.35);border-radius:10px;">
                            <div style="width:28px;height:28px;border:3px solid rgba(255,255,255,0.8);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
                        </div>
                    </div>
                ` : file && file.localPreviewUrl ? `
                    <div style="margin-top:${text ? '8px' : '0'};display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.07);border-radius:10px;padding:10px 14px;border:1px solid rgba(255,255,255,0.12);opacity:0.7;">
                        <div style="width:22px;height:22px;border:2px solid rgba(255,255,255,0.6);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
                        <span style="font-size:0.85rem;">${file.fileName}</span>
                    </div>
                ` : ''}
            </div>
        `;

        chatMessages.appendChild(tempEl);
        scrollToBottom();
        return tempId;
    };

    // Event Listeners
    chatInput.addEventListener('input', () => {
        socket.emit('typing', { name: user.name });
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('stopTyping', { name: user.name });
        }, 2000);
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text && !pendingFile) return;

        // Keep a REFERENCE (not a spread copy) so upload callback mutations are visible
        const fileRef = pendingFile || null;

        // Clear UI immediately
        chatInput.value = '';
        chatInput.focus();
        pendingFile = null;
        chatFileInput.value = '';
        chatFilePreview.style.display = 'none';
        chatFilePreviewName.textContent = '';

        socket.emit('stopTyping', { name: user.name });

        if (fileRef) {
            // Show optimistic message immediately with local preview
            const tempId = insertOptimisticMessage(text, fileRef);

            // Wait for upload to finish if still in progress (max 30s)
            if (fileRef.uploading) {
                await new Promise(resolve => {
                    const poll = setInterval(() => {
                        // fileRef is the SAME object the upload callback updates
                        if (!fileRef.uploading) {
                            clearInterval(poll);
                            resolve();
                        }
                    }, 200);
                    setTimeout(() => { clearInterval(poll); resolve(); }, 30000);
                });
            }

            // Remove optimistic message — server echo inserts the real one
            const tempEl = chatMessages.querySelector(`[data-temp-id="${tempId}"]`);
            if (tempEl) tempEl.remove();

            if (!fileRef.publicId && !text) {
                window.showCustomPopup('Upload Failed', 'The file could not be uploaded in time.', false, '❌');
                return;
            }

            socket.emit('sendMessage', {
                userId: user.id || user._id,
                name: user.name,
                text,
                filePublicId: fileRef.publicId,
                fileResourceType: fileRef.resourceType,
                fileName: fileRef.fileName,
                fileType: fileRef.fileType,
            });
        } else {
            socket.emit('sendMessage', {
                userId: user.id || user._id,
                name: user.name,
                text,
            });
        }
    });
});

