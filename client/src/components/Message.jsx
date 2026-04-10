import React, { useEffect } from "react";
import moment from "moment/moment";
import Markdown from "react-markdown";
import Prism from "prismjs";

// 🔹 Assets
import { assets } from "../assets/assets";

// 🎨 Prism Theme
import "prismjs/themes/prism-tomorrow.css";

// 🌐 Supported Languages
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-java";
import "prismjs/components/prism-python";
import "prismjs/components/prism-jsx";

const Message = ({ message }) => {
  // =========================================================
  // 🛡️ Safety Guard
  // Prevent rendering if message is invalid
  // =========================================================
  if (!message || !message.content) return null;

  // =========================================================
  // ✨ Highlight code blocks after content updates
  // =========================================================
  useEffect(() => {
    Prism.highlightAll();
  }, [message?.content]);

  // 🔹 Check if message is from user
  const isUser = message.role === "user";

  return (
    <div>
      {isUser ? (
        // =====================================================
        // 👤 USER MESSAGE
        // =====================================================
        <div className="flex items-start justify-end my-4 gap-2">
          <div className="flex flex-col gap-2 p-2 px-4 bg-slate-50 dark:bg-[#57317C]/30 border border-[#80609F]/30 rounded-md max-w-2xl">
            
            {/* 💬 Message Content */}
            <p className="text-sm dark:text-primary">
              {message.content}
            </p>

            {/* ⏱ Timestamp */}
            <span className="text-xs text-gray-400 dark:text-[#B1A6C0]">
              {message.timestamp
                ? moment(message.timestamp).fromNow()
                : ""}
            </span>
          </div>

          {/* 👤 User Avatar */}
          <img
            src={assets.user_icon}
            alt="user"
            className="w-8 rounded-full"
          />
        </div>
      ) : (
        // =====================================================
        // 🤖 AI MESSAGE
        // =====================================================
        <div className="inline-flex flex-col gap-2 p-2 px-4 max-w-2xl bg-primary/20 dark:bg-[#57317C]/30 border border-[#80609F]/30 rounded-md my-4">
          
          {/* 🖼️ Image Response */}
          {message.isImage ? (
            <img
              src={message.content}
              alt="generated"
              className="w-full max-w-md mt-2 rounded-md"
            />
          ) : (
            // 📝 Markdown Response
            <div className="text-sm dark:text-primary reset-tw">
              
              <Markdown
                components={{
                  // 🔹 Custom code renderer (block + inline)
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(
                      className || ""
                    );

                    // ✅ Block code
                    if (!inline) {
                      return (
                        <div className="my-3">
                          <pre className="rounded-md overflow-x-auto p-3 bg-[#1e1e1e] text-white">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      );
                    }

                    // ✅ Inline code
                    return (
                      <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                        {children}
                      </code>
                    );
                  },

                  // 🔹 Prevent invalid <p> wrapping for block elements
                  p({ children }) {
                    return <div className="mb-2">{children}</div>;
                  },
                }}
              >
                {message.content}
              </Markdown>
            </div>
          )}

          {/* ⏱ Timestamp */}
          <span className="text-xs text-gray-400 dark:text-[#B1A6C0]">
            {message.timestamp
              ? moment(message.timestamp).fromNow()
              : ""}
          </span>
        </div>
      )}
    </div>
  );
};

export default Message;