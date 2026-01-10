// Hybrid Quiz Storage System
// Combines localStorage (for speed) with server-side storage (for reliability)

class HybridQuizStorage {
  constructor(quizId, userId) {
    this.quizId = quizId;
    this.userId = userId;
    this.progressKey = `quiz_progress_${quizId}`;
    this.serverSyncInterval = null;
    this.lastServerSync = 0;
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncToServer();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Load progress from localStorage first, then try to sync with server
  async loadProgress() {
    try {
      // Load from localStorage immediately
      const localProgress = this.loadFromLocalStorage();
      
      if (this.isOnline) {
        try {
          // Try to get server progress
          const serverResponse = await fetch(`/api/quiz/progress?quizId=${this.quizId}`);
          if (serverResponse.ok) {
            const serverData = await serverResponse.json();
            
            if (serverData.exists && !serverData.isExpired) {
              // Merge server and local data, preferring most recent
              const mergedProgress = this.mergeProgressData(localProgress, serverData.progress);
              this.saveToLocalStorage(mergedProgress);
              
              console.log('Progress loaded from server and merged with local');
              return mergedProgress;
            } else if (serverData.isExpired) {
              console.log('Quiz expired, clearing local progress');
              this.clearProgress();
              return null;
            }
          }
        } catch (error) {
          console.warn('Failed to sync from server, using local data:', error);
        }
      }
      
      console.log('Using local progress data');
      return localProgress;
      
    } catch (error) {
      console.error('Error loading progress:', error);
      return null;
    }
  }

  // Save progress to both localStorage and server
  async saveProgress(progressData) {
    try {
      // Always save to localStorage first (fast)
      this.saveToLocalStorage(progressData);
      
      // Save to server if online
      if (this.isOnline && !this.syncInProgress) {
        this.syncInProgress = true;
        
        try {
          const response = await fetch('/api/quiz/progress', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              quizId: this.quizId,
              answers: progressData.answers,
              currentQuestionIndex: progressData.currentQuestionIndex,
              timeSpent: progressData.timeSpent,
              flaggedQuestions: progressData.flaggedQuestions
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            this.lastServerSync = Date.now();
            console.log('Progress saved to server:', result);
          } else {
            console.warn('Failed to save to server, keeping local only');
          }
        } catch (error) {
          console.warn('Error saving to server, keeping local only:', error);
        } finally {
          this.syncInProgress = false;
        }
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }

  // Start periodic server sync
  startPeriodicSync(intervalMs = 30000) { // Default: 30 seconds
    if (this.serverSyncInterval) {
      clearInterval(this.serverSyncInterval);
    }
    
    this.serverSyncInterval = setInterval(async () => {
      if (this.isOnline) {
        const currentProgress = this.loadFromLocalStorage();
        if (currentProgress && currentProgress.answers.length > 0) {
          await this.saveProgress(currentProgress);
        }
      }
    }, intervalMs);
  }

  // Stop periodic sync
  stopPeriodicSync() {
    if (this.serverSyncInterval) {
      clearInterval(this.serverSyncInterval);
      this.serverSyncInterval = null;
    }
  }

  // Force immediate sync to server
  async syncToServer() {
    const currentProgress = this.loadFromLocalStorage();
    if (currentProgress) {
      await this.saveProgress(currentProgress);
    }
  }

  // Clear progress from both localStorage and server
  async clearProgress() {
    try {
      // Clear localStorage
      localStorage.removeItem(this.progressKey);
      
      // Clear from server
      if (this.isOnline) {
        try {
          await fetch(`/api/quiz/progress/delete?quizId=${this.quizId}`, {
            method: 'DELETE'
          });
          console.log('Progress cleared from server');
        } catch (error) {
          console.warn('Failed to clear server progress:', error);
        }
      }
      
      this.stopPeriodicSync();
      console.log('Progress cleared from all storage');
    } catch (error) {
      console.error('Error clearing progress:', error);
    }
  }

  // Local storage helpers
  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem(this.progressKey);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  }

  saveToLocalStorage(progressData) {
    try {
      localStorage.setItem(this.progressKey, JSON.stringify({
        ...progressData,
        lastSavedAt: Date.now()
      }));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  // Merge local and server progress data
  mergeProgressData(localData, serverData) {
    if (!localData) return serverData;
    if (!serverData) return localData;
    
    // Prefer the most recently saved data
    const localTime = new Date(localData.lastSavedAt || 0).getTime();
    const serverTime = new Date(serverData.lastSavedAt || 0).getTime();
    
    if (serverTime > localTime) {
      // Server data is newer, but preserve any newer local answers
      const merged = { ...serverData };
      
      // Merge answers, preserving local answers for questions answered after server save
      if (localData.answers && Array.isArray(localData.answers)) {
        merged.answers = serverData.answers || [];
        
        localData.answers.forEach(localAnswer => {
          const existingIndex = merged.answers.findIndex(a => a.questionId === localAnswer.questionId);
          if (existingIndex >= 0) {
            // Keep local answer if it's more recent or server answer is empty
            const localAns = Array.isArray(localAnswer.answer) ? localAnswer.answer : [localAnswer.answer];
            const serverAns = Array.isArray(merged.answers[existingIndex].answer) 
              ? merged.answers[existingIndex].answer 
              : [merged.answers[existingIndex].answer];
            
            if (localAns.length > 0 && (serverAns.length === 0 || localTime > serverTime)) {
              merged.answers[existingIndex] = localAnswer;
            }
          } else {
            // Add new answer from local
            merged.answers.push(localAnswer);
          }
        });
      }
      
      // Preserve other local data that might be newer
      if (localTime > serverTime) {
        merged.currentQuestionIndex = localData.currentQuestionIndex;
        merged.timeSpent = localData.timeSpent;
        if (localData.flaggedQuestions) {
          merged.flaggedQuestions = localData.flaggedQuestions;
        }
      }
      
      return merged;
    }
    
    // Local data is newer or same age
    return localData;
  }

  // Get storage status for debugging
  getStorageStatus() {
    const localData = this.loadFromLocalStorage();
    return {
      hasLocalStorage: !!localData,
      isOnline: this.isOnline,
      lastServerSync: this.lastServerSync,
      syncInProgress: this.syncInProgress,
      periodicSyncActive: !!this.serverSyncInterval
    };
  }
}

// Export for use in quiz components
if (typeof window !== 'undefined') {
  window.HybridQuizStorage = HybridQuizStorage;
}
