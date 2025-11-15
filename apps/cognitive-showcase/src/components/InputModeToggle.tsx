import './InputModeToggle.css';

interface InputModeToggleProps {
  gestureEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

function InputModeToggle({ }: InputModeToggleProps) {
  return (
    <div className="input-mode-toggle">
      <div className="toggle-header">
        <span className="toggle-icon">🎮</span>
        <span className="toggle-label">Input Modes</span>
      </div>
      
      <div className="input-modes">
        <div className="input-mode active">
          <span className="mode-icon">⌨️</span>
          <span className="mode-label">Keyboard</span>
          <div className="mode-status enabled">Active</div>
        </div>

        <div className="input-mode disabled" title="Coming Soon">
          <span className="mode-icon">👋</span>
          <span className="mode-label">Gesture</span>
          <div className="mode-status">Coming Soon</div>
        </div>
      </div>

      <div className="toggle-hint">
        <span className="hint-icon">💡</span>
        <span className="hint-text">
          Gesture controls will allow you to navigate with hand movements
        </span>
      </div>
    </div>
  );
}

export default InputModeToggle;
