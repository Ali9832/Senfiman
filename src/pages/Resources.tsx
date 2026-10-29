import { useState } from "react";
import { Search, Download, BookOpen, FileText, Video, BookMarked, HelpCircle, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ContentType = "جزوه" | "فیلم" | "رفرنس" | "نمونه سؤال";
type ResourceItem = { professor: string; downloaded: boolean };
type Course = {
  id: string;
  name: string;
  semester: string;
  resources: Record<ContentType, ResourceItem[]>;
};

const contentTypes: ContentType[] = ["جزوه", "فیلم", "رفرنس", "نمونه سؤال"];
const contentIcons: Record<ContentType, React.ReactNode> = {
  "جزوه": <FileText className="h-4 w-4" />,
  "فیلم": <Video className="h-4 w-4" />,
  "رفرنس": <BookMarked className="h-4 w-4" />,
  "نمونه سؤال": <HelpCircle className="h-4 w-4" />,
};

const fields = ["مهندسی مکانیک", "مهندسی برق", "مهندسی شیمی", "مهندسی صنایع", "مهندسی عمران"];

const courses: Course[] = [
  {
    id: "1", name: "استاتیک", semester: "ترم ۲",
    resources: {
      "جزوه": [{ professor: "بصیری", downloaded: true }, { professor: "کریمی", downloaded: false }],
      "فیلم": [{ professor: "بصیری", downloaded: false }],
      "رفرنس": [],
      "نمونه سؤال": [{ professor: "بصیری", downloaded: true }],
    },
  },
  {
    id: "2", name: "مدار الکتریکی", semester: "ترم ۳",
    resources: {
      "جزوه": [{ professor: "حسنی", downloaded: true }],
      "فیلم": [{ professor: "حسنی", downloaded: true }],
      "رفرنس": [{ professor: "حسنی", downloaded: false }],
      "نمونه سؤال": [{ professor: "حسنی", downloaded: true }],
    },
  },
  {
    id: "3", name: "ریاضی عمومی ۲", semester: "ترم ۲",
    resources: {
      "جزوه": [{ professor: "رضایی", downloaded: true }, { professor: "احمدی", downloaded: false }],
      "فیلم": [{ professor: "رضایی", downloaded: false }],
      "رفرنس": [{ professor: "رضایی", downloaded: true }],
      "نمونه سؤال": [{ professor: "رضایی", downloaded: false }],
    },
  },
  {
    id: "4", name: "مقاومت مصالح", semester: "ترم ۴",
    resources: {
      "جزوه": [{ professor: "کریمی", downloaded: false }],
      "فیلم": [],
      "رفرنس": [{ professor: "کریمی", downloaded: true }],
      "نمونه سؤال": [{ professor: "کریمی", downloaded: true }],
    },
  },
];

function DownloadDot({ downloaded }: { downloaded: boolean }) {
  return (
    <span className={cn("inline-block w-2.5 h-2.5 rounded-full", downloaded ? "bg-green-500" : "bg-muted-foreground/30")} />
  );
}

export default function Resources() {
  const [search, setSearch] = useState("");
  const [selectedField, setSelectedField] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [filterType, setFilterType] = useState<ContentType | "all">("all");

  const filtered = courses.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const download = (course: string, type: ContentType, professor: string) => {
    toast.success(`دانلود ${type} — ${course} (${professor}) شروع شد`);
  };

  if (selectedCourse) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedCourse(null)} className="gap-1">
            ← بازگشت
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{selectedCourse.name}</h1>
            <p className="text-muted-foreground text-xs">{selectedCourse.semester}</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant={filterType === "all" ? "default" : "outline"} onClick={() => setFilterType("all")}>همه</Button>
          {contentTypes.map((t) => (
            <Button key={t} size="sm" variant={filterType === t ? "default" : "outline"} onClick={() => setFilterType(t)} className="gap-1">
              {contentIcons[t]}{t}
            </Button>
          ))}
        </div>

        <div className="space-y-4">
          {contentTypes
            .filter((t) => filterType === "all" || t === filterType)
            .map((type) => {
              const items = selectedCourse.resources[type];
              return (
                <Card key={type}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {contentIcons[type]}
                      {type}
                      <Badge variant="outline" className="text-xs">{items.length} استاد</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {items.length === 0 && <p className="text-sm text-muted-foreground">محتوایی موجود نیست</p>}
                    {items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40">
                        <DownloadDot downloaded={item.downloaded} />
                        <span className="text-sm flex-1">{item.professor}</span>
                        <span className="text-xs text-muted-foreground">{item.downloaded ? "دانلود شده" : "دانلود نشده"}</span>
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => download(selectedCourse.name, type, item.professor)}>
                          <Download className="h-3 w-3" />
                          دانلود
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">منابع دانشگاهی</h1>
        <p className="text-muted-foreground text-sm mt-1">دسترسی به جزوات، فیلم‌ها، رفرنس‌ها و نمونه سؤالات</p>
      </div>

      {/* Field selector */}
      {!selectedField ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {fields.map((f) => (
            <button key={f} onClick={() => setSelectedField(f)} className="p-5 rounded-2xl border bg-card hover:bg-primary hover:text-primary-foreground transition-all duration-200 text-sm font-medium text-right shadow-sm hover:shadow-md">
              <BookOpen className="h-6 w-6 mb-2 opacity-70" />
              {f}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => setSelectedField("")} className="gap-1">
              ← بازگشت
            </Button>
            <h2 className="font-semibold text-foreground">{selectedField}</h2>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pr-9" placeholder="جستجوی درس..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((course) => {
              const totalResources = Object.values(course.resources).flat().length;
              const downloadedCount = Object.values(course.resources).flat().filter((r) => r.downloaded).length;
              return (
                <Card key={course.id} className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30" onClick={() => setSelectedCourse(course)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{course.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{course.semester}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">{downloadedCount}/{totalResources}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {contentTypes.map((type) => {
                        const items = course.resources[type];
                        const downloaded = items.filter((i) => i.downloaded).length;
                        return (
                          <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {contentIcons[type]}
                            <span>{type}:</span>
                            {items.length === 0 ? (
                              <span className="text-muted-foreground/50">—</span>
                            ) : (
                              <span className={downloaded === items.length ? "text-green-600 font-medium" : ""}>{downloaded}/{items.length} ✓</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
