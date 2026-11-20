"use client";

import { useState } from "react";
import { CONVERSATIONS, MESSAGE_TABS } from "@/data/content";
import { IconMsgSearch } from "@/components/icons";

export function MessagesPage() {
  const [tab, setTab] = useState<(typeof MESSAGE_TABS)[number]>("Hamısı");

  return (
    <div className="page active" id="page-messages">
      <div className="messages-wrap">
        <div className="msg-search">
          <IconMsgSearch />
          <input type="text" placeholder="Mesajlarda axtar..." />
        </div>
        <div className="filter-tabs">
          {MESSAGE_TABS.map((t) => (
            <span key={t} className={`filter-tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>{t}</span>
          ))}
        </div>
        <div className="convo-list">
          {CONVERSATIONS.map((c) => {
            const avatar = <div className="convo-avatar-placeholder" style={{ background: c.gradient }}>{c.initial}</div>;
            return (
              <div key={c.id} className={`convo-item${c.unread ? " unread" : ""}`}>
                {c.online ? (
                  <div style={{ position: "relative" }}>
                    {avatar}
                    <span className="online-dot" />
                  </div>
                ) : (
                  avatar
                )}
                <div className="convo-body">
                  <div className="convo-name">{c.name}</div>
                  <div className="convo-preview">{c.preview}</div>
                </div>
                <div className="convo-right">
                  <div className="convo-time">{c.time}</div>
                  {c.unread && <div className="unread-dot" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
