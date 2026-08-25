// Living Galaxy server — the forum. A community lives next to the galaxy, in the
// same vault, under the same encryption, behind the same accounts.
//
// Deliberately small: boards → threads → posts, plain text, no markup engine, no
// votes, no attachments. Everything is a vault record with a hard cap, so the forum
// can never grow past what a laptop shrugs at, and the failure mode of a spammer is
// "the oldest threads fall off", never "the disk fills". Text is stored raw and
// rendered with textContent on the client — no HTML ever round-trips, which is the
// entire XSS story.
//
// Board list is seeded once and editable by editing the vault record; thread ids come
// from a counter in forum/meta. Moderation is three verbs (pin, lock, delete) because
// three verbs are what moderation is.

const CAPS = { threadsPerBoard: 200, postsPerThread: 500, title: 120, body: 4000, name: 24 };

const BOARDS = [
  { slug: 'flight-deck', title: 'Flight Deck', desc: 'General discussion — hulls, systems, stories from the black.' },
  { slug: 'trade', title: 'Trade & Industry', desc: 'Markets, mining, manufacturing, the credit and where it hides.' },
  { slug: 'combat', title: 'Combat & Bounties', desc: 'Doctrine, fits, war stories, and who shot first.' },
  { slug: 'support', title: 'Bug Reports & Support', desc: 'Something broke, or will not do what the manual says.' }
];

const clean = (s, cap) => String(s || '')
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')  // control chars; newlines and tabs live
  .trim().slice(0, cap);

export function makeForum(vault) {
  // Seed the boards once; an operator can rename them by editing the record.
  if (!vault.get('forum/meta')) vault.put('forum/meta', { seq: 0 });
  for (const b of BOARDS)
    if (!vault.get('forum/board/' + b.slug))
      vault.put('forum/board/' + b.slug, { ...b, threads: [] });

  const boardKey = slug => 'forum/board/' + String(slug || '').replace(/[^a-z0-9-]/g, '');

  /** Update a thread's summary row on its board, keeping pins on top, newest next. */
  function reindex(board, summary) {
    const b = vault.get(boardKey(board));
    if (!b) return;
    b.threads = b.threads.filter(t => t.id !== summary.id);
    if (!summary.deleted) b.threads.push(summary);
    b.threads.sort((x, y) => (y.pinned - x.pinned) || (y.last - x.last));
    // The cap evicts from the tail — the oldest unpinned conversation, which is the
    // right thing to lose and the reason spam cannot fill a disk.
    while (b.threads.length > CAPS.threadsPerBoard) {
      const idx = b.threads.map(t => t.pinned).lastIndexOf(false);
      const cut = b.threads.splice(idx === -1 ? b.threads.length - 1 : idx, 1)[0];
      vault.put('forum/thread/' + cut.id, { deleted: true });
    }
    vault.put(boardKey(board), b);
  }

  return {
    boards() {
      return BOARDS.map(b => {
        const rec = vault.get(boardKey(b.slug)) || { threads: [] };
        return { slug: b.slug, title: rec.title || b.title, desc: rec.desc || b.desc,
                 threads: rec.threads.slice(0, 50) };
      });
    },

    thread(id) {
      const t = vault.get('forum/thread/' + (id | 0));
      return (t && !t.deleted) ? t : null;
    },

    post(board, title, body, author, isAdmin) {
      const b = vault.get(boardKey(board));
      if (!b) return { err: 'no such board' };
      title = clean(title, CAPS.title); body = clean(body, CAPS.body);
      if (!title || !body) return { err: 'a thread needs a title and a first post' };
      const meta = vault.get('forum/meta');
      const id = ++meta.seq;
      vault.put('forum/meta', meta);
      const now = Date.now();
      vault.put('forum/thread/' + id, {
        id, board, title, author, at: now, pinned: false, locked: false,
        posts: [{ author, body, at: now, admin: !!isAdmin }]
      });
      reindex(board, { id, title, author, at: now, last: now, posts: 1, pinned: false, locked: false });
      return { ok: true, id };
    },

    reply(id, body, author, isAdmin) {
      const t = this.thread(id);
      if (!t) return { err: 'no such thread' };
      if (t.locked && !isAdmin) return { err: 'thread is locked' };
      body = clean(body, CAPS.body);
      if (!body) return { err: 'an empty post is not a post' };
      const now = Date.now();
      t.posts.push({ author, body, at: now, admin: !!isAdmin });
      if (t.posts.length > CAPS.postsPerThread) t.posts.splice(1, t.posts.length - CAPS.postsPerThread);
      vault.put('forum/thread/' + t.id, t);
      reindex(t.board, { id: t.id, title: t.title, author: t.author, at: t.at,
                         last: now, posts: t.posts.length, pinned: t.pinned, locked: t.locked });
      return { ok: true };
    },

    moderate(id, op) {
      const t = this.thread(id);
      if (!t) return { err: 'no such thread' };
      if (op === 'delete') {
        vault.put('forum/thread/' + t.id, { deleted: true });
        reindex(t.board, { id: t.id, deleted: true });
        return { ok: true };
      }
      if (op === 'pin') t.pinned = !t.pinned;
      else if (op === 'lock') t.locked = !t.locked;
      else return { err: 'bad op' };
      vault.put('forum/thread/' + t.id, t);
      reindex(t.board, { id: t.id, title: t.title, author: t.author, at: t.at,
                         last: t.posts[t.posts.length - 1].at, posts: t.posts.length,
                         pinned: t.pinned, locked: t.locked });
      return { ok: true, pinned: t.pinned, locked: t.locked };
    }
  };
}
