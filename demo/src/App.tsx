import { useState } from 'react';
import type { QuoinBlock } from 'quoin-editor';
import { AccentPicker } from './components/AccentPicker';
import { CodeSample } from './components/CodeSample';
import { EditorDemo } from './components/EditorDemo';
import { Header, NPM_URL, REPO_URL } from './components/Header';
import { Section } from './components/Section';
import { useTheme } from './components/useTheme';
import { seedBlocks } from './seed';
import { DARK_MODE, DEFINE_BLOCK, QUICKSTART, THEME_CSS } from './snippets';

function newBookmark(): QuoinBlock {
  return {
    id: crypto.randomUUID(),
    type: 'BOOKMARK',
    data: { url: REPO_URL, title: 'Quoin on GitHub' },
  };
}

export function App() {
  const { dark, toggle } = useTheme();
  const [blocks, setBlocks] = useState<QuoinBlock[]>(seedBlocks);
  const [revision, setRevision] = useState(0);

  function reset() {
    setBlocks(seedBlocks);
    setRevision((current) => current + 1);
  }

  function addBookmark() {
    setBlocks((current) => [...current, newBookmark()]);
    document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <Header dark={dark} onToggleTheme={toggle} />
      <main id="top" className="page">
        <section className="hero">
          <p className="eyebrow">A React block editor</p>
          <h1>Documents made of blocks you can actually shape.</h1>
          <p className="lede">
            Typed blocks, drag to reorder, a markdown surface with a slash palette, and a registry that lets you add your own.
            This is the real package, installed from npm. Type into it.
          </p>
        </section>

        <EditorDemo blocks={blocks} revision={revision} onChange={setBlocks} onReset={reset} />

        <Section id="install" title="Install" lede="Quoin needs React 18.2 or later, and TypeScript 5.4 or later if you use TypeScript.">
          <CodeSample label="npm" code="npm install quoin-editor" />
          <CodeSample label="yarn" code="yarn add quoin-editor" />
          <p className="note">
            The project is called Quoin. The package is <code>quoin-editor</code>, because npm rejects the bare name as too similar to an existing package.
          </p>
        </Section>

        <Section id="quickstart" title="Quickstart" lede="A document is an array of blocks, each with an id, a type and some data. BlockCanvas behaves like a controlled input.">
          <CodeSample label="Editor.tsx" code={QUICKSTART} />
        </Section>

        <Section
          id="blocks"
          title="The block registry"
          lede="Five block types ship by default. Anything else is a definition built with defineBlock. The Bookmark block in the editor above is exactly this, registered by this page."
        >
          <CodeSample label="Bookmark.tsx" code={DEFINE_BLOCK} />
          <div className="actions">
            <button type="button" className="primary-button" onClick={addBookmark}>
              Add a Bookmark to the editor
            </button>
            <span className="note">Or press / in the editor and pick Bookmark.</span>
          </div>
          <p className="note">
            This page also overrides the MARKDOWN preview with a small renderer, which is how you bring your own markdown pipeline. Quoin edits markdown and never renders it itself.
          </p>
        </Section>

        <Section
          id="theming"
          title="Theming"
          lede="The stylesheet is driven by CSS custom properties. Override any of them from your own CSS, and dark mode follows a .dark class on an ancestor."
        >
          <h3>Try it</h3>
          <p className="note">Both controls change this whole page, editor included.</p>
          <div className="actions">
            <button type="button" className="primary-button" onClick={toggle} aria-pressed={dark}>
              {dark ? 'Switch to light' : 'Switch to dark'}
            </button>
            <AccentPicker />
          </div>
          <CodeSample label="Override a token" code={THEME_CSS} />
          <CodeSample label="Dark mode" code={DARK_MODE} />
          <p className="note">
            Quoin does not reset your page. Its reset is scoped to a <code>.quoin</code> element, so your headings, lists and buttons keep their own styles.
          </p>
        </Section>
      </main>

      <footer className="site-footer">
        <a href={NPM_URL}>quoin-editor on npm</a>
        <a href={REPO_URL}>Source on GitHub</a>
        <a href={`${REPO_URL}#readme`}>Full documentation</a>
        <span>MIT licence</span>
      </footer>
    </>
  );
}
