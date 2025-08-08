/**
 * Animation Coordinator - Prevents animation conflicts and ensures smooth performance
 * Manages global animation state and coordinates timing between different components
 */

interface AnimationState {
    activeAnimations: Set<string>;
    pendingAnimations: Map<string, () => void>;
    maxConcurrentAnimations: number;
    animationQueue: Array<{ id: string; callback: () => void; priority: number }>;
}

class AnimationCoordinator {
    private static instance: AnimationCoordinator;
    private state: AnimationState = {
        activeAnimations: new Set(),
        pendingAnimations: new Map(),
        maxConcurrentAnimations: 3, // Limit concurrent animations for performance
        animationQueue: []
    };

    static getInstance(): AnimationCoordinator {
        if (!AnimationCoordinator.instance) {
            AnimationCoordinator.instance = new AnimationCoordinator();
        }
        return AnimationCoordinator.instance;
    }

    /**
     * Register an animation with the coordinator
     * @param id - Unique identifier for the animation
     * @param callback - Animation function to execute
     * @param priority - Higher numbers get priority (default: 1)
     */
    registerAnimation(id: string, callback: () => void, priority: number = 1): void {
        // Prevent duplicate animations
        if (this.state.activeAnimations.has(id)) {
            console.warn(`Animation "${id}" is already active`);
            return;
        }

        if (this.state.activeAnimations.size < this.state.maxConcurrentAnimations) {
            this.executeAnimation(id, callback);
        } else {
            // Queue the animation
            this.state.animationQueue.push({ id, callback, priority });
            this.state.animationQueue.sort((a, b) => b.priority - a.priority);
        }
    }

    /**
     * Execute an animation immediately
     */
    private executeAnimation(id: string, callback: () => void): void {
        this.state.activeAnimations.add(id);
        
        try {
            callback();
        } catch (error) {
            console.error(`Animation "${id}" failed:`, error);
        }
    }

    /**
     * Mark animation as complete and process queue
     */
    completeAnimation(id: string): void {
        this.state.activeAnimations.delete(id);
        this.state.pendingAnimations.delete(id);
        
        // Process next animation in queue
        if (this.state.animationQueue.length > 0) {
            const next = this.state.animationQueue.shift();
            if (next) {
                this.executeAnimation(next.id, next.callback);
            }
        }
    }

    /**
     * Cancel a specific animation
     */
    cancelAnimation(id: string): void {
        this.state.activeAnimations.delete(id);
        this.state.pendingAnimations.delete(id);
        
        // Remove from queue if present
        this.state.animationQueue = this.state.animationQueue.filter(item => item.id !== id);
    }

    /**
     * Check if an animation is currently active
     */
    isAnimationActive(id: string): boolean {
        return this.state.activeAnimations.has(id);
    }

    /**
     * Get current animation statistics
     */
    getStats(): { active: number; queued: number; pending: number } {
        return {
            active: this.state.activeAnimations.size,
            queued: this.state.animationQueue.length,
            pending: this.state.pendingAnimations.size
        };
    }

    /**
     * Reset all animations (emergency cleanup)
     */
    resetAll(): void {
        this.state.activeAnimations.clear();
        this.state.pendingAnimations.clear();
        this.state.animationQueue = [];
    }
}

// Export singleton instance
export const animationCoordinator = AnimationCoordinator.getInstance();

// Helper hook for React components
export const useAnimationCoordinator = () => {
    const coordinator = AnimationCoordinator.getInstance();
    
    return {
        registerAnimation: coordinator.registerAnimation.bind(coordinator),
        completeAnimation: coordinator.completeAnimation.bind(coordinator),
        cancelAnimation: coordinator.cancelAnimation.bind(coordinator),
        isAnimationActive: coordinator.isAnimationActive.bind(coordinator),
        getStats: coordinator.getStats.bind(coordinator)
    };
};