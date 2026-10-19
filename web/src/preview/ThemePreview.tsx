import { useId, type ReactNode } from 'react'
import { AccountLayout } from '../account/AccountLayout.tsx'
import { Button } from '../components/Button.tsx'
import { ArrowUpIcon, BackIcon, EyeOffIcon, JournalIcon, MenuIcon } from '../components/icons.tsx'
import { ApiStatus } from './ApiStatus.tsx'
import { ThemeSwitcher } from './ThemeSwitcher.tsx'

// Static sample content from the mocks in web/design/. Real data arrives with the conversation and run features.
const run = {
  title: "Vaela's Run",
  subtitle: 'Astrologer · Level 34 · Liurnia',
  character: 'Vaela',
  classAndLevel: 'Astrologer · Lv 34',
}

const conversation = {
  dateLabel: 'Conversation · Today',
  userMessage: 'Finally beat Rennala. Got the Great Rune but no idea what to do with it.',
  companionReply: [
    'Nice, that second phase is a lot with all the summons. The rune does nothing on its own yet. You need to activate it at a Divine Tower first, and there’s one you can reach from Liurnia.',
    'Want a nudge on how to get there, or the full route?',
  ],
  journalEntry: 'Defeated Rennala, Queen of the Full Moon. Holds her Great Rune, not yet activated.',
  quickReply: 'Just a nudge',
  spoilerText: 'This touches on something you haven’t reached yet. Want it anyway, or just a hint?',
}

const stats = [
  { name: 'VIG', value: 24 },
  { name: 'MND', value: 18 },
  { name: 'END', value: 12 },
  { name: 'INT', value: 38, highlighted: true },
  { name: 'STR', value: 10 },
  { name: 'DEX', value: 12 },
  { name: 'FTH', value: 7 },
  { name: 'ARC', value: 9 },
]

const equipped = [
  { name: 'Meteorite Staff', detail: '+4' },
  { name: 'Glintstone Kris', detail: '+3' },
  { name: 'Spellblade Set', detail: 'Armor' },
  { name: 'Rock Sling, Glintstone Pebble', detail: 'Sorceries' },
]

const panelTabs = ['Character', 'Progress', 'Journal', 'Lore So Far']

export function ThemePreview() {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-12 px-4 py-8">
      <header className="flex flex-col gap-4">
        <h1 className="font-display text-3xl text-text-strong">Theme preview</h1>
        <ThemeSwitcher />
      </header>

      <PreviewSection title="Run header">
        <RunHeader />
      </PreviewSection>

      <PreviewSection title="Conversation">
        <Conversation />
      </PreviewSection>

      <PreviewSection title="Composer">
        <Composer />
      </PreviewSection>

      <PreviewSection title="Run panel">
        <RunPanel />
      </PreviewSection>

      <PreviewSection title="Sign-in">
        <SignIn />
      </PreviewSection>

      <ApiStatus />
    </div>
  )
}

function PreviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      {/* text-faint is only readable on the page background, which is where these headings sit. */}
      <h2 className="label-caps text-text-faint">{title}</h2>
      {children}
    </section>
  )
}

function RunHeader() {
  return (
    <div className="-mx-4 flex items-center gap-3 border-b border-border-subtle bg-bg-chrome px-4 py-4">
      <button type="button" aria-label="Back to runs" className="p-1 text-2xl text-text-muted">
        <BackIcon />
      </button>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-2xl font-semibold text-accent">{run.title}</h3>
        <p className="truncate text-text-muted">{run.subtitle}</p>
      </div>
      <button
        type="button"
        aria-label="Open run panel"
        className="flex size-11 items-center justify-center rounded-md border border-border bg-surface text-2xl text-text"
      >
        <MenuIcon />
      </button>
    </div>
  )
}

