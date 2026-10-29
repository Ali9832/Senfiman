import { Link } from "react-router-dom";
import { ArrowLeft, Bell, Image as ImageIcon, Pin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CouncilPost } from "@/lib/councils";

export default function NewsFeedCard({ title, subtitle, posts, href, accent = "border-r-blue-500" }: { title: string; subtitle?: string; posts: CouncilPost[]; href?: string; accent?: string }) {
  return <Card className={`h-[30rem] flex flex-col border-r-4 ${accent}`}>
    <CardHeader className="pb-3 shrink-0"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4 text-primary" />{title}</CardTitle>{subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}</div>{href && <Link to={href} className="text-xs text-primary flex items-center gap-1">صفحه کامل<ArrowLeft className="h-3.5 w-3.5" /></Link>}</div></CardHeader>
    <CardContent className="overflow-y-auto space-y-3 pl-2">
      {posts.map((post) => <article key={post.id} className="rounded-xl border bg-background overflow-hidden">
        {post.image && <div className="h-28 overflow-hidden bg-muted"><img src={post.image} alt={post.title} loading="lazy" className="h-full w-full object-cover" /></div>}
        <div className="p-3"><div className="flex items-center gap-2"><Badge variant="secondary" className="text-[10px]">{post.type}</Badge>{post.pinned && <Pin className="h-3 w-3 text-primary" />}</div><p className="text-sm font-semibold mt-2 leading-6">{post.title}</p><p className="text-xs text-muted-foreground mt-1 leading-5">{post.excerpt}</p><p className="text-[11px] text-muted-foreground mt-2">{post.date}</p></div>
      </article>)}
      {!posts.length && <div className="py-10 text-center text-sm text-muted-foreground"><ImageIcon className="h-7 w-7 mx-auto mb-2" />هنوز پستی منتشر نشده است.</div>}
    </CardContent>
  </Card>;
}
