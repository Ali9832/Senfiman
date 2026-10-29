import { create } from "zustand";
import { persist } from "zustand/middleware";

export type StudentService = {
  id: string;
  title: string;
  category: "laundry" | "sports" | "student_job" | "other";
  audience: "all_students" | "dorm_students";
  description: string;
};

type State = {
  services: StudentService[];
  addService: (service: Omit<StudentService, "id">) => void;
};

export const useStudentServices = create<State>()(
  persist(
    (set) => ({
      services: [
        { id: "laundry-1", title: "رزرو لباسشویی خوابگاه", category: "laundry", audience: "dorm_students", description: "انتخاب دستگاه و نوبت شست‌وشو در بلوک محل سکونت" },
        { id: "sports-1", title: "امانت وسایل ورزشی", category: "sports", audience: "all_students", description: "رزرو و تحویل توپ، راکت و سایر تجهیزات ورزشی" },
        { id: "job-1", title: "همکاری دانشجویی سالن ورزش", category: "student_job", audience: "all_students", description: "ثبت درخواست همکاری پاره‌وقت در شیفت عصر" },
      ],
      addService: (service) => set((state) => ({ services: [...state.services, { ...service, id: `service-${Date.now()}` }] })),
    }),
    { name: "student-services" },
  ),
);
