import type { Post } from "@/data/feed/mock-posts";
import { CommentIcon, HeartIcon, ImagePlaceholderIcon, MegaphoneIcon } from "@/components/common/icons/Icons";

const badgeByType = {
  achievement: { label: "LOGRO", dot: "bg-logro", text: "text-logro", bg: "bg-logro-fondo" },
  activity: { label: "ACTIVIDAD", dot: "bg-actividad", text: "text-actividad", bg: "bg-actividad-fondo" },
  announcement: { label: "ANUNCIO", dot: "bg-anuncio", text: "text-anuncio", bg: "bg-anuncio-fondo" },
} as const;

export function Post({ post }: { post: Post }) {
  const badge = badgeByType[post.type];
  const isAnnouncement = post.type === "announcement";

  return (
    <article className="bg-card border border-borde rounded-[20px] px-5.5 py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)]">
      <header className="flex items-center gap-3 mb-3.5">
        {isAnnouncement ? (
          <div className="w-11 h-11 rounded-full bg-anuncio-fondo text-anuncio flex items-center justify-center flex-none">
            <MegaphoneIcon size={20} />
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
        <div className={`flex items-center gap-1.75 px-3 py-1.5 rounded-full ${badge.bg}`}>
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
          className="flex flex-col items-center justify-center gap-2 mt-3.5 border-[1.5px] border-dashed border-foto-borde rounded-2xl bg-foto-fondo h-50 text-foto-tinta"
        >
          <ImagePlaceholderIcon size={30} />
          <span className="text-[13.5px]">{post.photoCaption}</span>
        </a>
      )}

      <footer className="flex items-center gap-4.5 mt-4 pt-3.5 border-t border-borde-suave">
        <span className="flex items-center gap-1.75 text-corazon font-bold text-sm">
          <HeartIcon size={19} />
          {post.hearts}
        </span>
        {/* Dead link until the post detail lands in a future spec. */}
        <a href="#" className="flex items-center gap-1.75 text-mute font-bold text-sm">
          <CommentIcon size={18} />
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
