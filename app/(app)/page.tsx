import { mockPosts } from "@/data/feed/mock-posts";
import { Composer } from "@/components/feed/Composer";
import { Post } from "@/components/feed/Post";

export default function FeedPage() {
  return (
    <div className="max-w-[760px] w-full mx-auto px-10 pt-[34px] pb-20">
      <div className="mb-6">
        <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-acento mb-1">
          GUARDERÍA · SALA SOLES
        </div>
        <h1 className="font-display font-semibold text-[30px] text-tinta">Buenas, Caro</h1>
        <p className="mt-[5px] text-mute text-[14.5px]">12 niños · martes 17 jun</p>
      </div>

      <Composer />

      <div className="flex items-center gap-[14px] mb-[14px]">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#8A7C6D]">
          PUBLICADO HOY
        </span>
        <span className="flex-1 h-px bg-separador" />
      </div>

      <div className="flex flex-col gap-4">
        {mockPosts.map((post) => (
          <Post key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
