// A customer message only counts as "unread" for admins if nobody has
// handled it yet: it isn't marked read AND it came after the last reply
// from an admin (or the AI) in that chat. This way chats you've already
// answered stop showing in the badge even if older messages were never
// explicitly marked read.

export function lastReplyTimes(messages) {
  const last = {};
  for (const m of messages) {
    if (m.sender_type === 'admin' || m.sender_type === 'ai') {
      const t = new Date(m.created_date).getTime();
      if (!last[m.chat_id] || t > last[m.chat_id]) last[m.chat_id] = t;
    }
  }
  return last;
}

export function isUnreadForAdmin(msg, lastReply) {
  if (msg.sender_type !== 'customer' || msg.is_read) return false;
  const replied = lastReply[msg.chat_id];
  return !replied || new Date(msg.created_date).getTime() > replied;
}

/** Number of chats that have customer messages waiting for an admin. */
export function countUnreadChats(messages) {
  const lastReply = lastReplyTimes(messages);
  const chats = new Set();
  for (const m of messages) if (isUnreadForAdmin(m, lastReply)) chats.add(m.chat_id);
  return chats.size;
}
