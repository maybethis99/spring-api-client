import { useState, useEffect, useCallback, useMemo, useRef } from "react";

const DEFAULT_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8189";

const SECTIONS = [
  { name: "/boards", color: "#7F77DD", endpoints: [{ method: "GET", path: "/boards/all" }, { method: "GET", path: "/boards/{id}", hasId: true }, { method: "POST", path: "/boards/create" }] },
  { name: "/posts",  color: "#1D9E75", endpoints: [{ method: "GET", path: "/posts/all" }, { method: "GET", path: "/posts/{id}", hasId: true }, { method: "POST", path: "/posts/create" }] },
  { name: "/threads",color: "#D85A30", endpoints: [{ method: "GET", path: "/threads/all" }, { method: "GET", path: "/threads/{id}", hasId: true }, { method: "POST", path: "/threads/create" }] },
  { name: "/fakers", color: "#BA7517", endpoints: [{ method: "GET", path: "/fakers/generate" }, { method: "GET", path: "/posts/generateFakePost" }, { method: "GET", path: "/boards/generateFakeBoard" }, { method: "GET", path: "/threads/generateFakeThread" }, { method: "GET", path: "/threads/threadFactory" }] },
  { name: "/admin",  color: "#aa1111", endpoints: [{ method: "DELETE", path: "/api/admin/truncate", danger: true }] },
  { name: "/factory", color: "#6a3d9a", endpoints: [
    { method: "POST", path: "/fakers/userFactory",          hasBody: true, bodyField: "users", bodyLabel: "юзеров" },
    { method: "GET",  path: "/boards/boardFactory/{id}",    hasId: true, idLabel: "досок" },
    { method: "GET",  path: "/posts/fillThread/{id}/{count}", hasId: true, idLabel: "thread id", hasId2: true, id2Label: "постов" },
    { method: "GET",  path: "/news/startNewsFactory/{count}", hasId: true, idLabel: "count" }
  ]},
];

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = `
  :root {
    --bg: #f5f5f7;
    --bg2: #ffffff;
    --bg3: #ebebed;
    --bg-op: #f9f9fb;
    --bg-post: #ffffff;
    --text: #1c1c1e;
    --muted: #6e6e73;
    --hint: #a0a0a8;
    --border: rgba(0, 0, 0, 0.08);
    --border2: rgba(0, 0, 0, 0.14);
    --name: #1a7a6e;
    --link: #2d6fd4;
    --danger: #c0392b;
    --accent: #1c1c1e;
    --success: #1a7a3c;
    --radius: 10px;
    --radius-lg: 16px;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06);
    --shadow-md: 0 6px 20px rgba(0, 0, 0, 0.08);
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 14px;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    line-height: 1.5;
  }

  a {
    color: var(--link);
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  /* HEADER */
  .ib-header {
    background: rgba(255,255,255,0.88);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border);
    padding: 0 1rem;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .ib-header-inner {
    max-width: 1080px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 1rem;
    min-height: 60px;
  }

  .ib-logo {
    font-size: 18px;
    font-weight: 800;
    color: var(--accent);
    cursor: pointer;
    white-space: nowrap;
    user-select: none;
    letter-spacing: -0.02em;
  }

  .ib-logo span {
    color: var(--link);
  }

  .ib-breadcrumb {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--muted);
    overflow: hidden;
  }

  .ib-breadcrumb-sep {
    color: var(--hint);
    margin: 0 2px;
  }

  .ib-breadcrumb-link {
    cursor: pointer;
    color: var(--muted);
    white-space: nowrap;
    font-size: 12px;
  }

  .ib-breadcrumb-link:hover {
    color: var(--text);
  }

  .ib-breadcrumb-cur {
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
  }

  .ib-nav-spacer {
    flex: 1;
  }

  .ib-nav-tabs {
    display: flex;
    gap: 8px;
  }

  .ib-tab {
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    padding: 8px 14px;
    border: 1px solid transparent;
    border-radius: 999px;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    transition: 0.18s ease;
    white-space: nowrap;
  }

  .ib-tab:hover {
    background: var(--bg3);
    color: var(--text);
  }

  .ib-tab.active {
    background: var(--bg2);
    color: var(--text);
    border-color: var(--border);
    box-shadow: var(--shadow-sm);
  }

  /* LAYOUT */
  .ib-main {
    max-width: 1080px;
    margin: 0 auto;
    padding: 20px 16px 40px;
  }

  /* HOME */
  .home-banner {
    background: linear-gradient(180deg, var(--bg2), var(--bg-op));
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    padding: 16px 18px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .home-banner-title {
    font-size: 22px;
    font-weight: 800;
    color: var(--accent);
    letter-spacing: -0.03em;
  }

  .home-banner-sub {
    font-size: 13px;
    color: var(--muted);
    margin-top: 4px;
  }

  .home-banner-tag {
    font-size: 12px;
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--bg2);
    color: var(--muted);
    white-space: nowrap;
  }

  .boards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
  }

  .board-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    padding: 14px;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  }

  .board-card:hover {
    transform: translateY(-1px);
    border-color: var(--border2);
    box-shadow: var(--shadow-md);
  }

  .board-tag {
    font-size: 11px;
    color: var(--hint);
    margin-bottom: 6px;
  }

  .board-name {
    font-size: 14px;
    font-weight: 700;
    color: var(--accent);
    margin-bottom: 4px;
  }

  .board-desc {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.5;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .board-meta {
    margin-top: 10px;
  }

  .board-stat {
    font-size: 11px;
    color: var(--hint);
  }

  /* PAGE HEADER */
  .page-header {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    padding: 14px 16px;
    margin-bottom: 14px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .page-title {
    font-size: 20px;
    font-weight: 800;
    color: var(--accent);
    letter-spacing: -0.02em;
  }

  .page-sub {
    font-size: 12px;
    color: var(--muted);
    margin-top: 4px;
  }

  /* THREAD LIST */
  .thread-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .thread-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    padding: 10px 12px;
    cursor: pointer;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  }

  .thread-card:hover {
    transform: translateY(-1px);
    border-color: var(--border2);
    box-shadow: var(--shadow-md);
  }

  .thread-num {
    font-size: 11px;
    color: var(--hint);
    min-width: 28px;
    flex-shrink: 0;
    padding-top: 2px;
  }

  .thread-body {
    flex: 1;
    min-width: 0;
  }

  .thread-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--accent);
    margin-bottom: 3px;
  }

  .thread-preview {
    font-size: 12px;
    color: var(--muted);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .thread-arrow {
    font-size: 16px;
    color: var(--hint);
    flex-shrink: 0;
  }

  /* POSTS */
  .post-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .post-card {
    background: var(--bg-post);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    padding: 12px 14px 14px;
    display: block;
    width: 100%;
  }

  .post-card:first-child {
    background: linear-gradient(180deg, var(--bg-op), var(--bg2));
  }

  .post-card.reply-target {
    border-color: rgba(37, 99, 235, 0.45);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
  }

  .post-head {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 10px;
    flex-wrap: wrap;
    border-bottom: 1px solid var(--border);
    padding-bottom: 8px;
  }

  .post-author {
    font-size: 14px;
    font-weight: 700;
    color: var(--name);
  }

  .post-no {
    font-size: 12px;
    color: var(--link);
    cursor: pointer;
  }

  .post-no:hover {
    color: var(--text);
  }

  .post-date {
    font-size: 11px;
    color: var(--hint);
    margin-left: auto;
  }

  .post-reply-btn {
    font-size: 11px;
    font-family: inherit;
    padding: 4px 8px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--bg3);
    color: var(--muted);
    cursor: pointer;
  }

  .post-reply-btn:hover {
    color: var(--text);
    border-color: var(--border2);
  }

  .post-body {
    font-size: 14px;
    line-height: 1.7;
    color: var(--text);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .post-greentext {
    color: var(--success);
  }

  .post-image {
    margin-top: 10px;
    max-width: 350px;
    max-height: 280px;
    border: 1px solid var(--border);
    border-radius: 12px;
    display: block;
    cursor: pointer;
    object-fit: cover;
  }

  .post-image:hover {
    opacity: 0.92;
  }

  /* QUOTE / REPLY REF */
  .post-quote {
    display: block;
    color: var(--link);
    font-size: 12px;
    cursor: pointer;
    margin-bottom: 4px;
  }

  .post-quote:hover {
    text-decoration: underline;
  }

  .post-quote-block {
    border-left: 3px solid var(--link);
    padding: 6px 10px;
    margin-bottom: 8px;
    background: var(--bg3);
    border-radius: 8px;
    font-size: 12px;
    color: var(--muted);
    cursor: pointer;
  }

  .post-quote-block:hover {
    border-left-color: var(--danger);
  }

  /* FORMS */
  .form-box {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    padding: 14px 16px;
    margin-bottom: 14px;
  }

  .form-box-title {
    font-size: 12px;
    font-weight: 700;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    user-select: none;
  }

  .form-box-title:hover {
    color: var(--link);
  }

  .form-toggle-icon {
    font-size: 10px;
    color: var(--hint);
  }

  .form-row {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    align-items: flex-start;
  }

  .form-label {
    font-size: 12px;
    color: var(--muted);
    min-width: 70px;
    padding-top: 8px;
    text-align: right;
    flex-shrink: 0;
  }

  .form-input,
  .form-textarea,
  .form-select {
    font-family: inherit;
    font-size: 13px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--bg2);
    color: var(--text);
    width: 100%;
  }

  .form-input:focus,
  .form-textarea:focus {
    outline: none;
    border-color: rgba(37, 99, 235, 0.35);
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
  }

  .form-textarea {
    resize: vertical;
    min-height: 90px;
  }

  .form-btn {
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    padding: 9px 14px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--bg3);
    color: var(--text);
    cursor: pointer;
  }

  .form-btn:hover {
    border-color: var(--border2);
  }

  .form-btn.primary {
    background: var(--link);
    color: #fff;
    border-color: var(--link);
  }

  .form-btn.primary:hover {
    opacity: 0.92;
  }

  .form-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .form-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 6px;
    flex-wrap: wrap;
  }

  .form-error {
    font-size: 12px;
    color: var(--danger);
  }

  .form-ok {
    font-size: 12px;
    color: var(--success);
  }

  .reply-banner {
    background: var(--bg3);
    border: 1px solid var(--border);
    border-left: 3px solid var(--link);
    border-radius: 12px;
    padding: 8px 10px;
    margin-bottom: 10px;
    font-size: 12px;
    color: var(--muted);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .reply-banner-close {
    cursor: pointer;
    color: var(--danger);
    font-size: 14px;
    background: none;
    border: none;
    font-family: inherit;
  }

  /* SHARED */
  .section-label {
    font-size: 11px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 8px;
    padding-left: 8px;
    border-left: 3px solid var(--border2);
  }

  .empty-state,
  .loading-state,
  .error-state {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
  }

  .empty-state {
    padding: 2.5rem;
    text-align: center;
    color: var(--muted);
    font-size: 13px;
  }

  .loading-state {
    padding: 1.5rem;
    text-align: center;
    color: var(--hint);
    font-size: 13px;
  }

  .error-state {
    padding: 12px 14px;
    color: var(--danger);
    font-size: 13px;
    border-color: rgba(220, 38, 38, 0.25);
  }

  .count-pill {
    font-size: 12px;
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--bg3);
    color: var(--muted);
    white-space: nowrap;
  }

  /* ADMIN */
  .app {
    max-width: 980px;
    margin: 0 auto;
    padding: 1rem;
  }

  .top-bar {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 1rem;
  }

  .base-input {
    flex: 1;
    font-family: inherit;
    font-size: 13px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--bg2);
    color: var(--text);
  }

  .base-input:focus {
    outline: none;
    border-color: rgba(37, 99, 235, 0.35);
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
  }

  .badge {
    font-size: 11px;
    padding: 5px 9px;
    border-radius: 999px;
    font-family: inherit;
    font-weight: 700;
    white-space: nowrap;
    border: 1px solid transparent;
  }

  .badge-get {
    background: rgba(37, 99, 235, 0.10);
    color: #1d4ed8;
    border-color: rgba(37, 99, 235, 0.16);
  }

  .badge-post {
    background: rgba(22, 163, 74, 0.10);
    color: #15803d;
    border-color: rgba(22, 163, 74, 0.16);
  }

  .badge-delete {
    background: rgba(220, 38, 38, 0.10);
    color: #b91c1c;
    border-color: rgba(220, 38, 38, 0.16);
  }

  .badge-factory {
    background: rgba(139, 92, 246, 0.10);
    color: #7c3aed;
    border-color: rgba(139, 92, 246, 0.16);
  }

  .sections {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 12px;
    margin-bottom: 1rem;
  }

  .section {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    padding: 12px 14px;
  }

  .section-title {
    font-size: 11px;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
  }

  .btn-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }

  .btn-row:last-child {
    margin-bottom: 0;
  }

  .endpoint-btn {
    flex: 1;
    font-family: inherit;
    font-size: 12px;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--bg3);
    color: var(--text);
    cursor: pointer;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: 0.15s ease;
  }

  .endpoint-btn:hover {
    border-color: var(--border2);
    background: var(--bg-op);
  }

  .endpoint-btn:active {
    transform: scale(0.985);
  }

  .endpoint-btn.danger {
    color: var(--danger);
    border-color: rgba(220, 38, 38, 0.24);
  }

  .endpoint-btn.danger:hover {
    background: rgba(220, 38, 38, 0.06);
  }

  .id-input {
    width: 58px;
    font-family: inherit;
    font-size: 12px;
    padding: 8px 8px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--bg2);
    color: var(--text);
    text-align: center;
  }

  .id-input:focus {
    outline: none;
    border-color: rgba(37, 99, 235, 0.35);
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
  }

  .id-input::placeholder {
    color: var(--hint);
    font-size: 11px;
  }

  .response-area {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    padding: 14px;
    min-height: 180px;
  }

  .response-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .response-label {
    font-size: 11px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
  }

  .status-pill {
    font-size: 11px;
    padding: 5px 9px;
    border-radius: 999px;
    font-family: inherit;
    font-weight: 700;
  }

  .status-ok {
    background: rgba(22, 163, 74, 0.10);
    color: #15803d;
    border: 1px solid rgba(22, 163, 74, 0.16);
  }

  .status-err {
    background: rgba(220, 38, 38, 0.10);
    color: #b91c1c;
    border: 1px solid rgba(220, 38, 38, 0.16);
  }

  .status-idle {
    background: var(--bg3);
    color: var(--hint);
    border: 1px solid var(--border);
  }

  .req-line {
    font-size: 12px;
    color: var(--hint);
    margin-bottom: 8px;
    word-break: break-all;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  .response-body {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.6;
  }

  .clear-btn {
    font-size: 11px;
    font-family: inherit;
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
  }

  .clear-btn:hover {
    color: var(--text);
    border-color: var(--border2);
    background: var(--bg3);
  }

  /* USERS TABLE */
  .users-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .users-table th {
    background: var(--bg-op);
    border: 1px solid var(--border);
    padding: 10px 12px;
    text-align: left;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    white-space: nowrap;
  }

  .users-table td {
    border: 1px solid var(--border);
    padding: 10px 12px;
    background: var(--bg2);
    vertical-align: top;
  }

  .users-table tr:nth-child(even) td {
    background: var(--bg3);
  }

  .users-table tr:hover td {
    background: var(--bg-op);
  }

  .user-id {
    font-size: 11px;
    color: var(--hint);
  }

  .user-name {
    font-weight: 700;
    color: var(--accent);
  }

  .user-pokemon {
    font-size: 12px;
    color: var(--name);
  }

  .user-code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
    color: var(--muted);
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0f0f11;
      --bg2: #1c1c1e;
      --bg3: #2c2c2e;
      --bg-op: #1a1a1c;
      --bg-post: #1c1c1e;
      --text: #f2f2f7;
      --muted: #98989f;
      --hint: #636366;
      --border: rgba(255, 255, 255, 0.08);
      --border2: rgba(255, 255, 255, 0.14);
      --name: #34c789;
      --link: #5e9cf3;
      --danger: #ff453a;
      --accent: #f2f2f7;
      --success: #30d158;
      --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
      --shadow-md: 0 6px 20px rgba(0, 0, 0, 0.4);
    }

    .ib-header {
      background: rgba(15, 15, 17, 0.88);
    }
  }

  @media (max-width: 720px) {
    .ib-header-inner {
      min-height: auto;
      padding: 12px 0;
      flex-wrap: wrap;
    }

    .ib-nav-spacer {
      display: none;
    }

    .home-banner,
    .page-header,
    .top-bar,
    .response-header,
    .form-row,
    .btn-row {
      flex-direction: column;
      align-items: stretch;
    }

    .form-label {
      min-width: auto;
      text-align: left;
      padding-top: 0;
    }

    .post-date {
      margin-left: 0;
    }

    .id-input {
      width: 100%;
    }
  }

  /* LOGIN */
  .login-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: var(--bg);
  }

  .login-card {
    width: 100%;
    max-width: 380px;
  }

  .login-logo {
    text-align: center;
    margin-bottom: 24px;
  }

  .login-logo-text {
    font-size: 26px;
    font-weight: 800;
    color: var(--accent);
    letter-spacing: -0.03em;
  }

  .login-logo-sub {
    font-size: 13px;
    color: var(--muted);
    margin-top: 4px;
  }

  .login-divider {
    border: none;
    border-top: 1px solid var(--border);
    margin: 14px 0;
  }

  .login-skip {
    text-align: center;
    margin-top: 14px;
  }

  .login-skip-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 12px;
    color: var(--muted);
    font-family: inherit;
    transition: color 0.15s;
  }

  .login-skip-btn:hover {
    color: var(--link);
  }

  .auth-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--muted);
  }

  .auth-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--success);
    flex-shrink: 0;
  }

  .auth-dot.offline {
    background: var(--hint);
  }

  .logout-btn {
    font-family: inherit;
    font-size: 11px;
    padding: 5px 10px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    white-space: nowrap;
    transition: 0.15s ease;
  }

  .logout-btn:hover {
    color: var(--danger);
    border-color: rgba(220, 38, 38, 0.35);
  }
`;

