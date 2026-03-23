document.addEventListener('DOMContentLoaded', () => {
    // Check auth
    const userData = localStorage.getItem('user');
    let user = JSON.parse(userData || '{}');
    if (user.name) document.getElementById('current-username').textContent = user.name;

    // Verify auth with server
    const checkAuth = async () => {
        try {
            const response = await fetch('./api/auth/me');
            const data = await response.json();
            console.log('the data', data);
            if (data.success && data.user) {
                user = data.user;
                document.getElementById('current-username').textContent = user.name;
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

    let allPolls = [];

    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const typingIndicator = document.getElementById('typing-indicator');

    // Helper Functions
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

            optionEl.className = `poll-option ${hasVotedForThis ? 'voted' : ''} ${hasVotedForAny && !hasVotedForThis ? 'disabled' : ''}`;

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

        const timestamp = msg.timestamp || msg.createdAt;
        const timeString = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

        msgEl.innerHTML = `
      <div class="message-meta">
        ${isSelf ? '' : `<span class="sender-name">${msg.name || msg.username || 'Anonymous'}</span> • `}
        <span class="timestamp">${timeString}</span>
      </div>
      <div class="message-bubble">${msg.text}</div>
    `;

        return msgEl;
    };

    const scrollToBottom = () => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

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
        allPolls.push(newPoll);
        updatePollPagination();
        renderPoll(newPoll);
        highlightActivePagination(newPoll.id);
    });

    socket.on('newMessage', (msg) => {
        chatMessages.appendChild(createMessageElement(msg));
        scrollToBottom();
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
