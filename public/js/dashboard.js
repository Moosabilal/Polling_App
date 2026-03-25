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
            window.location.href = './index.html';
        }
    };
    checkAuth();

    // Logout
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await fetch('./api/auth/logout', { method: 'POST' });
        } catch (err) {
            console.error('Logout failed:', err);
        }
        localStorage.removeItem('user');
        window.location.href = './index.html';
    });

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
      <div class="message-bubble">${msg.text}
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
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.remove('show');
                    if (confirm('Are you sure you want to permanently delete this message?')) {
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
        alert(err.message || 'An error occurred');
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
                alert('Please enter a question');
                return;
            }
            if (options.length < 2) {
                alert('Please provide at least 2 options');
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
                alert('Display name cannot be empty');
                return;
            }

            let newAvatarUrl = user.avatarUrl;

            if (cropperInstance) {
                const canvas = cropperInstance.getCroppedCanvas({
                    width: 256,
                    height: 256,
                    fillColor: '#fff',
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high',
                });
                newAvatarUrl = canvas.toDataURL('image/jpeg', 0.8);
            }

            try {
                const response = await fetch('./api/auth/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newName, avatarUrl: newAvatarUrl || null })
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
                    alert(data.message || 'Failed to update profile');
                }
            } catch (err) {
                console.error(err);
                alert('An error occurred while updating profile');
            }
        });
    }

    // Event Listeners
    chatInput.addEventListener('input', () => {
        socket.emit('typing', { name: user.name });

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('stopTyping', { name: user.name });
        }, 2000);
    });

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        const payload = {
            userId: user.id || user._id,
            name: user.name,
            text: text
        };
        console.log('Sending message payload:', payload);

        socket.emit('sendMessage', payload);

        socket.emit('stopTyping', { name: user.name });
        chatInput.value = '';
        chatInput.focus();
    });
});
