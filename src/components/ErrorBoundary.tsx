import { Component, ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** Catches a crash in any page so the visitor sees a way out instead of a blank screen. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.error('Page crashed', error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="page nf">
        <span className="eyebrow">Something went wrong</span>
        <h1>This page hit a problem.</h1>
        <p className="lead">It's on us, not you. Try again, or head back to somewhere safe.</p>
        <div className="bk-actions">
          <button className="button button-primary" onClick={() => window.location.reload()}>Reload the page</button>
          <Link className="button button-quiet" to="/" onClick={() => this.setState({ failed: false })}>Go home</Link>
        </div>
      </section>
    );
  }
}
