import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    const msg = this.state.error?.message || String(this.state.error);
    return (
      <div style={{
        minHeight: "100vh", background: "#0e0d0b", color: "#e8e0d0",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}>
        <div style={{ maxWidth: 480, textAlign: "center", fontFamily: "'Fraunces', serif" }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "#c4956c",
          }}>Something interrupted the page</div>
          <h1 style={{ fontSize: 36, fontStyle: "italic", color: "#c4956c", margin: "16px 0 24px" }}>
            An unexpected error.
          </h1>
          <p style={{ fontSize: 14, color: "#a89d87", lineHeight: 1.7 }}>{msg}</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32 }}>
            <button onClick={this.reset} style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.22em",
              textTransform: "uppercase", padding: "14px 24px", border: "1px solid #c4956c",
              background: "transparent", color: "#c4956c", cursor: "pointer",
            }}>Try again</button>
            <button onClick={() => { window.location.href = "/"; }} style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.22em",
              textTransform: "uppercase", padding: "14px 24px", border: 0,
              background: "#c4956c", color: "#0e0d0b", cursor: "pointer",
            }}>Return home</button>
          </div>
        </div>
      </div>
    );
  }
}