// ─── UTILS ───────────────────────────────────────────────────────────────────
function useApi(baseUrl, token) {
  const get = useCallback(async (path) => {
    const url = baseUrl.replace(/\/$/, "") + path;
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, [baseUrl, token]);

  const post = useCallback(async (path, body) => {
    const url = baseUrl.replace(/\/$/, "") + path;
    const headers = { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) };
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, [baseUrl, token]);

  const del = useCallback(async (path) => {
    const url = baseUrl.replace(/\/$/, "") + path;
    const headers = { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) };
    const res = await fetch(url, { method: "DELETE", headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get("content-type") || "";
    return ct.includes("json") ? res.json() : res.text();
  }, [baseUrl, token]);

  return useMemo(() => ({ get, post, del }), [get, post, del]);
}

function formatDate(val) {
  if (!val) return "";
  try { return new Date(val).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  catch { return String(val); }
}

function pick(obj, ...keys) {
  if (!obj || typeof obj !== "object") return undefined;
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  return undefined;
}

function getBoardName(b) { return pick(b, "name", "title", "label", "boardName") || `Board #${b.id}`; }
function getBoardDesc(b) { return pick(b, "description", "desc", "about", "subtitle") || ""; }
function getThreadTitle(t) { return pick(t, "title", "subject", "name", "header") || `Thread #${t.id}`; }
function getThreadPreview(t) { const body = pick(t, "body", "content", "text", "message"); return body ? String(body).slice(0, 80) : ""; }
function getAuthor(item) {
  const user = item.user || item.author || item.poster || {};
  return pick(user, "name", "username", "nickname", "login")
    || pick(item, "userName", "username", "authorName", "nickname", "poster", "author")
    || "Anonymous";
}
function getPostBody(p) { return pick(p, "body", "content", "text", "message") || ""; }
function getImgUrl(item) {
  const url = pick(item, "imgUrl", "img_url", "imageUrl", "image") || null;
  return url ? url.replace("http://minio:9000", "http://localhost:9000") : null;
}

function normalizeList(res) {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.payload?.content)) return res.payload.content;
  if (res && Array.isArray(res.payload?.items)) return res.payload.items;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && Array.isArray(res.items)) return res.items;
  if (res && Array.isArray(res.content)) return res.content;
  if (res && Array.isArray(res.boards)) return res.boards;
  if (res && Array.isArray(res.threads)) return res.threads;
  if (res && Array.isArray(res.posts)) return res.posts;
  return [];
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function PostBody({ text, posts, onQuoteClick }) {
  const lines = String(text).split("\n");
  return (
    <div className="post-body">
      {lines.map((line, i) => {
        // >>123 — ссылка на пост
        const refMatch = line.match(/^>>(\d+)/);
        if (refMatch) {
          const refId = parseInt(refMatch[1]);
          const refPost = posts?.find(p => p.id === refId);
          return (
            <span key={i}>
              <span
                className="post-quote"
                onClick={() => onQuoteClick?.(refId)}
              >
                {line}
              </span>
              {refPost && (
                <span
                  className="post-quote-block"
                  onClick={() => onQuoteClick?.(refId)}
                >
                  <b>{getAuthor(refPost)}</b>: {String(getPostBody(refPost)).slice(0, 100)}
                </span>
              )}
              {i < lines.length - 1 && "\n"}
            </span>
          );
        }
        return (
          <span key={i}>
            {line.startsWith(">")
              ? <span className="post-greentext">{line}</span>
              : line}
            {i < lines.length - 1 && "\n"}
          </span>
        );
      })}
    </div>
  );
}

function LoadingBlock() { return <div className="loading-state" data-testid="loading-state">загрузка...</div>; }
function ErrorBlock({ msg }) { return <div className="error-state" data-testid="error-state">⚠ {msg}</div>; }
function EmptyBlock({ text }) { return <div className="empty-state" data-testid="empty-state">{text || "пусто"}</div>; }

function NewsFeed({ api, onThread }) {
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get("/news/all?page=0&limit=6")
      .then((r) => setNews(normalizeList(r).filter(n => !n.deleted)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div className="section-label">новости</div>
        <LoadingBlock />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div className="section-label">новости</div>
        <ErrorBlock msg={error} />
      </div>
    );
  }

  if (!news || news.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 16 }} data-testid="news-feed">
      <div className="section-label">новости</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {news.map((item, i) => {
          const imgUrl = getImgUrl(item);
          return (
          <div
            key={item.id ?? i}
            data-testid="news-item"
            data-news-id={item.id ?? i}
            style={{
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-sm)",
              padding: "10px 12px",
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            {imgUrl && (
              <img
                src={imgUrl}
                alt="news"
                style={{
                  width: 72,
                  height: 72,
                  objectFit: "cover",
                  border: "1px solid var(--border)",
                  flexShrink: 0,
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: "bold", color: "var(--link)", marginBottom: 4 }}>
                {item.title || `News #${item.id}`}
              </div>
              <div style={{ fontSize: 11, color: "var(--hint)", marginBottom: 4 }}>
                {item.author || "system"} • {formatDate(item.created)}
              </div>
              <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5 }}>
                {String(item.content || "").slice(0, 220)}
                {String(item.content || "").length > 220 ? "..." : ""}
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── FORM: CREATE THREAD ─────────────────────────────────────────────────────
function CreateThreadForm({ api, boardId, onCreated, baseUrl }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [userId, setUserId] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(false);
  const fileRef = useRef(null);
  const previewUrlRef = useRef(null);

  useEffect(() => () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); }, []);

  const onFile = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = file ? URL.createObjectURL(file) : null;
    previewUrlRef.current = url;
    setImage(file);
    setPreview(url);
  };

  const clearImage = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setImage(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    if (!content.trim()) { setErr("Введите текст"); return; }
    setLoading(true); setErr(null); setOk(false);
    try {
      // 1. Создаём тред с вложенным постом
      const res = await api.post("/threads/create", {
        boardId,
        title: title.trim() || null,
        post: {
          content: content.trim(),
          author: author.trim() || "Anonymous",
          userId: userId.trim() ? Number(userId.trim()) : null,
        },
      });
      // 2. Если выбрано изображение — загружаем отдельным запросом
      const threadId = res?.payload?.id ?? res?.data?.id ?? res?.id;
      if (image && threadId) {
        const fd = new FormData();
        fd.append("image", image);
        await fetch(`${baseUrl.replace(/\/$/, "")}/threads/${threadId}/image`, { method: "POST", body: fd });
      }
      setOk(true);
      setTitle(""); setContent(""); setAuthor(""); setUserId(""); clearImage();
      setTimeout(() => { setOk(false); setOpen(false); onCreated?.(); }, 800);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-box" style={{ marginBottom: 12 }} data-testid="create-thread-form">
      <div className="form-box-title" onClick={() => setOpen(o => !o)} data-testid="create-thread-toggle">
        <span className="form-toggle-icon">{open ? "▼" : "▶"}</span>
        Новый тред
        <span style={{ fontSize: 10, color: "var(--hint)", fontWeight: "normal", marginLeft: 6 }}>
          доска #{boardId}
        </span>
      </div>
      {open && (
        <>
          {/* ── Поля треда ── */}
          <div className="form-row">
            <span className="form-label">Тема</span>
            <input className="form-input" data-testid="thread-title-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Заголовок треда (опционально)" />
          </div>

          {/* ── Первый пост ── */}
          <div style={{ fontSize: 10, color: "var(--hint)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "8px 0 6px", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
            первый пост
          </div>
          <div className="form-row">
            <span className="form-label">Имя</span>
            <input className="form-input" data-testid="thread-author-input" value={author} onChange={e => setAuthor(e.target.value)} placeholder="Anonymous" />
          </div>
          <div className="form-row">
            <span className="form-label">User ID</span>
            <input className="form-input" data-testid="thread-userid-input" value={userId} onChange={e => setUserId(e.target.value)} placeholder="ID пользователя (опционально)" type="number" />
          </div>
          <div className="form-row">
            <span className="form-label">Текст</span>
            <textarea
              className="form-textarea"
              data-testid="thread-content-textarea"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Текст первого поста... (Ctrl+Enter для отправки)"
              onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); } }}
            />
          </div>
          <div className="form-row">
            <span className="form-label">Файл</span>
            <div style={{ flex: 1 }}>
              <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="form-input" data-testid="thread-file-input" style={{ padding: "3px 7px" }} />
              {preview && (
                <div style={{ marginTop: 6, display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <img src={preview} alt="preview" data-testid="thread-image-preview" style={{ maxWidth: 120, maxHeight: 90, border: "1px solid var(--border)", objectFit: "cover" }} />
                  <button className="form-btn" onClick={clearImage} style={{ fontSize: 10 }}>✕ убрать</button>
                </div>
              )}
            </div>
          </div>
          <div className="form-actions">
            <button className="form-btn primary" data-testid="thread-submit-btn" onClick={submit} disabled={loading}>
              {loading ? "Отправка..." : "Создать тред"}
            </button>
            {err && <span className="form-error" data-testid="thread-form-error">{err}</span>}
            {ok && <span className="form-ok" data-testid="thread-form-ok">✓ Тред создан</span>}
          </div>
        </>
      )}
    </div>
  );
}

// ─── FORM: REPLY POST ────────────────────────────────────────────────────────
function ReplyForm({ api, threadId, replyTo, replyToPost, onClearReply, onCreated, baseUrl }) {
  const [open, setOpen] = useState(true);
  const [content, setContent] = useState(replyTo ? `>>${replyTo}\n` : "");
  const [author, setAuthor] = useState("");
  const [userId, setUserId] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(false);
  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  const previewUrlRef = useRef(null);

  useEffect(() => () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); }, []);

  useEffect(() => {
    if (replyTo) {
      setContent(prev => {
        const ref = `>>${replyTo}\n`;
        return prev.includes(ref) ? prev : ref + prev;
      });
      setOpen(true);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [replyTo]);

  const onFile = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = file ? URL.createObjectURL(file) : null;
    previewUrlRef.current = url;
    setImage(file);
    setPreview(url);
  };

  const clearImage = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setImage(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    if (!content.trim()) { setErr("Введите текст"); return; }
    setLoading(true); setErr(null); setOk(false);
    try {
      // 1. Создаём пост
      const res = await api.post("/posts/create", {
        threadId,
        content: content.trim(),
        author: author.trim() || "Anonymous",
        userId: userId.trim() ? Number(userId.trim()) : null,
        parentId: replyTo ?? null,
      });
      // 2. Загружаем картинку если выбрана
      const postId = res?.payload?.id ?? res?.data?.id ?? res?.id;
      if (image && postId) {
        const fd = new FormData();
        fd.append("image", image);
        await fetch(`${baseUrl.replace(/\/$/, "")}/posts/${postId}/image`, { method: "POST", body: fd });
      }
      setOk(true);
      setContent(""); setAuthor(""); setUserId(""); clearImage();
      onClearReply?.();
      setTimeout(() => { setOk(false); onCreated?.(); }, 600);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-box" style={{ marginBottom: 12 }} data-testid="reply-form">
      <div className="form-box-title" onClick={() => setOpen(o => !o)} data-testid="reply-form-toggle">
        <span className="form-toggle-icon">{open ? "▼" : "▶"}</span>
        Ответить в тред
      </div>
      {open && (
        <>
          {replyTo && replyToPost && (
            <div className="reply-banner" data-testid="reply-banner">
              <span>Ответ на <b>No.{replyTo}</b> — {getAuthor(replyToPost)}: {String(getPostBody(replyToPost)).slice(0, 60)}...</span>
              <button className="reply-banner-close" data-testid="reply-banner-close" onClick={onClearReply}>✕</button>
            </div>
          )}
          <div className="form-row">
            <span className="form-label">Имя</span>
            <input className="form-input" data-testid="reply-author-input" value={author} onChange={e => setAuthor(e.target.value)} placeholder="Anonymous" />
          </div>
          <div className="form-row">
            <span className="form-label">User ID</span>
            <input className="form-input" data-testid="reply-userid-input" value={userId} onChange={e => setUserId(e.target.value)} placeholder="ID пользователя (опционально)" type="number" />
          </div>
          <div className="form-row">
            <span className="form-label">Текст</span>
            <textarea
              ref={textareaRef}
              className="form-textarea"
              data-testid="reply-content-textarea"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Текст поста... (>>123 для цитаты, Ctrl+Enter для отправки)"
              onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); } }}
            />
          </div>
          <div className="form-row">
            <span className="form-label">Файл</span>
            <div style={{ flex: 1 }}>
              <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="form-input" data-testid="reply-file-input" style={{ padding: "3px 7px" }} />
              {preview && (
                <div style={{ marginTop: 6, display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <img src={preview} alt="preview" data-testid="reply-image-preview" style={{ maxWidth: 120, maxHeight: 90, border: "1px solid var(--border)", objectFit: "cover" }} />
                  <button className="form-btn" onClick={clearImage} style={{ fontSize: 10 }}>✕ убрать</button>
                </div>
              )}
            </div>
          </div>
          <div className="form-actions">
            <button className="form-btn primary" data-testid="reply-submit-btn" onClick={submit} disabled={loading}>
              {loading ? "Отправка..." : "Отправить"}
            </button>
            {err && <span className="form-error" data-testid="reply-form-error">{err}</span>}
            {ok && <span className="form-ok" data-testid="reply-form-ok">✓ Отправлено</span>}
          </div>
        </>
      )}
    </div>
  );
}

// ─── HOME PAGE ───────────────────────────────────────────────────────────────
function HomePage({ api, onBoard, onThread }) {
  const [boards, setBoards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [randomThreads, setRandomThreads] = useState(null);
  const [randomLoading, setRandomLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true); setError(null); setBoards(null);
    api.get("/boards/all")
      .then(r => setBoards(normalizeList(r)))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [api]);

  const loadRandom = useCallback(() => {
    setRandomLoading(true);
    api.get("/threads/all")
      .then(r => {
        const all = normalizeList(r);
        // перемешиваем и берём 10
        const shuffled = [...all].sort(() => Math.random() - 0.5).slice(0, 10);
        setRandomThreads(shuffled);
      })
      .catch(() => setRandomThreads([]))
      .finally(() => setRandomLoading(false));
  }, [api]);

  useEffect(() => { load(); loadRandom(); }, [load, loadRandom]);

  return (
    <div className="ib-main" data-testid="home-page">
      <div className="home-banner" data-testid="home-banner">
        <div>
          <div className="home-banner-title">// imageboard</div>
          <div className="home-banner-sub">выбери доску чтобы начать</div>
        </div>
        {boards && <span className="home-banner-tag" data-testid="boards-count">{boards.length} досок</span>}
      </div>
      <NewsFeed api={api} />

      {/* Случайные треды */}
      <div style={{ marginBottom: 16 }} data-testid="random-threads-section">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div className="section-label" style={{ marginBottom: 0 }}>случайные треды</div>
          <button
            className="clear-btn"
            data-testid="random-threads-refresh"
            onClick={loadRandom}
            disabled={randomLoading}
            style={{ fontSize: 10 }}
          >↻ обновить</button>
        </div>
        {randomLoading && <div className="loading-state" data-testid="loading-state" style={{ padding: "8px 12px" }}>загрузка...</div>}
        {!randomLoading && randomThreads?.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 6 }} data-testid="random-threads-list">
            {randomThreads.map((t, i) => {
              const imgUrl = getImgUrl(t);
              return (
              <div
                key={t.id ?? i}
                data-testid="random-thread-item"
                data-thread-id={t.id ?? i}
                onClick={() => onThread(t)}
                style={{
                  background: "var(--bg2)",
                  border: "1px solid var(--border)",
                  padding: "6px 10px",
                  cursor: "pointer",
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-op)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--bg2)"}
              >
                {imgUrl && (
                  <img
                    src={imgUrl}
                    alt=""
                    style={{ width: 44, height: 44, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: "bold", color: "var(--link)", marginBottom: 2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                    {getThreadTitle(t)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                    {getThreadPreview(t) || "—"}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="section-label">доски</div>
      {loading && <LoadingBlock />}
      {error && <ErrorBlock msg={error} />}
      {!loading && !error && boards?.length === 0 && <EmptyBlock text="нет досок" />}
      {!loading && !error && boards?.length > 0 && (
        <div className="boards-grid" data-testid="boards-grid">
          {boards.map((b, i) => (
            <div className="board-card" key={b.id ?? i} data-testid="board-card" data-board-id={b.id ?? i} onClick={() => onBoard(b)}>
              <div className="board-tag" data-testid="board-tag">/{getBoardName(b).toLowerCase().replace(/\s+/g, "")}/</div>
              <div className="board-name" data-testid="board-name">{getBoardName(b)}</div>
              {getBoardDesc(b) && <div className="board-desc" data-testid="board-desc">{getBoardDesc(b)}</div>}
              <div className="board-meta"><span className="board-stat">#{b.id ?? i + 1}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PAGINATION ──────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, loading, onPage, maxButtons = Infinity }) {
  if (totalPages <= 1) return null;
  const buttons = Array.from({ length: Math.min(totalPages, maxButtons) }, (_, i) => i + 1);
  return (
    <div style={{ display: "flex", gap: 4, marginTop: 12, alignItems: "center", flexWrap: "wrap" }} data-testid="pagination">
      <button className="form-btn" data-testid="pagination-prev" onClick={() => onPage(page - 1)} disabled={page <= 1 || loading}>← пред</button>
      {buttons.map(n => (
        <button
          key={n}
          className={`form-btn${n === page ? " primary" : ""}`}
          data-testid="pagination-page"
          data-page={n}
          onClick={() => onPage(n)}
          disabled={loading}
          style={{ minWidth: 32 }}
        >{n}</button>
      ))}
      {totalPages > maxButtons && <span style={{ fontSize: 11, color: "var(--hint)" }}>...{totalPages}</span>}
      <button className="form-btn" data-testid="pagination-next" onClick={() => onPage(page + 1)} disabled={page >= totalPages || loading}>след →</button>
    </div>
  );
}

// ─── BOARD PAGE ──────────────────────────────────────────────────────────────
function BoardPage({ api, board, onThread, baseUrl }) {
  const [threads, setThreads] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback((p = 1) => {
    setLoading(true); setError(null);
    api.get(`/threads/getThreadsInBoard/${board.id}?page=${p - 1}&limit=20`)
      .then(r => {
        setThreads(normalizeList(r));
        const pagination = r?.payload?.pagination ?? r?.pagination ?? null;
        if (pagination) setTotalPages(pagination.pages ?? 1);
        setPage(p);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [api, board]);

  useEffect(() => { load(1); }, [load]);

  return (
    <div className="ib-main" data-testid="board-page">
      <div className="page-header" data-testid="board-page-header">
        <div>
          <div className="page-title" data-testid="board-title">/{getBoardName(board).toLowerCase()}/</div>
          {getBoardDesc(board) && <div className="page-sub" data-testid="board-description">{getBoardDesc(board)}</div>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {threads && <span className="count-pill" data-testid="thread-count">{threads.length} тредов</span>}
          <button className="clear-btn" data-testid="refresh-btn" onClick={() => load(page)} disabled={loading} title="Обновить">↻</button>
        </div>
      </div>

      {/* Форма создания треда */}
      <CreateThreadForm api={api} boardId={board.id} onCreated={load} baseUrl={baseUrl} />

      <div className="section-label">треды</div>
      {loading && <LoadingBlock />}
      {error && <ErrorBlock msg={error} />}
      {!loading && !error && threads?.length === 0 && <EmptyBlock text="нет тредов" />}
      {!loading && !error && threads?.length > 0 && (
        <>
          <div className="thread-list" data-testid="thread-list">
            {threads.map((t, i) => {
              const imgUrl = getImgUrl(t);
              return (
              <div className="thread-card" key={t.id ?? i} data-testid="thread-card" data-thread-id={t.id ?? i} onClick={() => onThread(t)}>
                <div className="thread-num">#{(page - 1) * 20 + i + 1}</div>
                {imgUrl && (
                  <img
                    src={imgUrl}
                    alt="thread"
                    style={{ width: 56, height: 56, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }}
                    onError={(e) => { e.target.style.display = "none"; }}
                    onClick={(e) => { e.stopPropagation(); window.open(imgUrl, "_blank"); }}
                  />
                )}
                <div className="thread-body">
                  <div className="thread-title" data-testid="thread-title">{getThreadTitle(t)}</div>
                  {getThreadPreview(t) && <div className="thread-preview" data-testid="thread-preview">{getThreadPreview(t)}</div>}
                </div>
                <div className="thread-arrow">›</div>
              </div>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} loading={loading} onPage={load} />
        </>
      )}
    </div>
  );
}

// ─── THREAD PAGE ─────────────────────────────────────────────────────────────
function ThreadPage({ api, thread, baseUrl }) {
  const [posts, setPosts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [replyTo, setReplyTo] = useState(null);
  const [highlightId, setHighlightId] = useState(null);
  const postRefs = useRef({});

  const load = useCallback((p = 1) => {
    setLoading(true); setError(null);
    api.get(`/posts/getPostsInThread/${thread.id}?page=${p - 1}&limit=20`)
      .then(r => {
        const list = normalizeList(r);
        setPosts(list);
        // читаем пагинацию из ответа
        const pagination = r?.payload?.pagination ?? r?.pagination ?? null;
        if (pagination) {
          setTotalPages(pagination.pages ?? 1);
        }
        setPage(p);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [api, thread]);

  useEffect(() => { load(1); }, [load]);

  const scrollToPost = (id) => {
    const el = postRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightId(id);
      setTimeout(() => setHighlightId(null), 1500);
    }
  };

  const replyToPost = posts?.find(p => p.id === replyTo) ?? null;

  return (
    <div className="ib-main" data-testid="thread-page">
      <div className="page-header" data-testid="thread-page-header">
        <div>
          <div className="page-title" data-testid="thread-page-title">{getThreadTitle(thread)}</div>
          {getThreadPreview(thread) && <div className="page-sub">{getThreadPreview(thread)}</div>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {posts && <span className="count-pill" data-testid="post-count">{posts.length} постов</span>}
          <button className="clear-btn" data-testid="refresh-btn" onClick={() => load(page)} disabled={loading} title="Обновить">↻</button>
        </div>
      </div>

      <ReplyForm
        api={api}
        threadId={thread.id}
        replyTo={replyTo}
        replyToPost={replyToPost}
        onClearReply={() => setReplyTo(null)}
        onCreated={() => load(page)}
        baseUrl={baseUrl}
      />

      <div className="section-label">посты</div>
      {loading && <LoadingBlock />}
      {error && <ErrorBlock msg={error} />}
      {!loading && !error && posts?.length === 0 && <EmptyBlock text="нет постов" />}
      {!loading && !error && posts?.length > 0 && (
        <>
          <div className="post-list" data-testid="post-list">
            {posts.map((p, i) => {
              const imgUrl = getImgUrl(p);
              return (
              <div
                className={`post-card${highlightId === p.id ? " reply-target" : ""}`}
                key={p.id ?? i}
                data-testid="post-card"
                data-post-id={p.id ?? i}
                ref={el => { if (el && p.id) postRefs.current[p.id] = el; }}
              >
                <div className="post-head">
                  <span className="post-author" data-testid="post-author">{getAuthor(p)}</span>
                  <span className="post-no" data-testid="post-no" onClick={() => scrollToPost(p.id)}>No.{p.id ?? i + 1}</span>
                  {(p.createdAt || p.created_at || p.date || p.timestamp) && (
                    <span className="post-date" data-testid="post-date">
                      {formatDate(p.createdAt ?? p.created_at ?? p.date ?? p.timestamp)}
                    </span>
                  )}
                  <button className="post-reply-btn" data-testid="post-reply-btn" onClick={() => setReplyTo(p.id)}>[Ответить]</button>
                </div>
                <PostBody text={getPostBody(p) || "(пустой пост)"} posts={posts} onQuoteClick={scrollToPost} />
                {imgUrl && (
                  <img
                    className="post-image"
                    data-testid="post-image"
                    src={imgUrl}
                    alt="post attachment"
                    onClick={() => window.open(imgUrl, "_blank")}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                )}
              </div>
              );
            })}
          </div>

          <Pagination page={page} totalPages={totalPages} loading={loading} onPage={load} />
        </>
      )}
    </div>
  );
}

// ─── USERS PAGE ──────────────────────────────────────────────────────────────
function UsersPage({ api }) {
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const load = useCallback((p = 1) => {
    setLoading(true); setError(null);
    api.get(`/fakers/all?page=${p - 1}&limit=20`)
      .then(r => {
        setUsers(normalizeList(r));
        const pagination = r?.payload?.pagination ?? r?.pagination ?? null;
        if (pagination) {
          setTotalPages(pagination.pages ?? 1);
          setTotal(pagination.total ?? 0);
        }
        setPage(p);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [api]);

  useEffect(() => { load(1); }, [load]);

  const filtered = users?.filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(u.id).includes(q) ||
      u.name?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q) ||
      u.pokemon?.toLowerCase().includes(q) ||
      u.phoneNumber?.toLowerCase().includes(q) ||
      u.code?.includes(q)
    );
  }) ?? [];

  return (
    <div className="ib-main" data-testid="users-page">
      <div className="page-header" data-testid="users-page-header">
        <div>
          <div className="page-title">// users</div>
          <div className="page-sub">датасет пользователей</div>
        </div>
        <span className="count-pill" data-testid="users-total-count">{total} записей</span>
      </div>

      {/* Поиск по странице */}
      <div style={{ marginBottom: 10 }}>
        <input
          className="base-input"
          data-testid="users-search-input"
          style={{ maxWidth: 320, fontSize: 12, padding: "5px 8px" }}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по имени, покемону, коду..."
        />
      </div>

      {loading && <LoadingBlock />}
      {error && <ErrorBlock msg={error} />}
      {!loading && !error && filtered.length === 0 && <EmptyBlock text="нет пользователей" />}
      {!loading && !error && filtered.length > 0 && (
        <>
          <div style={{ overflowX: "auto" }}>
            <table className="users-table" data-testid="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Имя</th>
                  <th>Фамилия</th>
                  <th>Возраст</th>
                  <th>Телефон</th>
                  <th>Код</th>
                  <th>Покемон</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id ?? i} data-testid="user-row" data-user-id={u.id ?? i}>
                    <td><span className="user-id" data-testid="user-id">#{u.id}</span></td>
                    <td><span className="user-name" data-testid="user-name">{u.name}</span></td>
                    <td data-testid="user-lastname">{u.lastName}</td>
                    <td style={{ textAlign: "center" }} data-testid="user-age">{u.age}</td>
                    <td data-testid="user-phone">{u.phoneNumber}</td>
                    <td><span className="user-code" data-testid="user-code">{u.code}</span></td>
                    <td><span className="user-pokemon" data-testid="user-pokemon">{u.pokemon}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} loading={loading} onPage={load} maxButtons={20} />
        </>
      )}
    </div>
  );
}

// ─── ADMIN PANEL ─────────────────────────────────────────────────────────────
function AdminPanel({ baseUrl, setBaseUrl, token }) {
  const [ids, setIds] = useState({});
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastReq, setLastReq] = useState("");

  const handleRequest = async (method, pathTemplate, sectionName, danger = false, bodyField = null) => {
    if (danger && !window.confirm(`⚠ Вы уверены? Это действие необратимо!\n\n${method} ${pathTemplate}`)) return;
    let path = pathTemplate;
    if (path.includes("{id}")) {
      const id = ids[sectionName] || "";
      if (!id.trim()) { alert("Введите ID"); return; }
      path = path.replace("{id}", id.trim());
    }
    if (path.includes("{count}")) {
      // paths with both {id} and {count} store count in sectionName + "_count";
      // paths with only {count} (no {id}) store it in sectionName (the primary input)
      const countKey = pathTemplate.includes("{id}") ? sectionName + "_count" : sectionName;
      const count = ids[countKey] || "";
      if (!count.trim()) { alert("Введите кол-во"); return; }
      path = path.replace("{count}", count.trim());
    }
    const url = baseUrl.replace(/\/$/, "") + path;
    setLastReq(`${method} ${url}`);
    setLoading(true); setResponse(null);
    try {
      const authHeader = token ? { "Authorization": `Bearer ${token}` } : {};
      const opts = { method, headers: { "Content-Type": "application/json", ...authHeader } };
      if (method === "POST") {
        // если есть bodyField — берём из ids, иначе пустой объект
        if (bodyField) {
          const val = ids[sectionName + "_body"] || "";
          if (!val.trim()) { alert("Введите значение"); setLoading(false); return; }
          opts.body = JSON.stringify({ [bodyField]: Number(val) });
        } else {
          opts.body = "{}";
        }
      }
      const res = await fetch(url, opts);
      const ct = res.headers.get("content-type") || "";
      let body;
      if (ct.includes("json")) { const json = await res.json(); body = JSON.stringify(json, null, 2); }
      else { body = await res.text(); }
      setResponse({ status: res.status, ok: res.ok, body: body || "(пустой ответ)" });
    } catch (e) {
      setResponse({ status: "error", ok: false, body: "Ошибка: " + e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app" data-testid="admin-panel">
      <div className="top-bar">
        <span className="badge badge-get">BASE URL</span>
        <input className="base-input" data-testid="base-url-input" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="http://localhost:8080" />
      </div>
      <div className="sections" data-testid="admin-sections">
        {SECTIONS.map(section => (
          <div className="section" key={section.name} data-testid={`section-${section.name.replace("/", "").replace("/", "")}`}>
            <div className="section-title">
              <span className="dot" style={{ background: section.color }} />
              {section.name}
            </div>
            {section.endpoints.map(ep => (
              <div className="btn-row" key={ep.path}>
                <span className={`badge ${ep.method === "GET" ? "badge-get" : ep.method === "POST" && ep.hasBody ? "badge-factory" : ep.method === "POST" ? "badge-post" : "badge-delete"}`}>{ep.method}</span>
                <button
                  className={`endpoint-btn${ep.danger ? " danger" : ""}`}
                  data-testid={`endpoint-btn-${ep.path.replace(/\//g, "-").replace(/[{}]/g, "").replace(/^-/, "")}`}
                  onClick={() => handleRequest(ep.method, ep.path, section.name, ep.danger, ep.bodyField ?? null)}
                >{ep.path}</button>
                {ep.hasId && (
                  <input
                    className="id-input"
                    data-testid={`id-input-${section.name.replace("/", "").replace("/", "")}`}
                    placeholder={ep.idLabel ?? "id"}
                    value={ids[section.name] || ""}
                    onChange={e => setIds(prev => ({ ...prev, [section.name]: e.target.value }))}
                  />
                )}
                {ep.hasId2 && (
                  <input
                    className="id-input"
                    data-testid={`id-input-${section.name.replace("/", "").replace("/", "")}-count`}
                    placeholder={ep.id2Label ?? "count"}
                    type="number"
                    min="1"
                    value={ids[section.name + "_count"] || ""}
                    onChange={e => setIds(prev => ({ ...prev, [section.name + "_count"]: e.target.value }))}
                  />
                )}
                {ep.hasBody && (
                  <input
                    className="id-input"
                    data-testid={`id-input-${section.name.replace("/", "").replace("/", "")}-body`}
                    style={{ width: 52 }}
                    placeholder={ep.bodyLabel ?? "кол-во"}
                    type="number"
                    min="1"
                    value={ids[section.name + "_body"] || ""}
                    onChange={e => setIds(prev => ({ ...prev, [section.name + "_body"]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="response-area" data-testid="response-area">
        <div className="response-header">
          <span className="response-label">response</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {response && <span className={`status-pill ${response.ok ? "status-ok" : "status-err"}`} data-testid="response-status">{response.status}</span>}
            {!response && !loading && <span className="status-pill status-idle" data-testid="response-status">idle</span>}
            {loading && <span className="status-pill status-idle" data-testid="response-status">...</span>}
            <button className="clear-btn" data-testid="response-clear-btn" onClick={() => { setResponse(null); setLastReq(""); }}>clear</button>
          </div>
        </div>
        {lastReq && <div className="req-line" data-testid="request-line">{lastReq}</div>}
        <pre className="response-body" data-testid="response-body" style={{ color: loading ? "var(--hint)" : response?.ok === false ? "var(--danger)" : "var(--text)" }}>
          {loading ? "загрузка..." : response?.body ?? "нажми кнопку чтобы отправить запрос..."}
        </pre>
      </div>
    </div>
  );
}

// ─── LOGIN PAGE ──────────────────────────────────────────────────────────────
function LoginPage({ baseUrl, setBaseUrl, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (!username.trim() || !password.trim()) { setError("Введите логин и пароль"); return; }
    setLoading(true); setError(null);
    try {
      const url = baseUrl.replace(/\/$/, "") + "/api/auth/login";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username.trim(), password: password.trim() }),
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = `HTTP ${res.status}`;
        try { const j = JSON.parse(text); msg = j.message || j.error || j.detail || msg; } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      const token =
        data?.token ||
        data?.accessToken ||
        data?.access_token ||
        data?.jwt ||
        data?.payload?.token ||
        data?.payload?.accessToken;
      if (!token) throw new Error("Сервер не вернул токен");
      onLogin(token);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = e => { if (e.key === "Enter") submit(); };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-text">//<span style={{ color: "var(--link)" }}>img</span>board</div>
          <div className="login-logo-sub">вход в систему</div>
        </div>

        <div className="form-box">
          <div className="form-row">
            <span className="form-label">URL</span>
            <input
              className="form-input"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder="http://localhost:8189"
            />
          </div>

          <hr className="login-divider" />

          <div className="form-row">
            <span className="form-label">Логин</span>
            <input
              className="form-input"
              autoComplete="username"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(null); }}
              onKeyDown={handleKey}
              placeholder="username"
              autoFocus
            />
          </div>
          <div className="form-row">
            <span className="form-label">Пароль</span>
            <input
              className="form-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(null); }}
              onKeyDown={handleKey}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="form-error" style={{ marginBottom: 10, padding: "8px 10px", background: "rgba(220,38,38,0.06)", borderRadius: 10 }}>
              ⚠ {error}
            </div>
          )}

          <button
            className="form-btn primary"
            style={{ width: "100%", padding: "11px", fontSize: 14 }}
            onClick={submit}
            disabled={loading}
          >
            {loading ? "Входим..." : "Войти"}
          </button>
        </div>

        <div className="login-skip">
          <button className="login-skip-btn" onClick={() => onLogin(null)}>
            войти без авторизации →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE);
  const [view, setView] = useState("home");
  const [currentBoard, setCurrentBoard] = useState(null);
  const [currentThread, setCurrentThread] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("auth_token") || null);
  const [showLogin, setShowLogin] = useState(() => !localStorage.getItem("auth_token"));

  const api = useApi(baseUrl, token);

  const handleLogin = (tok) => {
    if (tok) {
      localStorage.setItem("auth_token", tok);
      setToken(tok);
    } else {
      setToken(null);
    }
    setShowLogin(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setShowLogin(true);
  };

  const goHome = () => { setView("home"); setCurrentBoard(null); setCurrentThread(null); };
  const goBoard = (b) => { setCurrentBoard(b); setCurrentThread(null); setView("board"); };
  const goThread = (t, board = null) => { if (board) setCurrentBoard(board); setCurrentThread(t); setView("thread"); };

  const crumbs = [];
  if (view !== "home" && view !== "admin") crumbs.push({ label: "home", action: goHome });
  if ((view === "board" || view === "thread") && currentBoard)
    crumbs.push({ label: `/${getBoardName(currentBoard).toLowerCase()}/`, action: () => goBoard(currentBoard) });
  if (view === "thread" && currentThread)
    crumbs.push({ label: getThreadTitle(currentThread), action: null });

  if (showLogin) {
    return (
      <>
        <style>{styles}</style>
        <LoginPage baseUrl={baseUrl} setBaseUrl={setBaseUrl} onLogin={handleLogin} />
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="ib-header" data-testid="header">
        <div className="ib-header-inner">
          <div className="ib-logo" data-testid="logo" onClick={goHome}>//<span>img</span>board</div>
          {crumbs.length > 0 && (
            <div className="ib-breadcrumb" data-testid="breadcrumb">
              {crumbs.map((c, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                  {i > 0 && <span className="ib-breadcrumb-sep">›</span>}
                  {c.action
                    ? <span className="ib-breadcrumb-link" data-testid="breadcrumb-link" onClick={c.action}>{c.label}</span>
                    : <span className="ib-breadcrumb-cur" data-testid="breadcrumb-current">{c.label}</span>}
                </span>
              ))}
            </div>
          )}
          <div className="ib-nav-spacer" />
          <div className="ib-nav-tabs" data-testid="nav-tabs">
            <button className={`ib-tab ${view === "home" ? "active" : ""}`} data-testid="tab-boards" onClick={goHome}>boards</button>
            <button className={`ib-tab ${view === "users" ? "active" : ""}`} data-testid="tab-users" onClick={() => setView("users")}>users</button>
            <button className={`ib-tab ${view === "admin" ? "active" : ""}`} data-testid="tab-admin" onClick={() => setView("admin")}>admin</button>
          </div>
          <div className="auth-indicator">
            <span className={`auth-dot${token ? "" : " offline"}`} title={token ? "авторизован" : "без авторизации"} />
            {token
              ? <button className="logout-btn" onClick={handleLogout}>выйти</button>
              : <button className="logout-btn" onClick={() => setShowLogin(true)}>войти</button>}
          </div>
        </div>
      </div>

      {view === "home"   && <HomePage   api={api} onBoard={goBoard} onThread={goThread} />}
      {view === "board"  && currentBoard  && <BoardPage  api={api} board={currentBoard}   onThread={goThread} baseUrl={baseUrl} />}
      {view === "thread" && currentThread && <ThreadPage api={api} thread={currentThread} baseUrl={baseUrl} />}
      {view === "users"  && <UsersPage   api={api} />}
      {view === "admin"  && <AdminPanel baseUrl={baseUrl} setBaseUrl={setBaseUrl} token={token} />}
    </>
  );
}
