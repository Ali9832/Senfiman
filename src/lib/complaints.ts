export type ComplaintKind = "complaint" | "criticism" | "suggestion";
export type ComplaintStatus = "open" | "in_review" | "resolved" | "rejected";

export type Complaint = {
  id: string;
  createdBy: string | null;
  isAnonymous: boolean;
  kind: ComplaintKind;
  title: string;
  body: string;
  status: ComplaintStatus;
  assignedSecretary: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
};

export const complaintKindFa: Record<ComplaintKind, string> = {
  complaint: "شکایت",
  criticism: "انتقاد",
  suggestion: "پیشنهاد",
};

export const complaintStatusFa: Record<ComplaintStatus, string> = {
  open: "باز",
  in_review: "در حال بررسی",
  resolved: "حل شده",
  rejected: "رد شده",
};
