import { useEffect, useState } from 'react';
import './CognitiveHUD.css';

interface CognitiveMetrics {
  errorRate: number;
  averageSpeed: number;
  totalActions: number;
  successRate: number;
}

interface Action {
  type: string;
  success: boolean;
  timestamp: number;
  duration: number;
}

interface CognitiveHUDProps {
  cognitiveState: string;
  metrics: CognitiveMetrics;
  lastAction: Action | null;
}

function CognitiveHUD({ cognitiveState, metrics, lastAction }: CognitiveHUDProps) {
  const [actionHistory, setActionHistory] = useState<Action[]>([]);

  useEffect(() => {
    if (lastAction) {
      setActionHistory((prev) => [lastAction, ...prev].slice(0, 5));
    }
  }, [lastAction]);

  const getStateColor = (state: string) => {
    const colors: Record<string, string> = {
      neutral: '#6b7280',
      concentrated: '#06b6d4',
      frustrated: '#ef4444',
      learning: '#a78bfa',
      distracted: '#f59e0b',
    };
    return colors[state] || colors.neutral;
  };

  const getStateEmoji = (state: string) => {
    const emojis: Record<string, string> = {
      neutral: '😐',
      concentrated: '🎯',
      frustrated: '😤',
      learning: '🧠',
      distracted: '😵‍💫',
    };
    return emojis[state] || '🤖';
  };

  return (
    <div className="cognitive-hud">
      <div className="hud-header">
        <h2>🧠 The Reaction</h2>
        <p className="hud-description">
          Real-time cognitive state analysis
        </p>
      </div>

      {/* Main State Display */}
      <div className="state-display" data-state={cognitiveState} data-testid="cognitive-state-container">
        <div className="state-emoji">{getStateEmoji(cognitiveState)}</div>
        <div className="state-name" data-testid="cognitive-state">{cognitiveState}</div>
        <div className="state-indicator">
          <div 
            className="state-indicator-bar" 
            style={{ backgroundColor: getStateColor(cognitiveState) }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Error Rate</div>
          <div className="metric-value" data-testid="error-rate" data-danger={metrics.errorRate > 30}>
            {metrics.errorRate}%
          </div>
          <div className="metric-bar">
            <div 
              className="metric-bar-fill"
              style={{ 
                width: `${Math.min(metrics.errorRate, 100)}%`,
                backgroundColor: metrics.errorRate > 30 ? '#ef4444' : '#22c55e'
              }}
            />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Avg Speed</div>
          <div className="metric-value" data-testid="avg-speed">
            {metrics.averageSpeed}ms
          </div>
          <div className="metric-bar">
            <div 
              className="metric-bar-fill"
              style={{ 
                width: `${Math.min((metrics.averageSpeed / 1000) * 100, 100)}%`,
                backgroundColor: metrics.averageSpeed < 500 ? '#06b6d4' : '#a78bfa'
              }}
            />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Success Rate</div>
          <div className="metric-value" data-success={metrics.successRate > 70}>
            {metrics.successRate}%
          </div>
          <div className="metric-bar">
            <div 
              className="metric-bar-fill"
              style={{ 
                width: `${metrics.successRate}%`,
                backgroundColor: metrics.successRate > 70 ? '#22c55e' : '#ef4444'
              }}
            />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Total Actions</div>
          <div className="metric-value">
            {metrics.totalActions}
          </div>
          <div className="metric-badge">
            {metrics.totalActions > 10 ? '🔥' : '🚀'}
          </div>
        </div>
      </div>

      {/* Action Log */}
      <div className="action-log">
        <div className="log-header">
          <span>Recent Actions</span>
          <span className="log-count">{actionHistory.length}/5</span>
        </div>
        <div className="log-entries">
          {actionHistory.length === 0 ? (
            <div className="log-empty">
              Press arrow keys to start...
            </div>
          ) : (
            actionHistory.map((action, index) => (
              <div 
                key={`${action.timestamp}-${index}`}
                className={`log-entry ${action.success ? 'success' : 'error'}`}
                style={{
                  animationDelay: `${index * 50}ms`
                }}
              >
                <span className="log-icon">
                  {action.success ? '✓' : '✗'}
                </span>
                <span className="log-type">
                  {action.type.replace('intent:', '')}
                </span>
                <span className="log-duration">
                  {action.duration}ms
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI Insight Box */}
      <div className="insight-box" data-state={cognitiveState}>
        <div className="insight-icon">💡</div>
        <div className="insight-text">
          {cognitiveState === 'concentrated' && 
            'User is in the zone. Interface is responding faster.'}
          {cognitiveState === 'frustrated' && 
            'Detecting frustration. Slowing down transitions to help.'}
          {cognitiveState === 'learning' && 
            'User is adapting. Maintaining balanced response.'}
          {cognitiveState === 'neutral' && 
            'Monitoring user behavior patterns...'}
        </div>
      </div>
    </div>
  );
}

export default CognitiveHUD;
