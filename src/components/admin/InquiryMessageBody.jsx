import React from "react";

// Renders an inquiry message body, turning any image URLs (.png/.jpg/.jpeg/.gif/.webp)
// into inline <img> previews so long links don't overflow the modal.
export default function InquiryMessageBody({ message, className = "" }) {
  if (!message) return null;

  const imageUrlRegex = /(https?:\/\/[^\s)]+\.(?:png|jpe?g|gif|webp))/gi;

  // Split the message into parts: text segments and image URLs (in order).
  const parts = [];
  let lastIndex = 0;
  let match;
  const regex = new RegExp(imageUrlRegex);
  while ((match = regex.exec(message)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: message.slice(lastIndex, match.index) });
    }
    parts.push({ type: "image", value: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < message.length) {
    parts.push({ type: "text", value: message.slice(lastIndex) });
  }

  return (
    <div className={`text-sm text-gray-700 whitespace-pre-wrap break-words ${className}`}>
      {parts.map((part, i) =>
        part.type === "image" ? (
          <a
            key={i}
            href={part.value}
            target="_blank"
            rel="noopener noreferrer"
            className="block my-2"
          >
            <img
              src={part.value}
              alt="Attached screenshot"
              className="max-w-full rounded-lg border border-gray-200 object-contain"
              style={{ maxHeight: 320 }}
              onError={(e) => {
                // If the image fails to load (e.g. private/expired link),
                // fall back to showing the URL as text so nothing disappears.
                const a = e.currentTarget.parentElement;
                if (a) {
                  a.replaceWith(document.createTextNode(part.value));
                }
              }}
            />
          </a>
        ) : (
          <span key={i}>{part.value}</span>
        )
      )}
    </div>
  );
}