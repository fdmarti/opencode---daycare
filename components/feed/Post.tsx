import type { Post } from "@/data/feed/mock-posts";

const badgeByType = {
  achievement: { label: "LOGRO", dot: "bg-logro", text: "text-logro", bg: "bg-logro-fondo" },
  activity: { label: "ACTIVIDAD", dot: "bg-actividad", text: "text-actividad", bg: "bg-actividad-fondo" },
  announcement: { label: "ANUNCIO", dot: "bg-anuncio", text: "text-anuncio", bg: "bg-anuncio-fondo" },
} as const;

export function Post({ post }: { post: Post }) {
  const badge = badgeByType[post.type];
  const isAnnouncement = post.type === "announcement";

  return (
    <article className="bg-card border border-borde rounded-[20px] px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)]">
      <header className="flex items-center gap-3 mb-[14px]">
        {isAnnouncement ? (
          <div className="w-11 h-11 rounded-full bg-anuncio-fondo text-anuncio flex items-center justify-center flex-none">
            <MegaphoneIcon />
          </div>
        ) : (
          <div className="w-11 h-11 rounded-full bg-avatar-nino text-avatar-nino-tinta font-display font-semibold text-[17px] flex items-center justify-center flex-none">
            {post.childName.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <div className="font-display font-semibold text-[16.5px] text-tinta">{post.childName}</div>
          <div className="text-[12.5px] text-placeholder">
            {post.time} · {post.publishedBy}
          </div>
        </div>
        <div className={`flex items-center gap-[7px] px-3 py-1.5 rounded-full ${badge.bg}`}>
          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
          <span className={`text-xs font-extrabold tracking-[0.5px] ${badge.text}`}>{badge.label}</span>
        </div>
      </header>

      <div className="text-[12.5px] text-placeholder mb-2.5">Para: {post.recipient}</div>
      <p className="text-[15.5px] leading-[1.55] text-tinta-suave">{post.text}</p>

      {/* Dead link until the photo viewer lands in a future spec. */}
      {post.photoCaption && (
        <a
          href="#"
          className="flex flex-col items-center justify-center gap-2 mt-[14px] border-[1.5px] border-dashed border-foto-borde rounded-2xl bg-foto-fondo h-[200px] text-foto-tinta"
        >
          <ImagePlaceholderIcon />
          <span className="text-[13.5px]">{post.photoCaption}</span>
        </a>
      )}

      <footer className="flex items-center gap-[18px] mt-4 pt-[14px] border-t border-borde-suave">
        <span className="flex items-center gap-[7px] text-corazon font-bold text-sm">
          <HeartIcon />
          {post.hearts}
        </span>
        {/* Dead link until the post detail lands in a future spec. */}
        <a href="#" className="flex items-center gap-[7px] text-mute font-bold text-sm">
          <CommentIcon />
          {post.comments}
        </a>
        <span className="flex-1" />
        {/* Dead link until "crear publicación" lands in a future spec. */}
        <a href="#" className="text-acento-editar font-extrabold text-sm">
          Editar
        </a>
      </footer>
    </article>
  );
}

function MegaphoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

function ImagePlaceholderIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="#E0654A" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
    </svg>
  );
}