function Conversation() {
  return (
    <div className="flex flex-col gap-6">
      <p className="label-caps text-center text-text-faint">{conversation.dateLabel}</p>

      <UserBubble>{conversation.userMessage}</UserBubble>

      <div className="flex flex-col gap-3">
        <p className="font-display text-lg font-semibold text-accent">Companion</p>
        {conversation.companionReply.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <InlineCard icon={<JournalIcon />} label="Saving to your run journal">
        <p>{conversation.journalEntry}</p>
        <div className="grid grid-cols-2 gap-3">
          <Button>Correct</Button>
          <Button>Stop</Button>
        </div>
      </InlineCard>

      <UserBubble>{conversation.quickReply}</UserBubble>

      <InlineCard icon={<EyeOffIcon />} label="Spoiler ahead">
        <p>{conversation.spoilerText}</p>
        <div className="grid grid-cols-2 gap-3">
          {/* The safe choice is always the primary one. */}
          <Button variant="primary">Just a hint</Button>
          <Button>Tell me anyway</Button>
        </div>
      </InlineCard>
    </div>
  )
}

function UserBubble({ children }: { children: ReactNode }) {
  return (
    <p className="ml-auto max-w-[85%] rounded-lg rounded-br-sm border border-border bg-surface px-4 py-3 text-text">
      {children}
    </p>
  )
}

function InlineCard({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border-accent bg-surface-callout p-4">
      <p className="flex items-center gap-3 text-accent">
        <span className="text-xl">{icon}</span>
        <span className="label-caps">{label}</span>
      </p>
      {children}
    </div>
  )
}

function Composer() {
  const inputId = useId()
  return (
    <form
      className="-mx-4 flex items-center gap-3 border-t border-border-subtle bg-bg-chrome px-4 py-3"
      onSubmit={(event) => event.preventDefault()}
    >
      <label htmlFor={inputId} className="sr-only">
        Message
      </label>
      <input
        id={inputId}
        type="text"
        placeholder="Ask your companion…"
        className="min-w-0 flex-1 rounded-full border border-border bg-surface-input px-5 py-3 text-text placeholder:text-text-muted"
      />
      <button
        type="submit"
        aria-label="Send"
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-2xl text-on-accent"
      >
        <ArrowUpIcon />
      </button>
    </form>
  )
}

function RunPanel() {
  return (
    <div className="-mx-4 flex flex-col gap-6 rounded-t-3xl border-t border-border-subtle bg-surface-sheet px-4 pt-3 pb-6">
      <span aria-hidden="true" className="mx-auto h-1 w-10 rounded-full bg-border" />

      <ul className="flex border-b border-border-subtle">
        {panelTabs.map((tab, index) => (
          <li key={tab} className="flex-1">
            <button
              type="button"
              aria-current={index === 0 ? 'page' : undefined}
              className={`w-full border-b-2 py-3 ${index === 0 ? 'border-accent font-semibold text-accent' : 'border-transparent text-text-muted'}`}
            >
              {tab}
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-3xl font-semibold text-text-strong">{run.character}</h3>
        <p className="text-text-muted">{run.classAndLevel}</p>
      </div>

      <dl className="grid grid-cols-4 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className={`flex flex-col gap-1 rounded-lg border bg-surface-card p-3 ${stat.highlighted ? 'border-border-accent' : 'border-border-subtle'}`}
          >
            <dt className={`label-caps ${stat.highlighted ? 'text-accent' : 'text-text-muted'}`}>{stat.name}</dt>
            <dd className="text-2xl font-semibold text-text-strong">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-2">
        {/* On the sheet, so text-muted rather than text-faint. */}
        <h4 className="label-caps text-text-muted">Equipped</h4>
        <ul className="divide-y divide-border-list">
          {equipped.map((item) => (
            <li key={item.name} className="flex justify-between gap-3 py-3">
              <span>{item.name}</span>
              <span className="text-text-muted">{item.detail}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-label text-text-muted">
        Updated from your conversations. Tell the companion about changes and it keeps this current.
      </p>
    </div>
  )
}

function SignIn() {
  const emailId = useId()
  const passwordId = useId()
  const rememberId = useId()

  return (
    <AccountLayout
      fullPage={false}
      eyebrow="Your journey continues"
      cardTitle="Sign in"
      footer={
        <>
          New here?{' '}
          <a href="#create-account" className="font-semibold text-accent-bright underline">
            Begin a new journey
          </a>
        </>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={(event) => event.preventDefault()}>
        <div className="flex flex-col gap-2">
          <label htmlFor={emailId} className="label-caps text-text-muted">
            Email
          </label>
          {/* On a card, inputs use the page background (web/design/README.md). */}
          <input id={emailId} type="email" autoComplete="email" className="rounded-md border border-border bg-bg px-4 py-3" />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={passwordId} className="label-caps text-text-muted">
            Password
          </label>
          <input
            id={passwordId}
            type="password"
            autoComplete="current-password"
            className="rounded-md border border-border bg-bg px-4 py-3"
          />
        </div>

        <div className="flex items-center gap-3">
          <input id={rememberId} type="checkbox" defaultChecked className="size-5 accent-accent" />
          <label htmlFor={rememberId}>Keep me signed in on this device</label>
        </div>

        <Button type="submit" variant="primary" className="font-display text-xl tracking-wide">
          Enter
        </Button>

        <a href="#forgot-password" className="text-center text-accent-bright underline">
          Forgot password?
        </a>
      </form>
    </AccountLayout>
  )
}
