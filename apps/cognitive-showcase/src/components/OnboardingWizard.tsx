import { useEffect, useState } from 'react';
import './OnboardingWizard.css';

interface OnboardingStep {
  id: number;
  title: string;
  message: string;
  icon: string;
  condition: (metrics: OnboardingMetrics) => boolean;
}

interface OnboardingMetrics {
  totalActions: number;
  successfulActions: number;
  errorActions: number;
  frustrationDetected: boolean;
}

interface OnboardingWizardProps {
  metrics: {
    totalActions: number;
    errorRate: number;
    errorCount: number;
    successCount: number;
  };
  cognitiveState: string;
  onComplete: () => void;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to Navigator',
    message: 'Use ◀️ ▶️ arrow keys to navigate the carousel.',
    icon: '🎯',
    condition: (metrics) => metrics.successfulActions >= 3,
  },
  {
    id: 2,
    title: 'Perfect! Now Break Things',
    message: 'Press random keys (X, Y, Z, A, S, D) to simulate errors.',
    icon: '💥',
    condition: (metrics) => metrics.errorActions >= 5,
  },
  {
    id: 3,
    title: 'Watch the Magic',
    message: 'Keep making errors! Navigator is detecting your frustration and adapting...',
    icon: '🧠',
    condition: (metrics) => metrics.frustrationDetected || metrics.errorActions >= 8,
  },
  {
    id: 4,
    title: 'You\'re a Pro!',
    message: 'Now use arrow keys again. Notice how Navigator helps you by slowing down!',
    icon: '🚀',
    condition: (metrics) => metrics.totalActions >= 15,
  },
];

function OnboardingWizard({ metrics, cognitiveState, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if we should load dismissed state from localStorage
    const isDismissed = localStorage.getItem('navigator-onboarding-dismissed');
    if (isDismissed === 'true') {
      setDismissed(true);
      return;
    }
  }, []);

  useEffect(() => {
    if (dismissed || completed) return;

    const step = ONBOARDING_STEPS[currentStep];
    if (!step) return;

    const onboardingMetrics: OnboardingMetrics = {
      totalActions: metrics.totalActions,
      successfulActions: metrics.successCount,
      errorActions: metrics.errorCount,
      frustrationDetected: cognitiveState === 'frustrated',
    };

    if (step.condition(onboardingMetrics)) {
      // Different delays for different steps
      let delay = 2000;
      if (currentStep === 2) { // Step 3 - Give user time to see the adaptation
        delay = 3500;
      } else if (currentStep === 3) { // Step 4 - Final step
        delay = 2500;
      }

      const timer = setTimeout(() => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          setCompleted(true);
          onComplete();
        }
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [metrics, cognitiveState, currentStep, completed, dismissed, onComplete]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('navigator-onboarding-dismissed', 'true');
  };

  const handleReset = () => {
    setCurrentStep(0);
    setCompleted(false);
    setDismissed(false);
    localStorage.removeItem('navigator-onboarding-dismissed');
  };

  if (dismissed) {
    return (
      <button className="onboarding-reset-button" onClick={handleReset} title="Restart tutorial">
        🎯 Tutorial
      </button>
    );
  }

  if (completed) {
    return (
      <div className="onboarding-complete">
        <span className="complete-icon">✨</span>
        <span className="complete-message">Complete!</span>
        <button className="dismiss-button" onClick={handleDismiss}>
          Dismiss
        </button>
      </div>
    );
  }

  const step = ONBOARDING_STEPS[currentStep];

  // Calculate progress for current step
  const onboardingMetrics: OnboardingMetrics = {
    totalActions: metrics.totalActions,
    successfulActions: metrics.successCount,
    errorActions: metrics.errorCount,
    frustrationDetected: cognitiveState === 'frustrated',
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case 0: // Step 1 - Need 3 successful actions
        return Math.min((onboardingMetrics.successfulActions / 3) * 100, 100);
      case 1: // Step 2 - Need 5 error actions
        return Math.min((onboardingMetrics.errorActions / 5) * 100, 100);
      case 2: // Step 3 - Need frustration OR 8 errors
        if (onboardingMetrics.frustrationDetected) return 100;
        return Math.min((onboardingMetrics.errorActions / 8) * 100, 100);
      case 3: // Step 4 - Need 15 total actions
        return Math.min((onboardingMetrics.totalActions / 15) * 100, 100);
      default:
        return 0;
    }
  };

  const stepProgress = getStepProgress();
  const isStepComplete = step.condition(onboardingMetrics);

  return (
    <div className="onboarding-wizard" data-step={currentStep}>
      <div className="onboarding-card">
        <div className="step-progress">
          {ONBOARDING_STEPS.map((_, index) => (
            <div
              key={index}
              className={`progress-dot ${index <= currentStep ? 'active' : ''} ${index === currentStep && isStepComplete ? 'complete' : ''}`}
            />
          ))}
        </div>

        <div className="step-content">
          <div>
            <span className="step-icon">{step.icon}</span>
            <span className="step-title">{step.title}</span>
          </div>
          <p className="step-message">{step.message}</p>

          {/* Progress bar for current step */}
          <div className="step-progress-bar">
            <div 
              className="step-progress-fill" 
              style={{ width: `${stepProgress}%` }}
            />
          </div>
          {!isStepComplete && (
            <div className="step-hint">
              {currentStep === 0 && `${onboardingMetrics.successfulActions}/3 navigations`}
              {currentStep === 1 && `${onboardingMetrics.errorActions}/5 errors`}
              {currentStep === 2 && !onboardingMetrics.frustrationDetected && `${onboardingMetrics.errorActions}/8 errors`}
              {currentStep === 2 && onboardingMetrics.frustrationDetected && 'Frustration detected! ✓'}
              {currentStep === 3 && `${onboardingMetrics.totalActions}/15 actions`}
            </div>
          )}

          <div className="step-footer">
            <span className="step-counter">
              {currentStep + 1}/{ONBOARDING_STEPS.length}
            </span>
            <button className="skip-button" onClick={handleDismiss}>
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingWizard;
