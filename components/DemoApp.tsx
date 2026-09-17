'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChatPanel } from '@/components/chat/ChatPanel';

export function DemoApp() {
  const [open, setOpen] = useState(false);

  return (
    <div className="site-shell">
      <header className="minimal-header">
        <Link className="minimal-brand" href="/">
          Chicago Financial
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#solutions">Solutions</a>
          <a href="#insights">Insights</a>
          <a href="#about">About us</a>
          <button className="nav-login">Client login</button>
        </nav>
      </header>

      <main className="minimal-main">
        <section className="hero-grid">
          <div className="hero-copy">
            <p className="minimal-kicker">CHICAGO FINANCIAL</p>
            <h1>Plan with confidence.</h1>
            <p className="minimal-intro">
              Thoughtful retirement solutions and human support for the
              decisions that shape your future.
            </p>
            <div className="hero-actions">
              <a className="hero-primary" href="#solutions">
                Explore solutions
              </a>
              <a className="hero-secondary" href="#insights">
                View insights <span>→</span>
              </a>
            </div>
          </div>
          <div
            className="hero-art"
            aria-label="Abstract layered financial growth illustration"
          >
            <div className="art-sun" />
            <div className="art-arc arc-one" />
            <div className="art-arc arc-two" />
            <div className="art-line" />
            <span>BUILT FOR WHAT IS NEXT</span>
          </div>
        </section>
        <section className="service-strip" id="solutions">
          <div>
            <span>01</span>
            <h2>Retirement</h2>
            <p>Build a strategy that moves with your life.</p>
          </div>
          <div>
            <span>02</span>
            <h2>Investing</h2>
            <p>Make every decision with a clearer view.</p>
          </div>
          <div>
            <span>03</span>
            <h2>Support</h2>
            <p>Answers when you need a thoughtful next step.</p>
          </div>
        </section>
        <section className="insights-band" id="insights">
          <p className="minimal-kicker">OUR APPROACH</p>
          <h2>
            Clarity for today.
            <br />
            Confidence for tomorrow.
          </h2>
          <p>
            From everyday questions to long-term goals, Chicago Financial helps
            you make informed choices with care.
          </p>
        </section>
      </main>

      <footer className="minimal-footer">
        <span>Chicago Financial</span>
        <span>Guidance for the road ahead</span>
      </footer>

      <ChatPanel open={open} setOpen={setOpen} />
    </div>
  );
}
