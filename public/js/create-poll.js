document.addEventListener('DOMContentLoaded', () => {
    // Check auth
    const userData = localStorage.getItem('user');
    let user = JSON.parse(userData || '{}');
    if (user.name) document.getElementById('current-username').textContent = user.name;

    if (!user.id && !user._id) {
        window.location.href = './index.html';
        return;
    }

    const socket = io();

    document.getElementById('back-btn').addEventListener('click', () => {
        window.location.href = './dashboard.html';
    });

    const addOptionBtn = document.getElementById('add-option-btn');
    const submitPollBtn = document.getElementById('submit-poll-btn');
    const newPollOptionsContainer = document.getElementById('new-poll-options');
    const newPollQuestionInput = document.getElementById('new-poll-question');

    addOptionBtn.addEventListener('click', () => {
        const optionCount = newPollOptionsContainer.children.length + 1;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'poll-input option-input';
        input.placeholder = `Option ${optionCount}`;
        newPollOptionsContainer.appendChild(input);
    });

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

        submitPollBtn.disabled = true;
        submitPollBtn.textContent = 'Launching...';

        socket.emit('createPoll', {
            question,
            options,
            userId: user.id || user._id
        });
    });

    // When the poll is successfully created, redirect back to dashboard
    socket.on('newPollCreated', () => {
        window.location.href = './dashboard.html';
    });

    socket.on('error', (err) => {
        alert(err.message || 'An error occurred');
        submitPollBtn.disabled = false;
        submitPollBtn.textContent = 'Launch Poll';
    });
});
