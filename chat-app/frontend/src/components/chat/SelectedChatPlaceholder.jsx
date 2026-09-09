import { MessageCircle, Sparkles } from 'lucide-react';

import './SelectedChatPlaceholder.css';

function SelectedChatPlaceholder({ chat, currentUserId, onOpenCatchUp }) {
  const otherMember = chat?.members.find(
    (member) => member.user?._id !== currentUserId,
  )?.user;
  const displayName = otherMember?.displayName || otherMember?.username;

  return (
    <section className="selected-chat-placeholder">
      <button type="button" className="selected-chat-placeholder__catch-up" onClick={onOpenCatchUp}><Sparkles size={16} /> Catch up</button>
      <MessageCircle size={42} />

      {chat ? (
        <>
          <h1>{displayName}</h1>
          <p>
            Your direct chat is ready. We will add sending and receiving messages
            in the next feature.
          </p>
        </>
      ) : (
        <>
          <h1>Select a chat</h1>
          <p>
            Search for a user, then choose Chat to create or open a private
            conversation.
          </p>
        </>
      )}
    </section>
  );
}

export default SelectedChatPlaceholder;
