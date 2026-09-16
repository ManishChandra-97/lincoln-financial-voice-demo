'use client';

import {
  ArrowUpRight,
  HeartHandshake,
  Landmark,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ChatPanel } from '@/components/chat/ChatPanel';

export function DemoApp() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="utility">
        <span>Individuals &amp; families</span>
        <span>
          A connected support experience <i /> DEMO
        </span>
      </div>
      <header className="site-header">
        <Link href="/" className="brand">
          <Landmark size={35} />
          <span>
            Lincoln
            <br />
            <b>Financial</b>
          </span>
        </Link>
        <nav>
          <Link href="#retirement">Retirement</Link>
          <Link href="#planning">Planning for life</Link>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">HERE FOR YOUR NEXT STEP</p>
            <h1>
              Your future.
              <br />
              Our commitment.
            </h1>
            <p className="lede">
              Life doesn’t always go as planned.
              <br />
              Getting the support you need should.
            </p>
            <div className="hero-footnote">
              <ShieldCheck size={18} /> A little guidance. A clearer way
              forward.
            </div>
          </div>

          <aside className="support-card">
            <span className="round-icon">
              <HeartHandshake size={28} />
            </span>
            <p className="eyebrow">SUPPORT THAT STAYS WITH YOU</p>
            <h2>
              A conversation.
              <br />
              Not a fresh start.
            </h2>
            <p>
              Use the chat bubble in the bottom-right corner whenever you need
              support.
            </p>
            <div className="journey">
              <span>
                <MessageCircle size={19} /> Chat
              </span>
              <div />
              <span>
                <ShieldCheck size={19} /> Verify
              </span>
            </div>
          </aside>
        </section>

        <section className="resources" id="retirement">
          <div className="section-heading">
            <div>
              <p className="eyebrow">WHEREVER LIFE TAKES YOU</p>
              <h2>Let’s take the next step together.</h2>
            </div>
            <span>Support for today. Perspective for tomorrow.</span>
          </div>
          <div className="resource-grid">
            <article className="resource">
              <Landmark />
              <h3>Your retirement plan</h3>
              <p>
                Talk through withdrawals, distributions, and the questions on
                your mind.
              </p>
            </article>
            <article className="resource">
              <MessageCircle />
              <h3>Need support?</h3>
              <p>
                Open the chat bubble in the bottom-right corner to begin a
                conversation.
              </p>
            </article>
            <Link
              className="resource"
              href="https://www.lincolnfinancial.com/public/individuals"
              target="_blank"
              rel="noreferrer"
            >
              <HeartHandshake />
              <h3>Plan for what’s ahead</h3>
              <p>
                Explore retirement and protection resources on Lincoln’s
                website.
              </p>
              <span>
                Explore Lincoln Financial <ArrowUpRight size={18} />
              </span>
            </Link>
          </div>
        </section>

        <section id="planning" className="closing-band">
          <p>
            Some things are easier
            <br />
            <em>when we talk them through.</em>
          </p>
        </section>
      </main>

      <footer>
        <Link href="/" className="footer-brand">
          Lincoln Financial
        </Link>
        <p>
          Demo experience. No real account, authentication, transaction, or
          financial advice is provided.
        </p>
        <span>
          Independent demonstration · Not an official servicing website
        </span>
      </footer>

      <ChatPanel open={open} setOpen={setOpen} />
    </>
  );
}
