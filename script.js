class MindfulnessApp {
    constructor() {
        this.timerDuration = 180; // 3 minutes in seconds
        this.timeRemaining = this.timerDuration;
        this.timerInterval = null;
        this.isRunning = false;
        
        this.diaryEntries = this.loadDiaryEntries();
        
        this.initTimer();
        this.initDiary();
        this.createBellSound();
    }

    initTimer() {
        this.timerDisplay = document.getElementById('timerDisplay');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');

        this.startBtn.addEventListener('click', () => this.startTimer());
        this.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());

        this.updateTimerDisplay();
    }

    startTimer() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startBtn.textContent = 'Running...';
            this.startBtn.disabled = true;
            
            this.timerInterval = setInterval(() => {
                this.timeRemaining--;
                this.updateTimerDisplay();
                
                if (this.timeRemaining <= 0) {
                    this.completeTimer();
                }
            }, 1000);
        }
    }

    pauseTimer() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.timerInterval);
            this.startBtn.textContent = 'Resume';
            this.startBtn.disabled = false;
        }
    }

    resetTimer() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        this.timeRemaining = this.timerDuration;
        this.updateTimerDisplay();
        this.startBtn.textContent = 'Start';
        this.startBtn.disabled = false;
    }

    completeTimer() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        this.playBell();
        this.startBtn.textContent = 'Start';
        this.startBtn.disabled = false;
        this.timeRemaining = this.timerDuration;
        this.updateTimerDisplay();
        
        // Visual feedback
        this.timerDisplay.style.color = '#48bb78';
        setTimeout(() => {
            this.timerDisplay.style.color = '#4a5568';
        }, 2000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.timerDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    createBellSound() {
        // Create a simple bell sound using Web Audio API
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = AudioContextClass ? new AudioContextClass() : null;
        } catch (error) {
            console.warn('Web Audio API not supported');
            this.audioContext = null;
        }
    }

    playBell() {
        if (this.audioContext) {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.5);
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 1);
        }
    }

    initDiary() {
        this.createTodayInputs();
        this.renderDiaryEntries();
        this.updateProgress();
    }

    createTodayInputs() {
        const container = document.getElementById('todayInputs');
        const today = new Date().toDateString();
        const todayEntries = this.diaryEntries.filter(entry => 
            new Date(entry.timestamp).toDateString() === today
        );
        
        // Always show 3 input fields
        for (let i = 0; i < 3; i++) {
            const inputDiv = document.createElement('div');
            inputDiv.className = 'entry-input';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `How do I feel? (Entry ${i + 1})`;
            input.id = `feelingInput${i}`;
            
            // If there's already an entry for this slot, fill it
            if (todayEntries[i]) {
                input.value = todayEntries[i].feeling;
                input.disabled = true;
            }
            
            const button = document.createElement('button');
            button.textContent = todayEntries[i] ? '✓' : 'Save';
            button.disabled = todayEntries[i] ? true : false;
            button.addEventListener('click', () => this.saveFeelingEntry(i));
            
            inputDiv.appendChild(input);
            inputDiv.appendChild(button);
            container.appendChild(inputDiv);
        }
    }

    saveFeelingEntry(index) {
        const input = document.getElementById(`feelingInput${index}`);
        const feeling = input.value.trim();
        
        if (feeling) {
            const entry = {
                timestamp: new Date().toISOString(),
                feeling: feeling
            };
            
            this.diaryEntries.unshift(entry);
            this.saveDiaryEntries();
            
            // Disable the input and button
            input.disabled = true;
            input.nextElementSibling.textContent = '✓';
            input.nextElementSibling.disabled = true;
            
            this.renderDiaryEntries();
            this.updateProgress();
        }
    }

    renderDiaryEntries() {
        const container = document.getElementById('diaryEntries');
        container.innerHTML = '';
        
        // Group entries by date
        const groupedEntries = this.groupEntriesByDate();
        
        Object.keys(groupedEntries).forEach(date => {
            const dateGroup = document.createElement('div');
            dateGroup.className = 'date-group';
            
            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-header';
            dateHeader.textContent = date;
            dateGroup.appendChild(dateHeader);
            
            groupedEntries[date].forEach(entry => {
                const entryItem = document.createElement('div');
                entryItem.className = 'entry-item';
                
                const entryTime = document.createElement('div');
                entryTime.className = 'entry-time';
                entryTime.textContent = new Date(entry.timestamp).toLocaleTimeString();
                
                const entryFeeling = document.createElement('div');
                entryFeeling.className = 'entry-feeling';
                entryFeeling.textContent = entry.feeling;
                
                entryItem.appendChild(entryTime);
                entryItem.appendChild(entryFeeling);
                dateGroup.appendChild(entryItem);
            });
            
            container.appendChild(dateGroup);
        });
    }

    groupEntriesByDate() {
        const grouped = {};
        
        this.diaryEntries.forEach(entry => {
            const date = new Date(entry.timestamp).toDateString();
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(entry);
        });
        
        return grouped;
    }

    updateProgress() {
        const today = new Date().toDateString();
        const todayEntries = this.diaryEntries.filter(entry => 
            new Date(entry.timestamp).toDateString() === today
        );
        
        const progressText = document.getElementById('progressText');
        progressText.textContent = `${todayEntries.length}/3 entries completed today`;
    }

    loadDiaryEntries() {
        try {
            const stored = localStorage.getItem('mindfulnessDiary');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    }

    saveDiaryEntries() {
        try {
            localStorage.setItem('mindfulnessDiary', JSON.stringify(this.diaryEntries));
        } catch (error) {
            console.error('Failed to save diary entries:', error);
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MindfulnessApp();
});