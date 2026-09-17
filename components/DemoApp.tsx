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
        <span>Financial guidance, made clearer.</span>
      </header>

      <main className="minimal-main">
        <p className="minimal-kicker">CHICAGO FINANCIAL</p>
        <h1>
          Clear guidance.
          <br />
          Real conversations.
        </h1>
        <p className="minimal-intro">
          Retirement planning and financial support, with an AI assistant
          available whenever you need it.
        </p>

        <div className="minimal-details">
          <article>
            <span>01</span>
            <h2>Retirement</h2>
            <p>Understand distributions, withdrawals, and next steps.</p>
          </article>
          <article>
            <span>02</span>
            <h2>Support</h2>
            <p>Start in chat and move to voice when it feels easier.</p>
          </article>
        </div>
      </main>

      <footer className="minimal-footer">
        <span>Chicago Financial</span>
        <span>AI-powered client support</span>
      </footer>

      <ChatPanel open={open} setOpen={setOpen} />
    </div>
  );
}
