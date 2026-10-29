export type KnowledgeBaseCategory = "facilities" | "services" | "safety" | "admin";
export type KnowledgeBaseArticle = {
  id: string; title: string; category: KnowledgeBaseCategory; content: string;
  tags: string[]; published: boolean; authorId: string | null; createdAt: string; updatedAt: string;
};
export const knowledgeBaseCategoryFa: Record<KnowledgeBaseCategory, string> = {
  facilities: "تأسیسات فنی", services: "خدمات و عمومی", safety: "ایمنی و اضطراری", admin: "اداری و رفاهی",
};
